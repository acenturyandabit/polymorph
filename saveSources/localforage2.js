core.registerSaveSource("lf",function(core){ // a sample save source, implementing a number of functions.
    this.id="";
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
    <input placeholder="Save ID">
    <button class="snow">Save now</button>
    <button class="lfs">Load from source</button>
    </span>
    `;
    this.dialog.querySelector(".snow").addEventListener("click",()=>{
        this.pushAll(this.id,core.toSaveData());
        core.filescreen.saveRecentDocument(core.docName, undefined, core.currentDoc.displayName);
    })
    this.dialog.querySelector(".lfs").addEventListener("click",()=>{
        core.userLoad("lf",this.id);
    })
})