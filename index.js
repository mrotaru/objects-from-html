const cheerio = require("cheerio");
const assert = require("assert");
const deepMerge = require("lodash.merge");
const util = require("util")

const defaultOptions = {
  generateId: false,
  includeItemType: false,
  topLevelItems: null
};

function objectsFromHtml(html, itemDescriptors, options = {}) {
  const finalOptions = deepMerge(defaultOptions, options);

  const itemDescriptorsArray = Array.isArray(itemDescriptors)
    ? itemDescriptors
    : [itemDescriptors];

  const $ = cheerio.load(html, {
    normalizeWhitespace: false,
    xmlMode: false,
    decodeEntities: true
  });

  let topLevelItems = itemDescriptorsArray;
  if (finalOptions.topLevelItems) {
    topLevelItems = finalOptions.topLevelItems.map(topLevelItemName =>
      itemDescriptorsArray.find(desc => desc.name === topLevelItemName)
    );
  }

  const result = process($("body"), topLevelItems, (depth = 0));
  console.log(util.inspect(result, {depth: null}));
  return result

  function process(context, itemDescriptors, depth) {
    const items = [];
    context.each((i, ctx) => {
      itemDescriptors.forEach(itemDescriptor => {
        const { selector, name } = itemDescriptor;
        const $all = $(selector, ctx);
        const $parent = $($all.first()).parent();
        $all
          .filter((i, $element) => $($element.parent).is($($parent)))
          .each((i, $element) => {
            let item = {};
            if (finalOptions.includeItemType) {
              item.itemType = name;
            }
            // properties
            for (let propertyKey of Object.keys(itemDescriptor.properties)) {
              const propertyDescriptor = itemDescriptor.properties[propertyKey];
              if (typeof propertyDescriptor === "string") {
                // just a CSS selector
                let $propertyElement =
                  propertyDescriptor === "."
                    ? $($element, ctx)
                    : $($element, ctx).find(propertyDescriptor);
                item[propertyKey] = $propertyElement.text();
              } else if (typeof propertyDescriptor === "object") {
                // CSS selector and an 'extract' property
                assert(propertyDescriptor.extract, "must have extract");
                const { extract } = propertyDescriptor;
                const selector = propertyDescriptor.selector || ".";
                let $propertyElement =
                  selector === "."
                    ? $($element, ctx)
                    : $($element, ctx).find(selector);
                if (extract === "text") {
                  item[propertyKey] = $propertyElement.text();
                } else if (extract === "href") {
                  item[propertyKey] = $propertyElement.attr("href");
                } else if (extract === "html") {
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
                  itemDescriptor => itemDescriptor.name === included.name
                );
                assert(childItemDescriptor);
                let $childElements = included.selector
                  ? $($element).find(included.selector)
                  : $element;
                if (included.selector) {
                  const $parent = $($childElements.first()).parent();
                  $childElements = $childElements
                    .filter((i, $element) => $($element.parent).is($($parent)))
                }
                console.log(
                  depth,
                  `matching child selector ${included.selector}:`,
                  $childElements.length
                );
                item.children = [
                  ...item.children,
                  ...process($childElements, [childItemDescriptor], depth + 1)
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
