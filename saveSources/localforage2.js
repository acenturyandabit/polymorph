core.registerSaveSource("lf",function(){ // a sample save source, implementing a number of functions.
    this.pushAll=async function(id,data){
        localforage.setItem("__polymorph_" + id,data);
    }
    this.pullAll=async function(id){
        let d = await localforage.getItem("__polymorph_" + id);
        return d;
    }
    this.newDoc=async function(id){
        if (success){
            return id;
        }else{
            return;
        }
    }
    this.wipeDoc=async function(id){
        if (success){
            return id;
        }else{
            return;
        }
    }
    this.hook=async function(id){ // just comment out if you can't subscribe to live updates.
        //hook to pull changes and push changes.
        if (success){
            return true;
        }else{
            return false;
        }
    }
    this.unhook=async function(id){ // just comment out if you can't subscribe to live updates.
        //unhook previous hooks.
        if (success){
            return true;
        }else{
            return false;
        }
    }
})