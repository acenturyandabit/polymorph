# Operators
Operators are interchangeable UI components that display items, and which are contained in rects. 

## Life cycle
When an operator is added by including its .js file, it will be added to `polymorph_core.operators={}`, using `polymorph_core.registerOperator()`.

## Storage considerations
Operators are stored as regular items, except they contain a property `item._od`.
## Functions to implement
- Refresh
- createItem
- deleteItem
- updateItem
- focusItem
- itemRelevant (Garbage cleaning)
### Refresh
```javascript
this.refresh=()={
    //do your refreshing here
}
```
Called by:

### Garbage cleaning
```javascript
this.itemRelevant=(item_id){
    //return true if the item is relevant, false otherwise
}
```
- A standard itemRelevant is provided as `polymorph_core.itemRelevant(operator, id)` and should be called by passing `this` as `operator`. It considers `this.settings.filter` as either a string (specifying the property that the item must have), or a function in string form that should return true if the item is relevant (UNSAFE EVAL SPECIFIABLE BY THE USER).
# Standards to follow
- Standard item creation `operator.createItem` that fires 'createItem' and is triggered by 'createItem' (protected by self) :: itemList
- Standard item removal `operator.removeItem`