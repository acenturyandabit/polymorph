# Subframing
Subframing refers to when an operator contains one or more rects. It can be used to create tabs (with subframe.js), or lists of items (with stack.js). Or, as always, you can do your own thing with it.

## Sample code
- operators/subframe.js
- operators/stack.js [less well maintained]

## Requiremetns
A subframing operator SHOULD (please):
- Upon instantiating, check whether or not there are rects waiting for it in `polymorph_core.operatorLoadCallbacks[container.id]`; and append them.
- Otherwise, create its own rect on startup, and as necessary.
- [STANDARD] Have a method `operator.tieRect(rectID)` to replace or append a given rect.

To create rects, use `new polymorph_core.rect()`. 