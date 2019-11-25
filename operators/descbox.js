core.registerOperator("descbox", function (container) {
    let me = this;
    me.container = container;
    me.settings = {
        property: "description",
        operationMode: "focus",
        staticItem: ""
    };

    me.rootdiv = document.createElement("div");
    //Add div HTML here
    me.rootdiv.innerHTML = `<p></p><textarea></textarea>`;
    me.rootdiv.style.cssText="height:100%; display:flex; flex-direction: column;"
    me.textarea = me.rootdiv.querySelector("textarea");
    me.textarea.style.width = "100%";
    me.textarea.style.flex = "1 0 auto";
    me.textarea.style.resize = "none";
    me.currentIDNode = me.rootdiv.querySelector("p");

    container.div.appendChild(me.rootdiv);

    //Handle item updates
    me.updateItem = (id) => {
        me.currentIDNode.innerText = id;
        //if focused, ignore
        if (me.settings.operationMode != "putter") {
            if (id == me.settings.currentID && id && core.items[id]) {
                if (me.textarea.matches(":focus")) {
                    setTimeout(() => me.updateItem(id), 500);
                } else {
                    if (this.changed) {
                        //someone else just called this so i'll have to save my modifications discreetly.
                        core.items[id][me.settings.property] = me.textarea.value;
                    } else {
                        if (core.items[id] && core.items[id][me.settings.property]) me.textarea.value = core.items[id][me.settings.property];
                        else me.textarea.value = "";
                    }
                    me.textarea.disabled = false;
                    if (core.items[id].style) {
                        me.textarea.style.background = core.items[id].style.background;
                        me.textarea.style.color = core.items[id].style.color || matchContrast((/rgba?\([\d,\s]+\)/.exec(getComputedStyle(me.textarea).background) || ['#ffffff'])[0]); //stuff error handling; 
                    } else {
                        me.textarea.style.background = "";
                        me.textarea.style.color = "";
                    }
                }
            } else {
                if (!me.settings.currentID) {
                    me.textarea.disabled = true;
                    me.textarea.value = "Select an item to view its description.";
                }
            }
        } else {
            me.textarea.disabled = false;
        }
    }

    container.on("updateItem", function (d) {
        let id = d.id;
        let sender = d.sender;
        if (sender == me) return;
        if (id == me.settings.currentID) {
            me.updateItem(id);
            return true;
        }
    });

    //First time load

    me.updateItem(me.settings.currentID);

    me.updateSettings = function () {
        if (me.settings.operationMode == 'static') {
            let staticItem = me.settings.staticItem;
            me.settings.currentID = me.settings.staticItem;
            if (!core.items[staticItem]) {
                let it = {};
                it[me.settings.property] = "";
                core.items[staticItem] = it;
                container.fire("updateItem", {
                    sender: this,
                    id: staticItem
                });
            }
        } else if (me.settings.operationMode == 'putter') {
            if (me.settings.focusOperatorID) me.focusOperatorID = me.settings.focusOperatorID;
            me.textarea.value = "";
            me.textarea.disabled = false;
        }
        me.updateItem(me.settings.currentID);
    }

    //Saving and loading
    me.toSaveData = function () {
        return me.settings;
    }

    me.fromSaveData = function (d) {
        Object.assign(me.settings, d);
        me.updateSettings();
        //then rehash the display or sth
        me.updateItem(me.settings.currentID);
    }

    let upc = new capacitor(100, 40, (id, data) => {
        if (id && core.items[id] && this.changed) {
            core.items[id][me.settings.property] = data;
            container.fire("updateItem", {
                id: id,
                sender: me
            });
            this.changed = false;
        }
    }, {
        presubmit: () => {
            this.changed = true;
        }
    })
    //Register changes with core
    me.somethingwaschanged = function () {
        if (me.settings.operationMode != "putter") {
            upc.submit(me.settings.currentID, me.textarea.value);
        }
    }

    me.textarea.addEventListener("blur", () => { upc.forceSend() });

    me.textarea.addEventListener("input", me.somethingwaschanged);
    me.textarea.addEventListener("keyup", me.somethingwaschanged);

    me.textarea.addEventListener("keydown", (e) => {
        if (e.key == "Enter" && this.settings.operationMode == "putter") {
            let container = core.getOperator(me.focusOperatorID);
            if (container && container.container.quickAdd) {
                container.container.quickAdd(me.textarea.value);
                me.textarea.value = "";
                e.preventDefault();
            }
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
            object: me.settings,
            property: "showWordCount",
            label: "Show wordcount?"
        })
    };
    let targeter = this.dialogDiv.querySelector("button.targeter");
    targeter.addEventListener("click", function () {
        core.target().then((id) => {
            me.dialogDiv.querySelector("[data-role='focusOperatorID']").value = id;
            me.settings['focusOperatorID'] = id
            me.focusOperatorID = me.settings['focusOperatorID'];
        })
    })
    this.showDialog = function () {
        // update your dialog elements with your settings
        //fill out some details
        for (i in options) {
            options[i].load();
        }
        for (i in me.settings) {
            let it = me.dialogDiv.querySelector("[data-role='" + i + "']");
            if (it) it.value = me.settings[i];
        }
    }
    this.dialogUpdateSettings = function () {
        // pull settings and update when your dialog is closed.
        let its = me.dialogDiv.querySelectorAll("[data-role]");
        for (let i = 0; i < its.length; i++) {
            me.settings[its[i].dataset.role] = its[i].value;
        }
        me.textarea.placeholder = me.settings.placeholder || "";
        me.updateSettings();
        container.fire("updateView");
    }
    me.dialogDiv.addEventListener("input", function (e) {
        if (e.target.dataset.role) {
            me.settings[e.target.dataset.role] = e.target.value;
        }
    })

    //Core will call me when an object is focused on from somewhere
    container.on("focus", function (d) {
        let id = d.id;
        let sender = d.sender;
        function switchTo(id) {
            upc.forceSend();
            me.settings.currentID = id;
            me.updateItem(id);
            container.fire("updateView");
        }
        if (me.settings.operationMode == "focus") {
            if (me.settings['focusOperatorID']) {
                if (me.settings['focusOperatorID'] == sender.container.uuid) {
                    switchTo(id);
                }
            } else {
                if (sender) {
                    //calculate the base rect of the sender
                    let baserectSender = sender.container.rect;
                    while (baserectSender.parent) baserectSender = baserectSender.parent;
                    //calculate my base rect
                    let myBaseRect = me.container.rect;
                    while (myBaseRect.parent) myBaseRect = myBaseRect.parent;
                    //if they're the same, then update.
                    if (myBaseRect == baserectSender) {
                        switchTo(id);
                    }
                }
            }
        } else if (me.settings.operationMode == "putter") {
            if (!me.settings.focusOperatorID) {
                me.focusOperatorID = d.sender.container.uuid;
            }
        }
    });
    container.on("deleteItem", function (d) {
        let id = d.id;
        let s = d.sender;
        if (me.settings.currentID == id) {
            me.settings.currentID = undefined;
            me.updateItem(undefined);
        };
    });
});