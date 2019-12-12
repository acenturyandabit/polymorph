# Items
Items are generic data elements in Polymorph. Since this update, items include all of:
- Rects,
- Operators
- and your humble data element. [I will use data element to refer to anything that is not any of the above.] These are the most numerous as a user will be creating a lot of them.

## Creating Elements
Elements are native javascript objects. Please don't put functions in them - they should store data only.

In order to retrieve a unique id for the object, use `newID=core.insertItem(newItem)`.

Also, don't forget to fire `core.fire('updateItem',{id:newID})` once you've created the item, so that other operators are aware of it.

## Deleting Elements




## Element properties
You can use any element property you want, but you'll have to share with other operators, and the core. Properties reserved by the core include:
- item._rd: Rect data. The precence of this property indicates that this item should be treated as a rect during load.
- item._od: Operator data. The precence of this property indicates that this item should be treate as an operator during load. To read more about this, see `operators_general/common.md :  ## Storage considerations`.

Some common properties include:
- item.to: A map whose keys represent parent-to-child links from the current item to another item. The keys are strings which point to core.item[].
- item.title: The title of the element.
- item.itemcluster: Used by itemcluster to do its thing. 
