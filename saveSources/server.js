polymorph_core.registerSaveSource("srv", function(save_source_data) {
    polymorph_core.saveSourceTemplate.call(this, save_source_data);
    //initialise here
    if (save_source_data.type == "lobby") {
        // do a few switcheroos
        this.settings.data.saveTo = window.location.origin + "/lobbysave?f=" + this.settings.data.id;
        this.settings.data.loadFrom = window.location.origin + "/lobbyload?f=" + this.settings.data.id;
        this.settings.data.wsAddr = `ws://${window.location.hostname}:18036`
    }


    this.pushAll = async function(data) {
        //push to the source (force save)
        let compressedData = polymorph_core.datautils.IDCompress.compress(data);
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status != 200) {
                    alert("Save error! Please ensure the server backend is online.");
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

    this.dialog = document.createElement("div");
    polymorph_core.addToSaveDialog(this);

    let fixSharingLink = () => {
        let tmpurl = new URL(window.location);
        delete this.settings.data.sharing;
        tmpurl.search = "srvl=" + btoa(JSON.stringify({ id: polymorph_core.currentDocID, data: this.settings.data }))
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
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "wsAddr",
            afterInput: fixSharingLink,
            label: "Websocket addr for real time sync(include protocol, path, port.)"
        })
    ]
    this.showDialog = function() {
        fixSharingLink();
        ops.forEach(i => i.load());
    }


}, {
    prettyName: "Save to server",
    createable: true,
    canHandle: (params) => {
        if (params.has("srvl")) {
            let config = undefined;
            try {
                config = params.get("srvl");
                config = atob(config);
                config = JSON.parse(config);
            } catch (e) {
                return false;
            }
            return config;
        }
    }
})