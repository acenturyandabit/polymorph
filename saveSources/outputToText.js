core.registerSaveSource("toText", function (core) { // a sample save source, implementing a number of functions.
    this.dialog = document.createElement("div");
    this.dialog.innerHTML = `
    <h2>Output to text</h2>
    <span>
    <textarea placeholder="Output"></textarea>
    <br>
    <button class="snow">Save now</button>
    <button class="sfile">Save to file</button>
    <button class="lfs">Load from source</button>
    </span>
    `;
    this.dialog.querySelector(".snow").addEventListener("click", () => {
        this.pushAll(undefined, core.toSaveData());
    })
    this.dialog.querySelector(".lfs").addEventListener("click", () => {
        core.userLoad("toText", this.id);
    })
    this.dialog.querySelector(".sfile").addEventListener("click", () => {
        saveJSON(core.toSaveData(), core.currentDoc.displayName + "_" + Date.now()+".json");
    });

    this.pushAll = async function (id, data) {
        this.dialog.querySelector("textarea").value = JSON.stringify(data);
    }
    this.pullAll = async function (id) {
        return JSON.parse(this.dialog.querySelector("textarea").value);
    }
    this.hook=async function(){
        
    }
})