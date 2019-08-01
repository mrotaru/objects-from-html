const test = require('tape');
const markers = require('./markers');

const htmlParserOptions = {
  normalizeWhitespace: true,
  xmlMode: false,
  decodeEntities: true,
};

test('empty', t => {
  const results = markers([]);
  t.deepEqual(results, []);
  t.end();
});

test.skip('basic', t => {
  const results = markers(
    [1, 2, 3, 4, 5],
    (isStart = item => item == 2),
    (isEnd = item => item == 4),
  );
  t.deepEqual(results, [3]);
  t.end();
});
