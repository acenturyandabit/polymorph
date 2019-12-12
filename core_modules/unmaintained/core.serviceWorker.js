function startApplyServiceWorker(polymorph_core){
    let swint=new _serviceWorkerMessageInterface();
    swint.on("message", (e)=>{
        if (e.data.docID==polymorph_core.docName){
            polymorph_core.fire(e.data.messageType,e.data.data);
        }
    })
    polymorph_core.on("*",(et,dt)=>{
        //make the sender polymorph_core
        dt.sender=polymorph_core;
        swint.fire("broadcast",{docID: polymorph_core.docID, messageType:et,data:dt});
    })
}