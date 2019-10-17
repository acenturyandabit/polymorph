core.registerSaveSource("lf",function(core){ // a sample save source, implementing a number of functions.
    this.createable=true;
    this.prettyName="Localforage (offline storage)";
    this.pushAll=async function(id,data){
        localforage.setItem("__polymorph_" + id,data).then(()=>{
            core.savedOK=true; /// SUPER HACKY PLS FORMALISE
        });
    }
    this.pullAll=async function(data){
        let d = await localforage.getItem("__polymorph_" + data);
        return d;
    }

    this.dialog=document.createElement("div");
    this.dialog.innerHTML=`
    <span>
    <input class="svid" placeholder="Save ID">
    </span>
    `;
    this.showDialog=function(){
        this.dialog.querySelector(".svid").value=core.userData.documents[core.currentDocID].saveSources['lf'];
    }
    this.hook = async function (id) { 
        //hook to pull changes and push changes. 
        //To subscribe to live updates, you need to manually use core.on("updateItem",handler) to listen to item updates and core.on("updateView",handler) as well.
        //Otherwise, you can subscribe to the user save event, as per below, and set a flag to remind yourself to save
        this.toSave=true;
    }

    core.on("userSave",(d)=>{
        if (this.toSave){
            core.savedOK=false;
            this.pushAll(core.currentDocID,d);
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
})