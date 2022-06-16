# Data model
Polymorph's underlying data consists of a key-value dictionary of JSON-serializable objects. This means that a polymorph document can be exported to a .json, making saving easy. Although being moddable means that theoretically these items are a free-for-all, some standards are useful for ensuring consistent operational expectations for developers; some of which are facilitated or regulated by the core. 

## Client-side information
Some information should be stored on the client side, including:
- How the document is accessed and saved
- Minor customisation options.

## Document level standards
Every document has an `_meta` key and meta object, which encodes information about the document including a pointer to the base rectangle, and the container's name.

## Object level standards
- Each item has a `_lu` property that states when it was last updated.
- Hierarchical links are mediated by a `to:{}` dictionary, where truthy values correspond to links. Undirected links are represented by bi-directional links, i.e. `a to b` and `b to a` at the same time. This makes chasing parents somewhat difficult; so this will be managed by a cache in the core in future.

## Presentation data
- Rects are stored as objects with an `_rd` property.
- Operators are stored as objects with an `_od` property. Container information is stored in this key too.