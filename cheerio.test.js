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
