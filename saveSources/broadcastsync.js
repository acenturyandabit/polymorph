polymorph_core.registerSaveSource("broadcastsync", function(save_source_data) {
    polymorph_core.saveSourceTemplate.call(this, save_source_data);
    //initialise here
    const broadcast = new BroadcastChannel(polymorph_core.currentDocID);
    let fromBroadcast = false;
    let isRecievingLR = false;
    broadcast.onmessage = (event) => {
        switch (event.data.ev) {
            case "ev":
                if (event.data.d.data) { //bit of safety
                    polymorph_core.items[event.data.d.id] = event.data.d.data;
                    fromBroadcast = true;
                    polymorph_core.fire("updateItem", { id: event.data.d.id, sender: this });
                    fromBroadcast = false;
                }
                break;
            case "ll":
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
                if (isRecievingLR) {
                    isRecievingLR = false;
                    fromBroadcast = true;
                    for (let i in event.data.dl) {
                        polymorph_core.items[i] = event.data.dl[i];
                        polymorph_core.fire("updateItem", { id: i, sender: this });
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

    polymorph_core.on("updateItem", (e) => {
        if (e.sender == this) return;
        if (e.loadProcess) return;
        if (this.settings.RTactive && !fromBroadcast) {
            broadcast.postMessage({
                ev: "ev",
                d: {
                    id: e.id,
                    data: polymorph_core.items[e.id]
                }
            })
        }
    });
    this.updateRTstate = () => {}; // signal that can do RT
    this.dialog = document.createElement("div"); // meh
    polymorph_core.addToSaveDialog(this);
    this.showDialog = function() {
        // do nothing
    }
}, {
    prettyName: "Broadcast across browsers",
    createable: true,
    handleCrossWindow: true,
})