polymorph_core.registerSaveSource("template", function (save_source_data) { // a sample save source, implementing a number of functions.
    polymorph_core.saveSourceTemplate.call(this, save_source_data); //future-safety measure. sets this.settings to save_source_data.
    //initialise here
    if (!this.settings.gitcount) this.settings.gitcount = 0;

    //for the actual display:
    this.dialog = document.createElement("div");
    this.dialog.innerHTML = `
        <h1>Websocket synchroniser</h1>
    `;
    let ops = [
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "saveTo",
            label: "Websocket server address (include ws://)"
        })
    ]
    this.showDialog = function () {
        ops.forEach(i => i.load());
    }
    polymorph_core.addToSaveDialog(this);

    //ID will be a string if the object is loaded; otherwise a custom object that you have set in the past
    //Set custom objects by using polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources['your_savesource_name'].

    this.pushAll = async (data) => {
        //push to the source (force save)
        //check if we have a full history yet
        // !!! we can't modify the doc from here...
        let git = data._meta._git;
        if (!git) {
            git = [];
            data._meta._git = git;
        }
        if (!git.length) {
            for (let i of data) {
                if (i != "_meta") {
                    git.push({
                        cid: `${polymorph_core.userData.uniqueID}_${data._meta.id}_${this.settings.gitcount}`,
                        id: i,
                        data: data[i]
                    });
                    this.settings.gitcount++;
                }
            }
        } // later we can implement an aggregatedSave function.

        let ws = new WebSocket(this.settings.saveTo);
        ws.addEventListener("open", () => {
            ws.send()
        });
        /*
        open websocket
        cry if websocket is not openable
        send jumplist for push
        get common OR empty OR conflict (if no common)
        send from common
        */
    }
    this.pullAll = async function () {
        return object_with_data; //or nothing, if undefined
    }

    this.hook = async function () {
        //hook to pull changes and push changes. 
        //To subscribe to live updates, you need to manually use polymorph_core.on("updateItem",handler) to listen to item updates.
        //Otherwise, you can subscribe to the user save event, as per below, and set a flag to remind yourself to save
        this.toSave = true;
    }


    // Please remove or comment out this function if you can't subscribe to live updates.
    this.unhook = async function (id) {
        //unhook previous hooks.
        this.toSave = false;
    }

    polymorph_core.on("updateItem", () => {
        // add changes if genunine change has happened -- how do we tell if a genuine change has happened? we need to store a local copy of the archive. does core do that already?
    })

    polymorph_core.on("userSave", (d) => {
        if (this.toSave) {
            this.pushAll(polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources['template'], d);
            return true; //return true if we save
        } else {
            return false;
        }
    })

    window.addEventListener("beforeunload", () => {

    })
}, {
    prettyName: "Websocket Synchroniser",
    createable: true
})