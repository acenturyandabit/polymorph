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
    this.dialogDiv.innerHTML = `
    <p>Role</p>
    <select data-role="operationMode">
    <option value="static">Display static item</option>
    <option value="focus">Display focused item</option>
    <option value="putter">Use as data entry</option>
    </select>
    <br/>
    <input data-role="staticItem" placeholder="Static item to display...">
    <br>
    <p> Or, click to target 'focus' events from an container...
    <input data-role="focusOperatorID" placeholder="container UID (use the button)">
    <button class="targeter">Select container</button>
    </br>
    <input data-role="property" placeholder="Enter the property to display...">
    <input data-role="placeholder" placeholder="Enter a placeholder...">
    `;

    let options = {
        showWordCount: new _option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "showWordCount",
            label: "Show wordcount?"
        })
    };
    let targeter = this.dialogDiv.querySelector("button.targeter");
    targeter.addEventListener("click", () => {
        polymorph_core.target().then((id) => {
            this.dialogDiv.querySelector("[data-role='focusOperatorID']").value = id;
            this.settings['focusOperatorID'] = id
        })
    })
    this.showDialog = () => {
        // update your dialog elements with your settings
        //fill out some details
        for (i in options) {
            options[i].load();
        }
        for (i in this.settings) {
            let it = this.dialogDiv.querySelector("[data-role='" + i + "']");
            if (it) it.value = this.settings[i];
        }
    }
    this.dialogUpdateSettings = () => {
        // pull settings and update when your dialog is closed.
        let its = this.dialogDiv.querySelectorAll("[data-role]");
        for (let i = 0; i < its.length; i++) {
            this.settings[its[i].dataset.role] = its[i].value;
        }
        this.textarea.placeholder = this.settings.placeholder || "";
        this.updateSettings();
        container.fire("updateItem", { id: this.container.id });
    }
    this.dialogDiv.addEventListener("input", (e) => {
        if (e.target.dataset.role) {
            this.settings[e.target.dataset.role] = e.target.value;
        }
    })

    //polymorph_core will call this when an object is focused on from somewhere
    container.on("focus", (d) => {
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