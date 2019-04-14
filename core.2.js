// Items are just native objects now 
function _core(){
    let me=this;
    //Event API. pretty important, it turns out.
    addEventAPI(this);
    //call the dialog manager
    dialogSystemManager(this);
    dataSources=[];
    //Accept loading sources; default is local saving.

    function load(source){
        //reset
        reset();

        //load from loadsource
        allData=dataSources[source].allData();
        this.fromSaveData(allData);
    }

    function save(source){
        //reset
        reset();

        //load from loadsource
        allData=loadSources[source].allData();
        this.fromSaveData(allData);
    }

}


// save source example:
// cases:
// user save
// autosave
// remote update