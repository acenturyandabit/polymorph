Rects, operators and so on are created and call creation UPWARDS recursively.

This is different to before when data was in a tree structure and so creation was done DOWNWARDS recursively.

Views are Rects. They're baserects, to be precise.

data used to be in a tree structure, but is now per-item so that we could manage and merge changes more easily.
however, now that operators are not in a treestructure, its harder for us to manage their rendering, because we don't know which rects want which operators.

To consider:
- the scrollbox operator: what if there are lots of descboxes. like lots.

options moving forward:
- status quo: load everything at start, rects pick up orphaned operators, refresh called on focus 
- load everything just-in-time, always -- this is not good because e.g. background scriptrunners.

keep status quo.