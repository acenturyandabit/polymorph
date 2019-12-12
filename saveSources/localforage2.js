polymorph_core.registerSaveSource("lf", function (polymorph_core) { // a sample save source, implementing a number of functions.
    this.createable = true;
    this.prettyName = "Localforage (offline storage)";
    this.pushAll = async function (id, data) {

    }
    this.pullAll = async function () {
        let d = await localforage.getItem("__polymorph_" + polymorph_core.currentDocID);
        return d;
    }

    this.dialog = document.createElement("div");
    this.dialog.innerHTML = `
    <span>
    <input class="svid" placeholder="Save ID">
    </span>
    `;
    this.showDialog = function () {
        this.dialog.querySelector(".svid").value = polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources['lf'];
    }
    this.hook = async function (id) {
        //hook to pull changes and push changes. 
        //To subscribe to live updates, you need to manually use polymorph_core.on("updateItem",handler) to listen to item updates.
        //Otherwise, you can subscribe to the user save event, as per below, and set a flag to remind yourself to save
        this.toSave = true;
    }

    polymorph_core.on("userSave", (d) => {
        if (this.toSave) {
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