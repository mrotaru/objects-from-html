const cheerio = require("cheerio");
const assert = require("assert");

function objectsFromHtml(html, itemDescriptor, context = {}) {
  // TODO: validate descriptor

  const $ = cheerio.load(html, {
    normalizeWhitespace: false,
    xmlMode: false,
    decodeEntities: true
  });

  const { container, selector } = itemDescriptor;
  let $items = container ? $(container).find(selector) : $(selector);

  const items = [];
  $items.each((i, $element) => {
    let item = {};
    for (let propertyKey of Object.keys(itemDescriptor.properties)) {
      const propertyDescriptor = itemDescriptor.properties[propertyKey];
      if (typeof propertyDescriptor === "string") {
        // just a CSS selector
        let $propertyElement = $($element).find(propertyDescriptor);
        item[propertyKey] = $propertyElement.text();
      } else if (typeof propertyDescriptor === "object") {
        // CSS selector and an 'extract' property
        assert(propertyDescriptor.selector, "must have selector");
        assert(propertyDescriptor.extract, "must have extract");
        const { selector, extract } = propertyDescriptor;
        let $propertyElement = $($element).find(selector);
        if (extract === "text") {
          item[propertyKey] = $propertyElement.text();
        } else if (extract === "href") {
          item[propertyKey] = $propertyElement.attr("href");
        } else if (extract === "html") {
          item[propertyKey] = $propertyElement.parent().html();
        }
      }
    }
    items.push(item);
  });
  return items;
}

module.exports = objectsFromHtml;
