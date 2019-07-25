const cheerio = require('cheerio');
const assert = require('assert');
const deepMerge = require('lodash.merge');
const util = require('util');

const graphUtils = require('./graph');
const extractProperties = require('./extract-properties');
const { dbg } = require('./debug');

const defaultOptions = {
  generateId: false,
  includeItemType: false,
  topLevelItemTypes: null,
  debug: false,
  root: 'body',
};

function objectsFromHtml(html, itemDescriptors, options = {}) {
  const finalOptions = deepMerge({}, defaultOptions, options);
  const debug = finalOptions.debug;

  const itemDescriptorsArray = Array.isArray(itemDescriptors)
    ? itemDescriptors
    : [itemDescriptors];

  const $ = cheerio.load(html, {
    normalizeWhitespace: true,
    xmlMode: false,
    decodeEntities: true,
  });

  let topLevelItemTypes = itemDescriptorsArray;
  if (finalOptions.topLevelItemTypes) {
    topLevelItemTypes = finalOptions.topLevelItemTypes.map(topLevelItemName =>
      itemDescriptorsArray.find(desc => desc.name === topLevelItemName),
    );
  }

  const $root = (finalOptions.root && $(finalOptions.root)) || $();
  const result = process($root, topLevelItemTypes, (depth = 0));
  return result;

  function process(context, itemDescriptors, depth) {
    const items = [];
    const contextElements = Array.isArray(context)
      ? context
      : context.toArray();
    contextElements.forEach(ctx => {
      itemDescriptors.forEach(itemDescriptor => {
        const {
          selector = '.',
          sameLevel,
          sameParent,
          leavesOnly,
          name,
        } = itemDescriptor;
        debug && dbg(`🔍 ${selector} in`, ctx, depth);
        let all = [ctx];
        if (selector && selector !== '.') {
          all = $(selector, ctx).toArray();
        }

        // Build an array of elements matching the item descriptor. Take into
        // account the `leavesOnly`, `sameParent` and `sameLevel` options.
        let matches = [...all];
        if (leavesOnly) {
          matches = graphUtils.leavesOnly($, all);
        } else {
          if (sameParent) {
            matches = graphUtils.sameParent($, matches);
          } else if (sameLevel) {
            matches = graphUtils.sameLevel($, ctx, matches);
          }
        }

        // For every matching element, extract properties and look for included
        // (nested) items.
        matches.forEach($element => {
          debug && dbg('    🌟', $element, depth);
          let item = {};
          if (finalOptions.includeItemType) {
            item.itemType = name;
          }

          // Extract properties, as described by the item descriptors `properties`
          // property for the current item type.
          const properties = extractProperties(
            $,
            ctx,
            $element,
            itemDescriptor.properties,
          );
          item = { ...item, ...properties };

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

              if (included.startMarker) {
                const { startMarker } = included;
                childElements = $($element)
                  .children()
                  .toArray();
                let $fragment = $('<div id="scraping-fragment"></div>');
                let emptyFragment = true;
                let inside = false;
                let i = 0;
                while (i <= childElements.length) {
                  let $curr = childElements[i];
                  if ($($curr).is(startMarker)) {
                    inside = true;
                    if (!emptyFragment || i === childElements.length - 1) {
                      const includedItems = process(
                        $fragment,
                        [childItemDescriptor],
                        depth + 1,
                      );
                      item.children = [...item.children, ...includedItems];
                      $fragment = $('<div id="scraping-fragment"></div>');
                      $fragment.append($curr);
                      emptyFragment = true;
                    } else {
                      $fragment.append($curr);
                      emptyFragment = false;
                    }
                  } else {
                    $fragment.append($curr);
                    emptyFragment = false;
                    if (i === childElements.length - 1) {
                      const includedItems = process(
                        $fragment,
                        [childItemDescriptor],
                        depth + 1,
                      );
                      item.children = [...item.children, ...includedItems];
                      $fragment = $('<div id="scraping-fragment"></div>');
                      $fragment.append($curr);
                      emptyFragment = true;
                    }
                  }
                  i++;
                }
                items.push(item);
                return;
              }

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
                debug &&
                  dbg(
                    `containers not found (${included.selector})`,
                    $element,
                    depth,
                  );
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

          finalOptions.debug &&
            console.log(' '.repeat(depth * 4), '    🎁', {
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
