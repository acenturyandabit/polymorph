Observations:
- if we tie the toorder to the item, multiple additions will overwrite, resulting in loss of items
    - this could be fixed by merging the lists
    - if we were to merge the lists, we would do so by levinstein distance
- we could make each item remember who their previous sibling was and their parent sibling is
    - but if two middle siblings are deleted then RIP
- make each item remember their parent and an ordering index
- items can be added, deleted, rendered, unshifted (= deleted and added to parent)


Workflow tests

enter on root item creates new item below current item (root / child)
up and down change focus to previous item.

alt up and alt down to rearrange items


=== TODO === 
deal with the cursor span being a derp

============== Workflow Gitfriendly =============
- every item has a parent and a number
    - number starts from 0 and goes up
    - if there is a conflict then the item with the smaller ID goes first, and then a reordering is done
- if the parent is nothing then it is a rootelement