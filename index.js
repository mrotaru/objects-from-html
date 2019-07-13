const cheerio = require('cheerio');
const assert = require('assert');
const deepMerge = require('lodash.merge');
const util = require('util');

const defaultOptions = {
  generateId: false,
  includeItemType: false,
  topLevelItems: null,
};

function objectsFromHtml(html, itemDescriptors, options = {}) {
  const finalOptions = deepMerge(defaultOptions, options);

  const itemDescriptorsArray = Array.isArray(itemDescriptors)
    ? itemDescriptors
    : [itemDescriptors];

  const $ = cheerio.load(html, {
    normalizeWhitespace: false,
    xmlMode: false,
    decodeEntities: true,
  });

  let topLevelItems = itemDescriptorsArray;
  if (finalOptions.topLevelItems) {
    topLevelItems = finalOptions.topLevelItems.map(topLevelItemName =>
      itemDescriptorsArray.find(desc => desc.name === topLevelItemName),
    );
  }

  const result = process($('body'), topLevelItems, (depth = 0));
  return result;

  function process(context, itemDescriptors, depth) {
    const items = [];
    context.each((i, ctx) => {
      itemDescriptors.forEach(itemDescriptor => {
        const {
          selector,
          sameLevel,
          sameParent,
          leafsOnly,
          name,
        } = itemDescriptor;
        const $all = $(selector, ctx);
        const $parent = $($all.first()).parent();
        const distanceFromContext = $($all.first()).parentsUntil(ctx).length;
        let $matches;
        if (leafsOnly) {
          // very inefficient (?!)
          const $excluded = [];
          $all.each((i, $match) => {
            console.log('match', $match.name, $match.attribs)
            // const $parents = $($match).parentsUntil(ctx);
            const $parents = $($match).parents();
            console.log($parents)
            const $f = $($parents).filter((i, $parent) => {
              console.log('here')
            //   // console.log('here', $($parent).html())
            //   return $($parent).is($all);
            });
            // console.log('f', $f.length)
            if ($f.length) {
              $excluded.push($match);
            }
          });
          $matches = $all.filter(
            (i, $match) => !$excluded.find($el => $el.is($match)),
          );
        } else {
          $matches = $all.filter((i, $element) => {
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
        $matches.each((i, $element) => {
          let item = {};
          if (finalOptions.includeItemType) {
            item.itemType = name;
          }
          // properties
          for (let propertyKey of Object.keys(itemDescriptor.properties)) {
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

          // children
          if (itemDescriptor.includes && itemDescriptor.includes.length > 0) {
            if (!item.children) {
              item.children = [];
            }
            for (let included of itemDescriptor.includes) {
              const childItemDescriptor = itemDescriptorsArray.find(
                itemDescriptor => itemDescriptor.name === included.name,
              );
              assert(childItemDescriptor);
              let $childElements = included.selector
                ? $($element).find(included.selector)
                : $element;
              if (included.selector) {
                const $parent = $($childElements.first()).parent();
                $childElements = $childElements.filter((i, $element) =>
                  $($element.parent).is($($parent)),
                );
              }
              item.children = [
                ...item.children,
                ...process($childElements, [childItemDescriptor], depth + 1),
              ];
            }
          }
          items.push(item);
        });
      });
    });

    return items;
  }
}

module.exports = objectsFromHtml;
