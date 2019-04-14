core.registerSaveSource("server",function server(){
    // add entry points for save source
    // functions

    this.settings={};

    this.setSettings=function(settings){
        settings.documentID;
        settings.userID;
    }

    //saveAll
    this.saveTo=function(data){

    }
    //loadAll
    this.loadFrom=function(){
        //return an object.
    }

    //pushUpdate (for real timers)
    //directly called as core.on("update",pushUpdate);
    this.pushUpdate=function(event){
        
    }

    //enableUpdateSource
    this.enableUpdateSource=function(){
        
    }
    //can call core.fire("updateItem"); for loading

    //disableUpdateSource
    this.disableUpdateSource=function(){
        
    }
    //showDialog
    this.showDialog=function(div){

    }

    //toSaveData (to be saved with settings)
    this.toSaveData=function(){
        return JSON.parse(JSON.stringify(this.settings));
    }
})

function serverSave(core) {
    core.loadFromServer = function (url) {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                let obj = JSON.parse(this.responseText);
                core.directLoadFromSaveData(obj);
                //hide the load window in case it's open
                if (core.loadDialog) core.loadDialog.style.display = "none";
            } else if (this.readyState == 4) {
                //failure; direct load or backup!
                if (fail) fail();
            }
        };
        xmlhttp.open("GET", url + "/latest/" + core.docNacore, true);
        xmlhttp.send();
    };
    core.saveToServer = function (url) {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                alert("Save success!");
            }
        };
        xmlhttp.open("POST", url + "/" + core.docNacore + "-" + Date.now(), true);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.send(JSON.stringify(this.toSaveData()));
    };
}