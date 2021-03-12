# UI model
Polymorph's UI model consists of nested rectangles with tabs. Lowest-level rectangles have operators which contain operators aka representations of the underlying document.
- rectangle
    - (left) rectangle
        - List of items
    - (right) rectangle
        - (tab 1) Detail textarea of item
        - (tab 2) Calendar
The rect/operator structure is stored in the data model. Much like Von Neumann's combination of opcodes and data, this model allows representations to be easily encoded, allowing data-driven representations rather than fixed representations.

Between the rect and the operator is a middle layer called the Container, which creates a wrapper around the operator allowing it to be customised by the end user without asking the developer to consider the ways the end user might rewire their operator.

For more specific notes on each of the different layers of the UI model, refer to the links below:
- [Rects](rects.md)
- [Containers](container.md)
- [Operators](operators_general/overview.md)

## Subframes
One gap recognised early on was that although tabs allowed a single rect to contain a single other operator, sometimes context switching required further nesting. For this reason, the subframe operator was created:
- rectangle
    - (tab 1) Subframe: To do list context
        - Rectangle
            - (left) rectangle
                - List of items
            - (right) rectangle
                - (tab 1) Detail textarea of item
                - (tab 2) Calendar
    - (tab 2) Subframe: Knowledge management context
        - Rectangle
            - (left) rectangle
                - List of items
            - (right) rectangle
                - (tab 1) Detail textarea of item