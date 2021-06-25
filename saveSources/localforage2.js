polymorph_core.registerSaveSource("lf", function(save_source_data) { // a sample save source, implementing a number of functions.
    polymorph_core.saveSourceTemplate.call(this, save_source_data);

    this.pushAll = async function(data) {
        localforage.setItem("__polymorph_" + polymorph_core.currentDocID, data).then(() => {
            polymorph_core.saved_until = Date.now();
            polymorph_core.showNotification('Localforage Saved', 'success');
        });
        //used by user to force push. 
    }
    this.pullAll = async function() {
        let d = await localforage.getItem("__polymorph_" + save_source_data.data.id);
        return d;
    }

    this.dialog = document.createElement("div");
    this.dialog.innerHTML = `
    <span>
    <input class="svid" placeholder="Save ID">
    </span>
    `;
    this.showDialog = () => {
        if (!save_source_data.data.id) save_source_data.data.id = polymorph_core.currentDocID;
        this.dialog.querySelector(".svid").value = save_source_data.data.id;
    }

    this.dialog.querySelector(".svid").addEventListener("input", (e) => {
        save_source_data.data.id = e.target.value;
    })

    polymorph_core.addToSaveDialog(this);

    this.hook = async() => {
        //hook to pull changes and push changes. 
        //To subscribe to live updates, you need to manually use polymorph_core.on("updateItem",handler) to listen to item updates.
        //Otherwise, you can subscribe to the user save event, as per below, and set a flag to remind yourself to save
        this.toSave = true;
    }

    polymorph_core.on("userSave", (d) => {
        if (save_source_data.save) {
            this.pushAll(d);
            return true; //return true if we save
        } else {
            return false;
        }
    })

    // Please remove or comment out this function if you can't subscribe to live updates.
    this.unhook = async() => {
        //unhook previous hooks.
        this.toSave = false;
    }
}, {
    createable: true,
    prettyName: "Localforage (offline storage)"
})