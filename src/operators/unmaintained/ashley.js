polymorph_core.registerOperator("ashley", {
    displayName: "AI assistant",
    description: "An AI assistant."
}, function(container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        //filter: polymorph_core.guid() // used by the operator template to determine whether items are relevant to it.
    };

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `
    <div style="height:100%; display:flex; flex-direction:column;">
    <div style="flex-grow: 1">
    </div>
    <span style="flex: 0 0 1em; display:flex;flex-direction:row"><input style="flex-grow:1"></input><button>Send</button></span>
    </div>
    `;

    this.rootdiv.querySelector("input").addEventListener(() => {

    })

    container.on("createItem", (id) => {

    })

    container.on("deleteItem", (id) => {

    })

    //this is called when an item is updated (e.g. by another container)
    container.on("updateItem", (d) => {
        let id = d.id;
        if (this.itemRelevant(id)) {
            //render the item, if we care about it.
        }
        //do stuff with the item.
    });

    this.refresh = function() {
        // This is called when the parent container is resized.
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    this.showDialog = function() {
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function() {
        // This is called when your dialog is closed. Use it to update your container!
    }

});