function startApplyServiceWorker(core){
    let swint=new _serviceWorkerMessageInterface();
    swint.on("message", (e)=>{
        if (e.data.docID==core.docName){
            core.fire(e.data.messageType,e.data.data);
        }
    })
    core.on("*",(et,dt)=>{
        //make the sender core
        dt.sender=core;
        swint.fire("broadcast",{docID: core.docID, messageType:et,data:dt});
    })
}