core.registerOperator("quillbox", {
    displayName: "Quillbox",
    description: "A rich text editor powered by Quill.js. One up from descbox!"
}, function (operator) {
    let me = this;
    me.operator = operator;
    me.settings = {
        property: "richDescription",
        operationMode: "focus",
        staticItem: "",
        currentID: ""
    };

    me.rootdiv = document.createElement("div");
    //Add div HTML here
    //wait until quilljs has loaded
    scriptassert([
        ["quill", "3pt/quill.min.js"]
    ], () => {
        //add the css to my shadow.
        let s = document.createElement("link");
        s.rel = "stylesheet";
        s.href = "3pt/quill.snow.css";
        s.type = "text/css";
        operator.div.appendChild(s);
        operator.div.appendChild(me.rootdiv);
        let ql=document.createElement("div");
        me.rootdiv.style.height="100%";
        me.rootdiv.style.width="100%";
        me.rootdiv.style.display="flex";
        me.rootdiv.style.flexDirection="column";
        me.rootdiv.style.background="white";
        me.rootdiv.appendChild(ql);
        ql.style.height="100%";
        ql.style.width="100%";
        me.quill = new Quill(ql, {
            theme: "snow"
        }); //picky quill needs to be attached to dom to initalise :/
        //Handle item updates
        me.updateItem = function (id) {
            if (id == me.settings.currentID && id) {
                if (core.items[id] && core.items[id][me.settings.property]) me.quill.setContents(core.items[id][me.settings.property]);
                else me.quill.setText("");
                me.quill.enable();
            } else {
                if (!me.settings.currentID) {
                    me.self_set = true;
                    me.quill.setText("Select an item to view its description.");
                    me.quill.disable();
                }
            }
        }
        //First time load
        me.updateItem(me.settings.currentID);
        me.rootdiv.addEventListener("keyup", me.somethingwaschanged);
    })

    core.on("updateItem", function (d) {
        let id = d.id;
        let sender = d.sender;
        if (sender == me) return;
        //Check if item is shown
        //Update item if relevant
        if (me.updateItem) me.updateItem(id);
    });

    

    

    me.updateSettings = function () {
        if (me.settings.operationMode == 'static') {
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
        }
        me.updateItem(me.settings.currentID);
    }

    //Saving and loading
    me.toSaveData = function () {
        return me.settings;
    }

    me.fromSaveData = function (d) {
        Object.assign(me.settings, d);
        //then rehash the display or sth
        if (me.updateItem)me.updateItem(me.settings.currentID);
    }

    //Register changes with core
    me.somethingwaschanged = function () {
        if (me.self_set) {
            me.self_set = false;
            return;
        }
        core.items[me.settings.currentID][me.settings.property] = me.quill.getContents();
        core.fire("updateItem", {
            id: me.settings.currentID,
            sender: me
        });
    }

    //Handle the settings dialog click!
    this.dialogDiv=document.createElement("div");
    this.dialogDiv.innerHTML=`
    <h1>Role</h1>
    <select data-role="operationMode">
    <option value="static">Display static item</option>
    <option value="focus">Display focused item</option>
    </select>
    <br/>
    <input data-role="staticItem" placeholder="Static item to display...">
    <br>
    <p> Or, click to target 'focus' events from an operator...
    <input data-role="focusOperatorID" placeholder="Operator UID (use the button)">
    <button class="targeter">Select operator</button>
    </br>
    <input data-role="property" placeholder="Enter the property to display...">`;
    this.showDialog=function(){
        // update your dialog elements with your settings
        for (i in me.settings) {
            let it = me.dialogDiv.querySelector("[data-role='" + i + "']");
            if (it) it.value = me.settings[i];
        }
    }
    this.dialogUpdateSettings=function(){
        // pull settings and update when your dialog is closed.
        let its = me.dialogDiv.querySelector("[data-role]");
        for (let i = 0; i < its.length; i++) {
            me.settings[its.dataset.role] = its.value;
        }
        me.updateSettings();
    }
    let d= this.dialogDiv;
    let targeter = d.querySelector("button.targeter");
    targeter.addEventListener("click", function () {
        core.target().then((id) => {
            d.querySelector("[data-role='focusOperatorID']").value = id;
            me.settings['focusOperatorID'] = id
        })
    })
    let roledItems = d.querySelector("[data-role]");
    for (let q = 0; q < roledItems.length; q++) {
        roledItems[q].value = me.settings[roledItems[q].dataset.role];
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
        core.fire("updateView");
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