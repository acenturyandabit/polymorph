polymorph_core.operatorTemplate = function(container, defaultSettings) {
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
    this.rootStyle = document.createElement("style");
    container.div.appendChild(this.rootStyle);
    setTimeout(() => polymorph_core.updateCSS());
    this.rootdiv.style.height = "100%";
    this.rootdiv.style.overflow = "auto";
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

    this.itemRelevant = (id) => {
        if (this.settings.filter == "") {
            return true; //if filter doesnt exist it should be undefined
        } else {
            if (polymorph_core.items[id][this.settings.filter] != undefined) {
                return true;
            } else {
                return false;
            }
        }
    }

    this.intervalsToClear = [];
    this.remove = () => {
        if (this.intervalsToClear) this.intervalsToClear.forEach(i => clearInterval(i));
    }
};

// make sure that new operators are properly instantiated
(() => {
    let callInProgress = false;
    polymorph_core.on("updateItem", (d) => {
        if (callInProgress) return;
        callInProgress = true;
        let itm = polymorph_core.items[d.id];
        if (itm._od && !polymorph_core.containers[d.id]) {
            polymorph_core.containers[d.id] = new polymorph_core.container(d.id);
            polymorph_core.containers[d.id].refresh();
        }
        if (itm._od && polymorph_core.containers[d.id].operator && polymorph_core.containers[d.id].operator.constructor != polymorph_core.operators[polymorph_core.containers[d.id].settings.t].constructor) {
            //cleanup and reinstantiate
            let container = polymorph_core.containers[d.id];
            while (container.div.children.length) container.div.children[0].remove();
            container.operator = new polymorph_core.operators[polymorph_core.containers[d.id].settings.t].constructor(container);

            polymorph_core.rects[container.settings.p].tieContainer(container.id);
            polymorph_core.rects[container.settings.p].refresh(); // kick it so the container actually loads its operator
        }
        callInProgress = false;
    })
})();