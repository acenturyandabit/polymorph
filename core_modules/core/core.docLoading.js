(() => {
    Object.defineProperty(polymorph_core, "saveSourceData", {
        get: () => {
            return polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources;
        }
    })

    polymorph_core.handleURL = async function () {
        let params = new URLSearchParams(window.location.search);
        polymorph_core.resetDocument();
        if (params.has("doc")) {
            //Load from polymorph_core.userData
            let id = polymorph_core.currentDocID = params.get("doc");
            polymorph_core.datautils.upgradeSaveData(polymorph_core.currentDocID);
            if (params.has('src')) {
                //try to _also_ pull from the source as described
                if (!polymorph_core.userData.documents[id].saveSources[params.get('src')]) {
                    polymorph_core.userData.documents[id].saveSources[params.get('src')] = {};
                }
                polymorph_core.userData.documents[id].saveHooks[params.get('src')] = true;
                if (!polymorph_core.userData.documents[id].loadHooks) polymorph_core.userData.documents[id].loadHooks = {};
                polymorph_core.userData.documents[id].loadHooks[params.get('src')] = true;
                polymorph_core.saveUserData();
            }
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
                        polymorph_core.datautils.upgradeSaveData(polymorph_core.currentDocID, i);
                        break;
                    }
                }
            }
        }

        if (!polymorph_core.currentDocID) {
            polymorph_core.currentDocID = guid(6, polymorph_core.userData.documents);
            polymorph_core.datautils.upgradeSaveData(polymorph_core.currentDocID, 'lf');
        }
        if (!polymorph_core.userData.documents[polymorph_core.currentDocID].loadHooks || Object.keys(polymorph_core.userData.documents[polymorph_core.currentDocID].loadHooks).length == 0) {
            polymorph_core.datautils.upgradeSaveData(polymorph_core.currentDocID, 'lf');
        }

        for (let i in polymorph_core.userData.documents[polymorph_core.currentDocID].loadHooks) {
            if (polymorph_core.userData.documents[polymorph_core.currentDocID].loadHooks[i]) {
                polymorph_core.datautils.upgradeSaveData(polymorph_core.currentDocID, i);
                polymorph_core.fetchData(i);
            }
        }

        // rehook after fetchdoc because firebase depends on it.
        polymorph_core.rehookAll(polymorph_core.currentDocID);

        //clear out url elements
        window.history.pushState("", "", window.location.origin + window.location.pathname + `?doc=${polymorph_core.currentDocID}`);
        /*let template;
        //if there is a template, knock off the template from the url and remember it (discreetly)
        if (params.has("tmp")) {
            template = params.get("tmp");
            let loc = window.location.href
            loc = loc.replace(/&tmp=[^&]+/, "");
            history.pushState({}, "", loc);
        }*/ //if from template, fetchAndIntegrate once. Just make template another savesource that kills itself once loaded once.
    }

    //This is called by polymorph_core.handleURL and the filescreen.
    polymorph_core.sanityCheckDoc = function (data) {
        //if none then create new
        if (!data) {
            data = {
                _meta: {
                    displayName: polymorph_core.currentDocID,
                    id: polymorph_core.currentDocID,
                    contextMenuItems: [
                        "Delete::polymorph_core.deleteItem",
                        "Background::item.edit(style.background)",
                        "Foreground::item.edit(style.color)",
                    ],
                    _lu_:0
                }
            };
            polymorph_core.fire("documentCreated", { id: polymorph_core.currentDocID, data: data });
            //do anything else e.g. phone autosave
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

        //make sure all items have an _lu_s property.
        for (let i in data) {
            if (!data[i]._lu_) {
                data[i]._lu_ = Date.now();
            }
        }

        return data;
    }

    polymorph_core.rehookAll = function (id) {
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
        polymorph_core.unsaved = false;
    }

    polymorph_core.saveSources = [];

    polymorph_core.registerSaveSource = function (id, f) {
        polymorph_core.saveSources[id] = new f(polymorph_core);
        //create a wrapper for it in the loading dialog
        polymorph_core.addToSaveDialog(id);
    }

    polymorph_core.integrateData = function (data) {
        //sanity check, decompress etc the data
        data = polymorph_core.sanityCheckDoc(data);
        //ensure the data id is matching; if not then @ the user
        if (data._meta.id != polymorph_core.currentDocID) {
            if (confirm(`A source seems to be storing a different document (${data._meta.id}) to the one you requested (${polymorph_core.currentDocID}). Continue loading?`)) {
                data._meta.id = polymorph_core.currentDocID;
            } else {
                return;
            }
        }
        for (let i in data) {
            if (!polymorph_core.items[i] || data[i]._lu_ > polymorph_core.items[i]._lu_) {
                polymorph_core.items[i] = data[i];
            }
        }
        if (!polymorph_core.rects) polymorph_core.rects = {};
        //rects need each other to exist so they can attach appropriately, so do this separately to item adoption
        for (let i in data) {
            if (polymorph_core.items[i]._rd && !polymorph_core.rects[i]) {
                //overwriting rects? for future
                polymorph_core.rects[i] = new polymorph_core.rect(i);
            }
        }

        if (!polymorph_core.containers) polymorph_core.containers = {};
        for (let i in data) {
            if (polymorph_core.items[i]._od && !polymorph_core.containers[i]) {
                polymorph_core.containers[i] = new polymorph_core.container(i);
            }
        }

        for (let i in data) {
            //shouldnt hurt to fire update on other items
            polymorph_core.fire('updateItem', { id: i });
        }
        //show the prevailing rect
        polymorph_core.switchView(polymorph_core.items._meta.currentView);
        polymorph_core.datautils.linkSanitize();
        polymorph_core.updateSettings();
    }

    polymorph_core.fetchData = async function (source) {
        //do some checks before we do any lasting damage
        if (!polymorph_core.saveSources[source]) {
            //save source does not exist, alert the user
            alert(`Ack! Looks like the ${source} save source is not working right now.`);
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
        document.querySelector(".wall").style.display = "none";
        polymorph_core.integrateData(d);
    }

    polymorph_core.toSaveData = function () {
        //politely ask the operators and rects to update their items
        //nerf this in a future release
        for (let i in polymorph_core.rects) {
            polymorph_core.rects[i].toSaveData();
        }
        for (let i in polymorph_core.containers) {
            polymorph_core.containers[i].toSaveData();
        }
        return polymorph_core.items;
    }
})();