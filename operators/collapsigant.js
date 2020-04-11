polymorph_core.registerOperator("collapsigant", {
    displayName: "Collapsigant",
    description: "A Collapsible Gantt Chart."
}, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        windowStart:Date.now(),
        scalingFactor:1000*60*60*24/50, // one day is 50 px
        zeroMS: 1000*60*60*24, // how long zero width is
        filter:guid(6)
    };

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here.
    // Add a new item button
    this.rootdiv.innerHTML = `
    <style>
        div[data-id]{
            position:relative;
        }
    </style>
    <div><span style="width:100%">+</span></div>`;
    
    //return true if we care about an item and dont want it garbage-cleaned :(
    
    container.on("createItem", (e) => {
        polymorph_core.items[e.id][this.settings.filter]=true;
    })

    container.on("deleteItem", (id) => {
        
    })
    this.careItemCache={};
    //this is called when an item is updated (e.g. by another container)
    container.on("updateItem", (d) => {
        let id = d.id;
        if (this.itemRelevant(id)) {
            this.careItemCache[id]=polymorph_core.items[id];
            let thisDiv=this.rootdiv.querySelector(`div[data-id="${id}"]`);
            if (!thisDiv){
                thisDiv=htmlwrap(`<div data-id="${id}"><span data-id="${id}">${polymorph_core.items[id].title}</span></div>`);
            }else{
                thisDiv.children[0].innerText=polymorph_core.items[id].title;
            }
            //if the item has a parent we know of, then insert it into the parent
            for (let i in this.careItemCache){
                //check to's of all items we care about
                if (this.careItemCache[i].to && this.careItemCache[i].to[id]){
                    //ditch bidirectional links
                    if (!(polymorph_core.items[id].to && polymorph_core.items[id].to[i])){
                        this.rootdiv.querySelector(`div[data-id="${i}"]`).appendChild(thisDiv);
                    }
                }    
            }
            //if this guy has children we know of, add them to his div
            if (polymorph_core.items[d.id].to){
                for (let i in polymorph_core.items[d.id].to){
                    if (this.rootdiv.querySelector(`div[data-id="${i}"]`)){
                        thisDiv.appendChild(this.rootdiv.querySelector(`div[data-id="${i}"]`));
                    }
                }
            }
            if (!thisDiv.parentElement){
                this.rootdiv.appendChild(thisDiv);
            }
            thisDiv.children[0].style.marginLeft=((polymorph_core.items[id].startTime || 0)/this.settings.scalingFactor)+"px";
            thisDiv.children[0].style.width=(((polymorph_core.items[id].duration || 0)+this.settings.zeroMS)/this.settings.scalingFactor)+"px";
        }
        //do stuff with the item.
    });

    this.refresh = function () {
        // This is called when the parent container is resized.
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    this.showDialog = function () {
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // This is called when your dialog is closed. Use it to update your container!
    }

});