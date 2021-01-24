polymorph_core.registerSaveSource("template", function(save_source_data) { // a sample save source, implementing a number of functions.
    polymorph_core.saveSourceTemplate.call(this, save_source_data); //future-safety measure. sets this.settings to save_source_data.
    //initialise here
    // Set pretty name and creatability at end of file.


    //for the actual display:
    this.dialog = document.createElement("div");
    this.dialog.innerHTML = `whatever`;
    polymorph_core.addToSaveDialog(this);
    this.showDialog = () => {
        //do something
    }


    //optional function: given a set of urlparams, can you handle opening the file? If no, return false, do not implement, or delete.
    this.canHandle = function(params) {
        //if you return true, be prepared to handle id as a set of urlparams instead.
        //at which point, please do what you need to do to initialise, then return {id: name_of_doc, source:data_you_need_to_load}
    }

    //ID will be a string if the object is loaded; otherwise a custom object that you have set in the past
    //Set custom objects by using polymorph_core.userData.documents[polymorph_core.currentDocID].saveSources['your_savesource_name'].

    this.pushAll = async function(data) {
        //push to the source (force save)
    }
    this.pullAll = async function() {
        return object_with_data; //or nothing, if undefined
    }

    this.hook = async function() {
        //hook to pull changes and push changes. 
        //To subscribe to live updates, you need to manually use polymorph_core.on("updateItem",handler) to listen to item updates.
        //Otherwise, you can subscribe to the user save event, as per below, and set a flag to remind yourself to save
        this.toSave = true;
    }


    // Please remove or comment out this function if you can't subscribe to live updates.
    this.unhook = async function(id) {
        //unhook previous hooks.
        this.toSave = false;
    }

    polymorph_core.on("userSave", (d) => {
        if (this.toSave) {
            this.pushAll(d);
            return true; //return true if we save
        } else {
            return false;
        }
    })

    window.addEventListener("beforeunload", () => {

    })
}, {
    prettyName: "Save to server",
    createable: true
})