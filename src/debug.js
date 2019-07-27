const dbgDesc = $el => {
  let attribs = '';
  if ($el.attribs.class) attribs = `.${$el.attribs.class}`;
  if ($el.attribs.id) attribs = `#${$el.attribs.id}`;
  return attribs ? `${$el.name} (${attribs})` : $el.name;
};

function dbg($, _info = '', $_el, depth = 0) {
  const $el = typeof _info !== 'string' ? _info : $_el;
  const info = typeof _info !== 'string' ? $_el : _info;
  let retVal = $($el)
    .parents()
    .toArray()
    .reduce((acc, $curr) => `${dbgDesc($curr)} > ${acc}`, dbgDesc($el));
  retVal = (info && `${info}: ${retVal}`) || retVal;
  console.log(' '.repeat(depth * 4), retVal);
}

module.exports = {
  dbg,
  dbgDesc,
};
