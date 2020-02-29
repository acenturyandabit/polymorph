# rationale for the save source query parameter
So that links are transferrable to other users. unlike google, we can't just load everything from a single centralised source. so: always make the link shareable? If i enter the link from anywhere, if PM can fetch it it will fetch it? but i need to uniquely identify all things that can store polymorph documents, which i may not have authority for, so we'll just not for now.

## old save order
1. Load from multiple sources with fallbacks.
2. Save to all sources if possible - if not then save to as many as you can. 
3. Load order shouldn't matter if we're merging, but use load order because otherwise it's too messy?
4. Load into live doc rather than load all, to save time.

## new save order
1. load from all sources that user has nominated
3. use lu to figure out which items to keep.
--
1. Fire userSave command, things which are hooked will force save if they want.

# save source records
`polymorph_core.userData.documents.saveSources` is an array of these.

saveSourceRecord{
    load:true
    save:true
    data:{
        key:val
    }
    type:str
}

# save source instances
polymorph_core now has savesourceinstances, which are instances of save sources. they are freed on resetDocument.


on instantiation, if you need to load, please load.
polymorph_core.integrateData(d, save_source_record.type);


When making a new doc, have the option to pull from a remote server. -- instantiate a new savesource there and then. 

Time to make the home operator! Can only be accessed from an empty polymorph? How is it different from filescreen then? It looks prettier.

so, I start doc 1 on local. I push to remote by adding a savesource. [ the savesource needs to know to get pushed to rather than to pull from. ] 
I start doc 2 on local2. I tell it to connect to remote and pull doc1. 

stack
- polymorph_core.datautils.upgradeSaveData(id);


        if (!polymorph_core.currentDocID) {
            polymorph_core.datautils.upgradeSaveData(polymorph_core.currentDocID, 'lf');
        }
        if (!polymorph_core.userData.documents[polymorph_core.currentDocID].loadHooks || Object.keys(polymorph_core.userData.documents[polymorph_core.currentDocID].loadHooks).length == 0) {
            polymorph_core.datautils.upgradeSaveData(polymorph_core.currentDocID, 'lf');
        }

- polymorph_core.fetchData(saveSourceRecord)



pullFrom, pushto, etc now take instances.

redo the entire dialog

//just server and localforage for now. everything else can wait.