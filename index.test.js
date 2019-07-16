const test = require('tape');

const objectsFromHtml = require('.');

test('smoke test', t => {
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
    name: 'book',
    selector: '.book',
    properties: {
      title: '.title',
      rating: '.rating',
    },
  };

  const result = objectsFromHtml(html, descriptor);

  t.deepEqual(result, [
    {
      title: 'Foo',
      rating: '4/5',
    },
    {
      title: 'Bar',
      rating: '3/5',
    },
  ]);

  t.end();
});

test('extract text', t => {
  const html = '<div><p>Some <strong>nice</strong> text</p></div>';
  const descriptor = {
    name: 'foo',
    selector: 'div',
    properties: {
      allText: {
        selector: 'p',
        extract: 'text',
      },
    },
  };
  const result = objectsFromHtml(html, descriptor);
  t.deepEqual(result, [
    {
      allText: 'Some nice text',
    },
  ]);

  t.end();
});

test('extract href', t => {
  const html =
    '<div><p>This is a link to <a href="http://foo.com">Foo</a>, which is nice.</p></div>';
  const descriptor = {
    name: 'foo',
    selector: 'div',
    properties: {
      allText: {
        selector: 'a',
        extract: 'href',
      },
    },
  };
  const result = objectsFromHtml(html, descriptor);
  t.deepEqual(result, [
    {
      allText: 'http://foo.com',
    },
  ]);

  t.end();
});

test('extract from current node', t => {
  const html = '<div>AAA<em>BBB</em>CCC</p></div>';
  const result = objectsFromHtml(html, {
    selector: 'div',
    properties: {
      text: '.',
    },
  });
  t.deepEqual(result, [
    {
      text: 'AAABBBCCC',
    },
  ]);
  t.end();
});

test('extract html', t => {
  const html = '<div><p>Some <strong>nice</strong> text</p></div>';
  const descriptor = {
    name: 'foo',
    selector: 'div',
    properties: {
      allText: {
        selector: 'p',
        extract: 'html',
      },
    },
  };
  const result = objectsFromHtml(html, descriptor);
  t.deepEqual(result, [
    {
      allText: '<p>Some <strong>nice</strong> text</p>',
    },
  ]);

  t.end();
});

test('extract: href', t => {
  const html = '<li><a href="http://1.1.1">1.1.1</a>';
  const descriptors = [
    { selector: 'a', properties: { href: { extract: 'href' } } },
  ];
  const result = objectsFromHtml(html, descriptors);
  t.deepEqual(result, [{ href: 'http://1.1.1' }]);
  t.end();
});

test.skip('exclude', t => {
  const html = `
  <p id="1">p1</p>
  <p id="2">p2</p>
`;
  const descriptors = [
    {
      selector: 'p',
      exclude: '#2',
      properties: { text: '.' },
    },
  ];
  const result = objectsFromHtml(html, descriptors);
  t.deepEqual(result, [{ text: 'p1' }]);
  t.end();
});

test('sameParent', t => {
  const html = `
  <div>
    <p id="1">p1</p>
    <p id="2">p2</p>
    <div>
      <p id="3">p3</p>
    </div>
    <p id="4">p4</p>
  </div>
`;
  const descriptors = [
    {
      selector: 'p',
      sameParent: true,
      properties: { text: '.' },
    },
  ];
  const result = objectsFromHtml(html, descriptors);
  t.deepEqual(result, [{ text: 'p1' }, { text: 'p2' }, { text: 'p4' }]);
  t.end();
});

test('sameLevel', t => {
  const html = `
<li><a href="http://1.1.1">1.1.1</a></li>
<li><a href="http://1.1.2">1.1.2</a></li>
<li>
  <ul id='inner'>
    <li><a href="http://Foo">Foo</a></li>
  </ul>
</li>
`;
  const descriptors = [
    {
      selector: 'li a',
      sameLevel: true,
      properties: { href: { extract: 'href' } },
    },
  ];
  const result = objectsFromHtml(html, descriptors);
  t.deepEqual(result, [{ href: 'http://1.1.1' }, { href: 'http://1.1.2' }]);
  t.end();
});

test('sameLevel - can have different parents', t => {
  const html = `
  <div>
    <p id="1">p1</p>
    <p id="2">p2</p>
    <div>
      <p id="3">p3</p>
    </div>
    <p id="4">p4</p>
  </div>
  <div>
    <p id="5">p5</p>
  </div>
`;
  const descriptors = [
    {
      selector: 'p',
      sameLevel: true,
      properties: { text: '.' },
    },
  ];
  const result = objectsFromHtml(html, descriptors);
  t.deepEqual(result, [
    { text: 'p1' },
    { text: 'p2' },
    { text: 'p4' },
    { text: 'p5' },
  ]);
  t.end();
});

