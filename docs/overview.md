# Overview

Polymorph is a highly modular system, which makes it fantastic for modding. The main classes of modules outside of the care are savesources and operators: 

![](https://raw.githubusercontent.com/acenturyandabit/polymorph/largeAssets/docs/polymorph_overview.PNG)

- Operators operate on the data by rendering it and applying user edits to the underlying data. Operators also subscribe or publish to an event system allowing them to communicate with each other.
- Save sources operate on the data by saving it to a remote location for safekeeping between sessions.

There are also a number of core elements:
- Containers wrap around operators to help isolate operators from each other in a field-reconfigurable manner.
- Rects manage space by dividing the screen into rectangles. Each rect can either hold exactly two other rects; or an indefinite number of containers in tabs.
- The core event system relays events between operators and from operators to realtime savesources. 
- The core document loading system reads both the local machine data and the document data to determine which save source instances and operators to create.

The unit of data in polymorph is an item. An item is a plain JSON-encoded entry in the document dictionary. Items can further have properties which are then rendered by operators.


[Back to contents](https://github.com/acenturyandabit/polymorph/tree/master/docs)
