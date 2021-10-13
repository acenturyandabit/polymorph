polymorph_core.registerSaveSource("gitlite2", function(save_source_data) {
    polymorph_core.saveSourceTemplate.call(this, save_source_data);
    //initialise here

    this.internalCache = {};
    let updateCache = (id, newLU, canClear) => {
        if (!this.internalCache[id]) this.internalCache[id] = {
            _lu_: 0,
            c: false
        };
        if (this.internalCache[id]._lu_ < newLU) {
            this.internalCache[id]._lu_ = newLU;
            this.internalCache[id].c = true;
        } else if (canClear) {
            this.internalCache[id].c = false;
        }

    }
    this.lastRecvCommit = 0;


    this.pushAll = async function(data) {
        // data is useful if manual (first) push. if take data, then just send data. usersave should not have data.
        let toSend = { commit: 0, items: {} };
        if (data) {
            toSend.items = data;
            toSend.commit = 0;
        } else {
            toSend.commit = this.lastRecvCommit;
            //try pushing deltas, if server doesn't recieve it then warn user
            for (let i in this.internalCache) {
                if (this.internalCache[i].c) {
                    // item has changed
                    toSend.items[i] = polymorph_core.items[i];
                    this.internalCache[i].c = false;
                }
            }
        }
        if (Object.keys(toSend.items).length > 0) {
            let recvdata = await fetch(this.settings.data.saveTo, { method: "POST", body: JSON.stringify(toSend) });
            if (recvdata.ok) {
                let datajson = await recvdata.json();
                this.lastRecvCommit = datajson.commit;
                for (let i in datajson.items) {
                    if (datajson.items[i]._lu_ > polymorph_core.items[i]._lu_) {
                        polymorph_core.items[i] = datajson.items[i];
                        updateCache(i, datajson.items[i]._lu_);
                        polymorph_core.fire("updateItem", { id: i, sender: this });
                        this.internalCache[i].c = false; // remote has it, no need to flag it
                    }
                }
            } else {
                alert("Warning: error with gitlite source.");
                return;
            }
        }
        polymorph_core.saved_until = Date.now();
        polymorph_core.showNotification('Gitlite Saved', 'success');
    }

    this.pullAll = async function() {
        let data = await fetch(this.settings.data.loadFrom);
        if (data.ok) {
            let datajson = await data.json();
            // will have a commit id and a full document
            datajson.items = polymorph_core.datautils.decompress(datajson.items);
            for (let i in datajson.items) {
                updateCache(i, datajson.items[i]._lu_, true);
            }
            this.lastRecvCommit = datajson.commit;
            return datajson.items;
        } else {
            alert("Warning: error form monogit");
        }
    }

    polymorph_core.on("userSave", (d) => {
        if (this.settings.save) {
            if (this.settings.data.throttle && this.settings.data.throttle != "") {
                if (!this.settings.tmpthrottle) {
                    this.settings.tmpthrottle = 0;
                }
                if (this.settings.tmpthrottle > Number(this.settings.data.throttle)) {
                    this.settings.tmpthrottle = 0;
                    this.pushAll();
                } else {
                    this.settings.tmpthrottle++;
                }
            } else {
                this.pushAll();
            }
            return true; //return true if we save
        } else {
            return false;
        }
    });

    polymorph_core.on("updateItem", (d) => {
        // Can't just use modifiedItem because if other source  loads lu 10 and I load lu 5 then want to push lu 10
        updateCache(d.id, polymorph_core.items[d.id]._lu_);
    });

    this.dialog = document.createElement("div");
    polymorph_core.addToSaveDialog(this);


    let conflictDialog = htmlwrap(`
    <div>
        <h1>Conflicts editor</h1>
        <label>Ignore _lu_ changes <input type="checkbox" class="gl_ignorelu"/></label>
        <p>Source</p>
        <select class="gl_conflictsSource"></select>
        <div style = "display:flex;flex-direction:row">
            <div style="flex: 0 0 30px;">
                <select class="gl_itemIDSelect" size="10"></select>
            </div>
            <div style="flex: 1 1 50%">
                <p>This verison is the local version and will be saved.</p>
                <textarea class="gl_local"></textarea>
            </div>
            <div style="flex: 1 1 50%; width: 100px">
            <div class="gl_remote"></div>
            <button class="uremo">Use remote version</button>
            </div>
        </div>
    </div>
    `);
    let sourceSelect = conflictDialog.querySelector(".gl_conflictsSource");
    let ignoreLu = conflictDialog.querySelector(".gl_ignorelu");
    let changesList = conflictDialog.querySelector(".gl_itemIDSelect");
    let localVer = conflictDialog.querySelector(".gl_local");
    let uremobtn = conflictDialog.querySelector(".uremo");
    let remoteVer = conflictDialog.querySelector(".gl_remote");
    this.conflictResolutionInstructions = {};

    let swapConflictSource = () => {
        while (changesList.children.length) changesList.children[0].remove();
        for (let i in this.conflicts[sourceSelect.value]) {
            if (ignoreLu.checked) {
                let confcopy = JSON.parse(JSON.stringify(this.conflicts[sourceSelect.value][i]));
                delete confcopy._lu_;
                let micopy = JSON.parse(JSON.stringify(polymorph_core.items[i]));
                delete micopy._lu_;
                if (JSON.stringify(micopy) == JSON.stringify(confcopy)) continue;
            }
            let op = htmlwrap(`<option>${i}</option>`);
            changesList.appendChild(op);
        }
    }
    ignoreLu.addEventListener("input", swapConflictSource);


    let swapConflictItem = () => {
        if (this.conflicts[sourceSelect.value] && this.conflicts[sourceSelect.value][changesList.value]) {
            if (!this.conflictResolutionInstructions[changesList.value]) {
                this.conflictResolutionInstructions[changesList.value] = JSON.parse(JSON.stringify(polymorph_core.items[changesList.value]));
            }
            localVer.value = JSON.stringify(this.conflictResolutionInstructions[changesList.value], null, 1);
            localVer.style.background = "white";
            remoteVer.innerText = JSON.stringify(this.conflicts[sourceSelect.value][changesList.value], null, 1);
        }
    }
    let saveNewValue = (e) => {
        try {
            this.conflictResolutionInstructions[changesList.value] = JSON.parse(localVer.value);
            //updateConflictInstructions();
            localVer.style.background = "white";
        } catch (e) {
            localVer.style.background = "#ffcccc";
        }
    };
    sourceSelect.addEventListener("input", swapConflictSource);
    changesList.addEventListener("input", swapConflictItem);
    localVer.addEventListener("input", saveNewValue);
    uremobtn.addEventListener("click", () => {
        localVer.value = remoteVer.innerText;
        saveNewValue();
    })

    this.showConflictDialog = () => {
        while (sourceSelect.children.length) {
            sourceSelect.children[0].remove();
        }
        this.conflictResolutionInstructions = {};
        let x = new XMLHttpRequest();
        x.addEventListener("readystatechange", (e) => {
            if (x.readyState == XMLHttpRequest.DONE) {
                this.conflicts = JSON.parse(x.responseText);
                // ignore LU only differences
                /*for (let r in this.conflicts) {
                    for (let i in this.conflicts[r]) {
                        //v v inefficient!!111 :(
                        if (polymorph_core.items[i]) {
                            let tempCopy = JSON.parse(JSON.stringify(this.conflicts[r][i]));
                            let tempCopy2 = JSON.parse(JSON.stringify(polymorph_core.items[i]));
                            delete tempCopy._lu;
                            delete tempCopy2._lu;
                            if (JSON.stringify(tempCopy) == JSON.stringify(tempCopy2)) {
                                delete this.conflicts[r][i];
                            }
                        }
                    }
                }*/ // lu usually indicates something has changed so dont be too quick to dismiss it
                for (let i in this.conflicts) {
                    let op = htmlwrap(`<option>${i}</option>`);
                    sourceSelect.appendChild(op);
                    swapConflictSource();
                }
            }
        });
        x.open("GET", this.settings.data.conflictFrom);
        x.send();
        polymorph_core.dialog.prompt(conflictDialog, this.handleConflictsUpdate);
    }
    this.handleConflictsUpdate = () => {
        for (let i in this.conflictResolutionInstructions) {
            polymorph_core.items[i] = this.conflictResolutionInstructions[i];
            polymorph_core.fire("updateItem", { id: i });
        }
    };
    let fixSharingLink = () => {
        let tmpurl = new URL(window.location);
        delete this.settings.data.sharing; // prevent recursion causing explosion
        tmpurl.search = "mglt=" + btoa(JSON.stringify({ id: polymorph_core.currentDocID, data: this.settings.data }))
        this.settings.data.sharing = tmpurl.href;
    }

    let ops = [
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "saveTo",
            afterInput: fixSharingLink,
            label: "Full server save address (include document name)"
        }),
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "loadFrom",
            afterInput: fixSharingLink,
            label: "Full server load address (include document name)"
        }),
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "conflictFrom",
            afterInput: fixSharingLink,
            label: "Conflict fetching address (include document name)"
        }),
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "sharing",
            label: "Link for sharing"
        }),
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "throttle",
            label: "Throttle (number of changes before sending)",
            placeholder: 0
        }),
        /*
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "wsAddr",
            afterInput: fixSharingLink,
            label: "Websocket addr for real time sync(include protocol, path, port.)"
        }),
        */
        new polymorph_core._option({
            div: this.dialog,
            type: "button",
            fn: () => {
                this.settings.data.saveTo = window.location.origin + "/gitsave?f=" + polymorph_core.currentDocID;
                this.settings.data.loadFrom = window.location.origin + "/gitload?f=" + polymorph_core.currentDocID;
                this.settings.data.conflictFrom = window.location.origin + "/gitconflicts?f=" + polymorph_core.currentDocID;
                this.settings.data.wsAddr = `ws://${window.location.hostname}:29384`
                this.showDialog();
            },
            label: "Reset to defaults"
        }),
        new polymorph_core._option({
            div: this.dialog,
            type: "button",
            fn: () => {
                this.showConflictDialog();
            },
            label: "View conflicts"
        })
    ]
    this.showDialog = function() {
        fixSharingLink();
        ops.forEach(i => i.load());
    }


}, {
    prettyName: "Save deltas to git",
    createable: true,
    handleCrossWindow: true,
    canHandle: (params) => {
        if (params.has("dglt")) {
            let config = undefined;
            try {
                config = params.get("dglt");
                config = atob(config);
                config = JSON.parse(config);
            } catch (e) {
                return false;
            }
            return config;
        }
    }
})