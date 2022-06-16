# Polymorph developer documentation
Welcome to the developer documentation for Polymorph. 

## Core concepts
### Event system
Polymorph uses an event system to facilitate item updates and allow procedure calls between different parts of the system. A code module can register a function to be run on a given event using the `polymorph_core.on` function; and can raise an event using the `polymorph_core.fire` function. The most common event to be fired is the `updateItem` event, which is fired whenever any module updates an item. Reigstered functions will respond to the updateItem event by rerendering parts of the UI, or storing changes to be saved later.

### Interface organisation
Polymorph's interface is organised into rectangles and tabs. Each rectangle can be divided into two smaller rectangles along a single linear dimension into other rectangles on a proportional basis (making the polymorph document responsive); or the rectangle can host one or more tabs. Each tab can hold a single operator, which operates on the underlying data by rendering it or otherwise. Operators are wrapped around containers, which provide remapping of events for fine tuning of procedure calls.

### Data organisation
Polymorph's data is organised as a single flat-pack of items consisting of a dictionary of key:object pairs. By not separating (say) operators, rects, and ordinary objects, storage integrations are simplified: anything that can store key-value pairs can store a polymorph document very easily.

### Modular save system
Instead of creating a single save system, Polymorph asks save providers to implement save-hooks. When a user requests that Polymorph save their work, Polymorph reaches out to the save providers which individually save the work. By implementing multiple save providers, users can migrate save sources relatively easily; and new save sources can be added without changing core functionality.

## Design principles
### Extensibility
Some of the most-loved software packages in the world allow superusers to modify the core offering through Mods or Extensions of some sort: Paint.net, Jira, Minecraft, the list goes on. Borrowing from game design, Polymorph strives to be highly moddable, to the extent of delivering much of its core functionality through a modular system.

To keep Polymorph's build system simple (i.e. just concatenating all the files in a particular order), Polymorph decentralises declarations of features; i.e. instead of listing the features in one place, developers can list their features in a single file which need only be concatenated into the file list to install. 

## Porting
Various porting options are provided if an application which does not require polymorph's core UI elements (the rect, tab, container and title bar) is desired.
- If a static document is required (one which does not allow the user to save their changes), the `build/polymorph_static.js` version can be used to render a single static .json file, with all of Polymorph's features.
- [TODO] A slimmed-down version of the polymorph core supporting a single desired operator and savesource can be constructed using `build/unit_core.js`.