/**
 * Needs:
 * be aware of operators
 * - container handles, what kind of data they take
 * :: most container handles take item IDs: e.g. update, focus
 * :: view-change handlers take lists of items -- generally defined by other items. so technically still items.
 * The only thing that isnt item related is filters - which are container related.
 * But if we make operators = items, then voila, item based item filters!
 * 
 * 
 * There are things which describe how operators behave. These can come from within or come from other operators. 
 * I need a way of determining where those things come from and dynamically reconfiguring them.
 * 
 * three major classes though:
 *  - string 
 *  - item pointer
 *  - list of items
 * 
 * Needs to be:
 *  - storable in json
 * 
 * possibilities:
 *  - event api model
 * -- challenge: getting subscribers
 * -- use container.fire, and get container.fire to fire both a basic event and a specific event.
 *  - remote function call
 * -- challenge: unique container ID must be assigned, even as operators are cloned, reloaded, subframed etc.
 * -- issue: cannot subscribe to e.g. focus events as they happen
 * Syntax: 
 * @container:functionName
 * 
 * Expose to users: through the wall API, as rn. Each wall will also now get buttons.
 * Function expected return type should match up with function actual return type.
 * this.parameterFunctions={
 *  functionName:{
 *   type: "string" || "itemID" || "itemList"
 *  }
 * }
 */