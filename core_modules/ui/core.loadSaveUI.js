(() => {
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

        polymorph_core.addToSaveDialog = function (id) {
            let wrapperText = `
        <div data-saveref='${id}'>
            <h2>${polymorph_core.saveSources[id].prettyName || id}</h2>
            <span>`;
            if (polymorph_core.saveSources[id].hook) wrapperText += `<label>Save to this source<input data-role="tsync" type="checkbox"></input></label>`;
            if (polymorph_core.saveSources[id].hook) wrapperText += `<label>Load from this source<input data-role="lsync" type="checkbox"></input></label>`;
            if (polymorph_core.saveSources[id].pullAll) wrapperText += `<button data-role="dlg_hardLoad">Load from this source</button>`;
            if (polymorph_core.saveSources[id].pullAll) wrapperText += `<button data-role="dlg_softLoad">Merge from this source</button>`;
            if (polymorph_core.saveSources[id].pushAll) wrapperText += `<button data-role="dlg_save">Save to this source</button>`;
            wrapperText += `</span>
        </div>
        `;
            let wrapper = htmlwrap(wrapperText);
            //also register its settings in the save dialog
            if (polymorph_core.saveSources[id].dialog) wrapper.appendChild(polymorph_core.saveSources[id].dialog);
            polymorph_core.loadInnerDialog.appendChild(wrapper);
        }

        document.body.appendChild(loadDialog);

        //make it a function so that phone can use it
        polymorph_core.showSavePreferencesDialog = () => {
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
            for (let i in polymorph_core.userData.documents[polymorph_core.currentDocID].loadHooks) {
                try {
                    polymorph_core.loadInnerDialog.querySelector(`div[data-saveref='${i}'] [data-role='lsync']`).checked = true;
                }
                catch (e) {
                    console.log(e);
                }
            }
            autosaveOp.load();
            loadDialog.style.display = "block";
        }

        polymorph_core.on("UIstart", () => {
            polymorph_core.topbar.add("File/Preferences").addEventListener("click", () => {
                polymorph_core.showSavePreferencesDialog();
            });
        });
        loadDialog.querySelector(".cb").addEventListener("click", polymorph_core.saveUserData);
    })();

    polymorph_core.loadInnerDialog.addEventListener("input", (e) => {
        //save to this source checkbox checked
        if (e.target.matches("[data-role='tsync']")) {
            let csource = e.target.parentElement.parentElement.parentElement.dataset.saveref;
            if (e.target.checked) {
                if (!polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[csource]) polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[csource] = {};
                if (polymorph_core.saveSources[csource].hook) polymorph_core.saveSources[csource].hook();
                polymorph_core.userData.documents[polymorph_core.currentDocID].saveHooks[csource] = true;
            } else {
                if (polymorph_core.saveSources[csource].unhook) polymorph_core.saveSources[csource].unhook();
                delete polymorph_core.userData.documents[polymorph_core.currentDocID].saveHooks[csource];
            }
            polymorph_core.saveUserData();
        } else if (e.target.matches("[data-role='lsync']")) {
            let csource = e.target.parentElement.parentElement.parentElement.dataset.saveref;
            if (e.target.checked) {
                if (!polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[csource]) polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[csource] = {};
                polymorph_core.userData.documents[polymorph_core.currentDocID].loadHooks[csource] = true;
            } else {
                delete polymorph_core.userData.documents[polymorph_core.currentDocID].loadHooks[csource];
            }
            polymorph_core.saveUserData();
        }
    })

    polymorph_core.loadInnerDialog.addEventListener("click", async (e) => {
        if (e.target.matches("[data-role='dlg_save']")) {
            //Get the save source to save now
            let src = e.target.parentElement.parentElement.dataset.saveref;
            polymorph_core.saveSources[src].pushAll(polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources[src], polymorph_core.toSaveData());
        } else if (e.target.matches("[data-role='dlg_hardLoad']")) {
            //Load from the save source
            polymorph_core.resetDocument();
            let source = e.target.parentElement.parentElement.dataset.saveref;
            let d = await polymorph_core.fetchData(source);
        } else if (e.target.matches("[data-role='dlg_softLoad']")) {
            //Load from the save source
            let source = e.target.parentElement.parentElement.dataset.saveref;
            let d = await polymorph_core.fetchData(source);
        }
    })

    //a little nicety to warn user of unsaved items.
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


    //your run of the mill templates
    polymorph_core.templates = {
        brainstorm: JSON.parse(`{"displayName":"New Workspace","currentView":"default","id":"itemcluster","views":{"default":{"o":[{"name":"Itemcluster 2","opdata":{"type":"itemcluster2","uuid":"i33lyy","tabbarName":"Itemcluster 2","data":{"itemcluster":{"cx":0,"cy":0,"scale":1},"currentViewName":"7hj0","viewpath":["7hj0"]}}}],"s":0,"x":0,"f":1,"p":0}},"items":{"7hj0":{"itemcluster":{"viewName":"New Itemcluster"}}}}`),
    }
})();