# Operators
Operators are interchangeable UI components that display items, and which are contained in rects. 

## Life cycle
When an operator is added by including its .js file, it will be added to `polymorph_core.operators={}`, using `polymorph_core.registerOperator()`.

## Storage considerations
Operators are stored as regular items, except they contain a property `item._od`.
## Functions to implement
Try to stick to and internally call these standard functions as much as possible. They'll help us help you connect to any other people's operators sharing your document.

As always however, all of these are optional, and if you do not find it necessary to implement them, polymorph will get by just fine.
- Refresh
- createItem
- deleteItem
- updateItem
- focusItem
- itemRelevant (Garbage cleaning)
- toSaveData
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
```javascript
this.createItem = (id) => {
    //Use the inherited _createItem function to sort out instantiation and
    //coordination between operators.
    id=this._createItem(id);
    itm=polymorph_core.items[id];

    //add any data you need
    itm.a=b;
}
```

### Garbage cleaning
```javascript
this.itemRelevant=(item_id){
    //return true if the item is relevant, false otherwise
}
```
- A standard itemRelevant is provided as `polymorph_core.itemRelevant(operator, id)` and should be called by passing `this` as `operator`. It considers `this.settings.filter` as either a string (specifying the property that the item must have), or a function in string form that should return true if the item is relevant (UNSAFE EVAL SPECIFIABLE BY THE USER).
- If your operator exists solely to display information, it may not need an itemRelevant.
### toSaveData
The `polymorph_core.operatorTemplate` parent takes care of savedata for the most part, but if you have any data that might need to be saved that can't be updated to `operator.settings` on an event-driven basis, then you can do it via toSaveData.
```javascript
this.toSaveData=()=>{
    this.settings.someproperty="somevalue";
}
```