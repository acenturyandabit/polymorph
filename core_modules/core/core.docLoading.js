(() => {
    polymorph_core.loadDocument = async function () {
        let params = new URLSearchParams(window.location.search);
        let handled = false;
        let source;
        if (params.has("doc")) {
            //Load from polymorph_core.userData
            source = params.get("src") || 'lf';
            polymorph_core.currentDocID = params.get("doc");
            handled = true;
        } else if (window.location.search) {
            //check open flag, for file>open
            if (params.has("o")) {
                //trim the open flag
                let loc = window.location.href
                loc = loc.replace(/\?o/, "");
                history.pushState({}, "", loc);
                polymorph_core.filescreen.showSplash();
                return;
            }
            //For non-polymorph links (without doc), like drive links
            //try each save source to see if it can handle this kind of request
            for (let i in polymorph_core.saveSources) {
                if (polymorph_core.saveSources[i].canHandle) {
                    polymorph_core.currentDocID = await polymorph_core.saveSources[i].canHandle(params);
                    if (polymorph_core.currentDocID) {
                        source = i;
                        handled = true;
                        break;
                    }
                }
            }
        }
        let d;

        if (!handled) polymorph_core.currentDocID = guid(6, polymorph_core.userData.documents);

        // update savedata because fetchdoc depends on it.
        polymorph_core.datautils.upgradeSaveData(polymorph_core.currentDocID, source);

        if (handled) {
            //fetch it, if it exists
            d = await polymorph_core.fetchDoc(source, polymorph_core.currentDocID);
        } else {
            source = "lf";
        }

        // rehook after fetchdoc because firebase depends on it.
        polymorph_core.rehookAll(polymorph_core.currentDocID);

        window.history.pushState("", "", window.location.origin + window.location.pathname + `?doc=${polymorph_core.currentDocID}&src=${source}`);

        //if the current document userData doesnt exist, then create it.
        // e.g. user starts, user presses new, we get redirected to ?doc=etc&src=lf, but there is no entry.

        let template;
        //if there is a template, knock off the template from the url and remember it (discreetly)
        if (params.has("tmp")) {
            template = params.get("tmp");
            let loc = window.location.href
            loc = loc.replace(/&tmp=[^&]+/, "");
            history.pushState({}, "", loc);
        }
        let name;
        if (params.has("nm")) {
            name = params.get("nm");
            let loc = window.location.href
            loc = loc.replace(/&nm=[^&]+/, "");
            history.pushState({}, "", loc);
        }
        //Create a doc if not created, also add at least one baserect.
        //TODO: add document name to 2nd argument
        d = polymorph_core.sanityCheckDoc(d, { template: template, name: name });

        polymorph_core.fromSaveData(d);
    }

    //This is called by polymorph_core.loadDocument and the filescreen.
    polymorph_core.sanityCheckDoc = function (data, settings) {
        //if none then create new
        if (!data) {
            data = {
                _meta: {
                    displayName: settings.name || polymorph_core.currentDocID,
                    id: polymorph_core.currentDocID,
                    contextMenuItems: [
                        "Delete::polymorph_core.deleteItem",
                        "Background::item.edit(style.background)",
                        "Foreground::item.edit(style.color)",
                    ]
                }
            };
            if (settings.template) {
                Object.assign(data, polymorph_core.templates[template]);
            }
            polymorph_core.fire("documentCreated", { id: polymorph_core.currentDocID, data: data });
        }

        //Decompress
        data = polymorph_core.datautils.decompress(data);

        //Upgrade if necessary
        if (!data._meta) {
            data = polymorph_core.datautils.viewToItems(data);
        }

        //Do some sanity checks 
        if (!(data._meta.currentView && data[data._meta.currentView] && data[data._meta.currentView]._rd)) {
            for (let i in data) {
                //choose a view to assign as default
                if (data[i]._rd && !(data[i]._rd.p)) {
                    data._meta.currentView = i;
                    break;
                }
            }
            //if still not good, then add a new views
            if (!(data._meta.currentView && data[data._meta.currentView]._rd)) {
                //Add our first rect
                let newRectID = guid(6, data);
                data[newRectID] = {
                    _rd: { //we need some initial data otherwise rect deletion gets weird
                        x: 0,
                        f: 0,
                        ps: 1
                    }
                };
                data._meta.currentView = newRectID;

                //Also add an operator
                let newOperatorID = guid(6, data);
                data[newOperatorID] = {
                    _od: { t: "opSelect", p: newRectID }
                }
                data[newRectID]._rd.s = newOperatorID;
            }
        }

        //make sure all items have an lm property.
        for (let i in data) {
            if (!data[i]._lu_) {
                data[i]._lu_ = Date.now();
            }
        }

        return data;
    }

    polymorph_core.rehookAll = function (id) { // TODO: redo this with promises to make it async compatible
        for (let i in polymorph_core.userData.documents[id].saveHooks) {
            if (polymorph_core.saveSources[i].unhook) polymorph_core.saveSources[i].unhook();
            if (polymorph_core.saveSources[i].hook) polymorph_core.saveSources[i].hook();
        }
    }

    polymorph_core.resetDocument = function () {
        polymorph_core.items = {};
        polymorph_core.containers = {};
        for (let i in polymorph_core.rects) {
            polymorph_core.rects[i].outerDiv.remove();
            delete polymorph_core.rects[i];
        }
    }

    polymorph_core.saveSources = [];

    polymorph_core.registerSaveSource = function (id, f) {
        polymorph_core.saveSources[id] = new f(polymorph_core);
        //create a wrapper for it in the loading dialog
        polymorph_core.addToDialog(id);
    }

    polymorph_core.fetchDoc = async function (source, data, state) {
        if (!state) state = {};
        //do some checks before we do any lasting damage
        if (!polymorph_core.saveSources[source]) {
            //save source does not exist, alert the user
            alert("Ack! Looks like this save source is not working right now.");
            return false;
        }
        document.querySelector(".wall").style.display = "block";
        let d;
        try {
            d = await polymorph_core.saveSources[source].pullAll();
        } catch (e) {
            alert("Something went wrong with the save source: " + e);
            document.querySelector(".wall").style.display = "none";
            return;
        }
        if (!d) {
            return;
        }
        document.querySelector(".wall").style.display = "none";
        return d;
    }

    polymorph_core.fromSaveData = function (data) {

        //Does the current document match the current document? 
        if (data._meta.id != polymorph_core.currentDocID) {
            //Alert the user
            if (!confirm(`Hmm... this source seems to be storing a different document (${data._meta.id}) to the one you requested (${polymorph_core.currentDocID}). Continue loading?`)) {
                document.querySelector(".wall").style.display = "none";
                return false;
            } else {
                if (confirm("Create a new document that matches this datasource? (OK), or change the loaded data to this document name (CANCEL)?")) {
                    polymorph_core.currentDocID = data._meta.id;
                    polymorph_core.datautils.upgradeSaveData(data._meta.id, "lf");
                    //reload the page
                    polymorph_core.rehookAll(polymorph_core.currentDocID);
                    polymorph_core.fire("userSave", data);
                    polymorph_core.saveUserData();
                    function f() {
                        if (polymorph_core.savedOK) {
                            window.location.href = `?doc=${polymorph_core.currentDocID}&source=lf`;
                        } else {
                            setTimeout(f, 1);
                        }
                    }
                    setTimeout(f, 1);
                } else {
                    data._meta.id = polymorph_core.currentDocID;
                }
            }
        }
        polymorph_core.resetDocument();

        polymorph_core.items = data;

        //Create all the rects
        polymorph_core.rects = {};//live rects
        for (let i in polymorph_core.items) {
            if (polymorph_core.items[i]._rd) {
                polymorph_core.rects[i] = new polymorph_core.rect(i);
            }
        }

        //Create all the operators, to go into the rects
        polymorph_core.containers = {};//live rects
        for (let i in polymorph_core.items) {
            if (polymorph_core.items[i]._od) {
                polymorph_core.containers[i] = new polymorph_core.container(i);
            }
        }

        //show the prevailing rect. do this after containers exist so that refresh actually means something for phone.
        polymorph_core.switchView(polymorph_core.items._meta.currentView);

        // Say hello for everything
        for (let i in polymorph_core.items) {
            polymorph_core.fire("updateItem", { id: i, loadProcess: true });
        }
        polymorph_core.unsaved = false;
        polymorph_core.datautils.linkSanitize();
        polymorph_core.updateSettings();
        document.querySelector(".wall").style.display = "none";
    }

    polymorph_core.toSaveData = function () {
        //politely ask the operators and rects to update their items
        for (let i in polymorph_core.rects) {
            polymorph_core.rects[i].toSaveData();
        }
        for (let i in polymorph_core.containers) {
            polymorph_core.containers[i].toSaveData();
        }
        return polymorph_core.items;
    }

    polymorph_core.cetch('userSave', (data, state) => {
        if (state == undefined) {
            if (data) {
                //ok we saved
                polymorph_core.unsaved = false;
            }
        }
    })

    polymorph_core.userSave = function () {
        //save to all sources
        //upgrade older save systems
        let d = polymorph_core.toSaveData();
        polymorph_core.datautils.upgradeSaveData(polymorph_core.currentDocID);
        polymorph_core.filescreen.saveRecentDocument(polymorph_core.currentDocID, undefined, polymorph_core.items._meta.displayName);
        //trigger saving on all save sources
        polymorph_core.garbageClean();
        polymorph_core.fire("userSave", d);
    };

    (() => {
        //////////////////////////////////////////////////////////////////
        //Loading dialogs
        loadDialog = document.createElement("div");
        loadDialog.classList.add("dialog");
        loadDialog = dialogManager.checkDialogs(loadDialog)[0];

        polymorph_core.loadInnerDialog = document.createElement("div");
        loadDialog.querySelector(".innerDialog").appendChild(polymorph_core.loadInnerDialog);
        polymorph_core.loadInnerDialog.classList.add("loadInnerDialog")
        polymorph_core.loadInnerDialog.innerHTML = `
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
            div: polymorph_core.loadInnerDialog,
            type: "bool",
            object: () => {
                return polymorph_core.userData.documents[polymorph_core.currentDocID]
            },
            property: "autosave",
            label: "Autosave all changes"
        });
        //----------Autosave----------//
        polymorph_core.autosaveCapacitor = new capacitor(200, 20, polymorph_core.userSave);
        polymorph_core.on("updateItem", function (d) {
            if (polymorph_core.userData.documents[polymorph_core.currentDocID].autosave && !polymorph_core.isSaving) {
                polymorph_core.autosaveCapacitor.submit();
            }
        });



        //delegate toggle event handlers

        polymorph_core.addToDialog = function (id) {
            let wrapperText = `
        <div data-saveref='${id}'>
            <h2>${polymorph_core.saveSources[id].prettyName || id}</h2>
            <span>`;
            if (polymorph_core.saveSources[id].pullAll) wrapperText += `<label>Make this the default load source<input name="defaultSource" type="radio"></input></label>`
            if (polymorph_core.saveSources[id].hook) wrapperText += `<label>Save to this source<input data-role="tsync" type="checkbox"></input></label>`;
            if (polymorph_core.saveSources[id].pullAll) wrapperText += `<button data-role="dlg_load">Load from this source</button>`;
            if (polymorph_core.saveSources[id].pushAll) wrapperText += `<button data-role="dlg_save">Save to this source</button>`;
            wrapperText += `</span>
        </div>
        `;
            let wrapper = htmlwrap(wrapperText);
            //also register its settings in the save dialog
            if (polymorph_core.saveSources[id].dialog) wrapper.appendChild(polymorph_core.saveSources[id].dialog);
            polymorph_core.loadInnerDialog.appendChild(wrapper);
        }

        polymorph_core.on("titleButtonsReady", () => {
            document.body.appendChild(loadDialog);
            document.querySelector(".saveSources").addEventListener("click", () => {
                for (let i in polymorph_core.saveSources)
                    if (polymorph_core.saveSources[i].showDialog) polymorph_core.saveSources[i].showDialog();
                for (let i in polymorph_core.userData.documents[polymorph_core.currentDocID].saveHooks) {
                    try {
                        polymorph_core.loadInnerDialog.querySelector(`div[data-saveref='${i}'] [data-role='tsync']`).checked = true;
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
                autosaveOp.load();
                loadDialog.style.display = "block";
            });
        });
        loadDialog.querySelector(".cb").addEventListener("click", polymorph_core.saveUserData);
    })();

    polymorph_core.loadInnerDialog.addEventListener("input", (e) => {
        //save to this source checkbox checked
        if (e.target.matches("[data-role='tsync']")) {
            let csource = e.target.parentElement.parentElement.parentElement.dataset.saveref;
            if (e.target.checked) {
                if (!polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[csource]) polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[csource] = polymorph_core.currentDocID;
                if (polymorph_core.saveSources[csource].hook) polymorph_core.saveSources[csource].hook();
                polymorph_core.userData.documents[polymorph_core.currentDocID].saveHooks[csource] = true;
            } else {
                if (polymorph_core.saveSources[csource].unhook) polymorph_core.saveSources[csource].unhook();
                delete polymorph_core.userData.documents[polymorph_core.currentDocID].saveHooks[csource];
            }
            polymorph_core.saveUserData();
        }
    })

    polymorph_core.loadInnerDialog.addEventListener("click", async (e) => {
        if (e.target.matches("[data-role='dlg_save']")) {
            //Get the save source to save now
            let src = e.target.parentElement.parentElement.dataset.saveref;
            polymorph_core.saveSources[src].pushAll(polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[src], polymorph_core.toSaveData());
        } else if (e.target.matches("[data-role='dlg_load']")) {
            //Load from the save source
            let source = e.target.parentElement.parentElement.dataset.saveref;
            let d = await polymorph_core.fetchDoc(source, polymorph_core.currentDocID, polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[source] || polymorph_core.currentDocID);
            d = polymorph_core.sanityCheckDoc(d, polymorph_core.currentDocID);
            polymorph_core.fromSaveData(d);
        }
    })

    //a little nicety to warn user of unsaved items.
    //#region
    polymorph_core.unsaved = false;
    polymorph_core.on("updateItem", (e) => {
        if (!e || !e.load) {//if event was not triggered by a loading action
            polymorph_core.unsaved = true;
        }
    })
    window.addEventListener("beforeunload", (e) => {
        if (polymorph_core.unsaved) {
            e.preventDefault();
            e.returnValue = "Hold up, you seem to have some unsaved changes. Are you sure you want to close this window?";
        }
    })
    //#endregion

    Object.defineProperty(polymorph_core, "saveSourceData", {
        get: () => {
            return polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources;
        }
    })
    //your run of the mill templates
    polymorph_core.templates = {
        brainstorm:JSON.parse(`{"displayName":"New Workspace","currentView":"default","id":"itemcluster","views":{"default":{"o":[{"name":"Itemcluster 2","opdata":{"type":"itemcluster2","uuid":"i33lyy","tabbarName":"Itemcluster 2","data":{"itemcluster":{"cx":0,"cy":0,"scale":1},"currentViewName":"7hj0","viewpath":["7hj0"]}}}],"s":0,"x":0,"f":1,"p":0}},"items":{"7hj0":{"itemcluster":{"viewName":"New Itemcluster"}}}}`),
    }

})();