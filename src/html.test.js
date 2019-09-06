const test = require('tape');
const { select, parse, getParents, selectOne } = require('./html');

const htmlDoc = `
<!DOCTYPE html>
<html>
  <head></head>
  <body>
    <div><h1 id="foo">Hi there!</h1></div>
  </body>
</html>`
const htmlFragment = `
<div><h1 id="foo">Hi there!</h1></div>
`

test('basic selectors', t => {
  const doc = parse(htmlDoc);
  const frag = parse(htmlFragment);

  // can't select body ?
  // t.equals(select('body', doc).length, 1);

  // tag
  t.equals(select('div', doc).length, 1);
  t.equals(select('div', frag).length, 1);

  t.end();
});

test('getParents', t => {
  const doc = parse(htmlDoc);
  const h1 = selectOne('h1', doc);
  const parents = getParents(h1);
  t.equals(parents.length, 4);
  t.equals(parents[0].name, 'div');
  t.equals(parents[1].name, 'body');
  t.equals(parents[2].name, 'html');
  t.equals(parents[3].name, 'root');
  t.end();
}) 

test('getParents - until', t => {
  const frag = parse(`
  <div id="1">
    <div id="2">
      <h1>Foo</h1>
    </div>
  </div>
  `);
  const h1 = selectOne('h1', frag);
  const div1 = selectOne('#1', frag);
  const parents = getParents(h1, div1);
  t.equals(parents.length, 1);
  t.equals(parents[0].attribs.id, '2');
  t.end();
}) 
