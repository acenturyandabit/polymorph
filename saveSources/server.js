core.registerSaveSource("srv", function (core) { // a sample save source, implementing a number of functions.
    this.prettyName="Save to server";
    //initialise here
    this.pushAll = async function (id, data) {
        //push to the source (force save)
        let compressedData=core.datautils.IDCompress.compress(data);
        console.log(compressedData);
        if (typeof(id)=="string"){
            id={saveTo:id, loadFrom:id};
        }
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                //alert("Save success!");
            }
        };
        xmlhttp.open("POST", id.saveTo, true);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.send(JSON.stringify(compressedData));
    }
    this.pullAll = async function (id) {
        if (typeof(id)=="string"){
            id={saveTo:id, loadFrom:id};
        }
        let xmlhttp = new XMLHttpRequest();
        let p = new Promise((resolve,reject) => {
            xmlhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    try{
                        let obj = JSON.parse(this.responseText);
                        obj=core.datautils.decompress(obj);
                        console.log(obj);
                        resolve(obj);
                    }catch (e){
                        reject("data invalid :(");
                    }
                    
                } else if (this.readyState == 4) {
                    //failure; direct load or backup!
                    reject("server was unavailable :/");
                    //if (fail) fail();
                }
            };
            xmlhttp.onerror=function(){
                reject("An error occured...");
            }
        });
        xmlhttp.open("GET", id.loadFrom, true);
        xmlhttp.send();
        return p;
    }
    this.hook = async function (id) { 
        //hook to pull changes and push changes. 
        //To subscribe to live updates, you need to manually use core.on("updateItem",handler) to listen to item updates and core.on("updateView",handler) as well.
        //Otherwise, you can subscribe to the user save event, as per below, and set a flag to remind yourself to save
        this.toSave=true;
    }

    core.on("userSave",(d)=>{
        if (this.toSave){
            this.pushAll(core.userData.documents[core.currentDocID].saveSources['srv'],d);
            return true; //return true if we save
        }else{
            return false;
        }
    })

    // Please remove or comment out this function if you can't subscribe to live updates.
    this.unhook = async function (id) {
        //unhook previous hooks.
        this.toSave=false;
    }

    this.dialog = document.createElement("div");
    let addrop = new _option({
        div: this.dialog,
        type: "text",
        object: () => {
            return core.userData.documents[core.currentDocID].saveSources.srv
        },
        property: "saveTo",
        label: "Full server save address (include document name)"
    });
    let loop = new _option({
        div: this.dialog,
        type: "text",
        object: () => {
            return core.userData.documents[core.currentDocID].saveSources.srv
        },
        property: "loadFrom",
        label: "Full server load address (include document name)"
    });
    this.showDialog = function () {
        if (!core.userData.documents[core.currentDocID].saveSources.srv || typeof core.userData.documents[core.currentDocID].saveSources.srv!="object"){
            core.userData.documents[core.currentDocID].saveSources.srv={};
        }
        addrop.load();
        loop.load();
    }
})