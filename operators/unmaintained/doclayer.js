polymorph_core.registerOperator("doclayer", {
    displayName: "DocLayer",
    description: "Create documents from your items."
}, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        defaultProperty: "title",
        elements: []
    };

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    this.renderItem = (obj) => {//obj comes from the array
        let currentDiv = this.rootdiv.querySelector(`[data-id='${obj.uoid}']`);
        if (!currentDiv) currentDiv = htmlwrap(`
        <div data-id="${obj.id}">`);
        return htmlwrap(`
        <div data-id="${obj.id}">
            <p data-property="${this.settings.defaultProperty}">${polymorph_core.items[obj.id][this.settings.defaultProperty]}</p>
        </div>`)
    }

    this.renderArray = () => {
        //render this.settings.elements
    }

    this.itemRelevant = (id) => {
        let IDs = this.settings.elements.map(i => i.id);
        return (IDs.indexOf(id) != -1)
    }
    //Add content-independent HTML here.
    let bigPlus = htmlwrap(`<div style="text-align:center">
    <p>
    <label>ID:
        <select>
        </select>
    </label>
    <label>Property:
        <select>
        </select>
    </label>
    </p>
    <p><button>+</button></p>
    </div>`);
    this.rootdiv.appendChild(bigPlus);
    bigPlus.querySelector("button").addEventListener("click", () => {
        //add an entry in the array
        //refresh the entry
    });

    //return true if we care about an item and dont want it garbage-cleaned :(

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