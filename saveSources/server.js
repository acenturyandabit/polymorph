core.registerSaveSource("srv", function (core) { // a sample save source, implementing a number of functions.
    this.prettyName="Save to server";
    //initialise here
    this.pushAll = async function (id, data) {
        //push to the source (force save)
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                //alert("Save success!");
            }
        };
        xmlhttp.open("POST", id, true);
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
        xmlhttp.open("GET", id, true);
        xmlhttp.send();
        return p;
    }
    this.dialog = document.createElement("div");
    let addrop = new _option({
        div: this.dialog,
        type: "text",
        object: () => {
            return core.userData.documents[core.currentDocID].saveSources
        },
        property: "srv",
        label: "Full server address (include document name)"
    });
    this.readyDialog = function () {
        addrop.load();
    }
})