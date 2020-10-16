polymorph_core.registerSaveSource("gitlite", function(save_source_data) { // a sample save source, implementing a number of functions.
    polymorph_core.saveSourceTemplate.call(this, save_source_data); //future-safety measure. sets this.settings to save_source_data.
    //initialise here
    if (!this.settings.gitcount) this.settings.gitcount = 0;

    //for the actual display:
    this.dialog = document.createElement("div");
    this.dialog.innerHTML = `
    `;
    let ops = [
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "saveTo",
            label: "Websocket server address (include ws://)",
            afterInput: polymorph_core.saveUserData
        }),
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "id",
            label: "ID to save document as",
            afterInput: polymorph_core.saveUserData
        }),
        new polymorph_core._option({
            div: this.dialog,
            type: "button",
            label: "Clear local copy",
            fn: () => {
                localforage.setItem(`_polymorph_gitlite_${this.settings.data.id}`, {});
            }
        })
    ]
    if (!this.settings.data.id) this.settings.data.id = polymorph_core.currentDocID;
    ops.forEach(i => i.load());
    this.showDialog = function() {
        ops.forEach(i => i.load());
    }

    //ID will be a string if the object is loaded; otherwise a custom object that you have set in the past
    //Set custom objects by using polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources['your_savesource_name'].

    this.pushAll = async(data) => {

        //map objects to last update time
        let timekeys = Object.entries(data).map((i) => ({ _lu_: i[1]._lu_, id: i[0] })).sort((a, b) => b._lu_ - a._lu_);
        let pow2 = 0;
        lus = timekeys.filter((i, ii) => {
            if (!(ii % (2 ** pow2)) || ii == timekeys.length - 1) {
                pow2++;
                return true;
            }
        });
        // send this full history to the websocket

        //pull first
        let toMerges = await this.pullAll(true)
        for (let i in toMerges) {
            polymorph_core.items[i] = toMerges[i];
            polymorph_core.fire("updateItem", { id: i }); // this may trigger an autosave so make it not?
        }

        let ws = new WebSocket(this.settings.data.saveTo);
        ws.addEventListener("open", () => {
            ws.send(JSON.stringify({
                id: this.settings.data.id,
                op: "push",
                _lu_: lus
            }));
        });
        ws.addEventListener("message", (m) => {
            let response = JSON.parse(m.data);
            switch (response.op) {
                case "accept":
                    // send over the data
                    let dataToSend = timekeys.filter(i => i._lu_ > response._lu_).map(i => ({ id: i.id, data: data[i.id] }));
                    ws.send(JSON.stringify({
                        op: "transfer",
                        data: dataToSend
                    }));
                    console.log(`sent ${dataToSend.length} / ${timekeys.length} items`)
                    break;
                case "reject":
                    ws.close();
                    alert("Save to nominated sync source failed :(");
                    break;
                case "thanks":
                    //ack message
                    ws.close();
                    break;
            }
        })

        //also for now save to localforage
        localforage.setItem(`_polymorph_gitlite_${this.settings.data.id}`, data);

        /*
        open websocket
    cry if websocket is not openable
    send jumplist for push
    get common OR empty OR conflict (if no common)
    send from common
    */
    }
    this.pullAll = async(deltasOnly) => {
        let localCopy = await localforage.getItem(`_polymorph_gitlite_${this.settings.data.id}`);
        if (!localCopy) localCopy = {};
        return new Promise((res) => {
            let ws = new WebSocket(this.settings.data.saveTo);
            ws.addEventListener("open", () => {
                ws.send(JSON.stringify({
                    id: this.settings.data.id,
                    op: "pull",
                }));
            });
            // we don't actually have a "local version"! quelle horreur!
            // save to localstorage.
            ws.addEventListener("message", (m) => {
                let response = JSON.parse(m.data);
                switch (response.op) {
                    case "push":
                        // send accept if can accept
                        //first, check ID
                        if (response.id != this.settings.data.id) {
                            ws.send(JSON.stringify({
                                op: "reject"
                            }));
                        } else {
                            let wasSent = false;
                            for (let i = 0; i < response._lu_.length; i++) {
                                if (localCopy[response._lu_[i].id] && localCopy[response._lu_[i].id]._lu_ == response._lu_[i]._lu_) {
                                    // accept this
                                    ws.send(JSON.stringify({
                                        op: "accept",
                                        _lu_: localCopy[response._lu_[i].id]._lu_
                                    }));
                                    wasSent = true;
                                    break;
                                }
                            }
                            if (!wasSent) {
                                // something is probably wrong because thats a lot of unsents
                                //oh well
                                ws.send(JSON.stringify({
                                    op: "accept",
                                    _lu_: response._lu_[response._lu_.length - 1]._lu_
                                }));
                            }
                        }
                        break;
                    case "transfer":
                        // recieve and merge the data
                        if (deltasOnly) {
                            ws.close();
                            res(response.data.reduce((p, i) => {
                                if (!localCopy[i.id] || localCopy[i.id]._lu_ < i.data._lu_) p[i.id] = i.data;
                                return p;
                            }, {}))
                        } else {
                            ws.close();
                            for (let i of response.data) {
                                if (!localCopy[i.id] || localCopy[i.id]._lu_ < i.data._lu_) localCopy[i.id] = i.data;
                            }
                            localforage.setItem(`_polymorph_gitlite_${this.settings.data.id}`, localCopy);
                            res(localCopy); //or nothing, if undefined
                        }
                        break;
                    case "reject":
                        alert("Remote did not have the requested document!");
                        break;
                }
            })
        })
    }

    this.hook = async function() {
        //hook to pull changes and push changes. 
        //To subscribe to live updates, you need to manually use polymorph_core.on("updateItem",handler) to listen to item updates.
        //Otherwise, you can subscribe to the user save event, as per below, and set a flag to remind yourself to save
        this.toSave = true;
    }


    // Please remove or comment out this function if you can't subscribe to live updates.
    this.unhook = async function(id) {
        //unhook previous hooks.
        this.toSave = false;
    }

    polymorph_core.on("updateItem", () => {
        // add changes if genunine change has happened -- how do we tell if a genuine change has happened? we need to store a local copy of the archive. does core do that already?
    })

    polymorph_core.on("userSave", (d) => {
        if (this.toSave) {
            this.pushAll(d);
            return true; //return true if we save
        } else {
            return false;
        }
    })

    window.addEventListener("beforeunload", () => {

    })
    polymorph_core.addToSaveDialog(this);
}, {
    prettyName: "Websocket Synchroniser",
    createable: true
})