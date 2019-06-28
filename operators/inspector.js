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
    me.rootdiv.style.overflow = "auto";
    me.rootdiv.style.height = "100%";
    me.rootdiv.appendChild(me.internal);
    let ttypes = `<select data-role="nttype">
    <option>Text</option>
    <option>Date</option>
    </select>`;
    me.rootdiv.appendChild(htmlwrap(`
        <h4>Add a property:</h4>
        <input type="text" placeholder="Name">
        <label>Type:${ttypes}</label>
        <button>Add property</button>
    `));
    let insertbtn = htmlwrap(`
    <button>Add new item</button>`);
    me.rootdiv.appendChild(insertbtn);
    insertbtn.style.display = "none";
    let commitbtn = htmlwrap(`
    <button>Commit changes</button>`);
    me.rootdiv.appendChild(commitbtn);
    commitbtn.style.display = "none";
    insertbtn.addEventListener("click", () => {
        //create a new element with the stated specs
        let item = {};
        for (let i = 0; i < me.internal.children.length; i++) {
            item[me.internal.children[i].dataset.role] = me.internal.children[i].querySelector("input").value;
        }
        let id = core.insertItem(item)
        core.fire("updateItem", { id: id });
        me.settings.currentItem = undefined;
        //clear modified class on item
        for (let i=0;i<me.internal.children.length;i++){
            me.internal.children[i].classList.remove("modified");
        }
    })
    commitbtn.addEventListener("click", () => {
        //commit changes
        if (me.settings.currentItem) {
            let item = core.items[me.settings.currentItem];
            for (let i = 0; i < me.internal.children.length; i++) {
                item[me.internal.children[i].dataset.role] = me.internal.children[i].querySelector("input").value;
            }
            core.fire("updateItem", { id: me.settings.currentItem });
            //clear modified class on item
            for (let i=0;i<me.internal.children.length;i++){
                me.internal.children[i].classList.remove("modified");
            }
        }
    })
    /*let clearBtn=htmlwrap(`
    <button>Clear fields</button>`);
    me.rootdiv.appendChild(clearBtn);
    insertbtn.addEventListener("click",()=>{
        //create a new element with the stated specs
    })*/
    me.rootdiv.querySelector("input[placeholder='Name']").addEventListener("keyup", (e) => {
        if (e.key == "Enter") {
            if (me.settings.currentItem) core.items[me.settings.currentItem][e.target.value] = " ";
            if (me.settings.propsOn) me.settings.propsOn[e.target.value] = me.rootdiv.querySelector("[data-role='nttype']").value;
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
        .modified input{
            background: lightblue;
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
        //change this to invalidate instead of directly edit?
        if (me.settings.commitChanges){
            e.target.parentElement.classList.add("modified");
        }else if (me.settings.currentItem) {
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
        let clean_obj = {};
        if (core.items[id]) {
            //clean the object
            clean_obj = JSON.parse(JSON.stringify(core.items[id]));
        }
        for (let i in me.settings.propsOn) {
            if (me.settings.propsOn[i] && (clean_obj[i] || me.settings.showNonexistent)) {
                let pdiv = me.internal.querySelector("[data-role='" + i + "']");
                //create or change type if necessary
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
                //display value
                switch (me.settings.propsOn[i]) {
                    case 'Text':
                        pdiv.querySelector("input").value = clean_obj[i] || "";
                        break;
                    case 'Date':
                        pdiv.querySelector("input").value = clean_obj[i].datestring || "";
                        break;
                }
            }
        }
        //remove invalidated items
        its = me.internal.querySelectorAll("[data-invalid='1']");
        for (let i = 0; i < its.length; i++) {
            its[i].remove();
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
                let it = {};
                core.items[staticItem] = it;
                core.fire("updateItem", {
                    sender: this,
                    id: staticItem
                });
            }
        }
        if (me.settings.dataEntry) {
            insertbtn.style.display = "block";
        } else {
            insertbtn.style.display = "none";
        }
        if (me.settings.commitChanges) {
            commitbtn.style.display = "block";
        } else {
            commitbtn.style.display = "none";
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
    this.optionsDiv = document.createElement("div");
    this.dialogDiv.appendChild(this.optionsDiv);
    this.optionsDiv.style.width = "30vw";
    let options = {
        operationMode: new _option({
            div: this.optionsDiv,
            type: "select",
            object: me.settings,
            property: "operationMode",
            source: {
                static: "Display static item",
                focus: "Display focused element"
            },
            label: "Select operation mode:"
        }),
        currentItem: new _option({
            div: this.optionsDiv,
            type: "text",
            object: me.settings,
            property: "currentItem",
            label: "Set item to display:"
        }),
        focusOperatorID: new _option({
            div: this.optionsDiv,
            type: "text",
            object: me.settings,
            property: "focusOperatorID",
            label: "Set operator UID to focus from:"
        }),
        orientation: new _option({
            div: this.optionsDiv,
            type: "bool",
            object: me.settings,
            property: "orientation",
            label: "Horizontal orientation"
        }),
        showNonexistent: new _option({
            div: this.optionsDiv,
            type: "bool",
            object: me.settings,
            property: "showNonexistent",
            label: "Show enabled but not currently filled fields"
        }),
        commitChanges: new _option({
            div: this.optionsDiv,
            type: "bool",
            object: me.settings,
            property: "commitChanges",
            label: "Manually commit changes",
        }),
        dataEntry: new _option({
            div: this.optionsDiv,
            type: "bool",
            object: me.settings,
            property: "dataEntry",
            label: "Enable data entry",
            afterInput: (i) => {
                if (i.checked) {
                    me.settings.showNonexistent = true;
                    options.showNonexistent.load();
                    me.settings.commitChanges = true;
                    options.commitChanges.load();
                }
            }
        })
    }
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
            app.appendChild(htmlwrap(`<p data-pname="${j}">${j}<span style="display: block; float: right;"><input type="checkbox" ${(this.settings.propsOn[j]) ? "checked" : ""}> ${ttypes}</span></p>`));
        }
        //fill out some details
        for (i in options) {
            options[i].load();
        }
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
        me.renderItem(me.settings.currentItem);
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