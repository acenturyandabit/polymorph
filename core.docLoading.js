core.loadFromURL = function (params) { // very first load
    //screw the id, we just gonna use core.userData straight up
    let source = params.get("src") || 'lf';
    core.currentDocID = params.get("doc");
    //if there is a template, knock off the template from the url and remember it (discreetly)
    let template;
    if (params.has("tmp")) {
        template = params.get("tmp");
        let loc = window.location.href
        loc = loc.replace(/&tmp=[^&]+/, "");
        history.pushState({}, "", loc);
        console.log(window.location.href);
    }
    if (!core.userData.documents[core.currentDocID]) {
        core.userData.documents[core.currentDocID] = {};
    }
    if (!core.userData.documents[core.currentDocID].saveSources) {
        core.userData.documents[core.currentDocID].saveSources = {};
    }
    if (!core.userData.documents[core.currentDocID].saveSources[source]) {
        //this is a new document.... do stuff
        //Create a new profile for this save source and document
        core.userData.documents[core.currentDocID].saveSources[source] = core.currentDocID;
    }
    if (!core.userLoad(source, core.userData.documents[core.currentDocID].saveSources[source], { initial: true, template: template })) {
        core.filescreen.showSplash();
    };
}



core.saveSources = [];

core.registerSaveSource = function (id, f) {
    core.saveSources[id] = new f(core);
    //create a wrapper for it in the loading dialog
    core.addToDialog(id);
}

core.userLoad = async function (source, data, state) { // direct from URL
    //do some checks before we do any lasting damage
    if (!core.saveSources[source]) {
        //save source does not exist, alert the user
        alert("Ack! Looks like this save source is not working right now.");
        return false;
    }
    document.querySelector(".wall").style.display = "block";
    let d = await core.saveSources[source].pullAll(data);
    //Does data exist? If not, make a new document.
    if (!d) {
        d = {
            displayName: "New Workspace",
            currentView: "default",
            id: core.currentDocID,
            views: {},
            items: {}
        }
        core.fire("documentCreated", core.currentDocID);
        if (state.template) {
            Object.assign(d, polymorphTemplates[template]);
        }
    }
    //Does the current document match the current document? 
    if (!d.id) {
        //older version savedata, convert!
        d.id = core.currentDocID;
    }
    if (d.id != core.currentDocID) {
        //Alert the user
        if (confirm("Hmm... this source seems to be storing a different document to the one you requested. Continue loading?")) {
            if (confirm("Would you like to open this in a new window?")) {

            } else {
                //overwrite what we have right now
            }
        } else {
            if (confirm("Would you like to overwrite the document at this location?")) {
                //change the save source and overwrite it.
                //create a file backup of the data at this location
            } else if (confirm("Try and find another location in this save source to save this document?")) {
                //reset the save source data with a new GUID and attempt to save
            }
            document.querySelector(".wall").style.display = "none";
            return false;
        }
    }
    //Are we loading from scratch?
    if (!core.documentIsClean) {
        core.tryMerge(d, core.toSaveData());
        document.querySelector(".wall").style.display = "none";
        return true;
    } else {
        //load as usualll
        core.fromSaveData(d);
        document.querySelector(".wall").style.display = "none";
        return true;
    }
}

core.fromSaveData = function (data) {
    //load metadata, including views
    core.resetDocument();
    core.currentDoc = data;
    core.items = data.items;
    if (!core.currentDoc.currentView) core.currentDoc.currentView = Object.keys(core.currentDoc.views)[0];
    core.presentView(core.currentDoc.currentView);
    core.baseRect.refresh();
    for (let i in core.items) {
        core.standardiseItem(i);
    }
    for (let i in core.items) {
        core.fire("updateItem", {
            id: i
        });
    }
    core.updateSettings();
    core.unsaved = false;
}

core.toSaveData = function () {
    //patch current doc
    core.currentDoc.views[core.currentDoc.currentView] = core.baseRect.toSaveData();
    //clean up
    core.isSaving = true;
    for (let i in core.items) {
        core.itemShouldBeDeleted = true;
        core.fire("updateItem", {
            id: i,
            sender: "GARBAGE_COLLECTOR"
        });
        if (core.itemShouldBeDeleted) {
            delete core.items[i];
        }
    }
    core.isSaving = false;
    //patch items
    core.currentDoc.items = core.items;
    //save to all sources
    //upgrade older save systems
    return core.currentDoc;
}

core.userSave = function () {
    //save to all sources
    //upgrade older save systems
    let d = core.toSaveData();
    core.filescreen.saveRecentDocument(core.currentDocID, undefined, core.currentDoc.displayName);
    if (!core.currentDoc.saveSources) {
        core.currentDoc.saveSources = {
            lf: core.currentDocID
        };
    }
    for (let i in core.currentDoc.saveSources) {
        try {
            core.saveSources[i].pushAll(core.currentDoc.saveSources[i], d);
        } catch (e) {
            continue;
        }

    }
    core.unsaved = false;
};

