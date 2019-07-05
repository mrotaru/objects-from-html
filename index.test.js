const test = require("tape");

const objectsFromHtml = require(".");

test("smoke test", t => {
  const html = `<div class='books'>
    <div class='book'>
        <h3 class='title'>Foo</h3>
        <div class='rating'>4/5</div>
    </div>
    <div class='book'>
        <h3 class='title'>Bar</h3>
        <div class='rating'>3/5</div>
    </div>
</div>`;
  const descriptor = {
    name: "book",
    selector: ".book",
    properties: {
      title: ".title",
      rating: ".rating"
    }
  };

  const result = objectsFromHtml(html, descriptor);

  t.deepEqual(result, [
    {
      title: "Foo",
      rating: "4/5"
    },
    {
      title: "Bar",
      rating: "3/5"
    }
  ]);

  t.end();
});

test("extract text", t => {
  const html = "<div><p>Some <strong>nice</strong> text</p></div>";
  const descriptor = {
    name: "foo",
    selector: "div",
    properties: {
      allText: {
        selector: "p",
        extract: "text"
      }
    }
  };
  const result = objectsFromHtml(html, descriptor);
  t.deepEqual(result, [
    {
      allText: "Some nice text"
    }
  ]);

  t.end();
});

test("extract href", t => {
  const html =
    '<div><p>This is a link to <a href="http://foo.com">Foo</a>, which is nice.</p></div>';
  const descriptor = {
    name: "foo",
    selector: "div",
    properties: {
      allText: {
        selector: "a",
        extract: "href"
      }
    }
  };
  const result = objectsFromHtml(html, descriptor);
  t.deepEqual(result, [
    {
      allText: "http://foo.com"
    }
  ]);

  t.end();
});

test("extract html", t => {
  const html = "<div><p>Some <strong>nice</strong> text</p></div>";
  const descriptor = {
    name: "foo",
    selector: "div",
    properties: {
      allText: {
        selector: "p",
        extract: "html"
      }
    }
  };
  const result = objectsFromHtml(html, descriptor);
  t.deepEqual(result, [
    {
      allText: "<p>Some <strong>nice</strong> text</p>"
    }
  ]);

  t.end();
});
