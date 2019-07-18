core.loadDocument = async function () {
    let params = new URLSearchParams(window.location.search);
    let handled = false;
    let source;
    if (params.has("doc")) {
        //screw the id, we just gonna use core.userData straight up
        source = params.get("src") || 'lf';
        core.currentDocID = params.get("doc");
        handled = true;
    } else if (window.location.search) {
        //For non-polymorph links, like drive links
        //try each save source to see if it can handle this kind of request
        for (let i in core.saveSources) {
            if (core.saveSources[i].canHandle) {
                core.currentDocID = await core.saveSources[i].canHandle(params);
                if (core.currentDocID) {
                    source = i;
                    handled = true;
                    break;
                }
            }
        }
    }
    if (handled) {
        //if the current document doesnt exist, then create it.
        if (!core.userData.documents[core.currentDocID]) {
            core.userData.documents[core.currentDocID] = {
                v: 1,
                saveSources: {},
                saveHooks: {}
            };
        }
        if (!core.userData.documents[core.currentDocID].v) {
            let newdoc = {
                v: 1,
                saveSources: {},
                saveHooks: {}
            };
            Object.assign(newdoc, core.userData.documents[core.currentDocID]);
            core.userData.documents[core.currentDocID] = newdoc;
        }
        if (!core.userData.documents[core.currentDocID].saveSources[source]) {
            //this is a new document.... do stuff
            //Create a new profile for this save source and document
            core.userData.documents[core.currentDocID].saveSources[source] = core.currentDocID;
            //also hook it
            core.userData.documents[core.currentDocID].saveHooks[source] = true;
        }

        //if there is a template, knock off the template from the url and remember it (discreetly)
        let template;
        if (params.has("tmp")) {
            template = params.get("tmp");
            let loc = window.location.href
            loc = loc.replace(/&tmp=[^&]+/, "");
            history.pushState({}, "", loc);
            console.log(window.location.href);
        }
        //Load it
        if (!core.userLoad(source, core.userData.documents[core.currentDocID].saveSources[source], { initial: true, template: template })) {
            core.filescreen.showSplash();
        };
    } else {
        core.filescreen.showSplash();
    }
}

core.rehookAll = function (id) {
    for (let i in core.saveSources) {
        if (core.saveSources[i].unhook) core.saveSources[i].unhook();
    }
    for (let i in core.userData.documents[id].saveHooks) {
        if (core.saveSources[i] && core.saveSources[i].hook) core.saveSources[i].hook(core.userData.documents[core.currentDocID].saveSources[i]);
    }
}


core.saveSources = [];

core.registerSaveSource = function (id, f) {
    core.saveSources[id] = new f(core);
    //create a wrapper for it in the loading dialog
    core.addToDialog(id);
}

core.userLoad = async function (source, data, state) { // direct from URL
    if (!state) state = {};
    //do some checks before we do any lasting damage
    if (!core.saveSources[source]) {
        //save source does not exist, alert the user
        alert("Ack! Looks like this save source is not working right now.");
        return false;
    }
    document.querySelector(".wall").style.display = "block";
    let d;
    try {
        d = await core.saveSources[source].pullAll(data);
    } catch (e) {
        alert("Something went wrong with the save source: " + e);
        document.querySelector(".wall").style.display = "block";
        return;
    }

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
            Object.assign(d, polymorphTemplates[state.template]);
        }
    }
    //Does the current document match the current document? 
    if (!d.id) {
        //older version savedata, convert!
        d.id = core.currentDocID;
    }
    if (d.id != core.currentDocID) {
        //Alert the user
        if (!confirm("Hmm... this source seems to be storing a different document to the one you requested. Continue loading?")) {
            document.querySelector(".wall").style.display = "none";
            return false;
        }
    }
    //Are we loading from scratch?
    if (!core.documentIsClean) {
        core.tryMerge(d, core.toSaveData());
        core.fromSaveData(d);
    } else {
        //load as usualll
        core.fromSaveData(d);
    }
    core.rehookAll(core.currentDocID);
    document.querySelector(".wall").style.display = "none";
    return true;
}

