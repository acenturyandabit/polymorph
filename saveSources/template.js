core.registerSaveSource("template", function () { // a sample save source, implementing a number of functions.

    //initialise here
    this.prettyName="NAME_TO_DISPLAY_IN_DIALOG"
    


    //optional function: given a set of urlparams, can you handle opening the file? If no, return false, do not implement, or delete.
    this.canHandle=function(params){
        //if you return true, be prepared to handle id as a set of urlparams instead.
        //at which point, please do what you need to do to initialise, then change it to a url of the format ?doc=""&src=savesourcename
    }
    this.pushAll = async function (id, data) {
        //push to the source (force save)
    }
    this.pullAll = async function (id) {
        return object_with_data; //or nothing, if undefined
    }

    // Please remove or comment out this function if you can't subscribe to live updates.
    this.hook = async function (id) { 
        //hook to pull changes and push changes. You need to manually use core.on("updateItem",handler) to listen to item updates and core.on("updateView",handler) as well.
    }
    // Please remove or comment out this function if you can't subscribe to live updates.
    this.unhook = async function (id) {
        //unhook previous hooks.
    }
})