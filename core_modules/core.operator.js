polymorph_core.operatorTemplate = function (container, defaultSettings) {
    this.container = container;
    Object.defineProperty(this, "settings", {
        get: () => {
            return container.settings.data;
        }
    });
    //facilitate creation of this.settings if it doesnt exist.
    Object.assign(defaultSettings, this.settings);
    this.settings = {};
    Object.assign(this.settings, defaultSettings);
    this.rootdiv = document.createElement("div");
    container.div.appendChild(this.rootdiv);

    this._createItem = (id) => {
        let itm = {};
        if (!id) {
            id = polymorph_core.insertItem(itm);
            container.fire("createItem", { id: id });
        }
        if (this.settings.filter) {
            polymorph_core.items[id][this.settings.filter] = true;
        }
        return id;
    }

    this._deleteItem = (id) => {
        delete polymorph_core.items[id][this.settings.filter];
        container.fire("deleteItem", { id: id });
        //container.fire("updateItem", { id: id });
        //container.fire("focusItem", { id: undefined });
    }
}