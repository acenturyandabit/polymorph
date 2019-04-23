core.registerSaveSource("template", function () { // a sample save source, implementing a number of functions.

    //initialise here




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