(() => {
    //////////////////////////////////////////////////////////////////
    //Loading dialogs
    loadDialog = document.createElement("div");
    loadDialog.classList.add("dialog");
    loadDialog = dialogManager.checkDialogs(loadDialog)[0];

    core.loadInnerDialog = document.createElement("div");
    loadDialog.querySelector(".innerDialog").appendChild(core.loadInnerDialog);
    core.loadInnerDialog.classList.add("loadInnerDialog")
    core.loadInnerDialog.innerHTML = `
    <style>
    .loadInnerDialog>div{
        border: 1px solid;
        position:relative;
    }
    .loadInnerDialog>div>span:nth-child(2){
        position:absolute;
        top: 0;
        right: 0;
    }
    </style>
          <h1>Load/Save settings</h1>
          `;
    let autosaveOp = new _option({
        div: core.loadInnerDialog,
        type: "bool",
        object: () => {
            return core.userData.documents[core.currentDocID]
        },
        property: "autosave",
        label: "Autosave all changes"
    });
    //----------Autosave----------//
    core.autosaveCapacitor = new capacitor(200, 20, core.userSave);
    core.on("updateView,updateItem", function (d) {
        if (core.userData.documents[core.currentDocID].autosave && !core.isSaving) {
            core.autosaveCapacitor.submit();
        }
    });



    //delegate toggle event handlers

    core.addToDialog = function (id) {
        let wrapperText = `
        <div data-saveref='${id}'>
            <h2>${core.saveSources[id].prettyName || id}</h2>
            <span>
                <label>Default save source<input type="radio" name="dflt"></input></label><!--Load from this for the first time-->`;
        if (core.saveSources[id].hook) wrapperText += `<label>Sync to this source<input data-role="tsync" type="checkbox"></input></label><!--Request to save each change to this source-->`;
        wrapperText += `               
                <button data-role="dlg_save">Save to this source</button>
                <button data-role="dlg_load">Load from this source</button>
            </span>
        </div>
        `;
        let wrapper = htmlwrap(wrapperText);
        //also register its settings in the save dialog
        if (core.saveSources[id].dialog) wrapper.appendChild(core.saveSources[id].dialog);
        core.loadInnerDialog.appendChild(wrapper);
    }

    core.on("UIstart", () => {
        document.body.appendChild(loadDialog)
        document.querySelector(".saveSources").addEventListener("click", () => {
            for (let i in core.saveSources)
                if (core.saveSources[i].readyDialog) core.saveSources[i].readyDialog();
            for (let i in core.userData.documents[core.currentDocID].saveSources) {
                try { core.loadInnerDialog.querySelector(`div[data-saveref='${i}'] [data-role='tsync']`).checked = true; }
                catch (e) {
                    console.log(e);
                }
            }
            let params = new URLSearchParams(window.location.search);
            if (params.get("src")) core.loadInnerDialog.querySelector(`div[data-saveref='${params.get('src')}'] [name='dflt']`).checked = true;
            autosaveOp.load();
            loadDialog.style.display = "block";
        });
    });
    loadDialog.querySelector(".cb").addEventListener("click",core.saveUserData);
})();
core.loadInnerDialog.addEventListener("input", (e) => {
    if (e.target.matches("[name='dflt']")) {
        //'change' the default save source, by changing the url
        window.history.pushState("", core.currentDoc.displayName, `?doc=${core.currentDocID}&src=${e.target.parentElement.parentElement.parentElement.dataset.saveref}`);
        core.filescreen.saveRecentDocument(core.currentDocID, undefined, core.currentDoc.displayName);
    } else if (e.target.matches("[data-role='tsync']")) {
        let csource = e.target.parentElement.parentElement.parentElement.dataset.saveref;
        if (e.target.checked) {
            core.userData.documents[core.currentDocID].saveSources[csource] = core.currentDocID;
            if (core.saveSources[csource].hook) core.saveSources[csource].hook(core.currentDocID);
        } else {
            if (core.saveSources[csource].unhook) core.saveSources[csource].unhook(core.currentDocID);
            delete core.userData.documents[core.currentDocID].saveSources[csource];
        }
        core.saveUserData();
    }
})

core.loadInnerDialog.addEventListener("click", (e) => {
    if (e.target.matches("[data-role='dlg_save']")) {
        //Get the save source to save now
        core.saveSources[e.target.parentElement.parentElement.dataset.saveref].pushAll(core.currentDocID, core.toSaveData());
    } else if (e.target.matches("[data-role='dlg_load']")) {
        //Load from the save source
        core.saveSources[e.target.parentElement.parentElement.dataset.saveref].pullAll(core.currentDocID);
    }
})

