# Operators
Operators are interchangeable UI components that display items, and which are contained in rects. 

## Life cycle
When an operator is added by including its .js file, it will be added to `polymorph_core.operators={}`, using `polymorph_core.registerOperator()`.

## Storage considerations
Operators are stored as regular items, except they contain a property `item._od`.
## Functions to implement
Try to stick to and internally call these standard functions as much as possible. They'll help us help you connect to any other people's operators sharing your document.

As always however, all of these are optional, and if you do not find it necessary to implement them, polymorph will get by just fine. [please] means it will help facilitate interactions with other operators; and [optional] means only include it if you need it yourself (we're not expecting it.)
- itemRelevant (Garbage cleaning)
- updateItem
- focusItem
- [please]createItem
- [please]deleteItem
- [optional]Refresh
- [optional]toSaveData
### Refresh
```javascript
this.refresh=()={
    //do your refreshing here
}
```
Called by:
- rect.js -> container.js -> your operator, on:
    - first load (but please don't use this for instantiation - just put it in the constructor)
    - window resize
    - rect resize
### createItem
We do NOT expect you to call this function when you're making items from your own operator. This is for when other operators call 'createItem' and if your operator is integrated with them (i.e. on the same baseRect or otherwise) this will help them concur with your operator.
```javascript
container.on("createItem",(data)=>{
    polymorph_core.items[data.id].someproperty=somevalue;
})
```

A default has been provided with polymorph.
Data should be used sparingly. It is not designed to be standard across different operators. Any information about new items should be written to `polymorph_core.items[id]` as soon as possible.
### Garbage cleaning
```javascript
this.itemRelevant=(item_id){
    //return true if the item is relevant, false otherwise
}
```
- A standard itemRelevant is provided as `this._itemRelevant(operator, id)` and should be called by passing `this` as `operator`. It considers `this.settings.filter` as either a string (specifying the property that the item must have), or a function in string form that should return true if the item is relevant (UNSAFE EVAL SPECIFIABLE BY THE USER).
- If your operator exists solely to display information, it may not need an itemRelevant.
### toSaveData
The `polymorph_core.operatorTemplate` parent takes care of savedata for the most part, but if you have any data that might need to be saved that can't be updated to `operator.settings` on an event-driven basis, then you can do it via toSaveData.
```javascript
this.toSaveData=()=>{
    this.settings.someproperty="somevalue";
}
```
## Firables
- updateItem
- createItem - automatically fires updateItem (enforced by container)
- deleteItem - automatically fires updateItem (enforced by container)