# Some paradigmatic things
- Views should represent the same set of data, arranged in different ways. If you want a new set of data, create a new operator. [ enforced by default option: no new view button; create creates for all views. ]
- ... Except for subviews. or like, somehow figure out how to make all views with the same parent tied together.
- Regular vs permanent items? Or is that too convoluted?

# Settings
- createAcrossViews: if true, when creating an item, create it in every view I display.
- showNewViewButton: if true, then show the new view button. default false
# Properties
- views: IDs of all views that are displayed, in an array

# Item data layout
```javascript
polymorph_core.items[id].itemcluster={
    viewName:"indicates if this item is a view.",
    viewData:{
        vuid:{x:100,y:100}   
    }
}
```

itemPointerCache[id] contains me.svg.foreignObject.
itemPointerCache[id].node has dataset.id = id; class is .floatingitem.
movingdivs.el gives itemPointerCache[id].



ctrl click drag -> go from there


