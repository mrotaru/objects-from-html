const test = require('tape')

const objectsFromHtml = require('.')

test('smoke test', t => {
    const html=
`<div class='books'>
    <div class='book'>
        <h3 class='title'>Foo</h3>
        <div class='rating'>4/5</div>
    </div>
    <div class='book'>
        <h3 class='title'>Bar</h3>
        <div class='rating'>3/5</div>
    </div>
</div>`
    const descriptor = {
        "name": "book",
        "container": ".books",
        "selector": ".book",
        "properties": {
            "title": ".title",
            "rating": ".rating"
        }
    }

    const result = objectsFromHtml(html, descriptor)

    t.deepEqual(result, [{
        title: "Foo",
        rating: "4/5",
    }, {
        title: "Bar",
        rating: "3/5",
    }])

    t.end()
})
