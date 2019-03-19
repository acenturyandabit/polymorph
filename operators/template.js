core.registerOperator("template", {
    displayName: "Template",
    description: "A quickstart template. Very minimal."
}, function (container) {
    let me = this;
    me.container = container;//not strictly compulsory bc this is expected and automatically enforced - just dont touch it pls.
    this.settings = {};

    this.rootdiv = document.createElement("div");
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.rootdiv.innerHTML = ``;

    operator.div.appendChild(this.rootdiv);

    //////////////////Handle core item updates//////////////////

    //this is called when an item is updated (e.g. by another operator)
    core.on("updateItem", function (d) {
        let id = d.id;
        //do stuff with the item.
    });

    this.resize = function () {
        // This is called when my parent rect is resized.
    }

    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    this.fromSaveData = function (d) {
        //this is called when your operator is started OR your operator loads for the first time
        Object.assign(this.settings, d);
    }
});