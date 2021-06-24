# Linking V2 standard

## Ideal / priorities
- Standard can deal with multiple types of directed and undirected and hierarchical links.
    - hierarchy links are just directed links?
- can deal with hypergraphs
- requires minimal processing overhead
- fault tolerant
- edges can have props
- every vertex sees every edge
- accept external progressive changes
- minimal memory usage


## brainstormed options
- binary-directed hypergraph: https://murali-group.github.io/halp/
    - anonymous edges; binary (rather than sequential) direction
- partially ordered set edges, cached at runtime by polymorph_core
    - have to be able to upgrade edges to things-with-edges
    - have to be able to interpret edge properties in different ways
    - query: is there an edge between A and B, at the graph / hypergraph / hyper^2graph level?
        - Example: There exists C:{A,B,A>B}, D:{A,C}, K:{L,K>L}
            - partially directed hyperedge: C:{A,B,C,A>B}
            - branching hyperedge: C:{A,B,C,A>B, A>C}
            - invalid hyperedges: theoretically valid hyperedges that neither a hypergraph nor a hyper^2graph can interpret
                - cyclic directed hyperedge
                - ? partially directed hyperedge: because it can be represented as a graph, which means it's not atomic
                - incomplete directed hyperedge: contains more directed than acutal inclusives: K:{A,A>B} - invalid 
                - Self-referntial hyperedge: K:{K,L,K>L}
                - Self-referential hyperedge pair: K:{A,B}, A:{K,L}, as it implies that K is both a vertex and an edge? 
            - valid hyper^2edges but invalid hyperedges:
                - edge that refers to an edge: A{B,C}, D{A,B}
                - 
        - graph level: 
            - undirected edges: CA,CB, DA, DC
            - directed edges: AB
        - hypergraph level: consider hyperedge C as directed link between A->B; no connection to C. 
            - "partially directed edge"? 
        - hyper^2graph level: same as hypergraph. but if B
        - suppose there is a hyperedge C that links A and B.
            - at hypergraph level, AB only
            - at graph level, CA, CB
            - at hyper^2graph level, CA,CB
- ordered-sets-directed hypergraph
    - the combination between a binary-directed hypergraph and a poset hyper^2graph
- hyper^2 graphs have acyclic pointing-to graphs
    - what if you have a cyclic pointing-to graph? :: cannot represent it through "single-entity containment"
        - solve this through the separation of edges and the identifier of the edges. edge identifiers are things that point (not contain) to an edge. every edge identifier can only point to a single edge. you cannot point to the pointing of the edge identifier to the edge - this is atomic. 
Every interpretation of a graph must have:
- edge-vertex separation? 
    - issue is that you *can* make things which are both edges and vertexes
    - what if we forced edges to have labels?
    - or a mixture? labelled and anonymous edges? << might as well label all
- allowable nesting
    - [a,b]
    - [[a],[b,c],[d]]
    - [[[a],[b,c],[d]],[[e],[f,g]]]
        - can this be written using the [[]] only? << yes, if you MUST name the edges
    - the top level must have more than one item
    - no partial ordering allowed?
    - mixing nestings?
        - if you can mix nestings, that means you can recursively mix nestings.


- final soln
    - all edges must have a label, all edge labels can be referred to in edges
- representation
    - dimensional spaces
        - 2d space
            - regions
            - points
            - (curved) intervals
        - 3d space:
            - 3D regions
            - 2D surfaces
            - (curved) intervals
            - points
        - any less-than-full-dimensional container can be inflated into a full-dimensional container, always.
        - even in dimensional space, a container cannot contain itself, or contain another container that contains itself!
        - loops? general directionality? 
        - continuous vs discrete?
    - hybrid containment/directed graph
        - vertex-as-point
            - cannot contain anything
            - can be abstracted as a 'hyperedge'
        - edge: still MUST be between two vertices. can have direction or no.
        - vertex-as-container = hyperedge (it is actually a vertex-as-point pointing to many other vertex-as-points using a special pointing operator that renders as containment)
        - containment edges must be unordered and must form part of an acyclic pointed-to tree. (A containment node cannot eventually contain a node that contains itself.)
        - in containment, if A->K(B->C), A->B and A->C.
        - you can contain / uncontain a directed edge, even one that points to the container. (core vertex outside of container)
        - a directed graph edge can be either fully ordered or fully unordered, or a mix. This is represented by branching out from its core vertex. This makes the edge resolvable into individual strands.
            - if a directed graph edge has incoming 
        - directed edge graphs can be 
        - a directed edge can point to itself and other directed edges, by pointing to its core vertex.
        - typed edges. and directed edges fundamentally consist of sets of directed or undirected edges connected to a single unreferencable vertex
    - recursive ordered listing
    - directed graph [rotationally ordered?]
        - if its not ordered you can make it ordered by ordering it clockwise
        - what if it's fKN 3D? 
            - each edge has a descriptor then, like a set of angles or something
            - edge labels!
    - edge-labelled directed graph
        - a label is an edge prop, but the edge must exist somewhere

possible constraints
- agreement
    - this can be achieved with anonymous edges
    - or singularly directed edges
- graph representations need to be globally unambiguous

- a vertex. is a n-dimensional point. something that is an argument of an edge. it will be typed based on its edges first; verticies that have containment edges must be containers.
    - containments are dimensional. if dimension of containment == dimension of space, then containment relations are valid.  
- an edge. is somethign that operates on n vertices. operates = groups in a directed/undirected manner?
    - orderedsets
- a 'simple' edge is something that operates on EXACTLY 2 edges and must be either DIRECTED OR UNDIRECTED and can be TYPED.
    - contaiment
    - peer ordering
    - hierarchy
    - hierarchy with with index

- something can be both a vertex and an edge. 
- an edge should not have another edge in it? except in a hypergraph?
## Backwards compatibility
None

## Things that adhere to the V2 standard
None

## Shortcomings
- Cannot easily deal with hypergraphs.
- Assumes there are fewer [children with mulitple parents] than [parents with multiple children].
    - Ideally, each item can locate all instances of itself within a dynamic graph.


## How it works
Each item stores its own links. / To make updating across browsers easy.
Each item stores its PARENT item (not its child items!) / To make updating across browsers easy. 


## Helper functions
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