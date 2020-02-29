(() => {
    Object.defineProperty(polymorph_core, "saveSourceData", {
        get: () => {
            return polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources;
        }
    })

    let handleSrc = (params, userdata) => {
        if (params.has('src')) {
            //check if there is an instance of this save source, and that it is being pulled from.
            //otherwise do nothing
            let srcFine = false;
            for (let i of userdata) {
                if (i.type == params.get('src')) {
                    if (i.load == true) {
                        srcFine = true;
                        break;
                    }
                }
            }
            if (!srcFine) {
                for (let i of userdata) {
                    if (i.type == params.get('src')) {
                        i.load = true;
                        srcFine = true;
                        break;
                    }
                }
            }
            if (!srcFine) {
                userdata.push({
                    type: params.get('src'),
                    load: true,
                    save: true,
                    data: { id: polymorph_core.currentDocID }
                });
            }
            polymorph_core.saveUserData();
            return true;
        } else return false;
    }

    polymorph_core.handleURL = async function () {
        let params = new URLSearchParams(window.location.search);
        polymorph_core.resetDocument();
        let sourcesToAdd = [];
        if (params.has('doc')) {
            polymorph_core.currentDocID = params.get("doc");
        } else {
            for (let i in polymorph_core.saveSources) {
                if (polymorph_core.saveSources[i].canHandle) {
                    let result = await polymorph_core.saveSources[i].canHandle(params);
                    if (result) {
                        polymorph_core.currentDocID = result.id;
                        sourcesToAdd.push({
                            load: true,
                            save: true,
                            type: i,
                            data: result.source
                        });
                    }
                }
            }
        }

        if (params.has("o")) {
            //trim the open flag
            let loc = window.location.href
            loc = loc.replace(/\?o/, "");
            history.pushState({}, "", loc);
            polymorph_core.filescreen.showSplash();
            return;
        }
        if (!polymorph_core.currentDocID) {
            polymorph_core.currentDocID = guid(6, polymorph_core.userData.documents);
        }

        polymorph_core.datautils.upgradeSaveData(polymorph_core.currentDocID);

        let result = handleSrc(params, polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources);
        if (result) sourcesToAdd.push(result);

        polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.push.apply(polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources, sourcesToAdd);

        if (polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.length == 0) {
            confirm("Warning! This document doesn't have any save sources attached to it, so all your work will be lost. Automatically add a local storage source? [OK] Otherwise, please go to file>preferences to manually add a save source.");
        }

        let successfulLoads = 0;
        for (let i of polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources) {
            if (!polymorph_core.saveSources[i.type]) {
                alert(`Ack! Looks like the ${i.type} save source is not working right now.`);
            } else {
                let newInstance = new polymorph_core.saveSources[i.type](i);
                polymorph_core.saveSourceInstances.push(newInstance);
                if (i.load) {
                    try {
                        d = await newInstance.pullAll();
                        polymorph_core.integrateData(d, i.type);
                        successfulLoads++;
                    } catch (e) {
                        alert("Something went wrong with the save source: " + e);
                    }
                }
            }
        }
        if (successfulLoads == 0) {
            //uhhh we probably want to load a new document or alert the user or something
            alert(`Something went wrong and we weren't able to load anything. Please seek help.`);
        }

        for (let i of polymorph_core.saveSourceInstances) {
            if (i.unhook) i.unhook();
            if (i.settings.save) {
                if (i.hook) i.hook();
            }
        }

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
        document.querySelector(".wall").style.display = "none";
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
                    _lu_: 0
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

    polymorph_core.resetDocument = function () {
        polymorph_core.items = {};
        polymorph_core.containers = {};
        for (let i in polymorph_core.rects) {
            polymorph_core.rects[i].outerDiv.remove();
            delete polymorph_core.rects[i];
        }
        polymorph_core.unsaved = false;
        if (polymorph_core.saveSourceInstances) {
            for (let i of polymorph_core.saveSourceInstances) {
                if (i.unhook) i.unhook();
            }
        }
        polymorph_core.saveSourceInstances = [];
    }

    polymorph_core.saveSources = [];

    polymorph_core.registerSaveSource = function (id, f) {
        polymorph_core.saveSources[id] = f;
        //create a wrapper for it in the loading dialog
        //THIS IS A CROSSOVER. IT SHOULD NOT EXIST.
        polymorph_core.loadInnerDialog.querySelector('.nss select').appendChild(htmlwrap(`<option value='${id}'>${id}</option>`));
    }

    polymorph_core.integrateData = function (data, source) {
        //sanity check, decompress etc the data
        data = polymorph_core.sanityCheckDoc(data);
        //ensure the data id is matching; if not then @ the user
        if (data._meta.id != polymorph_core.currentDocID) {
            if (confirm(`A source (${source}) seems to be storing a different document (${data._meta.id}) to the one you requested (${polymorph_core.currentDocID}). Continue loading?`)) {
                if (confirm(`Overwrite the data ID to ${polymorph_core.currentDocID}? [OK] Or load the imported data in a separate window [cancel]?`)) {
                    data._meta.id = polymorph_core.currentDocID;
                } else {
                    polymorph_core.datautils.upgradeSaveData(data._meta.id, source);
                    polymorph_core.userData.documents[data._meta.id].saveSources[source] = polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[source];
                    polymorph_core.saveUserData();
                    window.location.href = `?doc=${data._meta.id}`;
                }
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

})();


polymorph_core.saveSourceTemplate = function saveSourceTemplate(save_source_record) {
    this.settings = save_source_record;
}

//your run of the mill templates
polymorph_core.templates = {
    brainstorm: JSON.parse(`{"displayName":"New Workspace","currentView":"default","id":"itemcluster","views":{"default":{"o":[{"name":"Itemcluster 2","opdata":{"type":"itemcluster2","uuid":"i33lyy","tabbarName":"Itemcluster 2","data":{"itemcluster":{"cx":0,"cy":0,"scale":1},"currentViewName":"7hj0","viewpath":["7hj0"]}}}],"s":0,"x":0,"f":1,"p":0}},"items":{"7hj0":{"itemcluster":{"viewName":"New Itemcluster"}}}}`),
}