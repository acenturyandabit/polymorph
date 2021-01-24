# Common scripting tasks


## Fixing the date of a done item
E.g. You have a todo list. The todo list contains a list with items and dates. The dates can be recurring. When you delete an item off the list, you want its date to become fixed (as opposed to automatically updating, e.g. when using a TODAY clause.)
1. Create a scriptrunner. 
2. Add the following code:
```js
instance.on("fixdate",(e)=>{
    let itm = polymorph_core.items[e.id];
    let dateProperty="some_dateprop"
	itm[dateProperty].datestring = new Date(itm[dateProperty].date[0].date).toLocaleString() + ">" + new Date(itm[dateProperty].date[0].endDate).toLocaleString();
    itm[dateProperty].date = dateParser.richExtractTime(itm[dateProperty].datestring);
    
	instance.fire("updateItem",{id: lastUpdatedItem});
	instance.fire("dateUpdate");
})
```
3. Open the settings of the scriptrunner. 
4. Attach the delete hook of another operator to the scriptrunner's `fixdate` input remap.
