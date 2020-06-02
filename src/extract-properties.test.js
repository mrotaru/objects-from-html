const test = require('tape');
const extractProperties = require('./extract-properties');
const { parse, selectOne } = require('./html');

test('extractProperties', t => {
  const html = `<div class='books'>
    <div class='book'>
        <h3 class='title'>Foo</h3>
        <div class='rating'>4/5</div>
        <a href="http://book-1.com">Link</a>
    </div>
</div>`;
  const parsed = parse(html);
  const element = selectOne('.book', parsed);
  const book = extractProperties(element, {
    title: '.title',
    rating: '.rating',
    link: {
      selector: 'a',
      extract: 'href',
    },
    html: {
      extract: 'html',
    },
    ratingXPath: {
      xpath: 'ancestor::*[position()=1]',
    },
  });
  t.equals(book.title, 'Foo');
  t.equals(book.rating, '4/5');
  t.equals(book.link, 'http://book-1.com');
  t.true(book.html.startsWith('\n    <div class="book"'));
  t.end();
});
