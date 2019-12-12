core.registerSaveSource("toText", function (core) { // a sample save source, implementing a number of functions.
    this.prettyName = "Output to text";
    this.dialog = document.createElement("div");
    this.dialog.innerHTML = `
    <span>
    <textarea placeholder="Output"></textarea>
    <br>
    <button class="sfile">Save text to file</button>
    <button class="mfs">Merge from text</button>
    </span>
    `;
    function saveToFile() {
        saveJSON(core.toSaveData(), core.currentDoc.displayName + "_" + Date.now() + ".json");
    }
    this.dialog.querySelector(".mfs").addEventListener("click", () => {
        /*
        let i = JSON.parse(this.dialog.querySelector("textarea").value);
        i = core.datautils.decompress(i);
        //dont do anything with views for now
        for (let d in i.items) {
            if (core.items[d]) {
                core.insertItem(i.items[d]);
            } else {
                core.items[d] = i.items[d];
            }
        }*/
    })
    this.dialog.querySelector(".sfile").addEventListener("click", () => {
        saveToFile();
    });

    this.pushAll = async function (id, data) {
        this.dialog.querySelector("textarea").value = JSON.stringify(data);
    }
    this.pullAll = async function (id) {
        let obj = JSON.parse(this.dialog.querySelector("textarea").value);
        obj = core.datautils.decompress(obj);
        return obj;
    }
    this.hook = async function (id) {
        //hook to pull changes and push changes. 
        //To subscribe to live updates, you need to manually use core.on("updateItem",handler) to listen to item updates and core.on("updateView",handler) as well.
        //Otherwise, you can subscribe to the user save event, as per below, and set a flag to remind yourself to save
        this.toSave = true;
    }

    core.on("userSave", (d) => {
        if (this.toSave) {
            saveToFile();
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