const assert = require('assert');

const { sanitizeString } = require('./sanitizers');

const extractProperties = ($, ctx, $element, properties) => {
  const result = {};
  const propertyKeys = (properties && Object.keys(properties)) || [];
  for (let propertyKey of propertyKeys) {
    const propertyDescriptor = properties[propertyKey];
    if (typeof propertyDescriptor === 'string') {
      // just a CSS selector
      let $propertyElement =
        propertyDescriptor === '.'
          ? $($element, ctx)
          : $($element, ctx).find(propertyDescriptor);
      result[propertyKey] = sanitizeString($propertyElement.text());
    } else if (typeof propertyDescriptor === 'object') {
      // CSS selector and an 'extract' property
      assert(propertyDescriptor.extract, 'must have extract');
      const { extract } = propertyDescriptor;
      const selector = propertyDescriptor.selector || '.';
      let $propertyElement =
        selector === '.' ? $($element, ctx) : $($element, ctx).find(selector);
      if (extract === 'text') {
        result[propertyKey] = sanitizeString($propertyElement.text());
      } else if (extract === 'href') {
        result[propertyKey] = $propertyElement.attr('href');
      } else if (extract === 'html') {
        result[propertyKey] = $propertyElement.parent().html();
      }
    }
  }
  return result;
};

module.exports = extractProperties;
