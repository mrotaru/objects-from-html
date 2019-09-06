const parse5 = require('parse5');
const treeAdapter = require('parse5-htmlparser2-tree-adapter');
const Select = require('css-select');
const util = require('util');

const selectOptions = {
  decodeEntities: true,
  normalizeWhitespace: false,
  withDomLvl1: true,
  xml: false,
};

const select = (selector, elements) => Select(selector, elements, selectOptions);
const selectOne = (selector, elements) => Select.selectOne(selector, elements, selectOptions);

const parseOptions = { treeAdapter }

const parse = html =>
  html.trim().startsWith('<!')
    ? parse5.parse(html, parseOptions)
    : parse5.parseFragment(html, parseOptions);

const getParents = (node, until = null, parents = []) => {
  if (node.parent) { 
    if (until && until === node.parent) {
      return parents;
    } else {
      return getParents(node.parent, until, [...parents, node.parent])
    }
  } else {
    return parents;
  }
}

const getText = nodes =>
  nodes.flat().reduce((acc, curr) => {
    const { name, type, data, children} = curr
    if (type === 'text') {
      acc += data;
    } else if (
      children &&
      type !== 'comment' &&
      !['script', 'style'].includes(name)
    ) {
      acc += getText(children);
    }
    return acc;
  }, '');

const getHtml = node => parse5.serialize(node, parseOptions)

module.exports = { select, selectOne, parse, getParents, getHtml, getText };
