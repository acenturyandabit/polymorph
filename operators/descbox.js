core.registerOperator("descbox", function (operator) {
    let me = this;
    me.operator = operator;
    me.settings = {
        property: "description",
        operationMode: "focus",
        staticItem: ""
    };

    me.rootdiv = document.createElement("div");
    //Add div HTML here
    me.rootdiv.innerHTML = `<textarea></textarea>`;
    me.textarea = me.rootdiv.querySelector("textarea");
    me.textarea.style.width = "100%";
    me.textarea.style.height = "100%";
    me.textarea.style.resize = "none";
    me.currentID = "";

    operator.div.appendChild(me.rootdiv);

    //Handle item updates
    me.updateItem = function (id) {
        if (me.settings.operationMode != "putter") {
            if (id == me.settings.currentID && id) {
                if (core.items[id] && core.items[id][me.settings.property]) me.textarea.value = core.items[id][me.settings.property];
                else me.textarea.value = "";
                me.textarea.disabled = false;
                if (core.items[id].style) {
                    me.textarea.style.background = core.items[id].style.background;
                    me.textarea.style.color = core.items[id].style.color;
                }else{
                    me.textarea.style.background="";
                    me.textarea.style.color="";
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
        //do i control this item?
        if (me.settings.operationMode=='static'){
            if (id==me.settings.currentID){
                return true;
            }
        }
        return false;
    }

    core.on("updateItem", function (d) {
        let id = d.id;
        let sender = d.sender;
        if (sender == me) return;
        //Check if item is shown
        //Update item if relevant
        return me.updateItem(id);
    });

    //First time load

    me.updateItem(me.settings.currentID);

    me.updateSettings = function () {
        if (me.settings.operationMode == 'static') {
            let staticItem=me.settings.staticItem;
            me.settings.currentID = me.settings.staticItem;
            if (!core.items[staticItem]) {
                let it = new _item();
                it[me.settings.property] = "";
                core.items[staticItem] = it;
                core.fire("create", {
                    sender: this,
                    id: staticItem
                });
                core.fire("updateItem", {
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

    let upc = new capacitor(300, 40, (id, data) => {
        core.items[id][me.settings.property] = data;
        core.fire("updateItem", {
            id: id,
            sender: me
        });
    })
    //Register changes with core
    me.somethingwaschanged = function () {
        if (me.settings.operationMode != "putter") {
            upc.submit(me.settings.currentID, me.textarea.value);
        }
    }

    me.textarea.addEventListener("input", me.somethingwaschanged);

    me.textarea.addEventListener("keydown", (e) => {
        if (e.key == "Enter" && this.settings.operationMode == "putter") {
            let operator = core.getOperator(me.focusOperatorID);
            if (operator && operator.baseOperator.quickAdd) {
                operator.baseOperator.quickAdd(me.textarea.value);
                me.textarea.value = "";
                e.preventDefault();
            }
        }
    });

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `
    <h1>Role</h1>
    <select data-role="operationMode">
    <option value="static">Display static item</option>
    <option value="focus">Display focused item</option>
    <option value="putter">Use as data entry</option>
    </select>
    <br/>
    <input data-role="staticItem" placeholder="Static item to display...">
    <br>
    <p> Or, click to target 'focus' events from an operator...
    <input data-role="focusOperatorID" placeholder="Operator UID (use the button)">
    <button class="targeter">Select operator</button>
    </br>
    <input data-role="property" placeholder="Enter the property to display...">
    `;
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
        me.updateSettings();
    }
    me.dialogDiv.addEventListener("input", function (e) {
        if (e.target.dataset.role) {
            me.settings[e.target.dataset.role] = e.target.value;
        }
    })

    //Core will call me when an object is focused on from somewhere
    core.on("focus", function (d) {
        let id = d.id;
        let sender = d.sender;
        if (me.settings.operationMode == "focus") {
            if (me.settings['focusOperatorID']) {
                if (me.settings['focusOperatorID'] == sender.container.uuid) {
                    me.settings.currentID = id;
                    me.updateItem(id);
                }
            } else {
                //calculate the base rect of the sender
                let baserectSender = sender.operator.rect;
                while (baserectSender.parentRect) baserectSender = baserectSender.parentRect;
                //calculate my base rect
                let myBaseRect = me.operator.rect;
                while (myBaseRect.parentRect) myBaseRect = myBaseRect.parentRect;
                //if they're the same, then update.
                if (myBaseRect == baserectSender) {
                    if (me.settings.operationMode == 'focus') {
                        me.settings.currentID = id;
                        me.updateItem(id);
                    }
                }
            }
            core.fire("viewUpdate");
        } else if (me.settings.operationMode == "putter") {
            if (!me.settings.focusOperatorID) {
                me.focusOperatorID = d.sender.container.uuid;
            }
        }
    });
    core.on("deleteItem", function (d) {
        let id = d.id;
        let s = d.sender;
        if (me.settings.currentID == id) {
            me.settings.currentID = undefined;
        };
        me.updateItem(undefined);
    });
});