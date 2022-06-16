# gitlite
A lightweight synchronisation method



## problems with full git
- cannot (should not) change document during save process

## gitlite approach
- keep local copy
- for every object, know when it was last changed
- gather all changes and sort. find last common change
- request all changes since last common change