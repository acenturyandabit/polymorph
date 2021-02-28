(() => {

    //navigator.serviceWorker.controller.postMessage("not even ready yet");


    /*let checkForURLConflict=()=>{}
    navigator.serviceWorker.register('core_modules/core/core.workersync.js', {scope: './'}).then(function(registration) {
        if (registration.active){
            console.log("yay im active");
            //navigator.serviceWorker.controller.postMessage("hello world!");
        }
    });*/
    let instance_uuid = polymorph_core.guid();
    const broadcast = new BroadcastChannel('channel1');
    let is_challenger = false;
    let alt_alive_warning = document.createElement("div");
    alt_alive_warning.innerHTML = `
        <div style="padding:10vw">
            <h1>Warning! This document is already open in another window. Please use the other window instead.</h1>
        </div>
    `;
    alt_alive_warning.style.cssText = `
    display:none;
    place-items: center center;
    position:absolute;
    height:100%;
    width:100%;
    z-index:2;
    background: rgba(0,0,0,0.5);
    color:white;
    text-align:center;
    `;
    document.body.appendChild(alt_alive_warning);
    broadcast.onmessage = (event) => {
        if (event.data.url.replace("#", "") == window.location.href.replace("#", "") && event.data.uuid != instance_uuid) {
            if (is_challenger) {
                alt_alive_warning.style.display = "grid";
                // seppuku
            } else {
                broadcast.postMessage({
                    url: window.location.href,
                    uuid: instance_uuid
                })
            }
        }
    };

    function checkForURLConflict() {
        broadcast.postMessage({
            url: window.location.href,
            uuid: instance_uuid
        })
        is_challenger = true;
        setTimeout(() => is_challenger = false, 500);
    }
    checkForURLConflict();
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

    let lfNotWorkingErr = false;

    polymorph_core.handleURL = async function() {
        let params = new URLSearchParams(window.location.search);
        polymorph_core.resetDocument();
        let sourcesToAdd = [];
        if (params.has('doc')) {
            polymorph_core.currentDocID = params.get("doc");
        } else {
            for (let i in polymorph_core.saveSources) {
                if (polymorph_core.saveSourceOptions[i].canHandle) {
                    let result = await polymorph_core.saveSourceOptions[i].canHandle(params);
                    if (result && result.id && result.data) {
                        polymorph_core.currentDocID = result.id;
                        sourcesToAdd.push({
                            load: true,
                            save: true,
                            RTactive: true, // not ideal but let's see
                            type: i,
                            data: result.data
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
            // this is somewhat useful as an emergency fallback.
        }
        if (!polymorph_core.currentDocID) {
            //Looks like we're not trying to load any new documents [TODO: catch when we CANT load a document but are trying]
            polymorph_core.currentDocID = polymorph_core.guid(6, polymorph_core.userData.documents);
            //add a local save source automatically; and then the user can add more save sources if they'd like
            polymorph_core.datautils.upgradeSaveData(polymorph_core.currentDocID);
            polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.push({
                load: true,
                save: true,
                type: 'lf',
                data: {
                    id: polymorph_core.currentDocID
                }
            });
            if (isPhone()) polymorph_core.userData.documents[polymorph_core.currentDocID].autosave = true;
            polymorph_core.saveUserData();
            //Don't attempt to load, since there is nothing to load in the first place
            //Show the loading operator
            polymorph_core.templates.blankNewDoc._meta.id = polymorph_core.currentDocID;
            polymorph_core.integrateData(polymorph_core.templates.blankNewDoc, "CORE_FAULT");
            //set the url to this document's url
            history.pushState({}, "", window.location.href + "?doc=" + polymorph_core.currentDocID);
            checkForURLConflict();

            let newInstance = new polymorph_core.saveSources['lf'](polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[0]);
            polymorph_core.saveSourceInstances.push(newInstance);
        } else {
            polymorph_core.datautils.upgradeSaveData(polymorph_core.currentDocID);

            let result = handleSrc(params, polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources);
            if (result) sourcesToAdd.push(result);

            polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.push.apply(polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources, sourcesToAdd);

            if (polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.length == 0) {
                if (confirm("Warning! This document doesn't have any save sources attached to it, so all your work will be lost. Would you like to add a local storage source? [OK] Otherwise, please go to file>preferences to manually add a save source.")) {
                    polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.push({
                        load: true,
                        save: true,
                        type: 'lf',
                        data: {
                            id: polymorph_core.currentDocID
                        }
                    })
                };
            }
            polymorph_core.saveUserData();

            let noloadpanicask = () => {
                if (confirm("There doesn't seem to be a valid document here. Press OK to create a new document with this name, or Cancel to be taken to a new document with a different name.")) {
                    //create a new doc here
                    if (lfNotWorkingErr) {
                        alert("Polymorph has run into a critical error: LFNOTWORKING. Please report this to steeven.liu2@gmail.com.");
                        return;
                    }
                    polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.push({
                        load: true,
                        save: true,
                        type: 'lf',
                        data: {
                            id: polymorph_core.currentDocID
                        }
                    })
                    polymorph_core.saveUserData();
                    lfNotWorkingErr = true;
                    polymorph_core.handleURL();
                    //todo: hard panic if this has been called twice
                } else {
                    // just go home
                    window.location.href = window.location.origin + window.location.pathname + "?o";
                }
            }

            let loadAttemptsRemaining = polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.length;
            for (let u = 0; u < polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.length; u++) {
                let i = polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[u];
                let errorMessage = undefined;
                if (!polymorph_core.saveSources[i.type]) {
                    errorMessage = `Ack! Looks like the ${i.type} save source is not working right now. Remove it?`;
                }

                if (!errorMessage && !i.data) {
                    errorMessage = `Ack! Looks like the ${i.type} save source is misconfigured. Remove it?`;
                }

                if (errorMessage) {
                    if (confirm(errorMessage)) {
                        polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.splice(u, 1);
                        polymorph_core.saveUserData();
                        u--;
                        loadAttemptsRemaining--;
                        if (loadAttemptsRemaining == 0) {
                            noloadpanicask();
                        }
                    };
                    continue;
                } else {
                    try {
                        let newInstance = new polymorph_core.saveSources[i.type](i);
                        polymorph_core.saveSourceInstances.push(newInstance);
                        if (i.load) {
                            (async() => {
                                try {
                                    d = await newInstance.pullAll();
                                    polymorph_core.integrateData(d, i.type);
                                } catch (e) {
                                    alert("Something went wrong with the save source: " + e);
                                    console.log(e);
                                    loadAttemptsRemaining--;
                                    if (loadAttemptsRemaining == 0) {
                                        noloadpanicask();
                                    }
                                    throw (e);
                                }
                            })();
                        }
                    } catch (e) {
                        alert("Something went wrong with the save source: " + e);
                        console.log(e);
                        loadAttemptsRemaining--;
                        if (loadAttemptsRemaining == 0) {
                            noloadpanicask();
                        }
                    }
                }
            }
            //try and catch when there is no data at all
            for (let i of polymorph_core.saveSourceInstances) {
                if (i.unhook) i.unhook();
                if (i.settings.save) {
                    if (i.hook) i.hook();
                }
            }

            //clear out url elements
            window.history.pushState("", "", window.location.origin + window.location.pathname + `?doc=${polymorph_core.currentDocID}`);
            //templates have been moved to their own module [todo]
        }
        document.querySelector(".wall").style.display = "none";
    }

    //This is called by polymorph_core.handleURL and the filescreen.
    polymorph_core.sanityCheckDoc = function(data) {
        //if none then create new
        if (!data) {
            data = polymorph_core.templates.blankNewDoc;
            data._meta.id = polymorph_core.currentDocID;
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
                let newRectID = polymorph_core.guid(6, data);
                data[newRectID] = {
                    _rd: { //we need some initial data otherwise rect deletion gets weird
                        x: 0,
                        f: 0,
                        ps: 1
                    }
                };
                data._meta.currentView = newRectID;

                //Also add an operator
                let newOperatorID = polymorph_core.guid(6, data);
                data[newOperatorID] = {
                    _od: { t: "opSelect", p: newRectID }
                }
                data[newRectID]._rd.s = newOperatorID;
            }
        }

        //make sure all items have an _lu_s property.
        for (let i in data) {
            if (!data[i]._lu_) {
                data[i]._lu_ = 0; // so as to not overwrite other stuff if initially it was null
            }
        }

        return data;
    }

    polymorph_core.resetDocument = function() {
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

    polymorph_core.saveSources = {};
    polymorph_core.saveSourceOptions = {};

    polymorph_core.registerSaveSource = function(id, f, ops) {
        polymorph_core.saveSources[id] = f;
        polymorph_core.saveSourceOptions[id] = ops || {};
        //create a wrapper for it in the loading dialog
        //THIS IS A CROSSOVER WITH loadsavedialog.js. Please formalise
        if (ops.createable) polymorph_core.loadInnerDialog.querySelector('.nss select').appendChild(htmlwrap(`<option value='${id}'>${ops.prettyName || id}</option>`));

    }

    polymorph_core.switchView = function(view) {
        polymorph_core.items._meta.currentView = view;
        while (document.body.querySelector(".rectspace").children.length) document.body.querySelector(".rectspace").children[0].remove();
        document.body.querySelector(".rectspace").appendChild(polymorph_core.rects[polymorph_core.items._meta.currentView].outerDiv);
        //reset and present a view
        polymorph_core.rects[polymorph_core.items._meta.currentView].refresh();
    };


    polymorph_core.integrateData = function(data, source) { // source: string
        //sanity check, decompress etc the data
        data = polymorph_core.sanityCheckDoc(data);
        //ensure the data id is matching; if not then @ the user
        if (data._meta.id != polymorph_core.currentDocID) {
            if (confirm(`A source (${source}) seems to be storing a different document (${data._meta.id}) to the one you requested (${polymorph_core.currentDocID}). Continue loading?`)) {
                if (confirm(`Overwrite the incoming data ID to ${polymorph_core.currentDocID}? [OK] Or load the imported data in a separate window [cancel]?`)) {
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
        polymorph_core.rectLoadCallbacks = {}; // clear this rl cache
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
        polymorph_core.fire('mergeBegin'); // for save sources to recognise that we are starting a merge.

        for (let i in data) {
            //shouldnt hurt to fire update on other items
            polymorph_core.fire('updateItem', { id: i, loadProcess: true });
        }
        //show the prevailing rect
        polymorph_core.switchView(polymorph_core.items._meta.currentView);
        polymorph_core.datautils.linkSanitize();
        polymorph_core.updateSettings(true);
        polymorph_core.fire('mergeComplete');
    }

})();


polymorph_core.saveSourceTemplate = function saveSourceTemplate(save_source_record) {
    this.settings = save_source_record;
}

//your run of the mill templates
polymorph_core.templates = {
    brainstorm: JSON.parse(`{"displayName":"New Workspace","currentView":"default","id":"itemcluster","views":{"default":{"o":[{"name":"Itemcluster 2","opdata":{"type":"itemcluster2","uuid":"i33lyy","tabbarName":"Itemcluster 2","data":{"itemcluster":{"cx":0,"cy":0,"scale":1},"currentViewName":"7hj0","viewpath":["7hj0"]}}}],"s":0,"x":0,"f":1,"p":0}},"items":{"7hj0":{"itemcluster":{"viewName":"New Itemcluster"}}}}`),
    blankNewDoc: {
        "_meta": {
            "displayName": "New Polymorph Document",
            "id": "blank",
            "contextMenuItems": ["Delete::polymorph_core.deleteItem", "Background::item.edit(style.background)", "Foreground::item.edit(style.color)"],
            "_lu_": 0,
            "currentView": "default_container",
            "globalContextMenuOptions": ["Style::Item Background::item.edit(item.style.background)", "Style::Text color::item.edit(item.style.color)"]
        },
        "default_container": {
            "_rd": { "x": 0, "f": 0, "ps": 1, "s": "default_operator" },
            "_lu_": 0
        },
        "default_operator": {
            "_od": {
                "t": "welcome",
                "data": {},
                "inputRemaps": {},
                "outputRemaps": {},
                "tabbarName": "Home",
                "p": "default_container"
            },
            "_lu_": 0
        }
    }
}