# Save sources
Look in savesources/template.

## Properties
Since savesources are standalone, their properties can be declared as `this.property=value` in the instantiation.
- creatable: Can you create a document from this source?
- prettyName: The name to be displayed to the user, and on the name of your dialog entry in preferences.

## Methods
You can implement any number of the following methods, if not all of them.

In each case, the current document ID can be accessed via polymorph_core.currentDocID, and the data associated with your particular savesource can be accessed through `polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[your_savesource]`, or the much prettier macro `polymorph_core.saveSourceData[your_savesource]`.

- async this.hook(): Sync the existing document with the one in the savesource (if necessary). Then:
    - If you do not handle live sync (e.g. a local storage), get ready to handle polymorph_core.on('userSave',(data)=>{});
    - If you do handle live sync (e.g. through a database), get ready to handle polymorph_core.on('updateItemSave',(id)=>{}). This will be called once polymorph_core is satisfied that the item has been updated.
        - Additionally, fire polymorph_core.fire('updateItemRemote',{d:id}) when you recieve and post an update. polymorph_core will keep track of updateItemRemote and updateItemSave to ensure there are no infinite loops.
- async this.unhook(): Unsync the existing document, so that you don't respond to all the triggers you do above.
- async this.pullAll(): Get a complete copy of the data from storage, and return it.
- async this.pushAll(data): Push a complete copy of the data to storage. This is only called by the dialog, but you can use it for internal operations too.

This is a little tricky to get right the first time - if you need help or inspiration, check out localforage2.js.

## Possible refactors
Manage hooks within polymorph_core - will save some overhead in the files.