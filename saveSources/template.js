core.registerSaveSource("template",function(){ // a sample save source, implementing a number of functions.

    //initialise here




    this.pushAll=async function(id,data){
        //push to the source (force save)
        if (success){
            return true;
        }else{
            return false;
        }
    }
    this.pullAll=async function(id){
        if (success){
            return object_with_data;
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