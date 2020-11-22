polymorph_core.registerSaveSource("lobby", function(save_source_data) { // a sample save source, implementing a number of functions.
    polymorph_core.saveSourceTemplate.call(this, save_source_data);
    //initialise here
    this.pushAll = async function(data) {
        //push to the source (force save)
        let compressedData = polymorph_core.datautils.IDCompress.compress(data);
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                //alert("Save success!");
            }
        };
        xmlhttp.open("POST", window.location.origin + "/lobbysave?f=" + this.settings.data.id, true);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.send(JSON.stringify(compressedData));
    }



    this.pullAll = async function() {
        let xmlhttp = new XMLHttpRequest();
        let p = new Promise((resolve, reject) => {
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    try {
                        let obj = JSON.parse(this.responseText);
                        obj = polymorph_core.datautils.decompress(obj);
                        console.log(obj);
                        resolve(obj);
                    } catch (e) {
                        reject("server response invalid - see console");
                        console.log(e);
                    }

                } else if (this.readyState == 4) {
                    //failure; direct load or backup!
                    reject("server was unavailable :/");
                    //if (fail) fail();
                }
            };
            xmlhttp.onerror = function() {
                reject("An error occured...");
            }
        });
        xmlhttp.open("GET", window.location.origin + "/lobbyload?f=" + this.settings.data.id, true);
        xmlhttp.send();
        return p;
    }

    polymorph_core.on("userSave", (d) => {
        if (this.settings.save) {
            if (this.settings.data.throttle && this.settings.data.throttle != "") {
                if (!this.settings.tmpthrottle) {
                    this.settings.tmpthrottle = 0;
                }
                if (this.settings.tmpthrottle > Number(this.settings.data.throttle)) {
                    this.settings.tmpthrottle = 0;
                    this.pushAll(d);
                } else {
                    this.settings.tmpthrottle++;
                }
            } else {
                this.pushAll(d);
            }
            return true; //return true if we save
        } else {
            return false;
        }
    })

    this.dialog = document.createElement("div");
    polymorph_core.addToSaveDialog(this);
    let ops = [
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "id",
            label: "The ID of this document."
        }),
        new polymorph_core._option({
            div: this.dialog,
            type: "text",
            object: this.settings.data,
            property: "throttle",
            label: "Throttle (number of saves before sending)",
            placeholder: 0
        })
    ]
    this.showDialog = function() {
        ops.forEach(i => i.load());
    };
    //send a quick get to the lobby to check it exists
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = () => {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status != 200) {
                //something wrong rip
                this.dialog.innerHTML = "<h2>The lobby operator is not installed on the host system.</h2>";
            }
            //alert("yay there is a lobby lah");
        }
    };
    xmlhttp.open("GET", window.location.origin + "/lobby", true);
    xmlhttp.send();
}, {
    prettyName: "Save to local lobby",
    createable: true
})