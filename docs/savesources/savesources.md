# Save sources
Look in savesources/template.

## Save source functionality
4 basic functions of save sources:
- I pull data from you, when asked.
- I receive change orders from you, and push them to the user.
- I push change orders to you, when I change
- I push data to you, when I save.

## Save source lifecycle
- Save sources are initialised when a document is loaded; or when a user creates the savesource from the savesources menu.
    - The savesource calls the standard function `polymorph_core.addToSaveDialog(this)` to add itself to the save dialog. 


## Flag
Since savesources are standalone, their flags can be declared as `this.flag=value` in the instantiation.
- createable: Can you create a document from this source?
- prettyName: The name to be displayed to the user, and on the name of your dialog entry in preferences.

## Methods
You can implement any number of the following methods, if not all of them.

- async this.hook(sourceData): Sync the existing document with the one in the savesource (if necessary). Then:
    - If you do not handle live sync (e.g. a local storage), get ready to handle polymorph_core.on('userSave',(data)=>{});
    - If you do handle live sync (e.g. through a database), get ready to handle polymorph_core.on('updateItemSave',(id)=>{}). This will be called once polymorph_core is satisfied that the item has been updated.
        - Additionally, fire polymorph_core.fire('updateItemRemote',{d:id}) when you recieve and post an update. polymorph_core will keep track of updateItemRemote and updateItemSave to ensure there are no infinite loops.
    - `hook` is called once for every live operator in the doc when the doc is loaded. 
        - It is NOT called if the savesource is loaded after the document is created; thus allowing the user to nominate whether or not to use the save source.
        - It is called when the user checks the `save to this source` button in the save dialog.
- async this.unhook(sourcedata): 
    - Unsync the existing document, so that you don't respond to all the triggers you do above.
    - This is called when the user unchecks the `save to this source` button in the save dialog. It is not usually called.
- async this.pullAll(): Get a complete copy of the data from storage, and return it.
- async this.pushAll(data): Push a complete copy of the data to storage. 
    - This is only called by a manual user press of the dialog, but you can use it for internal operations too.
    - In "normal" environments, "userSave" would be fired and you would handle that. Code for routing userSave to pushAll is in the template.

This is a little tricky to get right the first time - if you need help or inspiration, check out localforage2.js.

## Data storage
- About the document:
    - In each case, the current document ID can be accessed via `polymorph_core.currentDocID`. This is physically stored in `polymorph_core.items._meta`.
- The data associated with your particular savesource is an object.
    - it can be accessed through:
        - `polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[your_savesource]`, 
        - or the much prettier macro `polymorph_core.saveSourceData[your_savesource]`.
        - or just `this.settings.data` when you are working with the function. 
    - This is physically stored in localstorage, so don't jam it full of stuff please. 
    - IT DOES NOT CARRY WITH THE DOCUMENT TO DIFFERENT LOCATIONS. If you _really_ want to bind some stuff to the document, keep it in `data._meta` please.

When initialised, the saveSourceData will be blank (i.e. `{}`) . You may put in properties there as you desire.

## Possible refactors
Manage hooks within polymorph_core - will save some overhead in the files.