//v0. works. full credits to Yair Levy on S/O.

function saveJSON(data, filename) {
    if ((typeof data).toLowerCase() != "string") data = JSON.stringify(data);
    let bl = new Blob([data], {
        type: "text/html"
    });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(bl);
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
}

polymorph_core.registerSaveSource("toText", function (save_source_data) { // a sample save source, implementing a number of functions.
    polymorph_core.saveSourceTemplate.call(this, save_source_data);

    this.dialog = document.createElement("div");
    this.dialog.innerHTML = `
    <span>
    <textarea placeholder="Output"></textarea>
    <br>
    <button class="sfile">Save text to file</button>
    <button class="loitem">Load as item array</button>
    </span>
    `;
    function saveToFile() {
        saveJSON(polymorph_core.items, polymorph_core.currentDoc.displayName + "_" + Date.now() + ".json");
    }

    this.dialog.querySelector(".sfile").addEventListener("click", () => {
        saveToFile();
    });

    this.dialog.querySelector(".loitem").addEventListener("click", () => {
        let newItems = JSON.parse(this.dialog.querySelector("textarea").value);
        for (let i of newItems){
            polymorph_core.createItem(i);
        }
    });

    this.pushAll = async function (data) {
        this.dialog.querySelector("textarea").value = JSON.stringify(data);
    }
    this.pullAll = async function () {
        let obj = JSON.parse(this.dialog.querySelector("textarea").value);
        obj = polymorph_core.datautils.decompress(obj);
        return obj;
    }
    this.hook = async ()=>{
        //hook to pull changes and push changes. 
        //To subscribe to live updates, you need to manually use polymorph_core.on("updateItem",handler) to listen to item updates.
        //Otherwise, you can subscribe to the user save event, as per below, and set a flag to remind yourself to save
        this.toSave = true;
    }

    // Please remove or comment out this function if you can't subscribe to live updates.
    this.unhook = async ()=>{
        //unhook previous hooks.
        this.toSave = false;
    }
    polymorph_core.on("userSave", (d) => {
        if (this.toSave) {
            saveToFile();
            return true; //return true if we save
        } else {
            return false;
        }
    })

    polymorph_core.addToSaveDialog(this);
}, {
    createable: true,
    prettyName: "Output to text"
})