test('leavesOnly - simple', t => {
  const html = `
  <div>
    <div id="1">p1</div>
    <div>
      <div id="2">p2</div>
    </div>
  </div>
`;
  const descriptors = [
    {
      selector: 'div',
      leavesOnly: true,
      properties: { text: '.' },
    },
  ];
  const result = objectsFromHtml(html, descriptors);
  t.deepEqual(result, [{ text: 'p1' }, { text: 'p2' }]);
  t.end();
});

test('leavesOnly', t => {
  const html = `
  <div>
    <div id="1">div1</div>
    <div id="2">div2</div>
    <div>
      <div id="3">div3</div>
    </div>
    <div id="4">div4</div>
    <div>
      <div>
        <div id="5">div5</div>
      </div>
      <div>
        <div id="6">div6</div>
      </div>
    </div>
    <div id="7">div7</div>
  </div>
`;
  const descriptors = [
    {
      selector: 'div',
      leavesOnly: true,
      properties: { text: '.' },
    },
  ];
  const result = objectsFromHtml(html, descriptors);
  t.deepEqual(result, [
    { text: 'div1' },
    { text: 'div2' },
    { text: 'div3' },
    { text: 'div4' },
    { text: 'div5' },
    { text: 'div6' },
    { text: 'div7' },
  ]);
  t.end();
});

test('includes - simple', t => {
  const html = `
  <div class='foo'>
    <h2>Foo</h2>
    <div class='bar'>
      <h3>Bar 1</h3>
    </div> 
  </div>
`;
  const descriptors = [
    {
      selector: '.foo',
      properties: {
        heading: 'h2',
      },
      includes: [
        {
          selector: '.bar',
          properties: {
            heading: 'h3',
          },
        },
      ],
    },
  ];

  const result = objectsFromHtml(html, descriptors);
  t.deepEqual(result, [
    {
      heading: 'Foo',
      children: [
        {
          heading: 'Bar 1',
        },
      ],
    },
  ]);
  t.end();
});

test.only('includes - simple - with references', t => {
  const html = `
  <div class='foo'>
    <h2>Foo</h2>
    <div class='bar'>
      <h3>Bar 1</h3>
    </div> 
  </div>
`;
  const descriptors = [
    {
      name: 'foo',
      selector: '.foo',
      properties: {
        heading: 'h2',
      },
      includes: [
        {
          name: 'bar',
          selector: '.',
        },
      ],
    }, {
      name: 'bar',
      selector: '.bar',
      properties: {
        heading: 'h3',
      },
    }
  ];

  const result = objectsFromHtml(html, descriptors, {
    includeItemType: true,
    topLevelItems: ['foo'],
  });

  t.deepEqual(result, [
    {
      itemType: 'foo',
      heading: 'Foo',
      children: [
        {
          itemType: 'bar',
          heading: 'Bar 1',
        },
      ],
    },
  ]);
  t.end();
});

test('includes', t => {
  const html = `
<ul id='1'>
    <li>
        <h3>1.1</h3>
        <ul id='1.1'>
            <li><a href="http://1.1.1">1.1.1</a></li>
            <li><a href="http://1.1.2">1.1.2</a></li>
            <li>
              <ul id='inner'>
                <li><a href="http://Foo">Foo</a></li>
              </ul>
            </li>
        </ul>
        <h3>1.2</h3>
        <ul id='1.2'>
            <li><a href="http://1.2.1">1.2.1</a></li>
            <li><a href="http://1.2.2">1.2.2</a></li>
        </ul>
    <li>
</ul>
`;

  const descriptors = [
    {
      name: 'top-level',
      selector: 'ul',
      includes: [
        {
          name: 'link-list',
          selector: 'li',
        },
      ],
    },
    {
      name: 'link-list',
      selector: 'ul',
      includes: [
        {
          name: 'link',
          selector: 'li',
        },
      ],
      properties: {
        heading: 'h3',
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        href: {
          selector: '.',
          extract: 'href',
        },
        text: '.',
      },
    },
  ];
  const result = objectsFromHtml(html, descriptors, {
    includeItemType: true,
    topLevelItems: ['top-level'],
  });
  t.deepEqual(result, [
    {
      itemType: 'top-level',
      children: [
        {
          itemType: 'link-list',
          heading: '1.1',
          children: [
            {
              itemType: 'link',
              href: '//1.1.1',
              text: '1.1.1',
            },
            {
              itemType: 'link',
              href: '//1.1.2',
              text: '1.1.2',
            },
          ],
        },
        {
          itemType: 'link-list',
          heading: '1.1', // first match will be selected; TODO: sections
          children: [
            {
              itemType: 'link',
              href: '//1.2.1',
              text: '1.2.1',
            },
            {
              itemType: 'link',
              href: '//1.2.2',
              text: '1.2.2',
            },
          ],
        },
      ],
    },
  ]);

  t.end();
});
