# Overview

Polymorph is a highly modular system, which makes it fantastic for modding. 

If you're only looking to mod polymorph by adding your own functionality, you may only need to know about the following structure:

![](https://raw.githubusercontent.com/acenturyandabit/polymorph/largeAssets/assets/readme2.gif)





## It's like...
- ROS [https://www.ros.org/], but for user interfaces
- Outlook, but less integrated (sad) and more flexible (yay)
## Software Architecture
Polymorph is made up of a few main components:
- polymorph_core: This represents a shared platform where everything interacts. It contains a main event interface.
- Rects: This represents resizable rectangles that form the basis of Polymorph's UX.
- Containers: Rects hold containers, which hold operators. Containers abstract away some common UX concerns from operators.
- polymorph_core modules: These represent aspects of the polymorph_core's operation.
- Items: These are created by users through operators.
- [MODDING FOCUS] Operators: These represent different ways of representing, interacting with and creating items.

## Data architecture
The main data repositories of Polymorph include:
- polymorph_core.userData: Device (browser) scope. 
```javascript
polymorph_core.userData={
    documents:{
        document_id:{
            saveSources:{
                saveSourceName:savesourceData
            },
            autosave: true/false
        }
    },
    tutorialData:{
        operatorName:operatorTutorialData
    }
}
```
- polymorph_core.items: Instance scope.
## Living architecture
