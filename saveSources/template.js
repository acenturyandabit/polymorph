polymorph_core.registerSaveSource("template", function () { // a sample save source, implementing a number of functions.

    //initialise here
    this.prettyName="NAME_TO_DISPLAY_IN_DIALOG"
    


    //optional function: given a set of urlparams, can you handle opening the file? If no, return false, do not implement, or delete.
    this.canHandle=function(params){
        //if you return true, be prepared to handle id as a set of urlparams instead.
        //at which point, please do what you need to do to initialise, then change it to a url of the format ?doc=""&src=savesourcename
    }

    //ID will be a string if the object is loaded; otherwise a custom object that you have set in the past
    //Set custom objects by using polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources['your_savesource_name'].

    this.pushAll = async function (id, data) {
        //push to the source (force save)
    }
    this.pullAll = async function (id) {
        return object_with_data; //or nothing, if undefined
    }

    this.hook = async function (id) { 
        //hook to pull changes and push changes. 
        //To subscribe to live updates, you need to manually use polymorph_core.on("updateItem",handler) to listen to item updates.
        //Otherwise, you can subscribe to the user save event, as per below, and set a flag to remind yourself to save
        this.toSave=true;
    }

    polymorph_core.on("userSave",(d)=>{
        if (this.toSave){
            this.pushAll(polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources['template'],d);
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

    window.addEventListener("beforeunload",()=>{
        
    })
})