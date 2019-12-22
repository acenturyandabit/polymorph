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

    this.createItem = (id) => {
        let itm = {};
        if (!id) {
            id = polymorph_core.insertItem(itm);
        }
        if (this.settings.filter) {
            polymorph_core.items[id][this.settings.filter] = true;
        }
        return id;
    }

    this.deleteItem = (id) => {
        delete polymorph_core.items[id][this.settings.filter];
        //container.fire("updateItem", { id: id });
        //container.fire("focusItem", { id: undefined });
    }

    this.itemRelevant=(id)=>{
        if (this.settings.filter==""){
            return true;//if filter doesnt exist it should be undefined
        }else{
            if (polymorph_core.items[id][this.settings.filter]){
                return true;
            }else{
                return false;
            }
        }
        return false;
    }
}
