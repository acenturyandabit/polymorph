(() => {

    polymorph_core.userSave = function() {
        //save to all sources
        //upgrade older save systems
        let d = polymorph_core.items;
        polymorph_core.datautils.upgradeSaveData(polymorph_core.currentDocID);
        //trigger saving on all save sources
        polymorph_core.fire("userSave", d);
        let recents = JSON.parse(localStorage.getItem("__polymorph_recent_docs")) || {};
        recents[polymorph_core.currentDocID] = { url: window.location.href, displayName: polymorph_core.currentDoc.displayName };
    };

    polymorph_core.addCreationOption = (id, name) => {
        polymorph_core.loadInnerDialog.querySelector('.nss select').appendChild(htmlwrap(`<option value='${id}'>${name}</option>`));
    }

    document.body.addEventListener("keydown", e => {
        if ((e.ctrlKey || e.metaKey) && e.key == "s") {
            e.preventDefault();
            polymorph_core.userSave();
        }
    });

    (() => {
        //////////////////////////////////////////////////////////////////
        //Loading dialogs
        let loadDialog = document.createElement("div");
        loadDialog.classList.add("dialog");
        loadDialog.classList.add("loadDialog");
        loadDialog = dialogManager.checkDialogs(
            loadDialog, { zIndex: 999 })[0];

        polymorph_core.loadInnerDialog = document.createElement("div");
        loadDialog.querySelector(".innerDialog").appendChild(polymorph_core.loadInnerDialog);
        polymorph_core.loadInnerDialog.classList.add("loadInnerDialog");
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


        let autosaveOp = new polymorph_core._option({
            div: polymorph_core.loadInnerDialog,
            type: "bool",
            object: () => {
                return polymorph_core.userData.documents[polymorph_core.currentDocID]
            },
            property: "autosave",
            label: "Autosave all changes"
        });
        polymorph_core.autosaveCapacitor = new capacitor(500, 2000, polymorph_core.userSave);
        polymorph_core.on("updateItem", function(d) {
            if (polymorph_core.userData.documents[polymorph_core.currentDocID].autosave && !polymorph_core.isSaving && !polymorph_core.isLoading) {
                polymorph_core.autosaveCapacitor.submit();
            }
        });

        //adding additional savesources
        polymorph_core.loadInnerDialog.appendChild(htmlwrap(`
        <label class="nss">Add new savesource<select></select><button>Add</button></label>`));
        let nss = polymorph_core.loadInnerDialog.querySelector('.nss');
        nss.querySelector("button").addEventListener("click", () => {
            let newSaveSource = {
                load: false,
                save: false,
                type: nss.querySelector('select').value,
                data: {
                    id: polymorph_core.currentDocID
                }
            };
            polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.push(newSaveSource)
            let newSaveSourceInstance = new polymorph_core.saveSources[nss.querySelector("select").value](newSaveSource);
            polymorph_core.saveSourceInstances.push(newSaveSourceInstance);
            newSaveSourceInstance.showDialog();
            //reshow the dialog cos i cbs
        });

        //store the savedialogs so that we can toggle their save/load checkboxes down the line
        let saveDialogInstances = [];

        polymorph_core.addToSaveDialog = function(save_source_instance) {
            //called by instance on load.
            let wrapperText = `
        <div>
            <h2>${polymorph_core.saveSourceOptions[save_source_instance.settings.type].prettyName || save_source_instance.settings.type}</h2>
            <span>`;
            if (save_source_instance.pullAll) wrapperText += `<label>Save to this source<input data-role="tsync" type="checkbox"></input></label>`;
            if (save_source_instance.pushAll) wrapperText += `<label>Load from this source<input data-role="lsync" type="checkbox"></input></label>`;
            if (save_source_instance.pullAll) wrapperText += `<button data-role="dlg_hardLoad">Load from this source</button>`;
            if (save_source_instance.pullAll) wrapperText += `<button data-role="dlg_softLoad">Merge from this source</button>`;
            if (save_source_instance.pushAll) wrapperText += `<button data-role="dlg_save">Save to this source</button>`;
            if (save_source_instance.updateRTstate) wrapperText += `<label>Subscribe to this source<input data-role="rtsync" type="checkbox"></input></label>`;
            wrapperText += `</span>
        </div>
        `;
            let wrapper = htmlwrap(wrapperText);

            let hookIfExists = (sel, e, f) => {
                if (wrapper.querySelector(sel)) {
                    wrapper.querySelector(sel).addEventListener(e, f);
                }
            }
            hookIfExists("[data-role='tsync']", 'input', (e) => {
                save_source_instance.settings.save = e.target.checked;
                polymorph_core.saveUserData();
            })
            hookIfExists("[data-role='lsync']", 'input', (e) => {
                save_source_instance.settings.load = e.target.checked;
                polymorph_core.saveUserData();
            })
            hookIfExists("[data-role='dlg_save']", "click", () => {
                save_source_instance.pushAll(polymorph_core.items);
            });
            hookIfExists("[data-role='rtsync']", "click", (e) => {
                save_source_instance.settings.RTactive = e.target.checked;
                save_source_instance.updateRTstate();
            });
            hookIfExists("[data-role='dlg_hardLoad']", "click", async() => {
                if (confirm("Overwrite existing data? You will lose any unsaved work.")) {
                    polymorph_core.resetDocument();
                    try {
                        d = await save_source_instance.pullAll();
                        polymorph_core.integrateData(d, i.type);
                    } catch (e) {
                        alert("Something went wrong with the save source: " + e);
                        console.log(e);
                        throw (e);
                        //todo: restore document
                    }
                }
            });
            //Load from the save source
            hookIfExists("[data-role='dlg_softLoad']", "click", async() => {
                try {
                    d = await save_source_instance.pullAll();
                    polymorph_core.integrateData(d, i.type);
                } catch (e) {
                    alert("Something went wrong with the save source: " + e);
                    console.log(e);
                    throw (e);
                    //todo: restore document
                }
            });
            //also register its settings in the save dialog
            if (save_source_instance.dialog) wrapper.appendChild(save_source_instance.dialog);
            polymorph_core.loadInnerDialog.appendChild(wrapper);
            saveDialogInstances.push({
                div: wrapper,
                instance: save_source_instance
            });
        }

        document.body.appendChild(loadDialog);

        //make it a function so that phone can use it
        polymorph_core.showSavePreferencesDialog = () => {
            for (let i of saveDialogInstances) {
                if (i.instance.showDialog) i.instance.showDialog();
                if (i.div.querySelector(`[data-role='tsync']`)) {
                    i.div.querySelector(`[data-role='tsync']`).checked = i.instance.settings.save;
                }
                if (i.div.querySelector(`[data-role='lsync']`)) {
                    i.div.querySelector(`[data-role='lsync']`).checked = i.instance.settings.load;
                }
                if (i.div.querySelector(`[data-role='rtsync']`)) {
                    i.div.querySelector(`[data-role='rtsync']`).checked = i.instance.settings.RTactive;
                }
            }
            autosaveOp.load();
            loadDialog.style.display = "block";
        }

        polymorph_core.on("UIstart", () => {
            polymorph_core.topbar.add("File/Save Locations").addEventListener("click", () => {
                polymorph_core.showSavePreferencesDialog();
            });
        });
        loadDialog.querySelector(".cb").addEventListener("click", polymorph_core.saveUserData);
    })();

    //a little nicety to warn user of unsaved items.
    polymorph_core.saved_until = Date.now();
    polymorph_core.on("updateItem", (e) => {
        if (!e || !polymorph_core.isLoading) { //if event was not triggered by a loading action
            polymorph_core.last_change_time = Date.now();
        }
    });
    window.addEventListener("beforeunload", (e) => {
        if (polymorph_core.last_change_time > polymorph_core.saved_until) {
            e.preventDefault();
            e.returnValue = "Hold up, you seem to have some unsaved changes. Are you sure you want to close this window?";
        }
    })

})();