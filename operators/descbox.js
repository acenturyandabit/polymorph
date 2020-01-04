polymorph_core.registerOperator("descbox", { description: "A simple text entry field." }, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        property: "description",
        operationMode: "focus",
        staticItem: ""
    };

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add div HTML here
    this.rootdiv.innerHTML = `<p style="margin: 1px;"></p><textarea style="width:100%; flex: 1 0 auto; resize:none;"></textarea>`;
    this.rootdiv.style.cssText = "height:100%; display:flex; flex-direction: column;"
    this.textarea = this.rootdiv.querySelector("textarea");
    this.currentIDNode = this.rootdiv.querySelector("p");

    container.div.appendChild(this.rootdiv);

    //Handle item updates
    this.updateItem = (id) => {
        this.currentIDNode.innerText = id;
        //if focused, ignore
        if (this.settings.operationMode != "putter") {
            if (id == this.settings.currentID && id && polymorph_core.items[id]) {
                if (this.textarea.matches(":focus")) {
                    setTimeout(() => this.updateItem(id), 500);
                } else {
                    if (this.changed) {
                        //someone else just called this so i'll have to save my modifications discreetly.
                        polymorph_core.items[id][this.settings.property] = this.textarea.value;
                    } else {
                        if (polymorph_core.items[id] && polymorph_core.items[id][this.settings.property]) this.textarea.value = polymorph_core.items[id][this.settings.property];
                        else this.textarea.value = "";
                    }
                    this.textarea.disabled = false;
                    if (polymorph_core.items[id].style) {
                        this.textarea.style.background = polymorph_core.items[id].style.background;
                        this.textarea.style.color = polymorph_core.items[id].style.color || matchContrast((/rgba?\([\d,\s]+\)/.exec(getComputedStyle(this.textarea).background) || ['#ffffff'])[0]); //stuff error handling; 
                    } else {
                        this.textarea.style.background = "";
                        this.textarea.style.color = "";
                    }
                }
            } else {
                if (!this.settings.currentID) {
                    this.textarea.disabled = true;
                    this.textarea.value = "Select an item to view its description.";
                }
            }
        } else {
            this.textarea.disabled = false;
        }
    }

    container.on("updateItem", (d) => {
        let id = d.id;
        let sender = d.sender;
        if (sender == this) return;
        if (id == this.settings.currentID) {
            this.updateItem(id);
            return true;
        }
    });

    //First time load

    this.updateItem(this.settings.currentID);

    this.updateSettings = () => {
        if (this.settings.operationMode == 'static') {
            if (!this.settings.staticItem) this.settings.staticItem = polymorph_core.insertItem({});
            let staticItem = this.settings.staticItem;
            this.settings.currentID = this.settings.staticItem;
            if (!polymorph_core.items[staticItem]) {
                let it = {};
                it[this.settings.property] = "";
                polymorph_core.items[staticItem] = it;
                container.fire("updateItem", {
                    sender: this,
                    id: staticItem
                });
            }
        } else if (this.settings.operationMode == 'putter') {
            if (this.settings.focusOperatorID) this.focusOperatorID = this.settings.focusOperatorID;
            this.textarea.value = "";
            this.textarea.disabled = false;
        }
        this.textarea.placeholder = this.settings.placeholder || "";
        this.updateItem(this.settings.currentID);
    }

    this.updateSettings();
    this.updateItem(this.settings.currentID);

    let upc = new capacitor(100, 40, (id, data) => {
        if (id && polymorph_core.items[id] && this.changed) {
            polymorph_core.items[id][this.settings.property] = data;
            container.fire("updateItem", {
                id: id,
                sender: this
            });
            this.changed = false;
        }
    }, {
        presubmit: () => {
            this.changed = true;
        }
    })
    //Register changes with polymorph_core
    this.somethingwaschanged = () => {
        if (this.settings.operationMode != "putter") {
            upc.submit(this.settings.currentID, this.textarea.value);
        }
    }

    this.textarea.addEventListener("blur", () => { upc.forceSend() });

    this.textarea.addEventListener("input", this.somethingwaschanged);
    this.textarea.addEventListener("keyup", this.somethingwaschanged);

    this.createItem = (id, data) => {
        polymorph_core.items[id][this.settings.property] = data;
    }

    this.textarea.addEventListener("keydown", (e) => {
        if (e.key == "Enter" && this.settings.operationMode == "putter") {
            this.createItem(undefined, this.textarea.value);
            this.textarea.value = "";
            e.preventDefault();
        }
    });


    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    let options = {
        operationMode: new _option({
            div: this.dialogDiv,
            type: "select",
            object: this.settings,
            property: "operationMode",
            source: {
                static: "Display static item",
                focus: "Display focused item",
                putter: "Use as data entry"
            },
            label: "Select operation mode:"
        }),
        staticItem: new _option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "staticItem",
            label: "Static item to display:"
        }),
        property: new _option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "property",
            label: "Property of item to display:"
        }),
        placeholder: new _option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "property",
            label: "Property of item to display:"
        }),
        showWordCount: new _option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "showWordCount",
            label: "Show wordcount?"
        })
    };
    this.showDialog = () => {
        // update your dialog elements with your settings
        //fill out some details
        for (i in options) {
            options[i].load();
        }
    }
    this.dialogUpdateSettings = this.updateSettings;
    this.dialogDiv.addEventListener("input", (e) => {
        if (e.target.dataset.role) {
            this.settings[e.target.dataset.role] = e.target.value;
        }
    })

    //polymorph_core will call this when an object is focused on from somewhere
    container.on("focusItem", (d) => {
        let id = d.id;
        let sender = d.sender;
        let switchTo = (id) => {
            upc.forceSend();
            this.settings.currentID = id;
            this.updateItem(id);
            container.fire("updateItem", { id: this.container.id });
        }
        if (this.settings.operationMode == "focus") {
            if (this.settings['focusOperatorID']) {
                if (this.settings['focusOperatorID'] == sender.container.uuid) {
                    switchTo(id);
                }
            } else {
                if (sender) {
                    //calculate the base rect of the sender
                    let baserectSender = sender.container.rect;
                    while (baserectSender.parent) baserectSender = baserectSender.parent;
                    //calculate my base rect
                    let myBaseRect = this.container.rect;
                    while (myBaseRect.parent) myBaseRect = myBaseRect.parent;
                    //if they're the same, then update.
                    if (myBaseRect == baserectSender) {
                        switchTo(id);
                    }
                }
            }
        } else if (this.settings.operationMode == "putter") {
        }
    });
});