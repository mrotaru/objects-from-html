const assert = require('assert');
const { select, getText, getHtml } = require('./html');
const { sanitizeString } = require('./sanitizers');
const { firstOrSelf, toArray } = require('./utils');

const extractProperties = ($element, properties, options = {}) => {
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
        ? select(selector, $element)
        : $element;

    // extract property value(s)
    const propertyType =
      typeof propertyDescriptor === 'string'
        ? 'text'
        : propertyDescriptor.extract;
    const extractors = {
      text: elements => {
        const text = getText(toArray(elements));
        return options.sanitizeText
          ? sanitizeString(text)
          : text
      },
      href: elements => { return firstOrSelf(elements).attribs.href },
      html: elements => getHtml(firstOrSelf(elements)),
    };
    if (options.storeValuesInArrays) {
      $propertyElements.forEach($el => {
        const value = extractors[propertyType]($el);
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
