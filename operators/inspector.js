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
    me.internal = document.createElement("div");
    me.rootdiv = document.createElement("div");
    me.rootdiv.appendChild(me.internal);
    let ttypes = `<select>
    <option>Text</option>
    <option>Date</option>
    </select>`;
    me.rootdiv.appendChild(htmlwrap(`
        <h4>Add a property:</h4>
        <input type="text" placeholder="Name">
        <label>Type:${ttypes}</label>
    `));
    me.rootdiv.querySelector("input[placeholder='Name']").addEventListener("keyup", (e) => {
        if (e.key == "Enter") {
            core.items[me.settings.currentItem][e.target.value] = " ";
            if (me.settings.propsOn) me.settings.propsOn[e.target.value] = true;
            me.renderItem(me.settings.currentItem);
            e.target.value = "";
            core.fire("updateItem", {
                sender: me,
                id: me.settings.currentItem
            });
        }
    })
    operator.div.appendChild(htmlwrap(
        `
        <style>
        h4{
            margin:0;
        }
        </style>
    `
    ));
    operator.div.appendChild(me.rootdiv);

    ///////////////////////////////////////////////////////////////////////////////////////
    //Actual editing the item
    let upc = new capacitor(300, 40, (id) => {
        core.fire("updateItem", {
            id: id,
            sender: me
        });
    })

    me.internal.addEventListener("input", (e) => {
        let it = core.items[me.settings.currentItem];
        let i = e.target.parentElement.dataset.role;
        switch (e.target.parentElement.dataset.type) {
            case 'Text':
                it[i] = e.target.value;
                upc.submit(me.settings.currentItem);
                break;
            case 'Date':
                if (!it[i]) it[i] = {};
                if (typeof it[i] == "string") it[i] = {
                    datestring: it[i]
                };
                it[i].datestring = e.target.value;
                if (me.datereparse) me.datereparse(it, i);
                break;
        }
    })

    scriptassert([
        ['dateparser', 'genui/dateparser.js']
    ], () => {
        me.datereparse = function (it, i) {
            it[i].date = dateParser.richExtractTime(it[i].datestring);
            if (!it[i].date.length) it[i].date = undefined;
            core.fire("dateUpdate");
        }
    });

    scriptassert([
        ["contextmenu", "genui/contextMenu.js"]
    ], () => {
        let ctm = new _contextMenuManager(operator.div);
        let contextedItem;
        let menu;

        function filter(e) {
            contextedItem = e.target;
            return true;
        }
        menu = ctm.registerContextMenu(`<li class="fixed">Convert to fixed date</li>`, me.rootdiv, "[data-type='Date'] input", filter)
        menu.querySelector(".fixed").addEventListener("click", function (e) {
            if (!core.items[me.settings.currentItem][contextedItem.parentElement.dataset.role].date) me.datereparse(core.items[me.settings.currentItem], contextedItem.parentElement.dataset.role);
            contextedItem.value = new Date(core.items[me.settings.currentItem][contextedItem.parentElement.dataset.role].date[0].date).toLocaleString();
            core.items[me.settings.currentItem][contextedItem.parentElement.dataset.role].datestring = contextedItem.value;
            me.datereparse(core.items[me.settings.currentItem], contextedItem.parentElement.dataset.role);
            menu.style.display = "none";
        })
    })

    //render an item on focus or on settings update.
    //must be able to handle null and "" in id
    me.renderItem = function (id, soft = false) {
        if (!soft) me.internal.innerHTML = "";
        //create a bunch of textareas for each different field.
        //invalidate old ones
        for (let i = 0; i < me.internal.children.length; i++) {
            me.internal.children[i].dataset.invalid = 1;
        }
        if (core.items[id]) {
            //clean the object
            let clean_obj = JSON.parse(JSON.stringify(core.items[id]));
            if (me.settings.showNonexistent){
                for (let i in me.settings.propsOn){
                    clean_obj[i]="";
                }
            }
            for (let i in clean_obj) {
                if (me.settings.propsOn && !me.settings.propsOn[i]) continue; // skip properties we dont want
                let pdiv = me.internal.querySelector("[data-role='" + i + "']");
                if (!pdiv || pdiv.dataset.type != me.settings.propsOn[i]) {
                    //regenerate it 
                    if (pdiv) pdiv.remove();
                    pdiv = document.createElement("div");
                    pdiv.dataset.role = i;
                    pdiv.dataset.type = me.settings.propsOn[i];
                    let ihtml = `<h4>` + i + `</h4>`;
                    switch (me.settings.propsOn[i]) {
                        case 'Text':
                        case 'Date':
                            ihtml += `<input>`;
                    }
                    pdiv.innerHTML = ihtml;
                    me.internal.appendChild(pdiv);
                }
                pdiv.dataset.invalid = 0;
                //change type if necessary

                //display value
                switch (me.settings.propsOn[i]) {
                    case 'Text':
                        pdiv.querySelector("input").value = core.items[id][i];
                        break;
                    case 'Date':
                        pdiv.querySelector("input").value = core.items[id][i].datestring;
                        break;
                }

            }
            its = me.internal.querySelectorAll("[data-invalid='1']");
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
    me.renderItem(me.settings.currentItem);

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
        me.renderItem(me.settings.currentItem);
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
        }),
        new _option({
            div: this.dialogDiv,
            type: "bool",
            object: me.settings,
            property: "showNonexistent",
            label: "Show enabled but not currently filled fields"
        })
    ]
    let more = document.createElement('div');
    more.innerHTML = `
    <p> Or, click to target 'focus' events from an operator...
    <input data-role="focusOperatorID" placeholder="Operator UID (use the button)">
    <button class="targeter">Select operator</button>
    </br>
    `;
    this.dialogDiv.appendChild(more);
    let fields = document.createElement('div');
    fields.innerHTML = `
    <h4> Select visible fields: </h4>
    <div class="apropos"></div>
    `;
    this.dialogDiv.appendChild(fields);
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
        //get all available properties.
        let app = fields.querySelector(".apropos");
        app.innerHTML = "";
        let props = {};
        for (let i in core.items) {
            for (let j in core.items[i]) props[j] = true;
        }
        if (!this.settings.propsOn) this.settings.propsOn = props;
        for (let j in props) {
            app.appendChild(htmlwrap(`<p data-pname="${j}">${j}<span style="display: block; float: right;"><input type="checkbox" ${(this.settings.propsOn[j])?"checked":""}> ${ttypes}</span></p>`));
        }
        //fill out some details
        options.forEach((i) => i.load());
    }
    this.dialogUpdateSettings = function () {
        // pull settings and update when your dialog is closed.
        let its = me.dialogDiv.querySelectorAll("[data-role]");
        for (let i = 0; i < its.length; i++) {
            me.settings[its[i].dataset.role] = its[i].value;
        }
        //also update all properties
        let ipns = me.dialogDiv.querySelectorAll("[data-pname]");
        me.settings.propsOn = {};
        for (let i = 0; i < ipns.length; i++) {
            if (ipns[i].querySelector("input").checked) {
                me.settings.propsOn[ipns[i].dataset.pname] = ipns[i].querySelector("select").value;
            }
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
                    me.settings.currentItem = id;
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
                        me.settings.currentItem = id;
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
        if (me.settings.currentItem == id) {
            me.settings.currentItem = undefined;
        };
        me.updateItem(undefined);
    });
});