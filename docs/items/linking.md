# Linking

In polymorph, I store links as parent->child relations only. The decision is largely arbitrary, but enforcing both parent and child links is a bad idea (see below). 

## How it currently works
```javascript
polymorph_core.items[id].to={
    other_id:true,
    other_id_2:true
}
```
An undirected link is indicated by a->b and b->a both being enforced.

## How it could work
### Parent only
Instead of to, I could have polymorph_core.from. 
- Advantage: tree children add themselves
- Disadvantage: need to keep a cache of parents 

### Children only
- Advantage: Easily find children of trees.
- Disadvantage: Harder to find parents of stray items

### Parents and children
- Advantage: Easily find children and parents.
- Disadvantages: Storage is doubled up, removing links are harder, implementation is more fiddly, Need to make undirected links a separate thing.
