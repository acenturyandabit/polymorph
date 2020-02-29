polymorph_core.registerSaveSource("lf", function (save_source_data) { // a sample save source, implementing a number of functions.
    polymorph_core.saveSourceTemplate.call(this, save_source_data);
    this.createable = true;
    this.prettyName = "Localforage (offline storage)";
    this.pushAll = async function (data) {
        //used by user to force push. 
    }
    this.pullAll = async function () {
        let d = await localforage.getItem("__polymorph_" + save_source_data.data.id);
        return d;
    }

    this.dialog = document.createElement("div");
    this.dialog.innerHTML = `
    <span>
    <input class="svid" placeholder="Save ID">
    </span>
    `;
    this.showDialog = function () {
        if (!save_source_data.data.id)save_source_data.data.id=polymorph_core.currentDocID;
        this.dialog.querySelector(".svid").value = save_source_data.data.id;
    }

    polymorph_core.addToSaveDialog(this);

    this.hook = async function () {
        //hook to pull changes and push changes. 
        //To subscribe to live updates, you need to manually use polymorph_core.on("updateItem",handler) to listen to item updates.
        //Otherwise, you can subscribe to the user save event, as per below, and set a flag to remind yourself to save
        this.toSave = true;
    }

    polymorph_core.on("userSave", (d) => {
        if (this.toSave) {
            this.pushAll(d);
            polymorph_core.savedOK = false;
            localforage.setItem("__polymorph_" + polymorph_core.currentDocID, d).then(() => {
                polymorph_core.savedOK = true; /// SUPER HACKY PLS FORMALISE
            });
            return true; //return true if we save
        } else {
            return false;
        }
    })

    // Please remove or comment out this function if you can't subscribe to live updates.
    this.unhook = async function (id) {
        //unhook previous hooks.
        this.toSave = false;
    }
})