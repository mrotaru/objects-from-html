const test = require("tape");
const cheerio = require("cheerio");

const htmlParserOptions = {
  normalizeWhitespace: true,
  xmlMode: false,
  decodeEntities: true,
}

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

  $ = cheerio.load(html, htmlParserOptions)

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


test("select leaves", t => {
  const html = `
  <section>
    <div id="inner-1">
      <p id="1">p1</p>
    </div>
  </section>
  <div id="root">
    <p id="2">p2</p>
    <div id="inner-2">
      <p id="3">p3</p>
    </div>
  </div>
`;
  $ = cheerio.load(html, htmlParserOptions)

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