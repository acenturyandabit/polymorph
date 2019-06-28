core.registerSaveSource("lf",function(core){ // a sample save source, implementing a number of functions.
    this.createable=true;
    this.prettyName="Localforage (offline storage)";
    this.pushAll=async function(id,data){
        localforage.setItem("__polymorph_" + id,data);
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
    this.readyDialog=function(){
        this.dialog.querySelector(".svid").value=core.userData.documents[core.currentDocID].saveSources['lf'];
    }
})