# Dates
Dates are stored as:
```js
polymorph_core.items["abcdef123"].dateproperty={
    datestring: "+1d",
    date:[
        <DateObject>
    ]
}
```

See `dateparser.js:268` for an explainer of what `<DateObject>` is. I'm keeping it there because docs close to code is g.