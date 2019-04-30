core.registerSaveSource("srv", function (core) { // a sample save source, implementing a number of functions.
    //initialise here
    this.pushAll = async function (id, data) {
        //push to the source (force save)
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                //alert("Save success!");
            }
        };
        xmlhttp.open("POST", core.currentDoc.saveSources['srv'], true);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.send(JSON.stringify(data));
    }
    this.pullAll = async function (id) {
        let xmlhttp = new XMLHttpRequest();
        let p = new Promise((resolve,reject) => {
            xmlhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    let obj = JSON.parse(this.responseText);
                    resolve(obj);
                } else if (this.readyState == 4) {
                    //failure; direct load or backup!
                    reject("server was unavailable :/");
                    //if (fail) fail();
                }
            };
        });
        xmlhttp.open("GET", core.currentDoc.saveSources['srv'], true);
        xmlhttp.send();
        return p;
    }
    this.dialog = document.createElement("div");
    this.dialog.innerHTML = `
    <h2>Save to server</h2>`;
    let addrop = new _option({
        div: this.dialog,
        type: "text",
        object: () => {
            return core.currentDoc.saveSources
        },
        property: "srv",
        label: "Full server address (include document name)"
    });
    let morebuttons = htmlwrap(`<button class="save">Save to source</button>
    <button class="load">Load from source</button>`);
    //<button class="vfy">Verify source</button>`);
    this.dialog.appendChild(morebuttons);
    this.dialog.querySelector(".save").addEventListener("click", () => {
        this.pushAll(core.currentDoc.saveSources.srv, core.toSaveData());
    });
    this.dialog.querySelector(".load").addEventListener("click", () => {
        core.userLoad("srv", core.currentDoc.saveSources.srv);
    });
    this.readyDialog = function () {
        addrop.load();
    }
})