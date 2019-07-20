const cheerio = require('cheerio');
const assert = require('assert');
const deepMerge = require('lodash.merge');
const util = require('util');

const DEBUG = false

const defaultOptions = {
  generateId: false,
  includeItemType: false,
  topLevelItemTypes: null,
};

function objectsFromHtml(html, itemDescriptors, options = {}) {
  const finalOptions = deepMerge(defaultOptions, options);

  const itemDescriptorsArray = Array.isArray(itemDescriptors)
    ? itemDescriptors
    : [itemDescriptors];

  const $ = cheerio.load(html, {
    normalizeWhitespace: true,
    xmlMode: false,
    decodeEntities: true,
  });

  const dbgDesc = $el => {
    let attribs = '';
    if ($el.attribs.class) attribs = `.${$el.attribs.class}`;
    if ($el.attribs.id) attribs = `#${$el.attribs.id}`;
    return attribs ? `${$el.name} (${attribs})` : $el.name;
  };

  function dbg(_info = '', $_el, depth = 0) {
    const $el = typeof _info !== 'string' ? _info : $_el;
    const info = typeof _info !== 'string' ? $_el : _info;
    let retVal = $($el)
      .parents()
      .toArray()
      .reduce((acc, $curr) => `${dbgDesc($curr)} > ${acc}`, dbgDesc($el));
    retVal = (info && `${info}: ${retVal}`) || retVal;
    DEBUG && console.log(' '.repeat(depth * 4), retVal);
  }

  let topLevelItemTypes = itemDescriptorsArray;
  if (finalOptions.topLevelItemTypes) {
    topLevelItemTypes = finalOptions.topLevelItemTypes.map(topLevelItemName =>
      itemDescriptorsArray.find(desc => desc.name === topLevelItemName),
    );
  }

  const result = process($('body'), topLevelItemTypes, (depth = 0));
  return result;

  function process(context, itemDescriptors, depth) {
    const items = [];
    const contextElements = Array.isArray(context)
      ? context
      : context.toArray();
    contextElements.forEach(ctx => {
      itemDescriptors.forEach(itemDescriptor => {
        const {
          selector,
          sameLevel,
          sameParent,
          leavesOnly,
          name,
        } = itemDescriptor;
        dbg(`🔍 ${selector} in`, ctx, depth);
        let all = [ctx];
        if (selector && selector !== '.') {
          all = $(selector, ctx).toArray();
        }

        // Build an array of elements matching the item descriptor. Take into
        // account the `leavesOnly`, `sameParent` and `sameLevel` options.
        const $parent = $(all[0]).parent();
        const distanceFromContext = $(all[0]).parentsUntil(ctx).length;
        let matches;
        if (leavesOnly) {
          matches = [...all];
          all.forEach($match => {
            const parents = $($match)
              .parents()
              .toArray();
            parents.forEach($parent => {
              if (all.find($el => $el === $parent)) {
                matches = matches.filter($leaf => $leaf !== $parent);
              }
            });
          });
        } else {
          matches = all.filter($element => {
            if (sameParent) {
              return $($element.parent).is($($parent));
            } else if (sameLevel) {
              return (
                $($element).parentsUntil(ctx).length === distanceFromContext
              );
            } else {
              return true;
            }
          });
        }

        // For every matching element, extract properties and look for included
        // (nested) items.
        matches.forEach($element => {
          dbg('    🌟', $element, depth);
          let item = {};
          if (finalOptions.includeItemType) {
            item.itemType = name;
          }

          // Extract properties, as described by the item descriptors `properties`
          // property for the current item type.
          const propertyKeys =
            (itemDescriptor.properties &&
              Object.keys(itemDescriptor.properties)) ||
            [];
          for (let propertyKey of propertyKeys) {
            const propertyDescriptor = itemDescriptor.properties[propertyKey];
            if (typeof propertyDescriptor === 'string') {
              // just a CSS selector
              let $propertyElement =
                propertyDescriptor === '.'
                  ? $($element, ctx)
                  : $($element, ctx).find(propertyDescriptor);
              item[propertyKey] = $propertyElement.text();
            } else if (typeof propertyDescriptor === 'object') {
              // CSS selector and an 'extract' property
              assert(propertyDescriptor.extract, 'must have extract');
              const { extract } = propertyDescriptor;
              const selector = propertyDescriptor.selector || '.';
              let $propertyElement =
                selector === '.'
                  ? $($element, ctx)
                  : $($element, ctx).find(selector);
              if (extract === 'text') {
                item[propertyKey] = $propertyElement.text();
              } else if (extract === 'href') {
                item[propertyKey] = $propertyElement.attr('href');
              } else if (extract === 'html') {
                item[propertyKey] = $propertyElement.parent().html();
              }
            }
          }

          // Based on the objects inside the `includes` property, search for
          // included items, which will form the `children` property of the
          // current item. These objects can be item descriptors, or
          // "references" to item descriptors. A "reference" has to include the
          // item name, and can also have a `selector`, which can restrict where
          // to look for items of the referenced types. If the object is an item
          // descriptor, it will be looked for inside the whole current element.
          if (itemDescriptor.includes && itemDescriptor.includes.length > 0) {
            if (!item.children) {
              item.children = [];
            }
            for (let included of itemDescriptor.includes) {
              let childItemDescriptor;
              let isReference = false;
              if (included.name) {
                isReference = true;
                childItemDescriptor = itemDescriptorsArray.find(
                  itemDescriptor => itemDescriptor.name === included.name,
                );
              } else {
                assert(typeof included === 'object');
                childItemDescriptor = included;
              }
              assert(childItemDescriptor);

              // If the reference object has a selector, find all matching
              // elements, also taking into account `sameLevel` and
              // `sameParent`, if specified. If there is no `selector`, the
              // array of elements to be searched for included items will only
              // contain the current element.
              let includedContainers;
              if (isReference) {
                if (included.selector) {
                  if (included.selector === '.') {
                    includedContainers = [$element];
                  } else {
                    includedContainers = $($element)
                      .find(included.selector)
                      .toArray();
                    const $firstIncludedContainerParent = $(
                      includedContainers[0],
                    ).parent();
                    const distanceFromCurrentElement = $(
                      includedContainers[0],
                    ).parentsUntil($element).length;
                    includedContainers = includedContainers.filter(
                      $includedContainer => {
                        if (childItemDescriptor.sameParent) {
                          return $($includedContainer.parent).is(
                            $($firstIncludedContainerParent),
                          );
                        } else if (sameLevel) {
                          return (
                            $($includedContainer).parentsUntil(
                              $firstIncludedContainerParent,
                            ).length === distanceFromCurrentElement
                          );
                        } else {
                          return true;
                        }
                      },
                    );
                  }
                } else {
                  includedContainers = [$element];
                }
              } else {
                includedContainers = [$element];
              }

              // Ensure all elements to be searched for included items
              // have the same parent (the parent of the first such element)
              const firstIncludedContainer = includedContainers[0];
              if (included.selector && firstIncludedContainer) {
                const $firstChildParent = firstIncludedContainer.parent;
                includedContainers = includedContainers.filter($element => {
                  const $elementParent = $element.parent;
                  return $elementParent === $firstChildParent;
                });
              } else {
                dbg(`containers not found (${included.selector})`, $element, depth)
              }

              // Search each element (that wasn't filtered out above) for
              // included items by recursion, by using recursion.
              let children = [];
              if (firstIncludedContainer) {
                children = process(
                  includedContainers,
                  [childItemDescriptor],
                  depth + 1,
                );
              }

              item.children = [...item.children, ...children];
            }
          }

          DEBUG && console.log(' '.repeat(depth * 4), '    🎁', {
            itemType: item.itemType,
            text: item.text,
            children: (item.children && item.children.length) || null,
          });
          items.push(item);
        });
      });
    });

    return items;
  }
}

module.exports = objectsFromHtml;
