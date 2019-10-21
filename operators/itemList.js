core.registerOperator("itemList", function (operator) {
    let me = this;
    me.container = operator;
    //Initialise with default settings
    this.settings = {
        properties: {
            title: "text"
        },
        propertyWidths:{},
        filterProp: guid(),
        enableEntry: true,
        implicitOrder: true
    };

    this.settingsBar = document.createElement('div');
    this.settingsBar.innerHTML = `<div></div>`
    this.taskListBar = document.createElement("div");
    this.taskListBar.style.cssText = "flex: 1 0 auto; display: flex;height:100%; flex-direction:column;";
    //top / insert 
    this.template = htmlwrap(`<span style="display:block; width:100%;">
    <span></span>
    <button>&gt;</button>
    <div class="subItemBox"></div>
    </span>`);
    this._template = this.template.querySelector("span");
    this.taskListBar.appendChild(this.template);

    //search
    this.searchtemplate = htmlwrap(`<span style="display:block; width:100%;">
    <span></span>
    <button disabled>&#128269;</button>
    </span>`);
    this._searchtemplate = this.searchtemplate.querySelector("span");
    this.taskListBar.appendChild(this.searchtemplate);

    this.taskListBar.appendChild(document.createElement("hr"));
    this.taskListBar.style.whiteSpace = "nowrap";
    this.taskList = document.createElement("div");
    this.taskList.style.cssText = "height:100%; overflow-y:auto; width:fit-content;";
    this.taskListBar.appendChild(this.taskList);
    operator.div.appendChild(htmlwrap(
        `<style>
        input{
            background: inherit;
            color:inherit;
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

    operator.div.appendChild(this.taskListBar);

    //Handle item creation
    this.createItem = () => {
        let it = {};
        //clone the template and append it
        let currentItemSpan = me.template.cloneNode(true);
        //get data and register item
        for (i in me.settings.properties) {
            switch (me.settings.properties[i]) {
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
            me.template.querySelector("[data-role='" + i + "']").value = "";
        }
        currentItemSpan.children[1].innerHTML = "X";
        it.itemList = true;
        //ensure the filter property exists
        if (me.settings.filterProp && !it[me.settings.filterProp]) it[me.settings.filterProp] = Date.now();
        let id = core.insertItem(it);
        currentItemSpan.dataset.id = id;
        if (this.shiftDown) {
            let fi = me.taskList.querySelector(".ffocus");
            if (fi) {
                fi.children[fi.children.length - 1].appendChild(currentItemSpan);
                //we are creating a subitem
                let fiid = fi.dataset.id;
                fi = core.items[fiid];
                if (!fi.to) fi.to = {};
                fi.to[id] = true;
                core.fire("updateItem", {
                    id: fiid,
                    sender: me
                });
            }
        }
        if (!currentItemSpan.parentElement) {
            me.taskList.appendChild(currentItemSpan);
        }
        this.renderedItemsCache = undefined;
        core.fire("updateItem", {
            id: id,
            sender: me
        });
        me.datereparse(id);
    }
    document.body.addEventListener("keydown", (e) => {
        if (e.getModifierState("Shift")) {
            this.shiftDown = true;
            me.template.children[1].innerHTML = "&#x21a9;";
        }
    });
    document.body.addEventListener("keyup", (e) => {
        if (!e.getModifierState("Shift")) {
            this.shiftDown = false;
            me.template.children[1].innerHTML = "&gt;";
        }
    });
    this.template.querySelector("button").addEventListener("click", this.createItem);
    this.template.addEventListener("keydown", (e) => {
        if (e.key == "Enter") {
            me.createItem();
        }
    });


    //Managing the search
    let searchCapacitor = new capacitor(1000, 300, () => {
        //filter the items
        let searchboxes = Array.from(this.searchtemplate.querySelectorAll("input"));
        let amSearching = false;
        for (let i = 0; i < searchboxes.length; i++) {
            if (searchboxes[i].value != "") {
                amSearching = true;
            }
        }
        if (amSearching) {
            this.searchtemplate.querySelector("button").innerHTML = "&#9003;";
            this.searchtemplate.querySelector("button").disabled = false;
        } else {
            this.searchtemplate.querySelector("button").innerHTML = "&#128269;";
            this.searchtemplate.querySelector("button").disabled = true;
            //dont return yet, we have to reset everything
        }

        let items = Array.from(this.taskList.children);
        items.forEach((v) => {
            let it = core.items[v.dataset.id];
            v.style.display = "block";
            for (let i = 0; i < searchboxes.length; i++) {
                //only search by text for now
                if (searchboxes[i].value) {
                    switch (this.settings.properties[searchboxes[i].dataset.role]) {
                        case "text":
                            if (!it[searchboxes[i].dataset.role] || it[searchboxes[i].dataset.role].indexOf(searchboxes[i].value) == -1) {
                                v.style.display = "none";
                            }
                            break;
                        case "object":
                            if (v.querySelector(`[data-role="${searchboxes[i].dataset.role}"]`).value.indexOf(searchboxes[i].value) == -1) {
                                v.style.display = "none";
                            }
                            break;
                    }
                }
            }
        });
    });
    this.searchtemplate.addEventListener("keyup", searchCapacitor.submit);
    this.searchtemplate.querySelector("button").addEventListener("click", () => {
        let searchboxes = Array.from(this.searchtemplate.querySelectorAll("input"));
        searchboxes.forEach(v => { v.value = ""; });
        searchCapacitor.submit();
    })

    this.indexOf = function (id) {
        let childs = this.taskList.children;
        for (let i = 0; i < childs.length; i++) {
            if (childs[i].dataset.id == id) return i;
        }
        return -1;
    }

    me._sortItems = function () {
        if (!me.container.visible()) return;
        if (me.settings.implicitOrder) {
            me.settings.sortby = me.settings.filterProp;
        }
        if (me.settings.sortby) {
            //collect all items
            let itms = me.taskList.querySelectorAll(`[data-id]`);
            let its = [];
            for (let i = 0; i < itms.length; i++) {
                cpp = {
                    id: itms[i].dataset.id,
                    dt: core.items[itms[i].dataset.id][me.settings.sortby]
                };
                its.push(cpp);
            }
            //sort everything based on the filtered property.
            switch (me.settings.properties[me.settings.sortby]) {
                case "date":
                    let dateprop = me.settings.sortby;
                    for (let i = 0; i < its.length; i++) {
                        //we are going to upgrade all dates that don't match protocol)
                        if (its[i].dt && its[i].dt.date) {
                            if (typeof its[i].dt.date == "number") {
                                core.items[its[i].id][dateprop].date = [{
                                    date: core.items[its[i].id][dateprop].date
                                }];
                            }
                            if (core.items[its[i].id][dateprop].date[0]) {
                                its[i].date = core.items[its[i].id][dateprop].date[0].date;
                                //check for repetition structure
                                if (its[i].dt.datestring.indexOf("(") != -1) {
                                    //evaluate the repetition
                                    its[i].date = dateParser.richExtractTime(its[i].dt.datestring, new Date())[0].date;
                                }
                            }
                            else its[i].date = Date.now() * 10000;
                        } else its[i].date = Date.now() * 10000;
                    }
                    its.sort((a, b) => {
                        return a.date - b.date;
                    });
                    break;
                case "text":
                    for (let i = 0; i < its.length; i++) {
                        if (!its[i].dt) its[i].dt = "";
                    }
                    its.sort((a, b) => {
                        return a.dt.toString().localeCompare(b.dt.toString());
                    });
                    break;
                default: // probably implicit ordering
                    its.sort((a, b) => {
                        return a.dt - b.dt;
                    });
            }
            //remember focused item
            let fi = me.taskList.querySelector(":focus");
            //also remember cursor position
            let cp;
            if (fi) cp = fi.selectionStart || 0;
            //rearrange items
            //dont do this if subitem
            for (let i = 0; i < its.length; i++) {
                let span = me.taskList.querySelector("[data-id='" + its[i].id + "']")
                if (span.parentElement == me.taskList) me.taskList.appendChild(span);
            }
            //return focused item
            if (fi) {
                fi.focus();
                try {
                    fi.selectionStart = cp;
                } catch (e) {
                }
            }
        }
    }

    let sortcap = new capacitor(500 + isPhone() * 1000, 1000, me._sortItems);

    this.sortItems = function () {
        sortcap.submit();
    }

    core.on("updateItem", function (d) {
        let id = d.id;
        let s = d.sender;
        me.settings.currentID = id;
        if (s != "GARBAGE_COLLECTOR") sortcap.submit();
        return me.updateItem(id);
    });

    let getRenderedItems = () => {//TODO: add caching to this in case it becomes a burden on processing
        if (!this.renderedItemsCache) {
            let items = Array.from(me.taskList.querySelectorAll("span[data-id]"));
            this.renderedItemsCache = items.map((i) => i.dataset.id);
        }
        return this.renderedItemsCache;
    }

    this.updateItem = (id, unbuf = false) => {//if unbuf then we dont want to fire getRenderedItems as it would force an update.
        let it = core.items[id];
        //First check if we should show the item
        if (!mf(me.settings.filterProp, it)) {
            //if existent, remove
            let currentItemSpan = me.taskList.querySelector("span[data-id='" + id + "']")
            if (currentItemSpan) currentItemSpan.remove();
            this.renderedItemsCache=undefined;//ask to repopulate next time
            return false;
        }
        //Then check if the item already exists; if so then update it
        let currentItemSpan = me.taskList.querySelector("span[data-id='" + id + "']")
        if (!currentItemSpan) {
            currentItemSpan = me.template.cloneNode(true);
            currentItemSpan.style.display = "block";
            currentItemSpan.dataset.id = id;
            currentItemSpan.children[1].innerText = "X";
            me.taskList.appendChild(currentItemSpan);
            this.renderedItemsCache = undefined;//this can be even further optimised by only adding / removing stuff.
        }
        for (i in me.settings.properties) {
            switch (me.settings.properties[i]) {
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
                            if (me.datereparse) me.datereparse(id);
                        }
                    }
                    break;
            }
        }
        if (it.style) {
            currentItemSpan.style.background = it.style.background;
            currentItemSpan.style.color = it.style.color || matchContrast((/rgba?\([\d,\s]+\)/.exec(getComputedStyle(currentItemSpan).background) || ['#ffffff'])[0]); //stuff error handling
        }
        //then check if i have a direct and unique parent that is in the current set.
        let uniqueParent = undefined;
        if (!unbuf) {
            let ri = getRenderedItems();
            for (let _i = 0; _i < ri.length; _i++) {
                let i = ri[_i];
                if (core.items[i].to && core.items[i].to[id] && id != i) {
                    if (uniqueParent == undefined) {
                        uniqueParent = i;
                    } else {
                        uniqueParent = undefined;
                        break;
                    }
                }
            }
        }
        if (uniqueParent != undefined) {
            me.taskList.querySelector(`span[data-id='${uniqueParent}']>div.subItemBox`).appendChild(currentItemSpan);
        }
        return true;
    }

    //auto
    setInterval(() => {
        let worried = false;
        for (let i in me.settings.properties) {
            if (me.settings.properties[i] == 'date') {
                worried = i;
            }
        }
        if (!me.container.visible()) return; //if not shown then dont worryy
        if (worried) {
            let listofitems = me.taskList.querySelectorAll("[data-role='" + worried + "']");
            for (let i = 0; i < listofitems.length; i++) {
                if (listofitems[i].value.indexOf("auto") != -1) {
                    if (me.datereparse) me.datereparse(listofitems[i].parentElement.parentElement.parentElement.dataset.id);
                }
            }
        }
    }, 10000);

    //Handle item deletion
    this.taskList.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() == "button") {
            delete core.items[e.target.parentElement.dataset.id][me.settings.filterProp];
            core.fire("deleteItem", {
                id: e.target.parentElement.dataset.id,
                sender: this
            });
        }
    })
    /*
    //probably wont need this anymore as updateItem handles deletion
    this.deleteItem = function (id) {
        try {
            this.taskList.querySelector("span[data-id='" + id + "']").remove();
        } catch (e) {
            return;
        }
    }

    core.on("deletedItem", (d) => {
        me.deleteItem(d.id);
    });*/
    this.reRenderEverything = () => {
        this.taskList.innerHTML = "";
        for (let i in core.items) {
            this.updateItem(i, true);
        }
        //and again for links
        for (let i in core.items) {
            this.updateItem(i);
        }
    }

    //resizing
    operator.div.addEventListener("mousemove", (e) => {
        if (e.buttons) {
            for (let i=0;i<e.path.length;i++){
                if (e.path[i].dataset && e.path[i].dataset.containsRole){
                    let els=operator.div.querySelectorAll(`[data-contains-role=${e.path[i].dataset.containsRole}]`);
                    for (let j=0;j<els.length;j++)els[j].style.width = e.path[i].clientWidth;
                    this.settings.propertyWidths[e.path[i].dataset.containsRole]=e.path[i].clientWidth;
                    break;
                }else if (e.path[i]==this.taskList){
                    break;
                }
            }
        }
    })

    this.updateSettings = ()=>{
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
        this._searchtemplate.innerHTML = htmlstring;
        //resize stuff
        for (let i in this.settings.propertyWidths){
            this._template.querySelector(`[data-contains-role=${i}]`).style.width=this.settings.propertyWidths[i];
            this._searchtemplate.querySelector(`[data-contains-role=${i}]`).style.width=this.settings.propertyWidths[i];
        }
        //Recreate everything
        this.reRenderEverything();
        //hide or show based on entry enabled
        if (this.settings.enableEntry == false) {
            this.template.style.display = "none";
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
        currentItem = core.items[e.target.parentElement.parentElement.parentElement.dataset.id];
        switch (me.settings.properties[e.target.dataset.role]) {
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

        //match all the item data and currentITem data
        core.fire("updateItem", {
            id: e.target.parentElement.parentElement.parentElement.dataset.id,
            sender: me
        });
    })

    this.taskList.addEventListener("keyup", (e) => {
        if (e.target.tagName.toLowerCase() == "input" && this.settings.properties[e.target.dataset.role] == 'date' && e.key == "Enter") {
            me.datereparse(e.target.parentElement.parentElement.parentElement.dataset.id);
        }
    })

    this.focusItem = function (id) {
        //Highlight in purple
        let _target = me.taskList.querySelector("[data-id='" + id + "']");
        if (_target) {
            let spans = me.taskList.querySelectorAll(`span[data-id]`);
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
            core.fire("focus", {
                id: e.target.parentElement.parentElement.parentElement.dataset.id,
                sender: this
            });
            this.focusItem(e.target.parentElement.parentElement.parentElement.dataset.id);
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
                    //specifically reparse the date on it;
                    if (it) {
                        if (core.items[it][dateprop]) {
                            core.items[it][dateprop].date = dateParser.richExtractTime(core.items[it][dateprop].datestring);
                            if (!core.items[it][dateprop].date.length) core.items[it][dateprop].date = undefined;
                            //ds=me.taskList.querySelector('span[data-id="'+it+'"] input[data-role="'+dateprop+'"]').value;
                        }
                    }
                    // get a list of Items
                    let its = [];
                    me.taskList.querySelectorAll("[data-id]").forEach(e => {
                        let itm = {
                            id: e.dataset.id
                        };
                        if (!core.items[itm.id]){
                            //nerf the e that spawned me, then break
                            //idek how this happens :(
                            e.remove();
                            me.renderedItemsCache=undefined;
                            return;
                        }
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
                }
            }
            //sort everything
            me.sortItems();
            core.fire("dateUpdate");
        }
        me.datereparse();
    })

    scriptassert([
        ["contextmenu", "genui/contextMenu.js"]
    ], () => {
        let ctm = new _contextMenuManager(operator.div);
        let contextedItem;
        let contextedInput;
        let contextedProp;
        let menu;

        function filter(e) {
            contextedInput = e.target;
            contextedProp = contextedInput.dataset.role;
            let id = contextedInput;
            while (!id.dataset.id) {
                id = id.parentElement;
            }
            contextedItem = id.dataset.id;
            if (me.settings.properties[e.target.dataset.role] == "date") {
                menu.querySelector(".fixed").style.display = "block";
            } else {
                menu.querySelector(".fixed").style.display = "none";
            }
            if (core.items[contextedItem].style) {
                menu.querySelector(".background").value = core.items[contextedItem].style.background || "";
                menu.querySelector(".color").value = core.items[contextedItem].style.color || "";
            } else {
                menu.querySelector(".background").value = "";
                menu.querySelector(".color").value = "";
            }
            return true;
        }
        menu = ctm.registerContextMenu(`<li class="fixed">Convert to fixed date</li>
        <li class="back"><input class="background" placeholder="Background color"></input></li>
        <li class="fore"><input class="color" placeholder="Foreground color"></input></li>
        `, me.taskList, "input", filter)
        menu.querySelector(".fixed").addEventListener("click", function (e) {
            let id = contextedItem;
            contextedInput.value = new Date(core.items[id][contextedProp].date[0].date).toLocaleString() + ">" + new Date(core.items[id][contextedProp].date[0].endDate).toLocaleString();
            core.items[id][contextedProp].datestring = contextedInput.value;
            me.datereparse(id);
            menu.style.display = "none";
        })

        function updateStyle(e) {
            let cid = contextedItem;

            if (!core.items[cid].style) core.items[cid].style = {};
            core.items[cid].style[e.target.className] = e.target.value;
            core.fire("updateItem", {
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
    <option value="iface">Link to another operator...</option>
    </select>
    <p>View items with the following property:</p> 
    <input data-role='filterProp' placeholder = 'Property name'></input>
    <p>Operator to focus on:</p> 
    <input data-role="focusOperatorID" placeholder="Operator UID (use the button)">
    <button class="targeter">Select operator</button>
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
    this.showDialog = function () {
        // update your dialog elements with your settings
        //Fill in dialog information
        //set all property settings.
        for (i in me.settings) {
            let it = me.dialogDiv.querySelector("[data-role='" + i + "']");
            if (it) it.value = me.settings[i];
        }
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
        //enable adding new items checkbox
        for (i in options) {
            options[i].load();
        }
        // Now fill in the ones which we're currently monitoring.
        me.proplist.innerHTML = "";
        for (let prop in me.settings.properties) {
            let pspan = document.createElement("p");
            pspan.innerHTML = `<span>` + prop + `</span>
            <select data-role=` + prop + `>
                <option value="text">Text</option>
                <option value="date">Date</option>
                <option value="object">Object</option>
                <option value="number">Number</option>
            </select><label>Sort <input type="radio" name="sortie" data-ssrole=${prop}></label>` + `<button data-krole=` + prop + `>X</button>`
            pspan.querySelector("select").value = me.settings.properties[prop];
            me.proplist.appendChild(pspan);
        }
    }



    let targeter = this.dialogDiv.querySelector("button.targeter");
    targeter.addEventListener("click", function () {
        if (me.settings.operationMode == "iface") {
            core.target("itemList").then((id) => {
                me.dialogDiv.querySelector("[data-role='focusOperatorID']").value = id;
                me.settings['focusOperatorID'] = id
                me.focusOperatorID = me.settings['focusOperatorID'];
                me.detach = core.queryOnIface(id, () => {
                    // this will return a list of items
                })
            })
        } else {
            core.target().then((id) => {
                me.dialogDiv.querySelector("[data-role='focusOperatorID']").value = id;
                me.settings['focusOperatorID'] = id
                me.focusOperatorID = me.settings['focusOperatorID'];
            })
        }
    })

    //when clicking a sort radio button, turn off implict ordering
    me.proplist = me.dialogDiv.querySelector(".proplist");
    me.proplist.addEventListener("input", (e) => {
        if (e.target.matches("[name='sortie']")) {
            me.settings.implicitOrder = false;
            options.implicitOrder.load();
        }
    })

    this.dialogUpdateSettings = function () {
        // pull settings and update when your dialog is closed.
        me.updateSettings();
        me.sortItems();
        core.fire("updateView");
    }

    //adding new buttons
    d.querySelector(".adbt").addEventListener("click",
        function () {
            if (d.querySelector(".adpt").value != "") {
                me.settings.properties[d.querySelector(".adpt").value] = 'text';
                d.querySelector(".adpt").value = "";
            } else {
                me.settings.properties[d.querySelector("select._prop").value] = 'text';
            }
            me.showDialog();
        }
    )

    //the filter property.
    d.querySelector("input[data-role='filterProp']").addEventListener("input", function (e) {
        me.settings.filterProp = e.target.value;
        try {
            me.filter = eval(me.settings.filterProp);
        } catch (e) {
            me.filter = (itm) => {
                return itm[me.settings.filterProp]
            };
        }
    })

    //Handle select's in proplist
    me.proplist.addEventListener('change', function (e) {
        if (e.target.matches("select")) me.settings.properties[e.target.dataset.role] = e.target.value;
    })
    me.proplist.addEventListener('click', function (e) {
        if (e.target.matches("[data-krole]")) {
            delete me.settings.properties[e.target.dataset.krole];
            me.showDialog();
        }
    })
    me.proplist.addEventListener("input", (e) => {
        if (e.target.matches("input[type='radio']")) {
            me.settings.sortby = e.target.dataset.ssrole;
        }
    })

    me.opList = me.dialogDiv.querySelector("select._prop");
    //retrieve stuff
    //sort by date checkbox
    //Style tags button

    core.on("focus", function (data) {
        if (me.settings.operationMode == "focus") {
            if (data.sender.container.container.uuid == me.settings.focusOperatorID) {
                me.settings.filterProp = data.id;
            }
        }
        me.focusItem(data.id);
    });
    me.callables = {
        addArray: function (a) {
            let createdIDs = [];
            a.forEach((v) => {
                let obj = {};
                if (typeof v == "string") {
                    obj.title = v;
                } else {
                    obj = v;
                }
                let id = core.insertItem(obj);
                core.fire("updateItem", {
                    id: id
                });
                createdIDs.push(id);
            });
            return createdIDs;
        },
        addObjects: function (a) {
            for (let i in a) {
                core.items[i] = a[i];
            }
        }
    };
});