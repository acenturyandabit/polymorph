//todo: putter mode for inspector
core.registerOperator("inspector", {
    displayName: "Inspector",
    description: "Inspect all properties of a given element."
}, function (operator) {
    let me = this;
    me.container = operator;
    me.settings = {
        operationMode: "focus",
        currentItem: ""
    };

    me.rootdiv = document.createElement("div");
    operator.div.appendChild(me.rootdiv);

    ///////////////////////////////////////////////////////////////////////////////////////
    //Actual editing the item
    let upc = new capacitor(300, 40, (id) => {
        core.fire("updateItem", {
            id: id,
            sender: me
        });
    })


    //render an item on focus or on settings update.
    //must be able to handle null and "" in id
    me.renderItem = function (id, soft = false) {
        //if changing id, wipe everything
        if (!soft) me.rootdiv.innerHTML = "";
        //create a bunch of textareas for each different field.
        for (let i = 0; i < me.rootdiv.children.length; i++) {
            me.rootdiv.children.dataset.invalid = 1;
        }
        if (core.items[id]) {
            let clean_obj = JSON.parse(JSON.stringify(core.items[id]));
            for (let i in clean_obj) {
                let pdiv = me.rootdiv.querySelector("[data-role='" + i + "']");
                if (!pdiv) {
                    pdiv = document.createElement("div");
                    pdiv.dataset.role = i;
                    pdiv.innerHTML = `
                <h2>` + i + `</h2> 
                    <input>
                `;
                    me.rootdiv.appendChild(pdiv);
                }
                pdiv.dataset.invalid = 0;
                //change type if necessary

                //display value
                pdiv.querySelector("input").value = core.items[id][i];
            }
            its = me.rootdiv.querySelectorAll("[data-invalid='1']");
            for (let i = 0; i < its.length; i++) {
                its[i].remove();
            }
        }
        //(each has a dropdown for datatype)
        //rendering should not destroy ofject data
        //little 'new property' item
        //delete properties
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //First time load
    me.renderItem(me.settings.currentID);

    core.on("updateItem", function (d) {
        let id = d.id;
        let sender = d.sender;
        if (sender == me) return;
        //Check if item is shown
        //Update item if relevant
        if (id == me.settings.currentItem) {
            me.renderItem(id, true); //update for any new properties.
            return true;
        } else return false;
    });


    //loading and saving

    me.updateSettings = function () {
        if (me.settings.operationMode == 'static') {
            //create if it does not exist
            if (!core.items[staticItem]) {
                let it = new _item();
                core.items[staticItem] = it;
                core.fire("updateItem", {
                    sender: this,
                    id: staticItem
                });
            }
        }
        //render the item
        me.renderItem(me.settings.currentID);
    }

    //Saving and loading
    me.toSaveData = function () {
        return me.settings;
    }

    me.fromSaveData = function (d) {
        Object.assign(me.settings, d);
        me.updateSettings();
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    let options = [
        new _option({
            div: this.dialogDiv,
            type: "select",
            object: me.settings,
            property: "operationMode",
            source: {
                static: "Display static item",
                focus: "Display focused element"
            },
            label: "Select operation mode:"
        }),
        new _option({
            div: this.dialogDiv,
            type: "text",
            object: me.settings,
            property: "currentItem",
            label: "Set item to display:"
        }),
        new _option({
            div: this.dialogDiv,
            type: "text",
            object: me.settings,
            property: "focusOperatorID", 
            label: "Set operator UID to focus from:"
        }),
        new _option({
            div: this.dialogDiv,
            type: "bool",
            object: me.settings,
            property: "orientation",
            label: "Horizontal orientation"
        })
    ]
    let more = document.createElement('div');
    more.innerHTML = `
    <p> Or, click to target 'focus' events from an operator...
    <input data-role="focusOperatorID" placeholder="Operator UID (use the button)">
    <button class="targeter">Select operator</button>
    </br>
    `;
    this.dialogDiv.appendChild(more)
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
        options.forEach((i) => i.load());
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
                    me.renderItem(id);
                }
            } else {
                //calculate the base rect of the sender
                let baserectSender = sender.container.rect;
                while (baserectSender.parentRect) baserectSender = baserectSender.parentRect;
                //calculate my base rect
                let myBaseRect = me.container.rect;
                while (myBaseRect.parentRect) myBaseRect = myBaseRect.parentRect;
                //if they're the same, then update.
                if (myBaseRect == baserectSender) {
                    if (me.settings.operationMode == 'focus') {
                        me.settings.currentID = id;
                        me.renderItem(id);
                    }
                }
            }
            core.fire("updateView");
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