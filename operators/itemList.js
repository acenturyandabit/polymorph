if (!isPhone()) {
    polymorph_core.registerOperator("itemList", {
        section: "Standard",
        description: "Arrange your items in a list.",
        displayName: "List",
        imageurl: "assets/operators/list.png"
    }, function(container) {
        //initialisation
        let defaultSettings = {
            properties: {
                title: "text"
            },
            propertyWidths: {},
            filter: polymorph_core.guid(),
            enableEntry: true,
            implicitOrder: true,
            linkProperty: "to",
            entrySearch: false,
            propOrder: []
        };
        polymorph_core.operatorTemplate.call(this, container, defaultSettings);
        this.rootdiv.remove(); //we dont want this
        //upgrade older ones
        if (this.settings.filterProp) {
            this.settings.filter = this.settings.filterProp;
            delete this.settings.filterProp;
        }
        if (Object.keys(this.settings.properties).length != this.settings.propOrder.length) this.settings.propOrder = Object.keys(this.settings.properties);
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
        
        </style>`
        ));

        container.div.appendChild(this.taskListBar);

        this.renderedItems = {};

        this.renderItem = (id) => {
            let it = polymorph_core.items[id];
            let currentItemSpan = this.renderedItems[id];
            //First check if we should show the item
            if (!this.itemRelevant(id)) {
                //if existent, remove
                if (currentItemSpan) currentItemSpan.remove();
                delete this.renderedItems[id];
                return false;
            }
            //Then check if the item already exists; if so then update it
            if (!currentItemSpan) {
                currentItemSpan = this.template.cloneNode(true);
                currentItemSpan.style.display = "block";
                currentItemSpan.dataset.id = id;
                currentItemSpan.children[1].innerText = "X";
                this.taskList.appendChild(currentItemSpan);
                this.renderedItems[id] = currentItemSpan;
            }
            for (let i = 0; i < this.settings.propOrder.length; i++) {
                let p = this.settings.propOrder[i];
                switch (this.settings.properties[p]) {
                    case "text":
                        currentItemSpan.children[0].children[i + 1].children[0].value = (it[p] != undefined) ? it[p] : "";
                        break;
                    case "number":
                        currentItemSpan.children[0].children[i + 1].children[1].value = (it[p] != undefined) ? it[p] : "";
                        break;
                    case "object":
                        currentItemSpan.querySelector("[data-role='" + p + "']").value = (it[p] != undefined) ? JSON.stringify(it[p]) : "";
                        break;
                    case "date":
                        if (!currentItemSpan.querySelector("[data-role='" + p + "']").matches(":focus")) {
                            if (it[p]) {
                                if (!it[p].datestring && typeof it[p] == "string") {
                                    it[p] = {
                                        datestring: it[p]
                                    };
                                    if (this.datereparse) this.datereparse(id);
                                }
                                if (it[p].date && it[p].date.length && !it[p].prettyDateString) {
                                    it[p].prettyDateString = dateParser.humanReadableRelativeDate(it[p].date[0].date);
                                }
                                currentItemSpan.querySelector("[data-role='" + p + "']").value = it[p].prettyDateString || it[p].datestring;
                            } else {
                                currentItemSpan.querySelector("[data-role='" + p + "']").value = "";

                            }
                        } else {
                            currentItemSpan.querySelector("[data-role='" + p + "']").value = it[p].datestring;
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
                let ri = Object.keys(this.renderedItems);
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
                    Array.from(this.renderedItems[uniqueParent].children).filter(i => i.classList.contains("subItemBox"))[0].appendChild(currentItemSpan);
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
            for (let i of this.settings.propOrder) {
                switch (this.settings.properties[i]) {
                    case "text":
                    case "number":
                        if (this.template.querySelector("[data-role='" + i + "']").value) it[i] = this.template.querySelector("[data-role='" + i + "']").value;
                        break;
                    case "object":
                        try {
                            it[i] = JSON.parse(this.template.querySelector("[data-role='" + i + "']").value);
                        } catch (e) {

                        }
                        break;
                    case "date":
                        if (this.template.querySelector("[data-role='" + i + "']").value) {
                            if (!it[i]) it[i] = {};
                            if (typeof it[i] == "string") it[i] = {
                                datestring: it[i]
                            };
                            it[i].datestring = this.template.querySelector("[data-role='" + i + "']").value;
                        } else if (i == this.settings.filter) {
                            it[i] = {
                                datestring: "now" // is this useful to have as a default? sure
                            };
                        }
                        break;
                }
                //clear the template
                this.template.querySelector("[data-role='" + i + "']").value = "";
            }
            //ensure the filter property exists
            if (this.settings.filter && !it[this.settings.filter]) it[this.settings.filter] = Date.now();
            //if (this.settings.implicitOrder) { it[this.settings.filter] = polymorph_core.items[this.taskList.children[this.taskList.children.length].datset.id][this.settings.filter] + 1 };
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
            this.sortItems();
            //cheap and dirty hack to ensure that we only focus after sort has been called
            //todo: use promises
            //also fire a focus event for the item, but don't actually focus (in case of multiple entry)
            setTimeout(() => container.fire("focusItem", {
                id: id,
                sender: this
            }), 600);
            return id;
        }

        container.on("createItem", (d) => {
            let it = polymorph_core.items[d.id];
            if (this.settings.filter && !it[this.settings.filter]) it[this.settings.filter] = Date.now();
            this.renderItem(d.id);
        })

        document.body.addEventListener("keydown", (e) => {
            //this is a global listener across operators, but will abstract away target; so don't use it for normal stuff.
            if (!this.shiftDown && e.getModifierState("Shift")) {
                this.shiftDown = true;
                this.template.children[1].innerHTML = "&#x21a9;";
            }
        });
        container.div.addEventListener("keydown", (e) => {
            if (e.key == "Enter" && (e.getModifierState("Control") || e.getModifierState("Meta")) && e.target.dataset.role) {
                let id = this.createItem();
                this.renderedItems[id].querySelector(`[data-role='${e.target.dataset.role}']`).focus();
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

        container.on("updateItem", (d) => {
            let id = d.id;
            if (!this.itemRelevant(id)) {
                if (this.renderedItems[id]) {
                    this.renderedItems[id].remove();
                    delete this.renderedItems[id];
                }
                return;
            }
            if (d.sender == this) return; //dont rerender self
            this.settings.currentID = id;
            //sortcap may not have been declared yet
            if (d.sender != "GARBAGE_COLLECTOR" && this.sortcap) this.sortcap.submit();
            return this.renderItem(id);
        });

        //#endregion

        //auto
        this.intervalsToClear.push(setInterval(() => {
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
        }, 10000));

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
                this.renderItem(d.id); // actually remove the item
            }
        })

        container.on("deleteItem", (d) => {
            this.deleteItem(d.id);
            this.renderItem(d.id);
        })

        this.reRenderEverything = () => {
            this.taskList.innerHTML = "";
            this.renderedItems = [];
            for (let i in polymorph_core.items) {
                this.renderItem(i, true);
            }
            //and again for links
            for (let i in polymorph_core.items) {
                this.renderItem(i);
            }
        }

        let resizingRole = "";
        let resizingEl = undefined;
        //resizing
        container.div.addEventListener("mousedown", (e) => {
            let composedPath = e.composedPath();
            for (let i = 0; i < composedPath.length; i++) {
                if (composedPath[i].dataset && composedPath[i].dataset.containsRole) {
                    resizingRole = composedPath[i].dataset.containsRole;
                    resizingEl = composedPath[i];
                } else if (composedPath[i] == this.taskList) break;
            }
        })
        container.div.addEventListener("mousemove", (e) => {
            if (e.buttons && resizingRole && resizingEl) {
                let els = container.div.querySelectorAll(`[data-contains-role='${resizingRole}']`);
                let desiredW = resizingEl.clientWidth;
                for (let j = 0; j < els.length; j++) els[j].style.width = desiredW;
                this.settings.propertyWidths[resizingRole] = desiredW;
            }
        })

        function clearOut() {
            resizingRole = undefined;
            resizingEl = undefined;
        }

        container.div.addEventListener("mouseup", clearOut);
        container.div.addEventListener("mouseleave", clearOut);


        __itemlist_searchsort.apply(this);

        this.updateSettings = () => {
            //Look at the settings and apply any relevant changes
            this.settings.propOrder = Object.keys(this.settings.properties);
            let htmlstring = `<span class="draghandle">&#10247;</span>`;
            for (i of this.settings.propOrder) {
                switch (this.settings.properties[i]) {
                    case "text":
                    case "date":
                    case "object":
                        htmlstring += `<span class="resizable-input" data-contains-role="${i}"><input data-role='${i}' placeholder='${i}'></span>`;
                        break;
                    case "number":
                        htmlstring += "<span><span>" + i + ":</span><input data-role='" + i + "' type='number'></span>";
                        break;
                }
            }
            this._template.innerHTML = htmlstring;
            this.setSearchTemplate(htmlstring);
            //resize stuff
            for (let i in this.settings.propertyWidths) {
                if (this.settings.properties[i]) this._template.querySelector(`[data-contains-role='${i}']`).style.width = this.settings.propertyWidths[i];
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
                    currentItem[e.target.dataset.role] = dateParser.stringToEvent(e.target.value);
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
                this.renderItem(e.target.parentElement.parentElement.parentElement.dataset.id);
                container.fire("dateUpdate")
            }
        })

        this.focusItem = (id) => {
            //Highlight in purple
            let _target = this.renderedItems[id];
            if (_target) {
                let spans = Object.values(this.renderedItems);
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
            if (this.internalRefocus) {
                this.internalRefocus = false;
                return;
            }
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


        this.datereparse = (it) => {
            let dateprop = "";
            for (let i in this.settings.properties) {
                if (this.settings.properties[i] == 'date') {
                    dateprop = i;
                    //specifically reparse the date on it;
                    if (it) {
                        if (polymorph_core.items[it][dateprop]) {
                            polymorph_core.items[it][dateprop] = dateParser.stringToEvent(polymorph_core.items[it][dateprop].datestring);
                            //ds=this.taskList.querySelector('span[data-id="'+it+'"] input[data-role="'+dateprop+'"]').value;
                        }
                    }
                    // get a list of Items
                    let its = [];
                    Object.values(this.renderedItems).forEach(e => {
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
                polymorph_core.items[id][contextedProp].datestring = new Date(polymorph_core.items[id][contextedProp].date[0].date).toLocaleString() + ">" + new Date(polymorph_core.items[id][contextedProp].date[0].endDate).toLocaleString();
                this.datereparse(id);
            }
        }



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
            entryok: new polymorph_core._option({
                div: this.dialogDiv,
                type: "bool",
                object: this.settings,
                property: "enableEntry",
                label: "Enable adding new items"
            }),
            implicitOrder: new polymorph_core._option({
                div: this.dialogDiv,
                type: "bool",
                object: this.settings,
                property: "implicitOrder",
                label: "Implicit ordering (Enables drag and drop, disables existing ordering)",
                afterInput: () => {
                    this.settings.sortby = undefined;
                    Array.from(this.proplist.querySelectorAll("input[type='radio']")).forEach(i => i.checked = false);
                }
            }),
            linkProperty: new polymorph_core._option({
                div: this.dialogDiv,
                type: "text",
                object: this.settings,
                property: "linkProperty",
                label: "Property for links (leave blank to ignore links)"
            }),
            entrySearch: new polymorph_core._option({
                div: this.dialogDiv,
                type: "bool",
                object: this.settings,
                property: "entrySearch",
                label: "Use Entry as Search"
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
            </select><label>Sort <input type="radio" name="sortie" data-ssrole=${prop}></label>` + `<button data-krole="` + prop + `">X</button>`
                pspan.querySelector("select").value = this.settings.properties[prop];
                pspan.querySelector("input[type='radio']").checked = (this.settings.sortby == prop);
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

        let checkImplicitOrdering = () => {
            if (this.settings.implicitOrder) {
                Object.values(this.renderedItems).map((i, ii) => i[this.settings.filter] = ii);
            }
        }

        this.dialogUpdateSettings = () => {
            // pull settings and update when your dialog is closed.
            this.updateSettings();
            this.sortItems();
            checkImplicitOrdering();
            container.fire("updateItem", { id: this.container.id });
        }
        checkImplicitOrdering();
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

        // alt click and drag for drag and drop
        let dragDropID = undefined;
        container.div.addEventListener("mousedown", (e) => {
            //figure out which element this is
            dragDropID = undefined;
            let composedPath = e.composedPath();
            for (let i = 0; i < composedPath.length; i++) {
                if (!composedPath[i].dataset) break; //shadow root
                if (composedPath[i].dataset.id) {
                    dragDropID = composedPath[i].dataset.id;
                    break;
                }
            }
        })

        // normal click and drag on element to drag and drop
        container.div.addEventListener("mousedown", (e) => {
            //figure out which element this is
            if (e.target.matches(".dragHandle")) {
                let liRow = e.target.parentElement.parentElement;
                this.relrect = e.target.getRootNode().host.getBoundingClientRect();
                liRow.style.position = "absolute";
                liRow.style.left = e.clientX - this.relrect.x;
                liRow.style.top = e.clientY - this.relrect.y;
                this.worryRow = liRow;
                //temporarily disable user select on everything else
                Array.from(e.target.getRootNode().children).forEach(i => i.style.userSelect = "none");
            }
        })

        let lastBlued;
        container.div.addEventListener("mousemove", (e) => {
            //if alt, fire UDD
            /*
            //this is a bit fiddly and i dont like it
            if (e.altKey && dragDropID) {
                //fire UDD
                polymorph_core.initiateDragDrop(dragDropID, { x: e.clientX, y: e.clientY, sender: container.id });
                //prevent spamming
                dragDropID = undefined;
            }
            */
            if (this.worryRow) {
                let composedPath = e.composedPath();
                for (let i = 0; i < composedPath.length - 2; i++) {
                    try {
                        if (composedPath[i].matches("[data-id]")) {
                            if (composedPath[i] == this.worryRow) break;
                            if (lastBlued) lastBlued.style.borderTop = "";
                            lastBlued = composedPath[i];
                            lastBlued.style.borderTop = "3px solid blue";
                            break;
                        }
                    } catch (err) {
                        if (lastBlued) lastBlued.style.borderTop = "";
                        lastBlued = undefined;
                        break;
                    }
                }
                this.worryRow.style.left = e.clientX - this.relrect.x;
                this.worryRow.style.top = e.clientY - this.relrect.y;
            }
        })
        let ddmouseExitHandler = (e) => {
            if (this.worryRow) {
                //rearrange stuff
                if (lastBlued) {
                    lastBlued.style.borderTop = "";
                    if (lastBlued.previousElementSibling) polymorph_core.items[this.worryRow.dataset.id][this.settings.filter] = (polymorph_core.items[lastBlued.previousElementSibling.dataset.id][this.settings.filter] + polymorph_core.items[lastBlued.dataset.id][this.settings.filter]) / 2;
                    else polymorph_core.items[this.worryRow.dataset.id][this.settings.filter] = polymorph_core.items[lastBlued.dataset.id][this.settings.filter] - 1;
                    lastBlued.parentElement.insertBefore(this.worryRow, lastBlued);
                    lastBlued = undefined;
                }
                //check if implict ordering
                this.worryRow.style.position = "static";
                Array.from(e.target.getRootNode().children).forEach(i => i.style.userSelect = "unset");
                delete this.worryRow;
            }
        }
        container.div.addEventListener("mouseup", ddmouseExitHandler);
        container.div.addEventListener("mouseleave", ddmouseExitHandler);
    });
}