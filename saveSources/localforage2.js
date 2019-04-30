core.registerSaveSource("lf",function(core){ // a sample save source, implementing a number of functions.
    this.id="";
    this.pushAll=async function(id,data){
        localforage.setItem("__polymorph_" + id,data);
    }
    this.pullAll=async function(id){
        let d = await localforage.getItem("__polymorph_" + id);
        return d;
    }
    
    this.hook=async function(id){ // just comment out if you can't subscribe to live updates.
        this.id=id;
        this.dialog.enabled=true;
        this.dialog.querySelector('input').value=id||"";
        return true;
    }
    this.unhook=async function(id){ // just comment out if you can't subscribe to live updates.
        //unhook previous hooks.
        if (success){
            return true;
        }else{
            return false;
        }
    }

    this.dialog=document.createElement("div");
    this.dialog.innerHTML=`
    <h2>Localforage (offline storage)</h2>
    <span>
    <input>Save id</input>
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