const deepMerge = require('lodash.merge');
const assert = require('assert');
const { parse, select } = require('./html');
const { toArray } = require('./utils');

const graphUtils = require('./graph');
const extractProperties = require('./extract-properties');
const { dbg } = require('./debug');

const defaultOptions = {
  generateId: false,
  includeItemType: false,
  storeValuesInArrays: false,
  sanitizeText: true,
  debug: false,
};

function objectsFromHtml(html, itemDescriptors, options = {}) {
  const finalOptions = deepMerge({}, defaultOptions, options);
  const debug = (...args) => {
    if (finalOptions.debug) {
      dbg($, ...args);
    }
  };
  assert(typeof html === 'string', 'Input HTML must be a string');
  const $ = parse(html);
  return findMatches([$], toArray(itemDescriptors), (depth = 0));

  function findMatches(haystacks, itemDescriptors, depth) {
    const items = [];
    haystacks.forEach(haystack => {
      itemDescriptors.forEach(itemDescriptor => {
        const {
          selector = '.',
          sameLevel,
          sameParent,
          leavesOnly,
          name,
        } = itemDescriptor;
        debug(`🔍 ${selector} in`, haystack, depth);
        let all = [haystack];
        if (selector && selector !== '.') {
          all = select(selector, haystack);
        }

        // Build an array of elements matching the item descriptor. Take into
        // account the `leavesOnly`, `sameParent` and `sameLevel` options.
        let matches = [...all];
        if (leavesOnly) {
          matches = graphUtils.leavesOnly(all);
        } else {
          if (sameParent) {
            matches = graphUtils.sameParent(matches);
          } else if (sameLevel) {
            matches = graphUtils.sameLevel(matches, haystack);
          }
        }

        // For every matching element, extract properties and look for included
        // (nested) items.
        matches.forEach($element => {
          debug('    🌟', $element, depth);
          let item = {};
          if (finalOptions.includeItemType) {
            item.itemType = name;
          }

          const properties = extractProperties(
            $element,
            itemDescriptor.properties,
            { ...finalOptions, ...itemDescriptor }, // FIXME - only merge options
          );
          item = { ...item, ...properties };

          // Based on the objects inside the `includes` property, search for
          // included items, which will form the `children` property of the
          // current item.
          if (itemDescriptor.includes && itemDescriptor.includes.length > 0) {
            if (!item.children) {
              item.children = [];
            }
            for (let childItemDescriptor of itemDescriptor.includes) {
              item.children = [
                ...item.children,
                ...findMatches([$element], [childItemDescriptor], depth + 1),
              ];
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
