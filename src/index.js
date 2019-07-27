const cheerio = require('cheerio');
const assert = require('assert');
const deepMerge = require('lodash.merge');
const util = require('util');

const graphUtils = require('./graph');
const extractProperties = require('./extract-properties');
const { dbg } = require('./debug');

const defaultOptions = {
  generateId: false,
  includeItemType: false,
  topLevelItemTypes: null,
  storeValuesInArrays: false,
  sanitizeText: true,
  debug: false,
  root: 'body',
};

function objectsFromHtml(html, itemDescriptors, options = {}) {
  const finalOptions = deepMerge({}, defaultOptions, options);
  const debug = (...args) => {
    if (finalOptions.debug) {
      dbg($, ...args);
    }
  };

  const itemDescriptorsArray = Array.isArray(itemDescriptors)
    ? itemDescriptors
    : [itemDescriptors];

  const $ = cheerio.load(html, {
    normalizeWhitespace: true,
    xmlMode: false,
    decodeEntities: true,
  });

  let topLevelItemTypes = itemDescriptorsArray;
  if (finalOptions.topLevelItemTypes) {
    topLevelItemTypes = finalOptions.topLevelItemTypes.map(topLevelItemName =>
      itemDescriptorsArray.find(desc => desc.name === topLevelItemName),
    );
  }

  const $root = (finalOptions.root && $(finalOptions.root)) || $();
  const result = process($root, topLevelItemTypes, (depth = 0));
  return result;

  function process(context, itemDescriptors, depth) {
    const items = [];
    const contextElements = Array.isArray(context)
      ? context
      : context.toArray();
    contextElements.forEach(ctx => {
      itemDescriptors.forEach(itemDescriptor => {
        const {
          selector = '.',
          sameLevel,
          sameParent,
          leavesOnly,
          name,
        } = itemDescriptor;
        debug(`🔍 ${selector} in`, ctx, depth);
        let all = [ctx];
        if (selector && selector !== '.') {
          all = $(selector, ctx).toArray();
        }

        // Build an array of elements matching the item descriptor. Take into
        // account the `leavesOnly`, `sameParent` and `sameLevel` options.
        let matches = [...all];
        if (leavesOnly) {
          matches = graphUtils.leavesOnly($, all);
        } else {
          if (sameParent) {
            matches = graphUtils.sameParent($, matches);
          } else if (sameLevel) {
            matches = graphUtils.sameLevel($, ctx, matches);
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

          // Extract properties, as described by the item descriptors `properties`
          // property for the current item type.
          const properties = extractProperties(
            $,
            ctx,
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
              let children = [];
              if (firstIncludedContainer) {
                children = process(
                  $element,
                  [childItemDescriptor],
                  depth + 1,
                );
              }
              item.children = [...item.children, ...children];
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
