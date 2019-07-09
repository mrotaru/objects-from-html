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

test("extract from current node", t => {
  const html = "<div>AAA<em>BBB</em>CCC</p></div>"
  const result = objectsFromHtml(html, {
    selector: 'div',
    properties: {
      text: '.'
    }
  });
  t.deepEqual(result, [{
    text: 'AAABBBCCC'
  }])
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

test.only("includes", t => {
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

  const descriptors = [
    {
      name: "top-level",
      selector: "ul",
      includes: [
        {
          name: "link-list",
          selector: "li"
        }
      ],
      properties: {
        heading: "h2"
      }
    },
    {
      name: "link-list",
      selector: "ul",
      includes: [
        {
          name: "link",
          selector: "li"
        }
      ],
      properties: {
        heading: "h3"
      }
    },
    {
      name: "link",
      selector: "a",
      properties: {
        href: {
          selector: ".",
          extract: "href"
        },
        text: "."
      }
    }
  ];
  const result = objectsFromHtml(html, descriptors, {
    includeItemType: true,
    topLevelItems: ['top-level'],
  });
  t.deepEqual(result, [
    {
      itemType: "top-level",
      heading: "1",
      children: [
        {
          itemType: "link-list",
          heading: "1.1",
          children: [
            {
              itemType: "link",
              href: "//1.1.1",
              text: "1.1.1"
            },
            {
              itemType: "link",
              href: "//1.1.2",
              text: "1.1.2"
            }
          ]
        },
        {
          itemType: "link-list",
          heading: "1.1", // first match will be selected; TODO: sections
          children: [
            {
              itemType: "link",
              href: "//1.2.1",
              text: "1.2.1"
            },
            {
              itemType: "link",
              href: "//1.2.2",
              text: "1.2.2"
            }
          ]
        }
      ]
    }
  ]);

  t.end();
});
