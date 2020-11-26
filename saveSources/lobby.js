polymorph_core.registerSaveSource("lobby", function(save_source_data) { // a sample save source, implementing a number of functions.
    polymorph_core.saveSourceTemplate.call(this, save_source_data);
    //initialise here
    this.pushAll = async function(data) {
        //push to the source (force save)
        let compressedData = polymorph_core.datautils.IDCompress.compress(data);
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                //alert("Save success!");
            }
        };
        xmlhttp.open("POST", window.location.origin + "/lobbysave?f=" + this.settings.data.id, true);
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
        xmlhttp.open("GET", window.location.origin + "/lobbyload?f=" + this.settings.data.id, true);
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

    this.dialog = document.createElement("div");
    let ops = [
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "id",
            label: "The ID of this document."
        }),
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "throttle",
            label: "Throttle (number of saves before sending)",
            placeholder: 0
        })
    ]
    this.showDialog = function() {
        ops.forEach(i => i.load());
    };
    //send a quick get to the lobby to check it exists
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = () => {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status != 200) {
                //something wrong rip
                this.dialog.innerHTML = "<h2>The lobby operator is not installed on the host system.</h2>";
            }
            //alert("yay there is a lobby lah");
        }
    };
    xmlhttp.open("GET", window.location.origin + "/lobby", true);
    xmlhttp.send();

    this.updateRTstate = () => {
        if (this.settings.RTactive) {
            this.RTSyncQueue = Object.keys(polymorph_core.items).map(i => [i, polymorph_core.items[i]._lu_]);
            this.RTSyncQueue.sort((a, b) => { b[1] - a[1] });
            if (!this.ws || this.ws.readyState != WebSocket.OPEN) {
                this.ws = new WebSocket(`ws://${window.location.hostname}:18036`);
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
                        this.wsQueueDigester = setInterval(() => {
                            toSends = this.RTSyncQueue.slice(0, 5);
                            if (toSends.length) {
                                if (this.ws.readyState != WebSocket.OPEN) {
                                    console.log("ws error, reconnecting in 5...");
                                    setTimeout(this.updateRTstate, 5000);
                                    clearInterval(this.wsQueueDigester);
                                } else {
                                    this.ws.send(JSON.stringify({
                                        type: "postUpdate",
                                        data: toSends
                                    }));
                                    this.RTSyncQueue.splice(0, 5);
                                }
                            }
                        }, 1000);
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
                    console.log("ws error, reconnecting in 5...");
                    setTimeout(this.updateRTstate, 5000);
                    clearInterval(this.wsQueueDigester);
                })
            } else {
                this.wsQueueDigester = setInterval(() => {
                    toSends = this.RTSyncQueue.slice(0, 5);
                    if (toSends.length) {
                        if (this.ws.readyState != WebSocket.OPEN) {
                            console.log("ws error, reconnecting in 5...");
                            setTimeout(this.updateRTstate, 5000);
                            clearInterval(this.wsQueueDigester);
                        } else {
                            this.ws.send(JSON.stringify({
                                type: "postUpdate",
                                data: toSends
                            }));
                            this.RTSyncQueue.splice(0, 5);
                        }
                    }
                }, 1000);
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
    polymorph_core.addToSaveDialog(this);

}, {
    prettyName: "Save to local lobby",
    createable: true
})