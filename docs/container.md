# Containers
## Properties:
- settings: (Actually a getter for polymorph_core.items[this_container_id]).
    - t: The type
    - data: The base operator's data.
    - outputRemaps: Event trigger output remaps.
        - Looks like this: {createItem:["a","b","c"]}
    - inputRemaps: Event trigger input remaps.
        - Looks like this: {from:"to"}. I might make it an array if i feel the need to but that feels really unnecessary and you can just attach more outputremaps as a workaround. I know it's not consistent with outputRemaps, but like, it's different.
    - tabbarName: The name of the operator on the tabspan.
    - p: Parent rect (or subframe).
