const assert = require('assert');
const xpath = require("xpath")

const { select, getText, getHtml } = require('./html');
const { sanitizeString } = require('./sanitizers');
const { firstOrSelf, toArray } = require('./utils');

const extractProperties = ($element, properties, options = {}) => {
  const result = {};
  const propertyKeys = (properties && Object.keys(properties)) || [];
  for (let propertyKey of propertyKeys) {
    const propertyDescriptor = properties[propertyKey];

    // detect selection method - css or xpath
    let selector;
    let isXPath = false;
    if(typeof propertyDescriptor === 'string') {
      selector = propertyDescriptor;
    } else {
      if (propertyDescriptor.xpath) {
        isXPath = true;
      } else {
        selector = propertyDescriptor.selector;
      }
    }

    // find element(s)
    let $propertyElements;
    if (isXPath) {
      const xpathStr = properties[propertyKey].xpath;
      $propertyElements =  xpath.select(xpathStr, $element);
    } else {
      $propertyElements =
        selector && selector !== '.'
          ? select(selector, $element)
          : $element;
    }

    // what can be extracted from the found element(s) ?
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

    // detect what is to be extracted
    let extractor = 'text';
    if (typeof propertyDescriptor === 'object') {
      if (propertyDescriptor.extract) {
        extractor = propertyDescriptor.extract;
      }
    }

    // apply the corresponding extractor to get the property value
    assert(extractors.hasOwnProperty(extractor), `No such extractor: ${extractor}`);
    if (options.storeValuesInArrays) {
      $propertyElements.forEach($el => {
        const value = extractors[extractor]($el);
        if (result.hasOwnProperty(propertyKey)) {
          result[propertyKey] = [...result[propertyKey], value];
        } else {
          result[propertyKey] = [value];
        }
      });
    } else {
      result[propertyKey] = extractors[extractor]($propertyElements);
    }
  }
  return result;
};

module.exports = extractProperties;
