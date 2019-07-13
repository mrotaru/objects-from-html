const test = require("tape");
const cheerio = require("cheerio");

test("select only siblings", t => {
  const html = `
<ul id='1'>
    <h2>1</h2>
    <li>
        <h3>1.1</h3>
        <ul id='1.1'>
            <li><p>1.1.1</p></li>
            <li><p>1.1.2</p></li>
            <li>
              <ul id='inner'>
                <li><p>Foo</p></li>
              </ul>
            </li>
        </ul>
        <h3>1.2</h3>
        <ul id='1.2'>
            <li><p>1.2.1</p></li>
            <li><p>1.2.2</p></li>
        </ul>
    <li>
</ul>
`;

  $ = cheerio.load(html, {
    normalizeWhitespace: false,
    xmlMode: false,
    decodeEntities: true
  });

  function fn (ctx, selector, depth = 0) {
    const $all = $(selector, ctx)
    const $parent = $($all.first()).parent()
    $all
      .filter((i, $el) =>$($el.parent).is($($parent)))
      .each((i, $el) => {
        fn($el, selector, depth + 1)
      })
  }

  fn($('body'), 'ul')

  t.end();
});


test.only("select leaves", t => {
  const html = `
  <div>
    <p id="inner-1">
      <p id="1">p1</p>
    </p>
  </div>
  <p id="root">
    <p id="2">p2</p>
    <p id="inner-2">
      <p id="3">p3</p>
    </p>
  </p>
`;
  $ = cheerio.load(html, {
    normalizeWhitespace: true,
    xmlMode: true,
    decodeEntities: true
  });

  const all = $('p').toArray()
  let leaves = [...all]
  all.forEach($match => {
    const parents = $($match).parents().toArray();
    parents.forEach($parent => {
      if(all.find($el => $el === $parent)) {
        leaves = leaves.filter($leaf => $leaf !== $parent)
      }
    });
  })
  t.equals(leaves.length, 3)
  t.equals(leaves[0].attribs.id, '1')
  t.equals(leaves[1].attribs.id, '2')
  t.equals(leaves[2].attribs.id, '3')
  t.end();
})