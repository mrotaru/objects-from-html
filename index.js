const cheerio = require("cheerio");
const assert = require("assert");
const deepMerge = require("lodash.merge");

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
    decodeEntities: true
  })

  const items = [];

  let topLevelItems = itemDescriptorsArray;
  if (finalOptions.topLevelItems) {
    topLevelItems = finalOptions.topLevelItems.map(topLevelItemName =>
      itemDescriptorsArray.find(desc => desc.name === topLevelItemName)
    );
  }

  return process($('body'), topLevelItems, depth = 0)

  function process(ctx, itemDescriptors, depth) {
    const items = []
    assert(ctx.length === 1, `${depth} context must be one, not ${ctx.length}`)
    itemDescriptors.forEach(itemDescriptor => {
      const { selector, name } = itemDescriptor;
      // console.log(depth, ctx)
      console.log(depth, ` ${ctx.name} (${ctx.attribs}) searching for ${selector}`)
      const $all = $(selector, ctx)
      const $parent = $($all.first()).parent()
      $all
        .filter((i, $element) =>$($element.parent).is($($parent)))
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
              assert(propertyDescriptor.selector, "must have selector");
              assert(propertyDescriptor.extract, "must have extract");
              const { selector, extract } = propertyDescriptor;
              let $propertyElement = selector === "." ? $($element, ctx) : $($element, ctx).find(selector);
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
                itemDescriptor =>
                  itemDescriptor.name === included.name
              );
              assert(childItemDescriptor);

              // TODO: select without descending; probably not possible in one pass ?
              // So, every match will "shadow" others that are nested inside it. Given
              // below:
              // ---
              // div.a 
              //   div.b#1
              //     div.b#2
              //   div.b#3
              // ---
              // Select only #1 and #3, but not #2, because it is a child of an already
              // selected element (#1)
              const $childElement = included.selector
                ? $($element).find(included.selector).first()
                : $element
              console.log(depth, `matching child selector ${included.selector}:`, $childElement.length)
              item.children = [...item.children, ...process($childElement, [childItemDescriptor], depth + 1)]
            }
          }
          items.push(item);
        })
    })
    return items
  }
}

module.exports = objectsFromHtml;
