core.registerOperator("layflat", {
    displayName: "Layflat",
    description: "An operator that facilitates organising data in a printable format."
}, function (container) {
    let me = this;
    me.container = container;//not strictly compulsory bc this is expected and automatically enforced - just dont touch it pls.
    this.settings = {
        filter: undefined,
        headingProperty: "title",
        textProperty: undefined,
    };

    this.rootdiv = document.createElement("div");
    this.rootdiv.contentEditable = true;
    //Add content-independent HTML here.

    container.div.appendChild(this.rootdiv);

    //////////////////Handle core item updates//////////////////

    //this is called when an item is updated (e.g. by another operator)
    core.on("updateItem", (d) => {
        let id = d.id;
        //do stuff with the item.
        //do i care about it?
        if ((!this.settings.filter) || core.items[id][this.settings.filter]) {
            //show it!
            this.displayItem(id);
            return true;
        }
        return false;
    });

    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    this.fromSaveData = function (d) {
        //this is called when your operator is started OR your operator loads for the first time
        Object.assign(this.settings, d);
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    this.showDialog = function () {
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // pull settings and update when your dialog is closed.
    }

});