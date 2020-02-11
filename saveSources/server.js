polymorph_core.registerSaveSource("srv", function (polymorph_core) { // a sample save source, implementing a number of functions.
    this.prettyName = "Save to server";
    //initialise here
    this.pushAll = async function (saveData, data) {
        //push to the source (force save)
        let settings = polymorph_core.saveSourceData['srv'];
        let compressedData = polymorph_core.datautils.IDCompress.compress(data);
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                //alert("Save success!");
            }
        };
        xmlhttp.open("POST", settings.saveTo, true);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.send(JSON.stringify(compressedData));
    }
    let thisSourceSettings = (id) => {
        if (!id) id = polymorph_core.currentDocID;
        return polymorph_core.userData.documents[id].saveSources['websocket'];
    };
    this.pullAll = async function () {
        let settings = polymorph_core.saveSourceData['srv'];
        let xmlhttp = new XMLHttpRequest();
        let p = new Promise((resolve, reject) => {
            xmlhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    try {
                        let obj = JSON.parse(this.responseText);
                        obj = polymorph_core.datautils.decompress(obj);
                        console.log(obj);
                        resolve(obj);
                    } catch (e) {
                        reject("data invalid :(");
                    }

                } else if (this.readyState == 4) {
                    //failure; direct load or backup!
                    reject("server was unavailable :/");
                    //if (fail) fail();
                }
            };
            xmlhttp.onerror = function () {
                reject("An error occured...");
            }
        });
        xmlhttp.open("GET", settings.loadFrom, true);
        xmlhttp.send();
        return p;
    }
    this.hook = async function () {
        //hook to pull changes and push changes. 
        //To subscribe to live updates, you need to manually use polymorph_core.on("updateItem",handler) to listen to item updates.
        //Otherwise, you can subscribe to the user save event, as per below, and set a flag to remind yourself to save
        this.toSave = true;
    }

    polymorph_core.on("userSave", (d) => {
        if (this.toSave) {
            this.pushAll(polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources['srv'], d);
            return true; //return true if we save
        } else {
            return false;
        }
    })

    // Please remove or comment out this function if you can't subscribe to live updates.
    this.unhook = async function () {
        //unhook previous hooks.
        this.toSave = false;
    }

    this.dialog = document.createElement("div");
    let addrop = new _option({
        div: this.dialog,
        type: "text",
        object: () => {
            return polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.srv
        },
        property: "saveTo",
        label: "Full server save address (include document name)"
    });
    let loop = new _option({
        div: this.dialog,
        type: "text",
        object: () => {
            return polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.srv
        },
        property: "loadFrom",
        label: "Full server load address (include document name)"
    });
    this.showDialog = function () {
        if (!polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.srv || typeof polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.srv != "object") {
            polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources.srv = {};
        }
        addrop.load();
        loop.load();
    }
})