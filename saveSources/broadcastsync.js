polymorph_core.registerSaveSource("broadcastsync", function(save_source_data) {
    polymorph_core.saveSourceTemplate.call(this, save_source_data);
    //initialise here
    const broadcast = new BroadcastChannel(polymorph_core.currentDocID);
    let isBroadcasting = false;
    broadcast.onmessage = (event) => {
        polymorph_core.items[event.data.id] = event.data.data;
        isBroadcasting = true;
        polymorph_core.fire("updateItem", { id: event.data.id, sender: this });
        isBroadcasting = false;
    }

    polymorph_core.on("updateItem", (e) => {
        if (e.sender == this) return;
        if (e.loadProcess) return;
        if (this.settings.RTactive && !isBroadcasting) {
            broadcast.postMessage({
                id: e.id,
                data: polymorph_core.items[e.id]
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