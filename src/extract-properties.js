const assert = require('assert');

const { sanitizeString } = require('./sanitizers');

const extractProperties = ($, ctx, $element, properties, options) => {
  const result = {};
  const propertyKeys = (properties && Object.keys(properties)) || [];
  for (let propertyKey of propertyKeys) {
    const propertyDescriptor = properties[propertyKey];

    // find element(s)
    let selector =
      typeof propertyDescriptor === 'string'
        ? propertyDescriptor
        : propertyDescriptor.selector;
    const $propertyElements =
      selector && selector !== '.'
        ? $($element, ctx).find(selector)
        : $($element, ctx);

    // extract property value(s)
    const propertyType =
      typeof propertyDescriptor === 'string'
        ? 'text'
        : propertyDescriptor.extract;
    const extractors = {
      text: $el =>
        options.sanitizeText ? sanitizeString($el.text()) : $el.text(),
      href: $el => $el.attr('href'),
      html: $el => $el.parent().html(), // FIXME
    };
    if (options.storeValuesInArrays) {
      $propertyElements.toArray().forEach($el => {
        const value = extractors[propertyType]($($el));
        if (result.hasOwnProperty(propertyKey)) {
          result[propertyKey] = [...result[propertyKey], value];
        } else {
          result[propertyKey] = [value];
        }
      });
    } else {
      result[propertyKey] = extractors[propertyType]($propertyElements);
    }
  }
  return result;
};

module.exports = extractProperties;
