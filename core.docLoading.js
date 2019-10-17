(() => {
    function upgradeSaveData(id, source) { // also handles creation of new savedatas. Just hand it an empty object or undefined .
        if (core.userData.documents[id] == undefined || Object.keys(core.userData.documents[id]).length == 0) {
            core.userData.documents[id] = {
                v: 2,
                saveSources: []
            };
        }
        if (!core.userData.documents[core.currentDocID].saveSources) {
            core.userData.documents[core.currentDocID].saveSources = [];
        }
        if (!core.userData.documents[id].v || core.userData.documents[id].v < 2) {
            let newdoc = {
                v: 2,
                saveSources: [],
            };
            Object.assign(newdoc, core.userData.documents[id]);
            if (core.userData.documents[id].saveHooks){
                newdoc.saveSources = Object.keys(core.userData.documents[id].saveHooks);
                delete newdoc.saveHooks;
            }
            core.userData.documents[id] = newdoc;
        }
        if (source) {
            if (!(core.userData.documents[id].saveSources.includes(source))) {
                //this is a new document.... do stuff
                //Create a new profile for this save source and document
                core.userData.documents[id].saveSources.push(source);
            }
        }
        if (!core.userData.documents[id].saveSources.length){
            core.userData.documents[id].saveSources.push("lf");//at least you got him, eh?
            core.rehookAll(id);
        }
    }

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
            //check open flag
            if (params.has("o")) {
                //trim the open flag
                let loc = window.location.href
                loc = loc.replace(/\?o/, "");
                history.pushState({}, "", loc);
                core.filescreen.showSplash();
                return;
            }
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
            upgradeSaveData(core.currentDocID, source);
            //if there is a template, knock off the template from the url and remember it (discreetly)
            let template;
            if (params.has("tmp")) {
                template = params.get("tmp");
                let loc = window.location.href
                loc = loc.replace(/&tmp=[^&]+/, "");
                history.pushState({}, "", loc);
            }
            //Load it
            if (!core.userLoad(source, core.currentDocID, { initial: true, template: template })) {
                core.instantNewDoc();
            };
        } else {
            core.instantNewDoc();
        }
    }

    core.instantNewDoc = function () {
        //don't reload the page, directly load a new document, so we can handle the case appropriately
        //some parameters
        let template = core.filescreen.baseDiv.querySelector(".tmplt").value;
        let source = core.filescreen.baseDiv.querySelector(".source").value;
        let nm = core.filescreen.baseDiv.querySelector("[data-role='nm']").value || "New Workspace";
        let id = guid(5);
        //generate the URL
        window.history.pushState("", "", window.location + `?doc=${id}&src=${source}`);
        let d = {
            displayName: nm,
            currentView: "default",
            id: core.currentDocID,
            views: {},
            items: {}
        }
        d.id = core.currentDocID = id;
        if (template != "none") {
            Object.assign(d, polymorphTemplates[template]);
        }
        upgradeSaveData(core.currentDocID, source);
        core.isNewDoc = true;
        core.fire("documentCreated", id);
        core.fromSaveData(d);
        core.filescreen.baseDiv.style.display = "none";
        document.querySelector(".wall").style.display = "none";
        //dont care about the 
    }

    core.on("updateItem,updateView", () => { core.isNewDoc = false });

    core.rehookAll = function (id) { // TODO: redo this with promises to make it async compatible
        for (let i = 0; i < core.userData.documents[id].saveSources.length; i++) {
            let source = core.userData.documents[id].saveSources[i];
            if (core.saveSources[source].unhook) core.saveSources[source].unhook();
            if (core.saveSources[source].hook) core.saveSources[source].hook(core.currentDocID);
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
            } else {
                if (confirm("Create a new document that matches this datasource? (OK), or change the loaded data to this document name (CANCEL)?")) {
                    core.currentDocID = d.id;
                    if (!core.userData.documents[core.currentDocID] || !core.userData.documents[core.currentDocID].v || core.userData.documents[core.currentDocID].v < 2) {
                        core.userData.documents[core.currentDocID] = {
                            v: 2,
                            saveSources: ['lf']
                        };
                    }
                    //reload the page
                    core.rehookAll(core.currentDocID);
                    core.fire("userSave", d);
                    core.saveUserData();
                    function f() {
                        if (core.savedOK) {
                            window.location.href = `?doc=${core.currentDocID}&source=lf`;
                        } else {
                            setTimeout(f, 1);
                        }
                    }
                    setTimeout(f, 1);
                } else {
                    d.id = core.currentDocID;
                }
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
        upgradeSaveData(core.currentDocID);
        core.filescreen.saveRecentDocument(core.currentDocID, undefined, core.currentDoc.displayName);
        //trigger saving on all save sources
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

        core.on("titleButtonsReady", () => {
            document.body.appendChild(loadDialog);
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
                core.userData.documents[core.currentDocID].saveHooks[csource] = true;
            } else {
                if (core.saveSources[csource].unhook) core.saveSources[csource].unhook(core.userData.documents[core.currentDocID].saveSources[csource]);
                delete core.userData.documents[core.currentDocID].saveHooks[csource];
            }
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
})();