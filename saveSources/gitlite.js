polymorph_core.registerSaveSource("gitlite", function(save_source_data) {
    polymorph_core.saveSourceTemplate.call(this, save_source_data);
    //initialise here

    this.pushAll = async function(data) {
        //push to the source (force save)
        let compressedData = polymorph_core.datautils.IDCompress.compress(data);
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status != 200) {
                    alert("Save error! Please ensure the gitlite backend is online.");
                } else {
                    polymorph_core.saved_until = Date.now();
                }
            }
        };
        xmlhttp.open("POST", this.settings.data.saveTo, true);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.send(JSON.stringify(compressedData));
    }

    this.pullAll = async function() {
        let xmlhttp = new XMLHttpRequest();
        let p = new Promise((resolve, reject) => {
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    try {
                        let obj = JSON.parse(this.responseText);
                        obj = polymorph_core.datautils.decompress(obj);
                        console.log(obj);
                        resolve(obj);
                    } catch (e) {
                        reject("server response invalid - see console");
                        console.log(e);
                    }

                } else if (this.readyState == 4) {
                    //failure; direct load or backup!
                    reject("server was unavailable :/");
                    //if (fail) fail();
                }
            };
            xmlhttp.onerror = function() {
                reject("An error occured...");
            }
        });
        xmlhttp.open("GET", this.settings.data.loadFrom, true);
        xmlhttp.send();
        return p;
    }

    polymorph_core.on("userSave", (d) => {
            if (this.settings.save) {
                if (this.settings.data.throttle && this.settings.data.throttle != "") {
                    if (!this.settings.tmpthrottle) {
                        this.settings.tmpthrottle = 0;
                    }
                    if (this.settings.tmpthrottle > Number(this.settings.data.throttle)) {
                        this.settings.tmpthrottle = 0;
                        this.pushAll(d);
                    } else {
                        this.settings.tmpthrottle++;
                    }
                } else {
                    this.pushAll(d);
                }
                return true; //return true if we save
            } else {
                return false;
            }
        })
        /*

this.updateRTstate = () => {

    let initialiseWSQueueDigester = () => setInterval(() => {
        toSends = this.RTSyncQueue.slice(0, 5);
        if (this.ws.readyState != WebSocket.OPEN) {
            console.log("ws error, reconnecting...");
            setTimeout(this.updateRTstate);
            clearInterval(this.wsQueueDigester);
        } else if (toSends.length) {
            this.ws.send(JSON.stringify({
                type: "postUpdate",
                data: toSends
            }));
            this.RTSyncQueue.splice(0, 5);
        }
    }, 1000);

    if (this.settings.RTactive) {
        this.RTSyncQueue = Object.keys(polymorph_core.items).map(i => [i, polymorph_core.items[i]._lu_]);
        this.RTSyncQueue.sort((a, b) => { b[1] - a[1] });
        if (!this.ws || this.ws.readyState != WebSocket.OPEN) {
            this.ws = new WebSocket(this.settings.data.wsAddr);
            this.ws.addEventListener("open", () => {
                this.ws.send(JSON.stringify({
                    type: "selfID",
                    data: polymorph_core.currentDocID
                }));
                setTimeout(() => {
                    let timekeys = Object.entries(polymorph_core.items).map((i) => ({ _lu_: i[1]._lu_, id: i[0] })).sort((a, b) => b._lu_ - a._lu_);
                    let pow2 = 0;
                    let lus = timekeys.filter((i, ii) => {
                        if (!(ii % (2 ** pow2)) || ii == timekeys.length - 1) {
                            pow2++;
                            return true;
                        } else return false;
                    });
                    this.ws.send(JSON.stringify({
                        type: "mergeCheck",
                        items: lus
                    }))
                    this.wsQueueDigester = initialiseWSQueueDigester();
                }, 1000);
            })
            this.ws.addEventListener("message", (d) => {
                let data = JSON.parse(d.data);
                switch (data.type) {
                    case "request":
                        // send over my copy of stuff
                        this.ws.send(JSON.stringify({
                            type: "transmit",
                            data: data.data.map(i => [i, polymorph_core.items[i]])
                        }))
                        break;
                    case "transmit":
                        if (this.settings.RTactive) {
                            for (let i of data.data) {
                                if (!polymorph_core.items[i[0]] || polymorph_core.items[i[0]]._lu_ < i[1]._lu_) {
                                    polymorph_core.items[i[0]] = i[1];
                                    polymorph_core.fire("updateItem", { sender: this, id: i[0] });
                                }
                            }
                        }
                        // decide whether or not to merge
                        break;
                }
            })
            this.ws.addEventListener("error", () => {
                try {
                    this.ws.close();
                } catch (e) {
                    //ws already closed
                }
                console.log("ws error, reconnecting...");
                setTimeout(this.updateRTstate);
                clearInterval(this.wsQueueDigester);
            })
        } else {
            this.wsQueueDigester = initialiseWSQueueDigester();
        }
    } else {
        if (this.wsQueueDigester) clearInterval(this.wsQueueDigester);
        if (this.ws && this.ws.readyState == WebSocket.OPEN) this.ws.close();
    }
}
this.updateRTstate();

polymorph_core.on("updateItem", (d) => {
    if (d.sender == this) return;
    if (d.loadProcess) {
        this.RTSyncQueue.push([d.id, polymorph_core.items[d.id]._lu_]);
    } else {
        if (this.RTSyncQueue.length && this.RTSyncQueue[0][0] == d.id) {
            this.RTSyncQueue[0] = [d.id, Date.now(), polymorph_core.items[d.id]];
        } else this.RTSyncQueue.unshift([d.id, Date.now(), polymorph_core.items[d.id]]);
    }
})

polymorph_core.on("mergeBegin", () => {
    // clear out the RTSyncQueue
    this.RTSyncQueue = [];
})

polymorph_core.on("mergeComplete", () => {
    // sort the RTSyncQueue
    this.RTSyncQueue.sort((a, b) => { b[1] - a[1] });
});
*/
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
                this.conflictResolutionInstructions[changesList.value] = polymorph_core.items[changesList.value];
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
        tmpurl.search = "glt=" + btoa(JSON.stringify({ id: polymorph_core.currentDocID, data: this.settings.data }))
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
    prettyName: "Save to git",
    createable: true,
    canHandle: (params) => {
        if (params.has("glt")) {
            let config = undefined;
            try {
                config = params.get("glt");
                config = atob(config);
                config = JSON.parse(config);
            } catch (e) {
                return false;
            }
            return config;
        }
    }
})