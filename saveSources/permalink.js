polymorph_core.registerSaveSource("permalink", function (save_source_data) { // a sample save source, implementing a number of functions.
    polymorph_core.saveSourceTemplate.call(this, save_source_data);
    //initialise here
    this.prettyName="Permalink";
    this.createable = false;
    //id, source
    



    this.pullAll = async function () {
        let d = save_source_data.data;
        return d;
    }

}, {
    canHandle: async(params)=>{
        return new Promise((res,rej)=>{
            if (params.has("pml")){
                var xmlhttp = new XMLHttpRequest();
                let url=atob(params.get("pml"));
                xmlhttp.open('GET', url, true);
                xmlhttp.onreadystatechange = function() {
                    if (xmlhttp.readyState == 4) {
                        if(xmlhttp.status == 200) {
                            try{
                                var obj = JSON.parse(xmlhttp.responseText);
                                let tempID = polymorph_core.guid(6,polymorph_core.userData.documents);
                                obj._meta.id=tempID;
                                res({id: tempID, source:obj});
                            }catch (e){
                                res(false);
                            }
                        }else{
                            res(false);
                        }
                    }
                };
                xmlhttp.send(null);
            }else{
                res(false);
            }
        })
    }
})