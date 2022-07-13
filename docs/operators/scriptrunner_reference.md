# Scriptrunner reference 
## UI
A global-to-your-code variable `uidiv` is defined, which is a HTML div. You may set the innerHTML of the `uidiv` and query from it like any other div.

## Polymorph events
A global-to-your-code variable `instance` is defined. Use `instance.on(<eventname>, ()=>{})` to listen to polymorph events.

## Logging
A global-to-your-code variable `instance` is defined. Use `instance.log(string)` to log to an output underneath the script window.

## Persistent storage
All scripts are transient in that they are run on startup and do not save data. To save persistent data, you can use the global variable `persistence`. 

Persistence will be stored as `polymorph_core.items[<operator_id>].persistence`.

### Example scripts
Log the name of an item whenever it changes:

```js
instance.on("updateItem",(d)=>{
    instance.log(polymorph_core.items[d.id]);
})
```