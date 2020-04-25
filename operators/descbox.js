polymorph_core.registerOperator("descbox", {
    description: "A simple text entry field.",
    single_store: true // does it only store one thing? If so, drag and drop will not delete from containers storing multiple things.
}, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        property: "description",
        operationMode: "focus",
        staticItem: "",
        auxProperty: "title",
        showTags: false
    };

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add div HTML here
    this.rootdiv.innerHTML = `<p class="auxProp" style="margin: 1px;"></p><p class="parsedTags" style="margin: 1px;"></p><p style="margin: 1px;"></p><textarea style="width:100%; flex: 1 0 auto; resize:none;"></textarea>`;
    this.rootdiv.style.cssText = "height:100%; display:flex; flex-direction: column;"
    this.textarea = this.rootdiv.querySelector("textarea");
    this.currentIDNode = this.rootdiv.querySelector(".auxProp");
    this.parsedTagsNode = this.rootdiv.querySelector(".parsedTags");

    container.div.appendChild(this.rootdiv);

    let parseTags = (id) => {
        let text = polymorph_core.items[id][this.settings.property];
        let regexes = [/@(tag)=([\w_]+)/g, /@(from)=([\w_]+)/g, /@(to)=([\w_])+/g];
        //undo older tags
        if (polymorph_core.items[id]["_tags_" + this.settings.property] && polymorph_core.items[id]["_tags_" + this.settings.property]['tag']) {
            polymorph_core.items[id]["_tags_" + this.settings.property]['tag'].forEach(i => {
                delete polymorph_core.items[id]["_tag_" + i];
            })

        }
        let tagObj = polymorph_core.items[id]["_tags_" + this.settings.property] = {
        };

        polymorph_core.items[id]["_displayTags_" + this.settings.property] = "";

        regexes.forEach((i) => {
            while (matches = i.exec(text)) {
                if (!tagObj[matches[1]]) tagObj[matches[1]] = [];
                tagObj[matches[1]].push(matches[2]);
                switch (matches[1]) {
                    case "tag":
                        if (!polymorph_core.items["_tag_" + matches[2]]) polymorph_core.items["_tag_" + matches[2]] = {};
                        polymorph_core.items["_tag_" + matches[2]][id] = true;
                        polymorph_core.items[id]["_tag_" + matches[2]] = true;
                        break;
                    case "from":
                        if (!polymorph_core.items[matches[2]].to) {
                            polymorph_core.items[matches[2]].to = {};
                        }
                        polymorph_core.items[matches[2]].to[id] = true;
                        break;
                    case "to":
                        if (!polymorph_core.items[id].to) polymorph_core.items[id].to = {};
                        polymorph_core.items[id].to[matches[2]] = true;
                        break;
                }
                polymorph_core.items[id]["_displayTags_" + this.settings.property] += matches[0] + "  ";
            }
        });
    }

    this.updateMeta = (id) => {
        if (id) {
            if (this.settings.auxProperty == "id") {
                this.currentIDNode.innerText = id;
            } else {
                this.currentIDNode.innerText = polymorph_core.items[id][this.settings.auxProperty];
            }
            if (this.settings.showTags) {
                parseTags(id);
                this.parsedTagsNode.innerHTML = polymorph_core.items[id]["_displayTags_" + this.settings.property];
                this.parsedTagsNode.style.display = "block";
            } else {
                this.parsedTagsNode.style.display = "none";
            }
        }
    }

    //Handle item updates
    this.updateItem = (id) => {
        this.updateMeta(id);

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
            this.updateMeta(id);
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
    this.somethingwaschanged = (e) => {
        //Check ctrl-S so that we dont save then
        if (e.key == "Control" || e.key == "Meta" || ((e.ctrlKey || e.metaKey) && e.key == "s")) return;
        if (this.settings.operationMode != "putter") {
            upc.submit(this.settings.currentID, this.textarea.value);
        }
    }

    this.textarea.addEventListener("blur", () => { upc.forceSend() });

    this.textarea.addEventListener("input", this.somethingwaschanged);
    this.textarea.addEventListener("keyup", this.somethingwaschanged);
    document.addEventListener('keydown', (e) => {
        if (this.textarea.matches(":focus-within")) {
            var keycode1 = (e.keyCode ? e.keyCode : e.which);
            if (keycode1 == 0 || keycode1 == 9) {
                e.preventDefault();
                e.stopPropagation();
                document.execCommand('insertText', false /*no UI*/, "    ");
            }
        }
    })
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
        operationMode: new polymorph_core._option({
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
        staticItem: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "staticItem",
            label: "Static item to display:"
        }),
        property: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "property",
            label: "Property of item to display:"
        }),
        property: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "auxProperty",
            label: "Auxillary property to display:"
        }),
        showWordCount: new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "showWordCount",
            label: "Show wordcount?"
        }),
        showTags: new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "showTags",
            label: "Show and parse tags?"
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
            switchTo(id);
        }
    });

    //static items get deleted without this mod
    this.itemRelevant = (id) => {
        if (this.settings.operationMode == "static" && id == this.settings.staticItem) return true;
    }

    container.on("createItem", (d) => {
        if (d.sender == "dragdrop") {
            container._fire("focusItem", d);
        }
    })
});