core.registerOperator("itemList", function (operator) {
    let me = this;
    me.operator=operator;
    //Initialise with default settings
    this.settings = {
        properties: {
            title: "text"
        },
        filterProp: guid()
    };

    this.settingsBar = document.createElement('div');
    this.settingsBar.innerHTML = `<div></div>`
    this.taskListBar = document.createElement("div");
    this.taskListBar.style.cssText = "flex: 1 0 auto; display: flex; flex-direction:column;";
    this.template = document.createElement('span');
    this.template.style.cssText = "display: inline-block; width: 100%;";
    this._template = document.createElement("span");
    this.template.appendChild(this._template);
    this.template.appendChild(document.createElement("button"));
    this.taskListBar.appendChild(this.template);
    this.taskListBar.appendChild(document.createElement("hr"));
    this.taskList = document.createElement("div");
    this.taskListBar.appendChild(this.taskList);
    operator.div.appendChild(this.taskListBar);

    //Handle item creation
    this.createItem = function () {
        let it = new _item();
        //clone the template and append it
        let currentItemSpan = me.template.cloneNode(true);
        me.taskList.appendChild(currentItemSpan);
        //get data and register item
        for (i in this.settings.properties) {
            switch (this.settings.properties[i]) {
                case "text":
                case "tag":
                case "number":
                    it[i] = currentItemSpan.querySelector("[data-role='" + i + "']").value;
                    break;
                case "date":
                    if (!it[i]) it[i] = {};
                    if (typeof it[i] == "string") it[i] = {
                        datestring: it[i]
                    };
                    it[i].datestring = currentItemSpan.querySelector("[data-role='" + i + "']").value;
                    break;
            }
            me.template.querySelector("[data-role='" + i + "']").value = "";
        }
        currentItemSpan.querySelector("button").innerHTML = "X";
        it.itemList = true;
        //ensure the filter property exists
        if (me.settings.filterProp && !it[me.settings.filterProp]) it[me.settings.filterProp] = true;
        let id = core.insertItem(it);
        currentItemSpan.querySelector("[data-role='id']").innerText = id;
        currentItemSpan.dataset.id = id;
        //clear the template
        core.fire("create", {
            id: id,
            sender: this
        });
        core.fire("updateItem", {
            id: id,
            sender: this
        });
        me.datereparse(id);
    }

    this.template.querySelector("button").innerText = ">";
    this.template.querySelector("button").addEventListener("click", this.createItem);
    this.template.addEventListener("keydown", (e) => {
        if (e.key == "Enter") {
            me.createItem();
        }
    });


    core.on("updateItem", function (d) {
        let id = d.id;
        let s = d.sender;
        me.settings.currentID = id;
        me.updateItem(id, s);
    });

    this.updateItem = function (id, sender) {
        let it = core.items[id];
        //First check if we should show the item
        if (!it[me.settings.filterProp]) {
            return;
        }
        //Then check if the item already exists; if so then update it
        let currentItemSpan = me.taskList.querySelector("span[data-id='" + id + "']")
        if (!currentItemSpan) {
            currentItemSpan = me.template.cloneNode(true);
            me.taskList.appendChild(currentItemSpan);
            currentItemSpan.dataset.id = id;
            currentItemSpan.querySelector("button").innerHTML = "X";
        }
        for (i in me.settings.properties) {
            switch (me.settings.properties[i]) {
                case "text":
                case "tag":
                case "number":
                    if (it[i]) {
                        currentItemSpan.querySelector("[data-role='" + i + "']").value = it[i];
                    } else {
                        currentItemSpan.querySelector("[data-role='" + i + "']").value = "";
                    }
                    break;
                case "date":
                    if (it[i] && it[i].datestring) {
                        currentItemSpan.querySelector("[data-role='" + i + "']").value = it[i].datestring;
                    } else {
                        if (it[i] && typeof it[i] == "string") {
                            it[i] = {
                                datestring: it[i]
                            };
                            currentItemSpan.querySelector("[data-role='" + i + "']").value = it[i].datestring;
                            // May want to reparse the date aswell.
                            if (me.datereparse) me.datereparse(id);
                        }
                    }
                    break;
            }
        }

    }

    //Handle item deletion
    this.taskList.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() == "button") {
            core.fire("deleteItem", {
                id: e.target.parentElement.dataset.id,
                sender: this
            });
        }
    })
    this.deleteItem = function (id) {
        try {
            this.taskList.querySelector("span[data-id='" + id + "']").remove();
        }catch(e){
            return;
        }
    }

    core.on("deleteItem", (d) => {
        me.deleteItem(d.id)
    });

    this.updateSettings = function () {
        //Look at the settings and apply any relevant changes
        let htmlstring = `<span class="ids" style="display: inline-block;width: 60px;">ID:<span data-role='id'>none</span></span>`
        for (i in this.settings.properties) {
            switch (this.settings.properties[i]) {
                case "text":
                case "date":
                case "tag":
                    htmlstring += "<input data-role='" + i + "' placeholder='" + i + "'>";
                    break;
                case "number":
                    htmlstring += "<span>" + i + ":</span><input data-role='" + i + "' type='number'>";
                    break;
            }
        }
        this._template.innerHTML = htmlstring;
        //Recreate everything
        this.taskList.innerHTML = "";
        for (let i in core.items) {
            this.updateItem(i);
        }
    }

    //First time load
    this.updateSettings();
    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    this.fromSaveData = function (d) {
        Object.assign(this.settings, d);
        this.updateSettings();
        //then rehash the display or sth
    }

    this.taskList.addEventListener("input", (e) => {
        currentItem = core.items[e.target.parentElement.parentElement.dataset.id];

        switch (me.settings.properties[e.target.dataset.role]) {
            case "text":
            case "number":
            case "tag":
                currentItem[e.target.dataset.role] = e.target.value;
                break;
            case "date":
                if (!currentItem[e.target.dataset.role]) currentItem[e.target.dataset.role] = {};
                if (typeof currentItem[e.target.dataset.role] == "string") currentItem[e.target.dataset.role] = {
                    "datestring": currentItem[e.target.dataset.role]
                };
                currentItem[e.target.dataset.role].datestring = e.target.value;
                break;
        }

        //match all the item data and currentITem data
        core.fire("updateItem", {
            id: e.target.parentElement.parentElement.dataset.id,
            sender: me
        });
    })

    this.taskList.addEventListener("keyup", (e) => {
        if (e.target.tagName.toLowerCase() == "input" && this.settings.properties[e.target.dataset.role] == 'date' && e.key == "Enter") {
            me.datereparse(e.target.parentElement.parentElement.dataset.id);
        }
    })

    this.focusItem = function (id) {
        //Highlight in purple
        for (let i = 0; i < me.taskList.children.length; i++) {
            me.taskList.children[i].style.borderTop = "";
            me.taskList.children[i].style.borderBottom = "";
        }
        let _target = me.taskList.querySelector("[data-id='" + id + "']");
        _target.style.borderTop = "solid 3px purple";
        _target.style.borderBottom = "solid 3px purple";
    }

    this.taskList.addEventListener("focusin", (e) => {
        if (e.target.matches("input")) {
            core.fire("focus", {
                id: e.target.parentElement.parentElement.dataset.id,
                sender: this
            });
            this.focusItem(e.target.parentElement.parentElement.dataset.id);
        }
    })
    scriptassert([
        ['dateparser', 'genui/dateparser.js']
    ], () => {
        me.datereparse = function (it) {
            let dateprop = "";
            for (let i in me.settings.properties) {
                if (me.settings.properties[i] == 'date') {
                    dateprop = i;
                    break;
                }
            }
            if (dateprop == "") return;
            //specifically reparse the date on it;
            if (it) {
                core.items[it][dateprop].date = dateParser.richExtractTime(core.items[it][dateprop].datestring);
                if (!core.items[it][dateprop].date.length) core.items[it][dateprop].date = undefined;
                //ds=me.taskList.querySelector('span[data-id="'+it+'"] input[data-role="'+dateprop+'"]').value;
            }
            // get a list of Items
            let its = [];
            me.taskList.querySelectorAll("[data-id]").forEach(e => {
                let itm = {
                    id: e.dataset.id
                };
                //we are going to upgrade all dates that don't match protocol)
                if (core.items[itm.id][dateprop] && core.items[itm.id][dateprop].date) {
                    if (typeof core.items[itm.id][dateprop].date == "number") {
                        core.items[itm.id][dateprop].date = [{
                            date: core.items[itm.id][dateprop].date
                        }];
                    }
                    if (core.items[itm.id][dateprop].date[0]) itm.date = core.items[itm.id][dateprop].date[0].date;
                    else itm.date = Date.now() * 10000;
                } else itm.date = Date.now() * 10000;
                its.push(itm);
            });
            //sort everything based on the date.
            its.sort((a, b) => {
                return a.date - b.date
            });
            for (let i = 0; i < its.length; i++) {
                me.taskList.appendChild(me.taskList.querySelector("[data-id='" + its[i].id + "']"));
            }
            core.fire("dateUpdate");
        }
        me.datereparse();
    })


    scriptassert([
        ["dialog", "genui/dialog.js"]
    ], () => {
        me._dialog = document.createElement("div");

        me._dialog.innerHTML = `
        <div class="dialog">
        </div>`;
        dialogManager.checkDialogs(me._dialog);
        //Restyle dialog to be a bit smaller
        me._dialog = me._dialog.querySelector(".dialog");
        me.innerDialog = me._dialog.querySelector(".innerDialog");

        let d = document.createElement("div");
        d.innerHTML = `
        <p>Columns to show</p>
        <div class="proplist"></div>
        <p>You can pick more from the list below, or add a new property! </p>
        <span>Choose existing property:</span><select class="_prop">
        </select><br>
        <input class="adpt" placeholder="Or type a new property..."><br>
        <button class="adbt">Add</button>
        <p>Options</p>
        <p><input type="checkbox"><span>Sort by date</span></p>
        <p><input type="checkbox"><span>Delete items (instead of hiding)</span></p>
        <p>View items with the following property:</p> 
        <input data-role='filterProp' placeholder = 'Property name'></input>
        `
        d.querySelector(".adbt").addEventListener("click",
            function () {
                if (d.querySelector(".adpt").value != "") {
                    me.settings.properties[d.querySelector(".adpt").value] = 'text';
                } else {
                    me.settings.properties[d.querySelector("select._prop").value] = 'text';
                }
                me.showSettings();
            }
        )
        d.querySelector("input[data-role='filterProp']").addEventListener("input", function (e) {
            me.settings.filterProp = e.target.value;
        })
        me.innerDialog.appendChild(d);
        me._dialog.querySelector(".cb").addEventListener("click", function () {
            me.updateSettings();
            me.fire("viewUpdate");
        })

        me.proplist = me.innerDialog.querySelector(".proplist");
        //Handle select's in proplist
        me.proplist.addEventListener('change', function (e) {
            me.settings.properties[e.target.dataset.role] = e.target.value;
        })
        me.opList = me.innerDialog.querySelector("select._prop");
        //retrieve stuff
        operator.div.appendChild(me._dialog);
        //sort by date checkbox
        //Style tags button
        me.showSettings = function () {
            //Fill in dialog information
            //set the propertyname one
            me.innerDialog.querySelector('input[data-role="filterProp"]').value = me.settings.filterProp;
            //Get all available properties, by looping through all elements (?)
            me.opList.innerHTML = "";
            let props = {};
            for (let i in core.items) {
                for (let j in core.items[i]) {
                    if (typeof core.items[i][j] != "function") props[j] = true;
                }
            }
            for (let prop in props) {
                if (!me.settings.properties[prop]) {
                    let opt = document.createElement("option");
                    opt.innerText = prop;
                    opt.value = prop;
                    me.opList.appendChild(opt);
                }
            }
            // Now fill in the ones which we're currently monitoring.
            me.proplist.innerHTML = "";
            for (let prop in me.settings.properties) {
                let pspan = document.createElement("p");
                pspan.innerHTML = `<span>` + prop + `</span>
                <select data-role=` + prop + `>
                    <option value="text">Text</option>
                    <option value="date">Date</option>
                    <option value="tag">Tag</option>
                    <option value="number">Number</option>
                </select>`
                pspan.querySelector("select").value = me.settings.properties[prop];
                me.proplist.appendChild(pspan);
            }
            //A checkbox for all properties, with types
            me._dialog.style.display = "block";
        }
    });

    core.on("focus", function (data) {
        me.focusItem(data.id);
    })
});