polymorph_core.registerOperator("workflow", {
    displayName: "Workflowish",
    description: "Workflowy emulation."
}, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        titleProperty: "title",
        richtextProperty: "description",
        rootItems: [polymorph_core.insertItem({})]
    };

    //Can probably replace this with direct instantiation instead of a getter, if we're careful.
    Object.defineProperty(this, "existingItems", {
        get: () => {
            if (this._existingItemsCache) return this._existingItemsCache;
            else {
                this._existingItemsCache = Array.from(this.settings.rootItems);
                for (let i = 0; i < this._existingItemsCache.length; i++) {
                    if (polymorph_core.items[this._existingItemsCache[i]].to) this._existingItemsCache = this._existingItemsCache.concat(Object.keys(polymorph_core.items[this._existingItemsCache[i]].to));
                }
                return this._existingItemsCache;
            }
        }
    })
    this._parentOfCache = {};
    this.parentOf = (id) => {
        if (this._parentOfCache[id]) return this._parentOfCache[id];
        else {
            for (let i = 0; i < this.existingItems.length; i++) {
                if (polymorph_core.items[this.existingItems[i]].to && polymorph_core.items[this.existingItems[i]].to[id]) {
                    this._parentOfCache[id] = this.existingItems[i];
                    return this._parentOfCache[id];
                }
            }
            this._parentOfCache[id] = "";
            return this._parentOfCache[id];//undefined = root.
        }
    }

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `
    <style>
    span[data-id]{
        display:block;
        width:100%;
    }
    
    span[contenteditable]{
        display: inline-block;
        width: calc(100% - 10px);
        float: right; 
    }
    span[data-id]>div{
        padding-left: 10px;
    }
    </style>
    `;
    this.rootdiv.style.color = "white";

    //return true if we care about an item and dont want it garbage-cleaned :(
    this.itemRelevant = (id) => { return (this.existingItems.indexOf(id) != -1) }

    this.createItem = (id, data) => {
        itm = polymorph_core.items[id];

        //add any data you need
        let toDirectAdopt = true;
        for (let i = 0; i < this.existingItems.length; i++) {
            if (polymorph_core.items[i].to && polymorph_core.items[i].to[id]) {
                toDirectAdopt = false;
            }
        }
        if (toDirectAdopt) {
            this.settings.rootItems.push(id);
        }
        this._existingItemsCache.push(id);
    }

    let focusOnElement = function (el, index) {
        let range = document.createRange();
        let newP = el;
        range.setStart(newP.childNodes[0], index);
        range.collapse(true);
        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        newP.focus();
    }

    this.rootdiv.addEventListener("keydown", (e) => {
        if (e.target.matches(`span[data-id] span`)) {
            let id = e.target.parentElement.dataset.id;
            if (e.key == "Enter") {
                let newItem = {};
                newItem[this.settings.titleProperty] = "";
                let newID = polymorph_core.insertItem(newItem);
                if (e.shiftKey) {
                    polymorph_core.link(e.target.parentElement.dataset.id, newID);
                } else {
                    //     span     span          div        span or null
                    if (e.target.parentElement.parentElement.parentElement) {
                        polymorph_core.link(e.target.parentElement.parentElement.parentElement.dataset.id, newID);
                    } else {
                        this.settings.rootItems.push(newID);
                    }
                }
                this._existingItemsCache.push(newID);
                container.fire("createItem", { id: newID, sender: this });
                e.preventDefault();

                this.renderItem(newID);
                focusOnElement(this.rootdiv.querySelector(`span[data-id='${newID}']`).children[1]);

            } else if (e.key == "ArrowUp") {
                let toFocusOnSpan = e.target.parentElement.previousElementSibling;
                if (!toFocusOnSpan) {
                    toFocusOnSpan = e.target.parentElement.parentElement.parentElement;
                }
                focusOnElement(toFocusOnSpan.children[1]);
            }
        }
    })


    this.rootdiv.addEventListener("input", (e) => {
        if (e.target.matches(`span[data-id] span`)) {
            let id = e.target.parentElement.dataset.id;
            polymorph_core.items[e.target.parentElement.dataset.id][this.settings.titleProperty] = e.target.innerText;
            container.fire("updateItem", { id: id, sender: this });
        }
    });

    this.deleteItem = (id) => {
        //Find its parent and nerf it - if it doesnt have a parent, take it off the rootitems.
        container.fire("updateItem", { id: id });
    }

    //this is called when an item is updated (e.g. by another container)
    this.renderItem = (id) => {
        if (this.itemRelevant(id)) {
            //render the item, if we care about it.
            let span = this.rootdiv.querySelector(`span[data-id='${id}']`);
            if (!span) {
                span = htmlwrap(`
            <span data-id="${id}">
                <span>*</span>
                <span contenteditable></span>
                <div></div>
            </span>`);
            }
            span.children[1].innerText = polymorph_core.items[id][this.settings.titleProperty] || " ";
            if (this.parentOf(id)) this.rootdiv.querySelector(`span[data-id="${this.parentOf(id)}"]`).children[2].appendChild(span);
            else { this.rootdiv.appendChild(span); }
        }
    }
    container.on("updateItem", (d) => {
        if (d.sender == this) return;// Dont handle our own updates so that the user does not lose focus.
        let id = d.id;
        this.renderItem(id);
        //do stuff with the item.
    });

    this.settings.rootItems.forEach((i) => container.fire("updateItem", { id: i }));

    this.refresh = function () {
        // This is called when the parent container is resized.
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    let options = {
        oneTimeImport: new _option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "oneTimeImport",
            label: "Filter for one time import"
        }),
        implicitOrder: new _option({
            div: this.dialogDiv,
            type: "button",
            fn: () => {
                for (let i in polymorph_core.items) {
                    if (polymorph_core.items[i][this.settings.oneTimeImport]) {
                        //check if they are children of any of the existing items occurs on render.
                        this.settings.rootItems.push(i);
                        this.renderItem(i);
                    }
                }
            },
            label: "Import now"
        })
    }
    this.showDialog = function () {
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // This is called when your dialog is closed. Use it to update your container!
    }

});