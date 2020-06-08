//todo: putter mode for inspector
polymorph_core.registerOperator("inspector", {
    displayName: "Inspector",
    description: "Inspect all properties of a given element.",
    section:"Advanced",
    imageurl:"assets/operators/inspector.png"
}, function (container) {

    let upc = new capacitor(300, 40, (id) => {
        container.fire("updateItem", {
            id: id,
            sender: this
        });
    })


    let datatypes = {
        'Text': {
            onInput: (e, it, i) => {
                it[i] = e.target.value;
            },
            generate: (id) => {
                return `<input>`;
            },
            updateValue: (obj, div) => {
                if (obj != undefined) div.querySelector("input").value = obj;
                else div.querySelector("input").value = "";
            }
        },
        'Large Text': {
            onInput: (e, it, i) => {
                it[i] = e.target.value;
                e.target.style.height = e.target.scrollHeight;
            },
            generate: (id) => {
                return `<textarea style="width:100%"></textarea>`;
            },
            updateValue: (obj, div) => {
                if (obj != undefined) div.querySelector("textarea").value = obj;
                else div.querySelector("textarea").value = "";
                //tiny nudge so the scroll bar doesnt show up
                div.querySelector("textarea").style.height = div.querySelector("textarea").scrollHeight;
            }
        },
        'Date': {
            onInput: (e, it, i) => {
                if (!it[i]) it[i] = {};
                if (typeof it[i] == "string") it[i] = {
                    datestring: it[i]
                };
                it[i].datestring = e.target.value;
                if (this.datereparse) this.datereparse(it, i);
            },
            generate: (id) => {
                return `<input>`;
            },
            updateValue: (obj, div) => {
                if (obj) div.querySelector("input").value = obj.datestring || "";
                else div.querySelector("input").value = "";
            }
        },
        'Auto': {
            onInput: (e, it, i) => {
                it[i] = e.target.value;
            },
            updateValue: (obj, div, i) => {
                if (typeof (obj) == "object") {
                    recursiveRender(obj, div);
                } else {
                    div.innerHTML = `<p>${i}:</p><input>`;
                    if (obj != undefined) div.querySelector("input").value = obj;
                    else div.querySelector("input").value = "";
                    //fall through
                }
            }
        }
    };







    let defaultSettings = {
        operationMode: "focus",
        currentItem: "",
        globalEnabled: false,// whether or not it's enabled globally
    };
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);
    this.rootdiv.style.cssText = `
    overflow:auto;
    height: 100%;
    color: white;
    `
    let ttypes = `<select data-role="nttype">
    ${
        (() => {
            let output = "";
            for (i in datatypes) {
                output += `<option value='${i}'>${i}</option>`;
            }
            return output;
        })()
        }
    </select>`;
    this.rootdiv.appendChild(htmlwrap(`
    <h3>Item: <span class="itemID"></span></h3>
    <div></div>
        <h4>Add a property:</h4>
        <input type="text" placeholder="Name">
        <label>Type:${ttypes}</label>
        <button class="ap">Add property</button>
    `));
    this.internal = this.rootdiv.children[0].children[1];


    let insertbtn = htmlwrap(`
    <button>Add new item</button>`);
    this.rootdiv.appendChild(insertbtn);
    insertbtn.style.display = "none";
    insertbtn.addEventListener("click", () => {
        //create a new element with the stated specs
        let item = {};
        for (let i = 0; i < this.internal.children.length; i++) {
            item[this.internal.children[i].dataset.role] = this.internal.children[i].querySelector("input").value;
        }
        let id = polymorph_core.insertItem(item)
        container.fire("updateItem", { id: id });
        this.settings.currentItem = undefined;
        //clear modified class on item
        for (let i = 0; i < this.internal.children.length; i++) {
            this.internal.children[i].classList.remove("modified");
        }
    })


    let commitbtn = htmlwrap(`
    <button>Commit changes</button>`);
    this.rootdiv.appendChild(commitbtn);
    commitbtn.style.display = "none";
    commitbtn.addEventListener("click", () => {
        //commit changes
        if (this.settings.currentItem) {
            let item = polymorph_core.items[this.settings.currentItem];
            for (let i = 0; i < this.internal.children.length; i++) {
                item[this.internal.children[i].dataset.role] = this.internal.children[i].querySelector("input").value;
            }
            container.fire("updateItem", { id: this.settings.currentItem });
            //clear modified class on item
            for (let i = 0; i < this.internal.children.length; i++) {
                this.internal.children[i].classList.remove("modified");
            }
        }
    })
    /*let clearBtn=htmlwrap(`
    <button>Clear fields</button>`);
    this.rootdiv.appendChild(clearBtn);
    insertbtn.addEventListener("click",()=>{
        //create a new element with the stated specs
    })*/
    let newProp = (prop) => {
        if (this.settings.currentItem) polymorph_core.items[this.settings.currentItem][prop] = " ";
        if (this.settings.propsOn) this.settings.propsOn[prop] = this.rootdiv.querySelector("[data-role='nttype']").value;
        this.renderItem(this.settings.currentItem);
        container.fire("updateItem", {
            sender: this,
            id: this.settings.currentItem
        });
    }
    this.rootdiv.querySelector("input[placeholder='Name']").addEventListener("keyup", (e) => {
        if (e.key == "Enter") {
            newProp(e.target.value);
            e.target.value = "";
        }
    })
    this.rootdiv.querySelector(".ap").addEventListener("click", (e) => {
        newProp(this.rootdiv.querySelector("input[placeholder='Name']").value);
        this.rootdiv.querySelector("input[placeholder='Name']").value = "";
    })

    container.div.appendChild(htmlwrap(
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
    container.div.appendChild(this.rootdiv);

    ///////////////////////////////////////////////////////////////////////////////////////
    //Actual editing the item

    this.internal.addEventListener("input", (e) => {
        //change this to invalidate instead of directly edit?
        if (this.settings.commitChanges) {
            e.target.parentElement.classList.add("modified");
        } else if (this.settings.currentItem) {
            let it = polymorph_core.items[this.settings.currentItem];
            let i = e.target.parentElement.dataset.role;
            if (datatypes[e.target.parentElement.dataset.type]) {
                datatypes[e.target.parentElement.dataset.type].onInput(e, it, i);
                upc.submit(this.settings.currentItem);
            }
        }
    })

    this.datereparse = (it, i) => {
        it[i].date = dateParser.richExtractTime(it[i].datestring);
        if (!it[i].date.length) it[i].date = undefined;
        container.fire("dateUpdate");
    }

    let ctm = new _contextMenuManager(container.div);
    let contextedItem;
    let menu;

    function filter(e) {
        contextedItem = e.target;
        return true;
    }
    menu = ctm.registerContextMenu(`<li class="fixed">Convert to fixed date</li>`, this.rootdiv, "[data-type='Date'] input", filter)
    menu.querySelector(".fixed").addEventListener("click", (e) => {
        if (!polymorph_core.items[this.settings.currentItem][contextedItem.parentElement.dataset.role].date) this.datereparse(polymorph_core.items[this.settings.currentItem], contextedItem.parentElement.dataset.role);
        contextedItem.value = new Date(polymorph_core.items[this.settings.currentItem][contextedItem.parentElement.dataset.role].date[0].date).toLocaleString();
        polymorph_core.items[this.settings.currentItem][contextedItem.parentElement.dataset.role].datestring = contextedItem.value;
        this.datereparse(polymorph_core.items[this.settings.currentItem], contextedItem.parentElement.dataset.role);
        menu.style.display = "none";
    })

    //render an item on focus or on settings update.
    //must be able to handle null and "" in id
    //also should be able to update instead of just rendering
    function recursiveRender(obj, div) {
        if (typeof obj == "object" && obj) {
            for (let j = 0; j < div.children.length; j++) div.children[j].dataset.used = "false";
            for (let i in obj) {
                let d;
                for (let j = 0; j < div.children.length; j++) {
                    if (div.children[j].matches(`[data-prop="${i}"]`)) {
                        d = div.children[j];
                    }
                }
                if (!d) d = htmlwrap(`<div style="border-top: 1px solid black"><span>${i}</span><div></div></div>`);
                d.dataset.prop = i;
                d.dataset.used = "true";
                d.style.marginLeft = "5px";
                recursiveRender(obj[i], d.children[1]);
                div.appendChild(d);
            }
            for (let j = 0; j < div.children.length; j++) {
                if (div.children[j].dataset.used == "false" && (div.children[j].tagName == "DIV" || div.children[j].tagName == "BUTTON")) {
                    div.children[j].remove();
                }
            }
            div.appendChild(htmlwrap(`<button>Add property...</button>`));
        } else {
            let i;
            if (div.children[0] && div.children[0].tagName == "INPUT") {
                i = div.children[0];
            } else {
                while (div.children.length) div.children[0].remove();
            }
            if (!i) i = document.createElement("input");
            i.value = obj;
            div.appendChild(i);
        }
    }

    this.renderItem = function (id, soft = false) {
        this.rootdiv.querySelector(".itemID").innerText = id;
        if (!soft) this.internal.innerHTML = "";
        //create a bunch of textareas for each different field.
        //invalidate old ones
        for (let i = 0; i < this.internal.children.length; i++) {
            this.internal.children[i].dataset.invalid = 1;
        }
        let clean_obj = {};
        if (polymorph_core.items[id]) {
            //clean the object
            clean_obj = JSON.parse(JSON.stringify(polymorph_core.items[id]));
        }
        for (let i in this.settings.propsOn) {
            if (this.settings.propsOn[i] && (clean_obj[i] != undefined || this.settings.showNonexistent)) {
                let pdiv = this.internal.querySelector("[data-role='" + i + "']");
                //create or change type if necessary
                if (!pdiv || pdiv.dataset.type != this.settings.propsOn[i]) {
                    //regenerate it 
                    if (pdiv) pdiv.remove();
                    pdiv = document.createElement("div");
                    pdiv.dataset.role = i;
                    pdiv.dataset.type = this.settings.propsOn[i];
                    let ihtml = `<h4>` + i + `</h4>`;
                    if (datatypes[this.settings.propsOn[i]].generate) {
                        ihtml += datatypes[this.settings.propsOn[i]].generate(i);
                    }
                    pdiv.innerHTML = ihtml;
                    this.internal.appendChild(pdiv);
                }
                pdiv.dataset.invalid = 0;
                //display value
                if (datatypes[this.settings.propsOn[i]].updateValue) {
                    datatypes[this.settings.propsOn[i]].updateValue(clean_obj[i], pdiv, i);
                }
            }
        }
        //remove invalidated items
        its = this.internal.querySelectorAll("[data-invalid='1']");
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
    this.renderItem(this.settings.currentItem);

    container.on("updateItem", (d) => {
        let id = d.id;
        let sender = d.sender;
        if (sender == this) return;
        //Check if item is shown
        //Update item if relevant
        if (id == this.settings.currentItem) {
            this.renderItem(id, true); //update for any new properties.
            return true;
        } else return false;
    });


    //loading and saving
    this.updateSettings = () => {
        /*
        //this is broken because staticitem does not exist???
        if (this.settings.operationMode == 'static') {
            //create if it does not exist
            if (!polymorph_core.items[staticItem]) {
                let it = {};
                polymorph_core.items[staticItem] = it;
                container.fire("updateItem", {
                    sender: this,
                    id: staticItem
                });
            }
        }*/
        if (this.settings.dataEntry) {
            insertbtn.style.display = "block";
        } else {
            insertbtn.style.display = "none";
        }
        if (this.settings.commitChanges) {
            commitbtn.style.display = "block";
        } else {
            commitbtn.style.display = "none";
        }
        //render the item
        this.renderItem(this.settings.currentItem);
    }

    if (!this.settings.propsOn) {
        this.settings.propsOn = {};
        for (let i in polymorph_core.items) {
            for (let j in polymorph_core.items[i]) {
                this.settings.propsOn[j] = "Auto";
            }
        }
    }
    this.updateSettings();

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.optionsDiv = document.createElement("div");
    this.dialogDiv.appendChild(this.optionsDiv);
    this.optionsDiv.style.width = "30vw";
    let options = {
        operationMode: new polymorph_core._option({
            div: this.optionsDiv,
            type: "select",
            object: this.settings,
            property: "operationMode",
            source: {
                static: "Display static item",
                focus: "Display focused element"
            },
            label: "Select operation mode:"
        }),
        currentItem: new polymorph_core._option({
            div: this.optionsDiv,
            type: "text",
            object: this.settings,
            property: "currentItem",
            label: "Set item to display:"
        }),
        orientation: new polymorph_core._option({
            div: this.optionsDiv,
            type: "bool",
            object: this.settings,
            property: "orientation",
            label: "Horizontal orientation"
        }),
        showNonexistent: new polymorph_core._option({
            div: this.optionsDiv,
            type: "bool",
            object: this.settings,
            property: "showNonexistent",
            label: "Show enabled but not currently filled fields"
        }),
        commitChanges: new polymorph_core._option({
            div: this.optionsDiv,
            type: "bool",
            object: this.settings,
            property: "commitChanges",
            label: "Manually commit changes",
        }),
        dataEntry: new polymorph_core._option({
            div: this.optionsDiv,
            type: "bool",
            object: this.settings,
            property: "dataEntry",
            label: "Enable data entry",
            afterInput: (e) => {
                let i = e.currentTarget;
                if (i.checked) {
                    this.settings.showNonexistent = true;
                    options.showNonexistent.load();
                    this.settings.commitChanges = true;
                    options.commitChanges.load();
                }
            }
        }),
        globalEnabled: new polymorph_core._option({
            div: this.optionsDiv,
            type: "bool",
            object: this.settings,
            property: "globalEnabled",
            label: "Focus: listen for every container (regardless of origin)",
        })
    }
    let fields = document.createElement('div');
    fields.innerHTML = `
    <h4> Select visible fields: </h4>
    <div class="apropos"></div>
    `;
    this.dialogDiv.appendChild(fields);

    this.showDialog = () => {
        // update your dialog elements with your settings
        //get all available properties.
        let app = fields.querySelector(".apropos");
        app.innerHTML = "";
        let props = {};
        for (let i in polymorph_core.items) {
            for (let j in polymorph_core.items[i]) props[j] = true;
        }
        if (!this.settings.propsOn) this.settings.propsOn = props;
        for (let j in props) {
            let thisPropLine = htmlwrap(`<p data-pname="${j}">${j}<span style="display: block; float: right;"><input type="checkbox" ${(this.settings.propsOn[j]) ? "checked" : ""}> ${ttypes}</span></p>`);
            thisPropLine.querySelector("[data-role='nttype']").value = this.settings.propsOn[j] || "Text";
            app.appendChild(thisPropLine);

        }
        //fill out some details
        for (i in options) {
            options[i].load();
        }
    }
    this.dialogUpdateSettings = () => {
        // pull settings and update when your dialog is closed.
        let its = this.dialogDiv.querySelectorAll("[data-role]");
        for (let i = 0; i < its.length; i++) {
            this.settings[its[i].dataset.role] = its[i].value;
        }
        //also update all properties
        let ipns = this.dialogDiv.querySelectorAll("[data-pname]");
        this.settings.propsOn = {};
        for (let i = 0; i < ipns.length; i++) {
            if (ipns[i].querySelector("input").checked) {
                this.settings.propsOn[ipns[i].dataset.pname] = ipns[i].querySelector("select").value;
            }
        }
        this.updateSettings();
        this.renderItem(this.settings.currentItem);
    }
    this.dialogDiv.addEventListener("input", (e) => {
        if (e.target.dataset.role) {
            this.settings[e.target.dataset.role] = e.target.value;
        }
    })

    //polymorph_core will call this when an object is focused on from somewhere
    container.on("focusItem", (d) => {
        let id = d.id;
        let sender = d.sender;
        if (this.settings.operationMode == "focus") {
            this.settings.currentItem = id;
            this.renderItem(id);
            //using new focus paradigm we can skip this step, hopefully
            /*
            if (this.settings['focusOperatorID']) {
                if (this.settings['focusOperatorID'] == sender.container.uuid) {

                }
            } else {
                //calculate the base rect of the sender
                let baserectSender = sender.container.rect;
                while (baserectSender.parent) baserectSender = baserectSender.parent;
                //calculate my base rect
                let myBaseRect = this.container.rect;
                while (myBaseRect.parent) myBaseRect = myBaseRect.parent;
                //if they're the same, then update.
                if (myBaseRect == baserectSender || this.settings.globalEnabled) {
                    if (this.settings.operationMode == 'focus') {
                        this.settings.currentItem = id;
                        this.renderItem(id);
                    }
                }
            }
            */
        }
    });
    container.on("deleteItem", (d) => {
        let id = d.id;
        let s = d.sender;
        if (this.settings.currentItem == id) {
            this.settings.currentItem = undefined;
        };
        this.updateItem(undefined);
    });
});