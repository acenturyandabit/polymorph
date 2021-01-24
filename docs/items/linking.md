# Linking

To enforce links in polymorph, you may use the provided `polymorph_core.link(A,B,settings)` and corresponding `unlink` function.

These automatically enforce both parent and child relations on objects, when given the link property.

## How it currently works
```javascript
polymorph_core.items[id].to={
    other_id:true,
    other_id_2:true
}
```
An undirected link is indicated by a->b and b->a both being enforced.

## How it could work
### Children only, object
- Quickly store data
- Easily store metadata in links
- Disadvantage: No ordered links.

### Parents and children, object
- Easily find children and parents.
- Disadvantage: Storage is doubled up

### Array of objects as children
- Ordered children
- Disadvantage: Searching for children is a lot slower.


### Linking TODO
- Ordered children (because e.g. workflowy and you can always go back to unordered)
- Enforce from-to pairs? 
- Get core in on the gig (anything that looks like a from-to pair will automatically be treated as a link list)


-- categorical to vs dependent to are different and can/should be stored differently?
-- things can belong in different categories. how to show this?
--- bunches of slides containing sub-slides which are atoms of information, and can be arranged as such.
--- tag slides, then have slides that contain their tagged slides.
--- tables within slides? how to? if A:B and C:B, then can make a table with A vs C on B. 
recursive, colon separated tags.