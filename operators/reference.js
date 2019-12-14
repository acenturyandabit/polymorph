polymorph_core.registerOperator("template", {
    displayName: "Template",
    description: "A quickstart template. Very minimal."
}, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        somesetting: "somevalue"
    };

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here.
    this.rootdiv.innerHTML = ``;

    //return true if we care about an item and dont want it garbage-cleaned :(
    this.itemRelevant = (id) => { return polymorph_core.itemRelevant(this, id); }

    this.createItem = (id) => {
        //Use the inherited _createItem function to sort out instantiation and
        //coordination between operators.
        id=this._createItem(id);
        itm=polymorph_core.items[id];

        //add any data you need
        itm.a=b;
    }

    this.deleteItem = (id) => {
        //Use the inherited _createItem function to sort out instantiation and
        //coordination between operators.
        //If you're simply removing the filter property, then deleteItem will 
        //be sufficient.
        this._deleteItem(id);
        itm=polymorph_core.items[id];

        //remove just enough data so that you no longer care about the operator
        //garbage cleaner will do the rest
        delete itm.a;
    }

    //this is called when an item is updated (e.g. by another container)
    container.on("updateItem", (d) => {
        let id = d.id;
        if (this.itemRelevant(id)) {
            //render the item, if we care about it.
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