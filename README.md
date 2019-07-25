# objects-from-html [![Build Status](https://travis-ci.org/mrotaru/objects-from-html.svg?branch=master)](https://travis-ci.org/mrotaru/objects-from-html)

Extract structured data from HTML.

## Example

```js
const html = `
<div class='books'>
    <div class='book'>
        <h3 class='title'>Foo</h3>
        <div class='rating'>4/5</div>
    </div>
    <div class='book'>
        <h3 class='title'>Bar</h3>
        <div class='rating'>3/5</div>
    </div>
</div>`;

const objects = objectsFromHtml(html, {
  selector: '.book',
  properties: {
    title: '.title',
    rating: '.rating',
  },
});

// objects is:
// [
//   { title: 'Foo', rating: '4/5' },
//   { title: 'Bar', rating: '3/5' },
// ]
```

More examples in [`index.test.js`](./src/index.test.js)

## Layout

```
├─ src/
│  ├─ index.js                  entry point, main file
│  ├─ index.text.js             unit tests for the main file, integration tests
│  ├─ debug.js                  debugging and logging utilities
│  ├─ graph.js                  graph utils: leaves, same parent, same level
│  ├─ sanitizers.js             sanitization utils
│  ├─ cheerio.test.js           tests for various aspects of the cheerio lib
│  └─ object-properties.js      property extraction functionality
```
