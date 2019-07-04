const cheerio = require("cheerio");

function* objectsFromHtml(html, itemDescriptor, context = {}) {
  // TODO: validate descriptor

  const $ = cheerio.load(html, {
    normalizeWhitespace: false,
    xmlMode: false,
    decodeEntities: true
  });

  const { container, selector } = itemDescriptor;
  let $items = container ? $(container).find(selector) : $(selector);

  $items.each((i, $element) => {
    let item = {};
    for (let propertyKey of Object.keys(itemDescriptor.properties)) {
      const propertyDescriptor = itemDescriptor.properties[propertyKey];
      if (typeof propertyDescriptor === "string") {
        let $propertyElement = $($element).find(propertyDescriptor);
        item[propertyKey] = $propertyElement.text();
      }
    }
    yield item
  });
}

module.exports = objectsFromHtml;