core.fromSaveData = function (data) {
    //load metadata, including views
    core.resetDocument();
    core.currentDoc = data;
    core.items = data.items;
    core.documentIsClean = false;
    // create allll the views
    delete core.baseRects;
    core.baseRects = {};
    for (let i in core.currentDoc.views) {
        //load up said view
        core.baseRects[i] = new _rect(core, undefined, core.currentDoc.views[i]);
    }
    // cry a little when they arent created
    if (!core.userData.documents[core.currentDocID]) core.userData.documents[core.currentDocID] = {};
    if (!core.userData.documents[core.currentDocID].currentView || !core.currentDoc.views[core.userData.documents[core.currentDocID].currentView]) core.userData.documents[core.currentDocID].currentView = Object.keys(core.currentDoc.views)[0];
    core.isSaving = true; // set this so that autosave doesnt save for each item
    core.presentView(core.userData.documents[core.currentDocID].currentView);
    for (let i in core.items) {
        core.standardiseItem(i);
    }
    for (let i in core.items) {
        core.fire("updateItem", {
            id: i
        });
    }
    core.isSaving = false;
    core.updateSettings();
    core.unsaved = false;
}

core.toSaveData = function () {
    //patch current doc
    core.currentDoc.views[core.userData.documents[core.currentDocID].currentView] = core.baseRect.toSaveData();
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

core.cetch('userSave', (data, state) => {
    if (state == undefined) {
        if (data) {
            //ok we saved
            core.unsaved = false;
        }
    }
})

core.userSave = function () {
    //save to all sources
    //upgrade older save systems
    let d = core.toSaveData();
    core.filescreen.saveRecentDocument(core.currentDocID, undefined, core.currentDoc.displayName);
    if (!core.userData.documents[core.currentDocID]) {
        core.userData.documents[core.currentDocID] = {};
    }
    if (!core.userData.documents[core.currentDocID].saveSources) {
        if (core.currentDoc.saveSources) {
            core.userData.documents[core.currentDocID].saveSources = core.currentDoc.saveSources;
        } else {
            core.userData.documents[core.currentDocID].saveSources = {
                lf: core.currentDocID
            };
        }
    }// the above realllly shouldnt happen
    core.fire("userSave", d);
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
    .loadInnerDialog>div>h2{
        margin:0;
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
            <span>`;
        if (core.saveSources[id].hook) wrapperText += `<label>Save to this source<input data-role="tsync" type="checkbox"></input></label>`;
        if (core.saveSources[id].pullAll) wrapperText += `<button data-role="dlg_load">Load from this source</button>`;
        if (core.saveSources[id].pushAll) wrapperText += `<button data-role="dlg_save">Save to this source</button>`;
        wrapperText += `</span>
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
                if (core.saveSources[i].showDialog) core.saveSources[i].showDialog();
            for (let i in core.userData.documents[core.currentDocID].saveHooks) {
                try { core.loadInnerDialog.querySelector(`div[data-saveref='${i}'] [data-role='tsync']`).checked = true; }
                catch (e) {
                    console.log(e);
                }
            }
            autosaveOp.load();
            loadDialog.style.display = "block";
        });
    });
    loadDialog.querySelector(".cb").addEventListener("click", core.saveUserData);
})();
core.loadInnerDialog.addEventListener("input", (e) => {
    if (e.target.matches("[data-role='tsync']")) {
        let csource = e.target.parentElement.parentElement.parentElement.dataset.saveref;
        if (e.target.checked) {
            if (!core.userData.documents[core.currentDocID].saveSources[csource]) core.userData.documents[core.currentDocID].saveSources[csource] = core.currentDocID;
            if (core.saveSources[csource].hook) core.saveSources[csource].hook(core.userData.documents[core.currentDocID].saveSources[csource]);
        } else {
            if (core.saveSources[csource].unhook) core.saveSources[csource].unhook(core.userData.documents[core.currentDocID].saveSources[csource]);
            delete core.userData.documents[core.currentDocID].saveSources[csource];
        }
        core.userData.documents[core.currentDocID].saveHooks[csource] = e.target.checked;
        core.saveUserData();
    }
})

core.loadInnerDialog.addEventListener("click", (e) => {
    if (e.target.matches("[data-role='dlg_save']")) {
        //Get the save source to save now
        let src = e.target.parentElement.parentElement.dataset.saveref;
        core.saveSources[src].pushAll(core.userData.documents[core.currentDocID].saveSources[src], core.toSaveData());
    } else if (e.target.matches("[data-role='dlg_load']")) {
        //Load from the save source
        let source = e.target.parentElement.parentElement.dataset.saveref;
        core.userLoad(source, core.userData.documents[core.currentDocID].saveSources[source] || core.currentDocID)
    }
})

