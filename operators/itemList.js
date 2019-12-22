polymorph_core.registerOperator("itemList", function (container) {
    let defaultSettings = {
        properties: {
            title: "text"
        },
        propertyWidths: {},
        filter: guid(),
        enableEntry: true,
        implicitOrder: true
    };
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);
    //upgrade older ones
    if (this.settings.filterProp){
        this.settings.filter=this.settings.filterProp;
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

    let getRenderedItems = () => {//TODO: add caching to this in case it becomes a burden on processing
        if (!this.renderedItemsCache) {
            let items = Array.from(this.taskList.querySelectorAll("span[data-id]"));
            this.renderedItemsCache = items.map((i) => i.dataset.id);
        }
        return this.renderedItemsCache;
    }

    //Handle item creation
    this.createItem = () => {
        let it = {};
        //clone the template and append it
        let currentItemSpan = this.template.cloneNode(true);
        //get data and register item
        for (i in this.settings.properties) {
            switch (this.settings.properties[i]) {
                case "text":
                case "number":
                    it[i] = currentItemSpan.querySelector("[data-role='" + i + "']").value;
                    break;
                case "object":
                    try {
                        it[i] = JSON.parse(currentItemSpan.querySelector("[data-role='" + i + "']").value);
                    } catch (e) {

                    }
                    break;
                case "date":
                    if (!it[i]) it[i] = {};
                    if (typeof it[i] == "string") it[i] = {
                        datestring: it[i]
                    };
                    it[i].datestring = currentItemSpan.querySelector("[data-role='" + i + "']").value;
                    break;
            }
            //clear the template
            this.template.querySelector("[data-role='" + i + "']").value = "";
        }
        currentItemSpan.children[1].innerHTML = "X";
        //ensure the filter property exists
        if (this.settings.filter && !it[this.settings.filter]) it[this.settings.filter] = Date.now();
        let id = polymorph_core.insertItem(it);
        currentItemSpan.dataset.id = id;
        if (this.shiftDown) {
            let fi = this.taskList.querySelector(".ffocus");
            if (fi) {
                fi.children[fi.children.length - 1].appendChild(currentItemSpan);
                //we are creating a subitem
                let fiid = fi.dataset.id;
                fi = polymorph_core.items[fiid];
                if (!fi.to) fi.to = {};
                fi.to[id] = true;
                container.fire("updateItem", {
                    id: fiid,
                    sender: this
                });
            }
        }
        if (!currentItemSpan.parentElement) {
            this.taskList.appendChild(currentItemSpan);
        }
        this.renderedItemsCache = undefined;
        container.fire("createItem", {
            id: id,
            sender: this
        });
        this.datereparse(id);
    }
    document.body.addEventListener("keydown", (e) => {
        if (e.getModifierState("Shift")) {
            this.shiftDown = true;
            this.template.children[1].innerHTML = "&#x21a9;";
        }
    });
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
        let s = d.sender;
        this.settings.currentID = id;
        //sortcap may not have been declared yet
        if (s != "GARBAGE_COLLECTOR" && this.sortcap) this.sortcap.submit();
        return this.updateItem(id);
    });

    this.updateItem = (id, unbuf = false) => {//if unbuf then we dont want to fire getRenderedItems as it would force an update.
        let it = polymorph_core.items[id];
        //First check if we should show the item
        if (!mf(this.settings.filter, it)) {
            //if existent, remove
            let currentItemSpan = this.taskList.querySelector("span[data-id='" + id + "']")
            if (currentItemSpan) currentItemSpan.remove();
            this.renderedItemsCache = undefined;//ask to repopulate next time
            return false;
        }
        //Then check if the item already exists; if so then update it
        let currentItemSpan = this.taskList.querySelector("span[data-id='" + id + "']")
        if (!currentItemSpan) {
            currentItemSpan = this.template.cloneNode(true);
            currentItemSpan.style.display = "block";
            currentItemSpan.dataset.id = id;
            currentItemSpan.children[1].innerText = "X";
            this.taskList.appendChild(currentItemSpan);
            this.renderedItemsCache = undefined;//this can be even further optimised by only adding / removing stuff.
        }
        for (i in this.settings.properties) {
            switch (this.settings.properties[i]) {
                case "text":
                case "number":
                    if (it[i] != undefined) {
                        currentItemSpan.querySelector("[data-role='" + i + "']").value = it[i];
                    } else {
                        currentItemSpan.querySelector("[data-role='" + i + "']").value = "";
                    }
                    break;
                case "object":
                    if (it[i]) {
                        currentItemSpan.querySelector("[data-role='" + i + "']").value = JSON.stringify(it[i]);
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
                            if (this.datereparse) this.datereparse(id);
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
            currentItemSpan.style.color = "black"; //stuff error handling
        }
        //then check if i have a direct and unique parent that is in the current set.
        let uniqueParent = undefined;
        if (!unbuf) {
            let ri = getRenderedItems();
            for (let _i = 0; _i < ri.length; _i++) {
                let i = ri[_i];
                if (polymorph_core.items[i].to && polymorph_core.items[i].to[id] && id != i) {
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
            this.taskList.querySelector(`span[data-id='${uniqueParent}']>div.subItemBox`).appendChild(currentItemSpan);
        }
        return true;
    }

    //auto
    setInterval(() => {
        let worried = false;
        for (let i in this.settings.properties) {
            if (this.settings.properties[i] == 'date') {
                worried = i;
            }
        }
        if (!this.container.visible()) return; //if not shown then dont worryy
        if (worried) {
            let listofitems = this.taskList.querySelectorAll("[data-role='" + worried + "']");
            for (let i = 0; i < listofitems.length; i++) {
                if (listofitems[i].value.indexOf("auto") != -1) {
                    if (this.datereparse) this.datereparse(listofitems[i].parentElement.parentElement.parentElement.dataset.id);
                }
            }
        }
    }, 10000);

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
    /*
    //probably wont need this anymore as updateItem handles deletion
    this.deleteItem = (id)=>{
        try {
            this.taskList.querySelector("span[data-id='" + id + "']").remove();
        } catch (e) {
            return;
        }
    }

    container.on("deletedItem", (d) => {
        this.deleteItem(d.id);
    });*/
    this.reRenderEverything = () => {
        this.taskList.innerHTML = "";
        for (let i in polymorph_core.items) {
            this.updateItem(i, true);
        }
        //and again for links
        for (let i in polymorph_core.items) {
            this.updateItem(i);
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
            this._template.querySelector(`[data-contains-role=${i}]`).style.width = this.settings.propertyWidths[i];
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
                if (typeof currentItem[e.target.dataset.role] == "string") currentItem[e.target.dataset.role] = {
                    "datestring": currentItem[e.target.dataset.role]
                };
                currentItem[e.target.dataset.role].datestring = e.target.value;
                break;
        }

        //match all the item data and currentItem data
        container.fire("updateItem", {
            id: e.target.parentElement.parentElement.parentElement.dataset.id,
            sender: this
        });
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
            container.fire("focus", {
                id: e.target.parentElement.parentElement.parentElement.dataset.id,
                sender: this
            });
            this.focusItem(e.target.parentElement.parentElement.parentElement.dataset.id);
        }
    })
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
                            this.renderedItemsCache = undefined;
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



    let targeter = this.dialogDiv.querySelector("button.targeter");
    targeter.addEventListener("click", () => {
        if (this.settings.operationMode == "iface") {
            polymorph_core.target("itemList").then((id) => {
                this.dialogDiv.querySelector("[data-role='focusOperatorID']").value = id;
                this.settings['focusOperatorID'] = id
                this.focusOperatorID = this.settings['focusOperatorID'];
                this.detach = polymorph_core.queryOnIface(id, () => {
                    // this will return a list of items
                })
            })
        } else {
            polymorph_core.target().then((id) => {
                this.dialogDiv.querySelector("[data-role='focusOperatorID']").value = id;
                this.settings['focusOperatorID'] = id
                this.focusOperatorID = this.settings['focusOperatorID'];
            })
        }
    })

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

    container.on("focus", (data) => {
        if (this.settings.operationMode == "focus") {
            if (data.sender.container.container.uuid == this.settings.focusOperatorID) {
                this.settings.filter = data.id;
            }
        }
        this.focusItem(data.id);
    });
    this.callables = {
        addArray: (a) => {
            let createdIDs = [];
            a.forEach((v) => {
                let obj = {};
                if (typeof v == "string") {
                    obj.title = v;
                } else {
                    obj = v;
                }
                let id = polymorph_core.insertItem(obj);
                container.fire("updateItem", {
                    id: id
                });
                createdIDs.push(id);
            });
            return createdIDs;
        },
        addObjects: (a) => {
            for (let i in a) {
                polymorph_core.items[i] = a[i];
            }
        }
    };
    scriptassert([["itemlist searchsort", "operators/itemList.searchsort.js"]], () => {
        __itemlist_searchsort.apply(this);
    })
});