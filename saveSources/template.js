core.registerSaveSource("template", function () { // a sample save source, implementing a number of functions.

    //initialise here

    


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
    this.hook = async function (id) { // just comment out if you can't subscribe to live updates.
        //hook to pull changes and push changes.
    }
    this.unhook = async function (id) { // just comment out if you can't subscribe to live updates.
        //unhook previous hooks.
    }
})