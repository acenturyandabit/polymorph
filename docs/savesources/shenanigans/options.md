# options

`polymorph_core.options` is a ui library for basic options. it automatically syncs the object and the input, meaning you dont have to write out annoying handler code again and again.

## where
`core.js`, find `_option`

## how
```javascript
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "saveTo",
            label: "Websocket server address (include ws://)",
            afterInput: fn(e)
        })

        i.load() to update the option.
```