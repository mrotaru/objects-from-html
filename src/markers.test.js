const test = require('tape');
const markers = require('./markers');

const htmlParserOptions = {
  normalizeWhitespace: true,
  xmlMode: false,
  decodeEntities: true,
};

const markersWithSeparators = inputs =>
  markers(
    inputs,
    (isStart = item => item == '>>'),
    (isEnd = item => item == '<<'),
    { includeStartItems: false, includeEndItems: false, }
  );

test('empty', t => {
  const results = markers([]);
  t.deepEqual(results, { items: [], outsideItems: [] });
  t.end();
});

test('basic', t => {
  const results = markersWithSeparators(['>>', 'item', '<<']);
  t.deepEqual(results, { items: [['item']], outsideItems: [] });
  t.end();
});

test('basic - with outside items', t => {
  const results = markersWithSeparators(['o-1', '>>', 'item', '<<', 'o-2']);
  t.deepEqual(results, { items: [['item']], outsideItems: [['o-1'], ['o-2']] });
  t.end();
});

test('multiple', t => {
  const results = markersWithSeparators(['o-1', '>>', '1-1', '1-2', '<<', 'o-2']);
  t.deepEqual(results, {
    items: [['1-1', '1-2']],
    outsideItems: [['o-1'], ['o-2']],
  });
  t.end();
});

test('if start while not ended, end current, start new item', t => {
  const results = markersWithSeparators([
    'o-1',
    '>>',
    '1-1',
    '>>',
    '1-2',
    '<<',
    'o-2',
  ]);
  t.deepEqual(results, {
    items: [['1-1'], ['1-2']],
    outsideItems: [['o-1'], ['o-2']],
  });
  t.end();
});

test('multiple sequences', t => {
  const results = markersWithSeparators([
    'o-1',
    '>>',
    '1',
    '<<',
    'o-2',
    '>>',
    '2',
    '<<',
    'o-3',
  ]);
  t.deepEqual(results, {
    items: [['1'], ['2']],
    outsideItems: [['o-1'], ['o-2'], ['o-3']],
  });
  t.end();
});

test('multiple sequences, multiple items', t => {
  const results = markersWithSeparators([
    'o-1',
    '>>',
    '1-1',
    '1-2',
    '<<',
    'o-2',
    '>>',
    '2-1',
    '2-2',
    '<<',
    'o-3',
  ]);
  t.deepEqual(results, {
    items: [['1-1', '1-2'], ['2-1', '2-2']],
    outsideItems: [['o-1'], ['o-2'], ['o-3']],
  });
  t.end();
});
