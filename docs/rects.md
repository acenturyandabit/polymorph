# Rects

## Properties of rects
These are in rect.settings, which is a getter for `polymorph_core.items[this_rect_id]._rd`
- x: X or Y - if X, the children are split in the x direction; if Y, the children are split in the Y direction.
- f: First or second: determines whether this child is the first or second of its pair of rects.
- ps: position: the percentage left or up that the rect takes. This property is only present on the first rect; the second takes from its sibling.
- s: selectedOperator: The ID of the operator that is selected.
- p: parent: the ID of the parent rect.