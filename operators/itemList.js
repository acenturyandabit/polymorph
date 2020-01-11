polymorph_core.registerOperator("itemList", function (container) {
    //initialisation
    //#region
    let defaultSettings = {
        properties: {
            title: "text"
        },
        propertyWidths: {},
        filter: guid(),
        enableEntry: true,
        implicitOrder: true,
        linkProperty: "to"
    };
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);
    //upgrade older ones
    if (this.settings.filterProp) {
        this.settings.filter = this.settings.filterProp;
        delete this.settings.filterProp;
    }
    this.settingsBar = document.createElement('div');
    this.settingsBar.innerHTML = `<div></div>`
    this.taskListBar = document.createElement("div");
    this.taskListBar.style.cssText = "flex: 1 0 auto; display: flex;height:100%; flex-direction:column;";
    //top / insert 
    this.template = htmlwrap(`<span style="display:block; width:fit-content;">
    <span></span>
    <button>&gt;</button>
    <div class="subItemBox"></div>
    </span>`);
    this._template = this.template.querySelector("span");
    this.taskListBar.appendChild(this.template);



    this.taskListBar.appendChild(document.createElement("hr"));
    this.taskListBar.style.whiteSpace = "nowrap";
    this.taskList = document.createElement("div");
    this.taskList.style.cssText = "height:100%; overflow-y:auto; min-width:fit-content;";
    this.taskListBar.appendChild(this.taskList);
    container.div.appendChild(htmlwrap(
        `<style>
        input{
            background: inherit;
            color:inherit;
        }
        div>span{
            background:white;
        }
        span[data-id]{
            background:white;
        }
        div.subItemBox>span{
            margin-left: 10px;
        }
        .ffocus{
            border-top:solid 3px purple;
            border-bottom:solid 3px purple;
        }

        .resizable-input {
            /* make resizable */
            overflow-x: hidden;
            resize: horizontal;
            display: inline-block;
        
            /* no extra spaces */
            padding: 0;
            margin: 0;
            white-space: nowrap;
          
            /* default widths */
            width: 10em;
            min-width: 2em;
            max-width: 30em;
        }
        
        /* let <input> assume the size of the wrapper */
        .resizable-input > input {
            width: 100%;
            box-sizing: border-box;
            margin: 0;
        }
        
        /* add a visible handle */
        .resizable-input > span {
            display: inline-block;
            vertical-align: bottom;
            margin-left: -16px;
            width: 16px;
            height: 16px;
            background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAJUlEQVR4AcXJRwEAIBAAIPuXxgiOW3xZYzi1Q3Nqh+bUDk1yD9sQaUG/4ehuEAAAAABJRU5ErkJggg==");
            cursor: ew-resize;
        }
        </style>`
    ));
    //Resize credits to u/MoonLite on stackoverflow

    container.div.appendChild(this.taskListBar);

    Object.defineProperty(this, "renderedItems", {
        get: () => {
            let items = Array.from(this.taskList.querySelectorAll("span[data-id]"));
            return items.map((i) => i.dataset.id);
        }
    })

    //#endregion

    this.renderItem = (id) => {
        let it = polymorph_core.items[id];
        let currentItemSpan = this.taskList.querySelector("span[data-id='" + id + "']")
        //First check if we should show the item
        if (!mf(this.settings.filter, it)) {
            //if existent, remove
            if (currentItemSpan) currentItemSpan.remove();
            return false;
        }
        //Then check if the item already exists; if so then update it
        if (!currentItemSpan) {
            currentItemSpan = this.template.cloneNode(true);
            currentItemSpan.style.display = "block";
            currentItemSpan.dataset.id = id;
            currentItemSpan.children[1].innerText = "X";
            this.taskList.appendChild(currentItemSpan);
        }
        for (i in this.settings.properties) {
            switch (this.settings.properties[i]) {
                case "text":
                case "number":
                    currentItemSpan.querySelector("[data-role='" + i + "']").value = (it[i] != undefined) ? it[i] : "";
                    break;
                case "object":
                    currentItemSpan.querySelector("[data-role='" + i + "']").value = (it[i] != undefined) ? JSON.stringify(it[i]) : "";
                    break;
                case "date":
                    if (!currentItemSpan.querySelector("[data-role='" + i + "']").matches(":focus")) {
                        if (it[i] && it[i].datestring) {

                            currentItemSpan.querySelector("[data-role='" + i + "']").value = it[i].prettyDateString || it[i].datestring;
                        } else {
                            if (it[i] && typeof it[i] == "string") {
                                it[i] = {
                                    datestring: it[i]
                                };
                                currentItemSpan.querySelector("[data-role='" + i + "']").value = it[i].prettyDateString || it[i].datestring;
                                // May want to reparse the date aswell.
                                if (this.datereparse) this.datereparse(id);
                            }
                        }
                    }
                    break;
            }
        }
        if (it.style) {
            currentItemSpan.style.background = it.style.background;
            currentItemSpan.style.color = it.style.color || matchContrast((/rgba?\([\d,\s]+\)/.exec(getComputedStyle(currentItemSpan).background) || ['#ffffff'])[0]); //stuff error handling
        } else {
            //enforce white, in case its parent is not white
            currentItemSpan.style.background = "white";
            currentItemSpan.style.color = "black";
        }
        //then check if i have a direct and unique parent that is in the current set.
        let uniqueParent = undefined;
        if (this.settings.linkProperty) {
            let ri = this.renderedItems;
            for (let _i = 0; _i < ri.length; _i++) {
                let i = ri[_i];
                if (polymorph_core.items[i][this.settings.linkProperty] && polymorph_core.items[i][this.settings.linkProperty][id] && id != i) {
                    if (uniqueParent == undefined) {
                        uniqueParent = i;
                    } else {
                        uniqueParent = undefined;
                        break;
                    }
                }
            }
        }
        if (uniqueParent != undefined && !(currentItemSpan.parentElement && currentItemSpan.parentElement.parentElement.dataset.id == uniqueParent)) {
            try {
                this.taskList.querySelector(`span[data-id='${uniqueParent}']>div.subItemBox`).appendChild(currentItemSpan);
            } catch (error) {
                if (error instanceof DOMException) {
                    //just an infinite loop, all chill
                } else {
                    throw error;
                }
            }
        }
    }



    //Item creation
    //#region
    this.createItem = () => {
        let it = {};
        //clone the template and parse it
        //get data and register item
        for (i in this.settings.properties) {
            switch (this.settings.properties[i]) {
                case "text":
                case "number":
                    it[i] = this.template.querySelector("[data-role='" + i + "']").value;
                    break;
                case "object":
                    try {
                        it[i] = JSON.parse(this.template.querySelector("[data-role='" + i + "']").value);
                    } catch (e) {

                    }
                    break;
                case "date":
                    if (!it[i]) it[i] = {};
                    if (typeof it[i] == "string") it[i] = {
                        datestring: it[i]
                    };
                    it[i].datestring = this.template.querySelector("[data-role='" + i + "']").value;
                    break;
            }
            //clear the template
            this.template.querySelector("[data-role='" + i + "']").value = "";
        }
        //ensure the filter property exists
        if (this.settings.filter && !it[this.settings.filter]) it[this.settings.filter] = Date.now();
        let id = polymorph_core.insertItem(it);

        if (this.shiftDown && this.settings.linkProperty) {
            let fi = this.taskList.querySelector(".ffocus");
            if (fi) {
                //we are creating a subitem
                let fiid = fi.dataset.id;
                fi = polymorph_core.items[fiid];
                if (!fi[this.settings.linkProperty]) fi[this.settings.linkProperty] = {};
                fi[this.settings.linkProperty][id] = true;
                container.fire("updateItem", {
                    id: fiid,
                    sender: this
                });
            }
        }
        container.fire("createItem", {
            id: id,
            sender: this
        });
        this.renderItem(id);
        this.datereparse(id);
        return id;
    }

    container.on("createItem", (d) => {
        let it = polymorph_core.items[d.id];
        if (this.settings.filter && !it[this.settings.filter]) it[this.settings.filter] = Date.now();
        this.renderItem(d.id);
    })

    document.body.addEventListener("keydown", (e) => {
        //this is a global listener across operators, but will abstract away target; so don't use it for normal stuff.
        if (e.getModifierState("Shift")) {
            this.shiftDown = true;
            this.template.children[1].innerHTML = "&#x21a9;";
        }
    });
    container.div.addEventListener("keydown", (e) => {
        if (e.key == "Enter" && (e.getModifierState("Control") || e.getModifierState("Meta")) && e.target.dataset.role) {
            let id = this.createItem();
            container.div.querySelector(`[data-id='${id}'] [data-role='${e.target.dataset.role}']`).focus();
        }
    })

    document.body.addEventListener("keyup", (e) => {
        if (!e.getModifierState("Shift")) {
            this.shiftDown = false;
            this.template.children[1].innerHTML = "&gt;";
        }
    });
    this.template.querySelector("button").addEventListener("click", this.createItem);
    this.template.addEventListener("keydown", (e) => {
        if (e.key == "Enter") {
            this.createItem();
        }
    });

    //#endregion

    //Item updating
    //#region
    container.on("updateItem", (d) => {
        let id = d.id;
        let s = d.sender;
        this.settings.currentID = id;
        //sortcap may not have been declared yet
        if (s != "GARBAGE_COLLECTOR" && this.sortcap) this.sortcap.submit();
        return this.renderItem(id);
    });

    //#endregion

    //auto
    setInterval(() => {
        if (!this.container.visible()) return; //if not shown then dont worryy
        //its every 10s, we can afford for it to be detailed

        //Create an auto list - formed by checking every date property of every tiem we care about

        for (let i in this.settings.properties) {
            if (this.settings.properties[i] == 'date') {
                let listofitems = this.taskList.querySelectorAll("[data-role='" + i + "']");
                for (let i = 0; i < listofitems.length; i++) {
                    if (listofitems[i].value.indexOf("auto") != -1) {
                        if (this.datereparse) this.datereparse(listofitems[i].parentElement.parentElement.parentElement.dataset.id);
                    }
                }
            }
        }
        this.sortItems();
    }, 10000);

    //Item deletion
    //Handle item deletion
    this.taskList.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() == "button") {
            container.fire("deleteItem", {
                id: e.target.parentElement.dataset.id,
                sender: this
            });
            delete polymorph_core.items[e.target.parentElement.dataset.id][this.settings.filter];
            container.fire("deleteItem", {
                id: e.target.parentElement.dataset.id,
                sender: this
            });
        }
    })

    container.on("deleteItem", (d) => {
        this.deleteItem(d.id);
        this.renderItem(d.id);
    })

    this.reRenderEverything = () => {
        this.taskList.innerHTML = "";
        for (let i in polymorph_core.items) {
            this.renderItem(i, true);
        }
        //and again for links
        for (let i in polymorph_core.items) {
            this.renderItem(i);
        }
    }

    //resizing
    container.div.addEventListener("mousemove", (e) => {
        if (e.buttons) {
            for (let i = 0; i < e.path.length; i++) {
                if (e.path[i].dataset && e.path[i].dataset.containsRole) {
                    let els = container.div.querySelectorAll(`[data-contains-role=${e.path[i].dataset.containsRole}]`);
                    for (let j = 0; j < els.length; j++)els[j].style.width = e.path[i].clientWidth;
                    this.settings.propertyWidths[e.path[i].dataset.containsRole] = e.path[i].clientWidth;
                    break;
                } else if (e.path[i] == this.taskList) {
                    break;
                }
            }
        }
    })

    waitForFn.apply(this, ["setSearchTemplate"]);
    waitForFn.apply(this, ["sortItems"]);
    scriptassert([["itemlist searchsort", "operators/itemList.searchsort.js"]], () => {
        __itemlist_searchsort.apply(this);
    })

    this.updateSettings = () => {
        //Look at the settings and apply any relevant changes
        let htmlstring = ``
        for (i in this.settings.properties) {
            switch (this.settings.properties[i]) {
                case "text":
                case "date":
                case "object":
                    htmlstring += `<span class="resizable-input" data-contains-role="${i}"><input data-role='${i}' placeholder='${i}'><span></span></span>`;
                    break;
                case "number":
                    htmlstring += "<span>" + i + ":</span><input data-role='" + i + "' type='number'>";
                    break;
            }
        }
        this._template.innerHTML = htmlstring;
        this.setSearchTemplate(htmlstring);
        //resize stuff
        for (let i in this.settings.propertyWidths) {
            if (this.settings.properties[i]) this._template.querySelector(`[data-contains-role=${i}]`).style.width = this.settings.propertyWidths[i];
            else delete this.settings.propertyWidths[i];
        }
        //Recreate everything
        this.reRenderEverything();
        //hide or show based on entry enabled
        if (this.settings.enableEntry == false) {
            this.template.style.display = "none";
        }
        this.container.fire("updateItem", { id: this.container.id })
    }

    //First time load
    this.updateSettings();
    //Saving and loading

    this.taskList.addEventListener("input", (e) => {
        currentItem = polymorph_core.items[e.target.parentElement.parentElement.parentElement.dataset.id];
        switch (this.settings.properties[e.target.dataset.role]) {
            case "text":
            case "number":
                currentItem[e.target.dataset.role] = e.target.value;
                break;
            case "object":
                try {
                    currentItem[e.target.dataset.role] = JSON.parse(e.target.value);
                    e.target.style.background = "white";
                    e.target.style.color = "black";
                } catch (e) {
                    e.target.style.background = "red";
                    e.target.style.color = "white";
                    return;
                }
                break;
            case "date":
                if (!currentItem[e.target.dataset.role]) currentItem[e.target.dataset.role] = {};
                if (!currentItem[e.target.dataset.role].datestring) currentItem[e.target.dataset.role] = {
                    "datestring": ""
                };
                currentItem[e.target.dataset.role].datestring = e.target.value;
                currentItem[e.target.dataset.role].date = dateParser.richExtractTime(currentItem[e.target.dataset.role].datestring);
                break;
        }

        //match all the item data and currentItem data
        container.fire("updateItem", {
            id: e.target.parentElement.parentElement.parentElement.dataset.id,
            sender: this
        });
    })

    this.taskList.addEventListener("focusout", (e) => {
        if (!this.isSorting) {
            currentItem = polymorph_core.items[e.target.parentElement.parentElement.parentElement.dataset.id];
            switch (this.settings.properties[e.target.dataset.role]) {
                case "date":
                    if (currentItem[e.target.dataset.role] && currentItem[e.target.dataset.role].date) {
                        currentItem[e.target.dataset.role].prettyDateString = dateParser.humanReadableRelativeDate(currentItem[e.target.dataset.role].date[0].date);
                        e.target.value = currentItem[e.target.dataset.role].prettyDateString;
                    }
                    break;
            }
        }
    })


    this.taskList.addEventListener("focusin", (e) => {
        currentItem = polymorph_core.items[e.target.parentElement.parentElement.parentElement.dataset.id];
        switch (this.settings.properties[e.target.dataset.role]) {
            case "date":
                if (currentItem[e.target.dataset.role]) {
                    e.target.value = currentItem[e.target.dataset.role].datestring;
                }
                break;
        }
    })
    this.taskList.addEventListener("keyup", (e) => {
        if (e.target.tagName.toLowerCase() == "input" && this.settings.properties[e.target.dataset.role] == 'date' && e.key == "Enter") {
            this.datereparse(e.target.parentElement.parentElement.parentElement.dataset.id);
        }
    })

    this.focusItem = (id) => {
        //Highlight in purple
        let _target = this.taskList.querySelector("[data-id='" + id + "']");
        if (_target) {
            let spans = this.taskList.querySelectorAll(`span[data-id]`);
            for (let i = 0; i < spans.length; i++) {
                spans[i].classList.remove("ffocus");
            }
            _target.classList.add("ffocus");
            let bcr = _target.parentElement.getBoundingClientRect();
            let tcr = _target.getBoundingClientRect();
            if (tcr.y < bcr.y || tcr.y + tcr.height > bcr.y + bcr.height) _target.scrollIntoView({
                behavior: "smooth"
            });
        }
    }

    this.taskList.addEventListener("focusin", (e) => {
        if (e.target.matches("input")) {
            container.fire("focusItem", {
                id: e.target.parentElement.parentElement.parentElement.dataset.id,
                sender: this
            });
            this.focusItem(e.target.parentElement.parentElement.parentElement.dataset.id);
        }
    })
    container.on("focusItem", (data) => {
        if (this.settings.operationMode == "focus") {
            if (data.sender.container.container.uuid == this.settings.focusOperatorID) {
                this.settings.filter = data.id;
            }
        }
        this.focusItem(data.id);
    });


    scriptassert([
        ['dateparser', 'genui/dateparser.js']
    ], () => {
        this.datereparse = (it) => {
            let dateprop = "";
            for (let i in this.settings.properties) {
                if (this.settings.properties[i] == 'date') {
                    dateprop = i;
                    //specifically reparse the date on it;
                    if (it) {
                        if (polymorph_core.items[it][dateprop]) {
                            polymorph_core.items[it][dateprop].date = dateParser.richExtractTime(polymorph_core.items[it][dateprop].datestring);
                            if (!polymorph_core.items[it][dateprop].date.length) polymorph_core.items[it][dateprop].date = undefined;
                            //ds=this.taskList.querySelector('span[data-id="'+it+'"] input[data-role="'+dateprop+'"]').value;
                        }
                    }
                    // get a list of Items
                    let its = [];
                    this.taskList.querySelectorAll("[data-id]").forEach(e => {
                        let itm = {
                            id: e.dataset.id
                        };
                        if (!polymorph_core.items[itm.id]) {
                            //nerf the e that spawned this, then break
                            //idek how this happens :(
                            e.remove();
                            return;
                        }
                        //we are going to upgrade all dates that don't match protocol)
                        if (polymorph_core.items[itm.id][dateprop] && polymorph_core.items[itm.id][dateprop].date) {
                            if (typeof polymorph_core.items[itm.id][dateprop].date == "number") {
                                polymorph_core.items[itm.id][dateprop].date = [{
                                    date: polymorph_core.items[itm.id][dateprop].date
                                }];
                            }
                            if (polymorph_core.items[itm.id][dateprop].date[0]) itm.date = polymorph_core.items[itm.id][dateprop].date[0].date;
                            else itm.date = Date.now() * 10000;
                        } else itm.date = Date.now() * 10000;
                        its.push(itm);
                    });
                }
            }
            //sort everything
            this.sortItems();
            container.fire("dateUpdate");
        }
        this.datereparse();
    })

    this.container.registerContextMenu(this.taskList, (el) => {
        let id = el;
        while (!id.dataset.id && id != this.taskList) {
            id = id.parentElement;
        }
        if (id.dataset.id) {
            let obj = { id: id.dataset.id };
            if (el.dataset.role) obj.role = el.dataset.role;
            let ls = [];
            if (this.settings.properties[el.dataset.role] == "date") ls.push("Convert to fixed date::operator.toFixedDate")
            return { e: obj, ls: ls };
        }
    });

    this.ctxCommands = {
        "toFixedDate": (e, ctr) => {
            let id = e.id;
            let contextedProp = e.role;
            polymorph_core.items[id][contextedProp].datestring = new Date(polymorph_core.items[id][contextedProp].date[0].date).toLocaleString() + ">" + new Date(polymorph_core.items[id][contextedProp].date[0].endDate).toLocaleString();;
            this.datereparse(id);
        }
    }

    /*
    scriptassert([
        ["contextmenu", "genui/contextMenu.js"]
    ], () => {
        let ctm = new _contextMenuManager(container.div);
        let contextedItem;
        let contextedInput;
        let contextedProp;
        let menu;

        let filter = (e) => {
            contextedInput = e.target;
            contextedProp = contextedInput.dataset.role;
            let id = contextedInput;
            while (!id.dataset.id) {
                id = id.parentElement;
            }
            contextedItem = id.dataset.id;
            if (this.settings.properties[e.target.dataset.role] == "date") {
                menu.querySelector(".fixed").style.display = "block";
            } else {
                menu.querySelector(".fixed").style.display = "none";
            }
            if (polymorph_core.items[contextedItem].style) {
                menu.querySelector(".background").value = polymorph_core.items[contextedItem].style.background || "";
                menu.querySelector(".color").value = polymorph_core.items[contextedItem].style.color || "";
            } else {
                menu.querySelector(".background").value = "";
                menu.querySelector(".color").value = "";
            }
            return true;
        }
        menu = ctm.registerContextMenu(`<li class="fixed">Convert to fixed date</li>
        <li class="back"><input class="background" placeholder="Background color"></input></li>
        <li class="fore"><input class="color" placeholder="Foreground color"></input></li>
        `, this.taskList, "input", filter)
        menu.querySelector(".fixed").addEventListener("click", (e) => {
            let id = contextedItem;
            contextedInput.value = new Date(polymorph_core.items[id][contextedProp].date[0].date).toLocaleString() + ">" + new Date(polymorph_core.items[id][contextedProp].date[0].endDate).toLocaleString();
            polymorph_core.items[id][contextedProp].datestring = contextedInput.value;
            this.datereparse(id);
            menu.style.display = "none";
        })

        function updateStyle(e) {
            let cid = contextedItem;

            if (!polymorph_core.items[cid].style) polymorph_core.items[cid].style = {};
            polymorph_core.items[cid].style[e.target.className] = e.target.value;
            container.fire("updateItem", {
                sender: this,
                id: cid
            });
        }
        menu
            .querySelector(".back input")
            .addEventListener("input", updateStyle);
        menu
            .querySelector(".fore input")
            .addEventListener("input", updateStyle);
    })
    */

    //settings dialog
    //#region
    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `
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
    <h1>Role</h1>
    <select data-role="operationMode">
    <option value="static">Display static list</option>
    <option value="focus">Display focused list</option>
    <option value="iface">Link to another container...</option>
    </select>
    <p>View items with the following property:</p> 
    <input data-role='filter' placeholder = 'Property name'></input>
    <p>container to focus on:</p> 
    <input data-role="focusOperatorID" placeholder="container UID (use the button)">
    <button class="targeter">Select container</button>
    `;
    let options = {
        entryok: new _option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "enableEntry",
            label: "Enable adding new items"
        }),
        implicitOrder: new _option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "implicitOrder",
            label: "Implicit ordering"
        }),
        linkProperty: new _option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "linkProperty",
            label: "Property for links (leave blank to ignore links)"
        })
    }
    let d = this.dialogDiv;
    this.showDialog = () => {
        // update your dialog elements with your settings
        //Fill in dialog information
        //set all property settings.
        for (i in this.settings) {
            let it = this.dialogDiv.querySelector("[data-role='" + i + "']");
            if (it) it.value = this.settings[i];
        }
        //Get all available properties, by looping through all elements (?)
        this.opList.innerHTML = "";
        let props = {};
        for (let i in polymorph_core.items) {
            for (let j in polymorph_core.items[i]) {
                if (typeof polymorph_core.items[i][j] != "function") props[j] = true;
            }
        }
        for (let prop in props) {
            if (!this.settings.properties[prop]) {
                let opt = document.createElement("option");
                opt.innerText = prop;
                opt.value = prop;
                this.opList.appendChild(opt);
            }
        }
        //enable adding new items checkbox
        for (i in options) {
            options[i].load();
        }
        // Now fill in the ones which we're currently monitoring.
        this.proplist.innerHTML = "";
        for (let prop in this.settings.properties) {
            let pspan = document.createElement("p");
            pspan.innerHTML = `<span>` + prop + `</span>
            <select data-role=` + prop + `>
                <option value="text">Text</option>
                <option value="date">Date</option>
                <option value="object">Object</option>
                <option value="number">Number</option>
            </select><label>Sort <input type="radio" name="sortie" data-ssrole=${prop}></label>` + `<button data-krole=` + prop + `>X</button>`
            pspan.querySelector("select").value = this.settings.properties[prop];
            this.proplist.appendChild(pspan);
        }
    }

    //when clicking a sort radio button, turn off implict ordering
    this.proplist = this.dialogDiv.querySelector(".proplist");
    this.proplist.addEventListener("input", (e) => {
        if (e.target.matches("[name='sortie']")) {
            this.settings.implicitOrder = false;
            options.implicitOrder.load();
        }
    })

    this.dialogUpdateSettings = () => {
        // pull settings and update when your dialog is closed.
        this.updateSettings();
        this.sortItems();
        container.fire("updateItem", { id: this.container.id });
    }

    //adding new buttons
    d.querySelector(".adbt").addEventListener("click",
        () => {
            if (d.querySelector(".adpt").value != "") {
                this.settings.properties[d.querySelector(".adpt").value] = 'text';
                d.querySelector(".adpt").value = "";
            } else {
                this.settings.properties[d.querySelector("select._prop").value] = 'text';
            }
            this.showDialog();
        }
    )

    //the filter property.
    d.querySelector("input[data-role='filter']").addEventListener("input", (e) => {
        this.settings.filter = e.target.value;
    })

    //Handle select's in proplist
    this.proplist.addEventListener('change', (e) => {
        if (e.target.matches("select")) this.settings.properties[e.target.dataset.role] = e.target.value;
    })
    this.proplist.addEventListener('click', (e) => {
        if (e.target.matches("[data-krole]")) {
            delete this.settings.properties[e.target.dataset.krole];
            this.showDialog();
        }
    })
    this.proplist.addEventListener("input", (e) => {
        if (e.target.matches("input[type='radio']")) {
            this.settings.sortby = e.target.dataset.ssrole;
        }
    })

    this.opList = this.dialogDiv.querySelector("select._prop");
    //retrieve stuff
    //sort by date checkbox
    //Style tags button
    //#endregion



});