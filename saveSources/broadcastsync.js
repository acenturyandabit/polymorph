polymorph_core.registerSaveSource("broadcastsync", function(save_source_data) {
    polymorph_core.saveSourceTemplate.call(this, save_source_data);
    //initialise here
    const broadcast = new BroadcastChannel(polymorph_core.currentDocID);
    let fromBroadcast = false;
    let isRecievingLR = false;
    broadcast.onmessage = (event) => {
        switch (event.data.ev) {
            case "ev":
                // fire an event
                if (event.data.d.data) { //bit of safety
                    if (!polymorph_core.items[event.data.d.id] || polymorph_core.items[event.data.d.id]._lu_ < event.data.d.data._lu_) {
                        polymorph_core.items[event.data.d.id] = event.data.d.data;
                        fromBroadcast = true;
                        let sender = this;
                        if (event.data.d.sender) {
                            if (event.data.d.sender.type == "container") {
                                try {
                                    sender = polymorph_core.containers[event.data.d.sender.id].operator
                                } catch (e) {
                                    console.log(e);
                                }
                            }
                        }
                        polymorph_core.fire("updateItem", { id: event.data.d.id, sender: sender });
                        fromBroadcast = false;
                    }
                }
                break;
            case "ll":
                // when an external merge is completed and large numbers of LUs are generated
                // aka _lu_ list
                if (isRecievingLR) break;
                let dels = {};
                for (let i in polymorph_core.items) {
                    if (polymorph_core.items[i]._lu_ > (event.data.lu[i] || 0)) {
                        dels[i] = polymorph_core.items[i];
                    }
                }
                for (let i in event.data.lu) {
                    if (!polymorph_core.items[i]) dels[i] = null;
                }
                broadcast.postMessage({
                    ev: "lr",
                    dl: dels
                });
                break;
            case "lr":
                // aka _lu_ recieve
                if (isRecievingLR) {
                    isRecievingLR = false;
                    fromBroadcast = true;
                    for (let i in event.data.dl) {
                        if (event.data.dl[i]) {
                            polymorph_core.items[i] = event.data.dl[i];
                            polymorph_core.fire("updateItem", { id: i, sender: this });
                        } else {
                            if (this.settings.allowDeletions) {
                                delete polymorph_core.items[i];
                                polymorph_core.fire("updateItem", { id: i, sender: this });
                            }
                        }
                    }
                    fromBroadcast = false;
                }
                break;
        }
    }
    polymorph_core.on("mergeComplete", (e) => {
        // broadcast a list of itemIDs
        let lulist = Object.entries(polymorph_core.items).map(i => [i[0], i[1]._lu_]).reduce((p, i) => {
            p[i[0]] = i[1];
            return p;
        }, {});
        isRecievingLR = true;
        broadcast.postMessage({
            ev: "ll",
            lu: lulist
        });
        setTimeout(() => isRecievingLR = false, 500);
        // recieve any future copies of items as an updateItem

    })
    polymorph_core.on("modifiedItem", (e) => {
        if (e.sender == this) return;
        if (e.loadProcess) return;
        if (this.settings.RTactive && !fromBroadcast) {
            let sender = undefined;
            try {
                if (e.sender && e.sender.container.id) {
                    sender = {
                        type: "container",
                        id: e.sender.container.id
                    }
                }
            } catch (e) {
                sender = undefined;
            }
            broadcast.postMessage({
                ev: "ev",
                d: {
                    id: e.id,
                    data: polymorph_core.items[e.id],
                    sender: sender
                }
            })
        }
    });
    this.updateRTstate = () => {}; // signal that can do RT
    this.dialog = document.createElement("div"); // meh
    let options = {
        oneTimeImport: new polymorph_core._option({
            div: this.dialog,
            type: "bool",
            object: () => this.settings,
            property: "allowDeletions",
            label: "Allow broadcast to delete objects that have been deleted from other instances."
        })
    }
    polymorph_core.addToSaveDialog(this);
    this.showDialog = function() {
        for (let i in options) {
            options[i].load();
        }
    }
}, {
    prettyName: "Broadcast across browsers",
    createable: true,
    handleCrossWindow: true,
})