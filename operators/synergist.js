core.registerOperator("itemCluster", function (operator) {
    let me = this;
    this.settings = {
        currentViewName: undefined,
        maxZ: 1
    };

    this.rootdiv = document.createElement("div");
    this.rootdiv.style.overflow = "none";
    //Add div HTML here
    this.rootdiv.innerHTML = `
    <style>
    .floatingItem img {
        display: none;
        min-height: 1em;
    }
    
    .floatingItem{
        position:absolute;
    }
    
    .floatingItem,
    .floatingSetupMenu {
        border-radius: 8px;
    }
    
    .floatingItem>div{
        font-size:0.9em;
    }
    
    .floatingItem .floatingItem{
        border: 1px solid black;
        border-radius: 0;
        padding: 2px;
        margin: 5px;
        width: 9vw;
    }
    
    .floatingItem:hover img,
    .floatingItem:focus img {
        margin: 8px;
        display: block;
        float: right;
    }
    
    .floatingItem {
        background: white;
        width: 10vw;
        padding: 5px;
        transition: left 0.5s ease, top 0.5s ease;
    }
    
    .synergist>.floatingItem {
        position: absolute;
    }
    
    .synergist-container {
        display: flex;
        height: 100%;
        flex-direction: column;
    }
    
    /*---------------------Banner----------------*/
    .synergist-banner {
        flex: 1 1 auto;
        position: relative;
        display: block;
        flex-direction: column;
        z-index: 2;
    }
    
    .synergist-banner h1{
        padding: 3px;
    }
    
    .synergist-banner a>span {
        border-radius:4px;
        display: inline-block;
    }
    
    .synergist-banner a>span>span {
        padding: 3px;
    }
    
    a.viewNameContainer{
        background-color:rgb(132, 185, 218);
    }
    
    .synergist-banner a .gears{
        padding: 2px;
        margin-bottom: -0.2em;
        height: 0.8em;
        display: inline-block;
    }
    
    /*
    .synergist-banner .plusbutton{ 
        padding: 10px;
        background: lightblue;
        border-radius: 10px;
        margin: 10px;
        position: absolute;
        right: 0;
        bottom: 0;
    }
    */
    /*------------view options menu----------*/
    .done{
        margin-top: auto;
    }
    /*------------Back wall----------*/
    .backwall {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
    }
    
    .leftLabelContainer,
    .rightLabelContainer {
        font-size: 30px;
    }
    
    .leftLabelContainer:not(.phone) {
        position: absolute;
        left: 0px;
        top: 50%;
    }
    
    .rightLabelContainer:not(.phone) {
        position: absolute;
        right: 0px;
        top: 50%;
    }
    .viewNameDrop{
        position: absolute;
        background-color: #f9f9f9;
        z-index: 1;
        list-style: none;
    }

    .viewNameDrop>a{
        display:block;
    }

    .viewNameDrop>a:hover{
        display:block;
        background:lavender;
    }

    .leftLabelContainer.phone {
        position: absolute;
        left: 50%;
        bottom: 0px;
        transform: translateX(-50%);
    }
    
    .rightLabelContainer.phone {
        position: absolute;
        left: 50%;
        top: 0px;
        transform: translateX(-50%);
    }
    
    .synergist {
        user-select: none;
    }
    
    /*------------Floatingsettings----------*/
    .floatingSetupMenu {
        position: absolute;
        background: white;
    }
    
    .floatingSetupMenu>span {
        padding: 10px;
        display: block;
    }
    
    .floatingItem.moving {
        box-shadow: 5px 5px 5px black;
        transition: none;
    }
    
    .floatingItem.selected {
        border: 3px dotted rgb(0, 110, 255);
    }
    
    /*------------floating action button(s)----------*/
    .fab {
        z-index: 10;
        position: absolute;
        bottom: 10vw;
        right: 10vw;
        background-color: rgb(0, 110, 255);
        width: 15vw;
        height: 15vw;
        border-radius: 100%;
        background: rgb(0, 110, 255);
        border: none;
        outline: none;
        color: #FFF;
        font-size: 36px;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
    }
    
    .phone .phoneNoShow {
        display: none;
    }
    
    /*------------Loginshield----------*/
    .dialog.loginShield{
        top:0;
        left:0;
        display:none;
        position: absolute;
        width: 100%;
        height:100%;
        background: lightblue;
    }
    .loginShield section{
        display:none;
    }
    </style>
    <div class="synergist-container">
    <div class="synergist-banner">
        <span class="topbar">
            <a>View:</a>
            <span>
                <a class="viewNameContainer"><span><span contenteditable class="viewName" data-listname='main' style="cursor:text"></span><span
                            class="listDrop">&#x25BC</span>
                    </span><img class="gears" src="resources/gear.png"></a>
                <div class="viewNameDrop" style="display:none">
                </div>
            </span>
        </span>
    </div>
    <div class="synergist"  style="flex: 1 1 100%;position: relative;">
        <div class="backwall">
            <span class="leftLabelContainer"><span class="phoneNoShow">
                    <<</span> <span class="leftLabel" contentEditable>
                </span></span>
            <span class="rightLabelContainer"><span class="rightLabel" contentEditable></span><span class="phoneNoShow">>>></span></span>
        </div>
        <div class="dialog backOptionsMenu">
            <h2>Options</h2>
            <p>View type:<select class="viewType">
                    <option value="blank">Blank</option>
                    <option value="singleAxis">Single Axis</option>
                    <!--<option value="doubleAxis">Double Axis</option>-->

                </select> </p>
        </div>
        <div class="dialog moreMenu">
            <h2>More options</h2>
            <section class="wsm">
                <h3>Weighted scoring matrix</h3>
                <button>Generate weighted scoring matrix</button>
            </section>
        </div>
    </div>
</div>
<div class="floatingSetupMenu" style="display:none; position:absolute;">
    <span>Background:<input class="jscolor backcolor" onchange="fireman.thing.backColorUpdateReceived(this.jscolor)"
            value="ffffff"></span>
    <span>Text:<input class="jscolor forecolor" onchange="fireman.thing.foreColorUpdateReceived(this.jscolor)" value="ffffff"></span>
</div>`;
    this.viewName = this.rootdiv.querySelector(".viewName");
    this.leftLabel = this.rootdiv.querySelector(".leftLabel");
    this.rightLabel = this.rootdiv.querySelector(".rightLabel");
    this.leftLabelContainer = this.rootdiv.querySelector(".leftLabelContainer");
    this.rightLabelContainer = this.rootdiv.querySelector(".rightLabelContainer");
    this.viewgear = this.rootdiv.querySelector(".gears");
    this.viewDropdown = this.rootdiv.querySelector(".viewNameDrop");
    this.viewDropdownContainer = this.rootdiv.querySelector(".viewNameContainer");
    this.viewDropdownButton = this.rootdiv.querySelector(".listDrop");
    this.itemspace = this.rootdiv.querySelector(".backwall");
    operator.div.appendChild(this.rootdiv);


    //////////////////Handle core item updates//////////////////

    //these are optional but can be used as a reference.
    core.on("updateItem", function (d) {
        let id = d.id;
        let sender = d.sender;
        if (sender == me) return;
        me.arrangeItem(id);
        //Check if item is shown
        //Update item if relevant
        //This will be called for all items when the items are loaded.
    });

    core.on("focus", function (d) {
        let id = d.id;
        let s = d.sender;
        // An item was focused.
    });

    core.on("create", function (d) {
        let id = d.id;
        let s = d.sender;
        if (sender == me) return;
        // An item was created.
    });

    core.on("deleteItem", function (d) {
        let id = d.id;
        let s = d.sender;
        if (sender == me) return;
        // An item was created.
    });

    core.on("dateUpdate", function (d) {
        let id = d.id;
        let s = d.sender;
        if (sender == me) return;
        // The date of an item was updated.
    });

    //For interoperability between views you may fire() and on() your own events. You may only pass one object to the fire() function; use the properties of that object for additional detail.


    //////////////////Handling local changes to push to core//////////////////

    //----------For views----------//
    this.viewName.addEventListener("keyup", function (e) {
        core.items[me.settings.currentViewName].synergist.viewName = e.currentTarget.innerText;
        core.fire("updateItem", {
            id: me.settings.currentViewName,
            sender: me
        });
    })

    this.leftLabel.addEventListener("keyup", function (e) {
        core.items[me.settings.currentViewName].synergist.leftLabel = e.currentTarget.innerText;
        core.fire("updateItem", {
            id: me.settings.currentViewName,
            sender: me
        });
    })

    this.rightLabel.addEventListener("keyup", function (e) {
        core.items[me.settings.currentViewName].synergist.rightLabel = e.currentTarget.innerText;
        core.fire("updateItem", {
            id: me.settings.currentViewName,
            sender: me
        });
    })

    this.switchView = function (ln) {
        me.settings.currentViewName = ln;
        if (!me.settings.currentViewName) {
            //Show blank
        } else {
            if (core.items[me.settings.currentViewName].synergist.type == "singleAxis") {
                this.leftLabel.innerText = core.items[me.settings.currentViewName].synergist.leftLabel;
                this.rightLabel.innerText = core.items[me.settings.currentViewName].synergist.rightLabel;
                this.leftLabelContainer.style.display = "block";
                this.rightLabelContainer.style.display = "block";
            } else {
                this.leftLabelContainer.style.display = "none";
                this.rightLabelContainer.style.display = "none";
            }
            this.viewName.innerText = core.items[me.settings.currentViewName].synergist.viewName;
            for (i in core.items) {
                if (core.items[i].synergist && core.items[i].synergist.viewData) {
                    if (me.arrangeItem)me.arrangeItem(i);
                    //position the item appropriately. 
                }
            }


        }
    }

    this.makeNewView = function () {
        let itm = new _item();
        //register it with the core
        let id = core.insertItem(itm);
        itm.title = "New view";
        itm.synergist = {
            type: "blank",
            viewName: "New View"
        };
        //register a change
        core.fire("create", {
            sender: this,
            id: id
        });
        core.fire("updateItem", {
            sender: this,
            id: id
        });
        this.switchView(id);
    }

    this.cloneView = function () {
        let itm = new _item();
        //register it with the core
        let id = core.insertItem(itm);
        itm.title = "New view";
        itm.synergist = {
            type: "blank",
            viewName: "New View"
        };
        itm.title = core.items[me.settings.currentViewName].synergist.viewName;
        itm.synergist.viewName = core.items[me.settings.currentViewName].synergist.viewName;
        //register a change
        core.fire("create", {
            sender: this,
            id: id
        });
        core.fire("updateItem", {
            sender: this,
            id: id
        });
        this.switchView(id);
    }

    this.destroyView = function (viewName, auto) {
        // Destroy the synergist property of the item but otherwise leave it alone
        delete core.items[viewName].synergist;
        this.switchView();
    }

    /*
    //Install JScolor
    window.jscolor.installByClassName("jscolor");
    */

    //////////////////Banner//////////////////
    //----------View options menu----------//
    this.viewgear.addEventListener("click", () => {
        //show the view settings
        me.viewSettings.style.display = "block";
    });

    scriptassert([
        ["dialog", "genui/dialog.js"]
    ], () => {

        dialogManager.checkDialogs(me.rootdiv);
        me.viewSettings = me.rootdiv.querySelector(".dialog.backOptionsMenu");
        //Create the back options dialog

        //add this to the close hook: this.switchView(me.settings.currentViewName);
        /*
$(".viewType").on("change", () => {
        synergist.views[synergist.currentView].type = $(".viewType")[0].value;
        if (synergist.firebaseEnabled) synergist.viewCollection.doc(synergist.currentView).update({
            'type': $(".viewType")[0].value
        });
    })

        */
    })

    this.viewDropdown.addEventListener("click", function (e) {
        if (e.currentTarget.dataset.isnew) {
            //make a new view
            nv = Date.now().toString();
            me.makeNewView(nv);
            me.switchView(nv);
        } else {
            ln = e.currentTarget.dataset.listname;
            me.switchView(ln);
        }
        me.viewDropdown.style.display = "none";
        e.stopPropagation();
    })

    this.viewDropdownButton.addEventListener("click", function () {
        me.viewDropdown.innerHTML = "";
        for (i in core.items) {
            if (core.items[i].synergist && core.items[i].synergist.viewName) {
                let aa = document.createElement("a");
                aa.dataset.listname = i;
                aa.innerHTML = core.items[i].synergist.viewName;
                me.viewDropdown.appendChild(aa);
            }
            //v = synergist.views[i].name;
        }
        let aa = document.createElement("a");
        aa.dataset.isnew = "yes";
        aa.innerHTML = `<em>Add another view</em>`;
        me.viewDropdown.appendChild(aa);
        me.viewDropdown.style.display = "block";
    })

    this.rootdiv.addEventListener("mousedown", function (e) {
        if (e.target.parentElement!=me.viewDropdown)
        me.viewDropdown.style.display = "none";
    })
    scriptassert([
        ["contextmenu", "genui/contextMenu.js"]
    ], () => {
        contextMenuManager.init(me.rootdiv);
        me.viewContextMenu = contextMenuManager.registerContextMenu(
            `<li class="viewDeleteButton">Delete</li>
            <li class="viewCloneButton">Clone view</li>`,
            me.viewDropdownContainer);
        me.viewDeleteButton = me.viewContextMenu.querySelector(".viewDeleteButton");
        me.viewDeleteButton.addEventListener("click", (e) => {
            //delete the view
            me.destroyView(synergist.currentView);
            me.viewContextMenu.style.display = "none";
        })

        me.viewCloneButton = me.viewContextMenu.querySelector(".viewCloneButton");
        me.viewCloneButton.addEventListener("click", (e) => {
            //delete the view
            me.cloneView(synergist.currentView);
            me.viewContextMenu.style.display = "none";
        })
    })



    ///----------Items----------//
    this.itemspace.addEventListener("click", function (e) {
        if (e.target.matches(".floatingItem") || e.target.matches(".floatingItem *")) {
            let it = e.target;
            while (!it.matches(".floatingItem")) it = it.parentElement;
            if (me.preselected) me.preselected.classList.remove("selected");
            me.preselected = it;
            it.classList.add("selected");
        }
    })

    this.dragging = false;
    this.itemspace.addEventListener("mousedown", function (e) {
        if (e.target.matches(".floatingItem") || e.target.matches(".floatingItem *")) {
            let it = e.target;
            while (!it.matches(".floatingItem")) it = it.parentElement;
            if (e.which != 1) return;
            core.fire("focus",{id:it.dataset.id});
            if (it.classList.contains("selected")) return;
            if (me.dragging) return;
            me.movingDiv = it;
            it.style["z-index"] = ++me.settings.maxZ; //oo what a hacker
            me.dragging = true;
            var rect = it.getBoundingClientRect();
            me.dragDX = e.pageX - (rect.left + document.body.scrollLeft);
            me.dragDY = e.pageY - (rect.top + document.body.scrollTop);
            //e.preventDefault();
            //return false;
        };
    })
    this.itemspace.addEventListener("mousemove", function (e) {
        if (me.dragging) {
            if (me.movingDiv.parentElement.matches(".floatingItem")) { //nested items
                me.itemSpace.appendChild(me.movingDiv);
                me.clearParent(me.movingDiv.dataset.id);
                //me.items[me.movingDiv.dataset.id].viewData[me.currentView].parent = undefined;
            }
            me.movingDiv.classList.add("moving");
            let rect = me.itemspace.getBoundingClientRect();
            me.movingDiv.style.left =
                e.clientX - me.dragDX - rect.left;
            me.movingDiv.style.top =
                e.clientY - me.dragDY - rect.top;

            let elements = document.elementsFromPoint(e.clientX, e.clientY);
            let fi = me.rootdiv.querySelectorAll(".floatingItem");
            for (let i = 0; i < fi.length; i++) {
                fi[i].style.border = "";
            }
            for (let i = 0; i < elements.length; i++) {
                if (elements[i].matches(".floatingItem") && elements[i] != me.movingDiv) {
                    elements[i].style.border = "3px dotted red";
                    break;
                }
            }
        }
    })

    this.itemspace.addEventListener("mouseup", e => {
        me.handleMoveEnd(e)
    });
    this.itemspace.addEventListener("mouseleave", e => {
        me.handleMoveEnd(e)
    });

    me.handleMoveEnd = function (e, touch) {
        if (me.dragging) {
            //disengage drag
            me.dragging = false;
            me.movingDiv.classList.remove("moving");

            let fi = me.rootdiv.querySelectorAll(".floatingItem");
            for (let i = 0; i < fi.length; i++) {
                fi[i].style.border = "";
            }

            //define some stuff
            let thing = me.movingDiv.dataset.id
            let elements = document.elementsFromPoint(e.clientX, e.clientY);
            /*
              case 1: hidden
              case 2: dragged into another object
              case 3: dragged to a position
            */
            for (let i = 0; i < elements.length; i++) {
                if (elements[i].matches(".floatingItem") && elements[i] != me.movingDiv) {
                    me.setParent(thing, elements[i].dataset.id);
                    return;
                }
            }
            me.updatePosition(thing);
        }
    };

    this.itemspace.addEventListener("dblclick", function (e) {
        if (e.target == me.itemspace) {
            let rect = me.itemspace.getBoundingClientRect();
            me.createItem((e.pageX - rect.left) / me.itemspace.clientWidth, (e.pageY - rect.top) / me.itemspace.clientHeight);
            // Make a new item
        }
    })

    this.itemspace.addEventListener("click", function (e) {
        let fi = me.rootdiv.querySelectorAll(".floatingItem");
        for (let i = 0; i < fi.length; i++) {
            fi[i].classList.remove("selected");
        }
    })

    scriptassert([
        ["contextmenu", "genui/contextMenu.js"]
    ], () => {
        me.itemContextMenu = contextMenuManager.registerContextMenu(
            `<li class="deleteButton">Delete</li>
            <li class="subview">Open Subview</li>`,
            me.rootdiv,
            ".floatingItem",
            e => {
                let cte = e.target;
                while (!cte.matches(".floatingItem")) cte = cte.parentElement;
                me.contextedElement = cte;
            }
        );
        me.itemContextMenu.querySelector(".deleteButton").addEventListener("click", e => {
            //delete the div and delete its corresponding item
            me.removeItem(me.contextedElement.dataset.id);
            me.itemContextMenu.style.display = "none";
        });

        me.itemContextMenu.querySelector(".subView").addEventListener("click", e => {
            //delete the div and delete its corresponding item
            core.items[me.contextedElement.dataset.id].synergist.viewName = me.deltas[me.contextedElement.dataset.id].getText();
            me.switchView(me.contextedElement.dataset.id);
            me.itemContextMenu.style.display = "none";
        });
    })


    this.resize = function () {
        if (me.arrangeItem) {
            for (let i in core.items) {
                me.arrangeItem(i);
            }
        }
    }


    //----------item functions----------//
    this.hide = function (id) {

    }

    this.unhide = function (id) {

    }

    this.clearParent = function (id) {

    }

    this.updatePosition = function (id) {
        let it = me.rootdiv.querySelector(".floatingItem[data-id='" + id + "']");
        core.items[id].synergist.viewData[this.settings.currentViewName].x = (it.getBoundingClientRect().left - me.itemspace.getBoundingClientRect().left) / me.itemspace.clientWidth;
        core.items[id].synergist.viewData[this.settings.currentViewName].y = (it.getBoundingClientRect().top - me.itemspace.getBoundingClientRect().top) / me.itemspace.clientHeight;
        me.arrangeItem(id);
    }

    scriptassert([
        ["quill", "3pt/quill.min.js"]
    ], () => {
        let s = document.createElement("link");
        s.rel = "stylesheet";
        s.href = "3pt/quill.bubble.css";
        s.type = "text/css";
        operator.div.appendChild(s);
        me.deltas = {}; //this is necessary apparently.
        me.itemspace.addEventListener("keyup", function(e){
            if (e.target.matches(".floatingItem *")||e.target.matches(".floatingItem")){
                let lt=e.target;
                while(!lt.matches(".floatingItem")){
                    lt=lt.parentElement;
                }
                let id=lt.dataset.id;
                core.items[id].synergist.description = me.deltas[id].getContents();
                core.fire("updateItem",{id:id});
            }
        })

        me.arrangeItem = function (id) {
            if (!core.items[id].synergist || !core.items[id].synergist.viewData) return;
            //visual aspect of updating position.
            //Check if the item actually exists yet
            let it = me.rootdiv.querySelector(".floatingItem[data-id='" + id + "']");
            if (!it) {
                it = document.createElement("div");
                it.classList.add("floatingItem");
                it.dataset.id = id;
                it.style.resize = "both";
                let dqiv = document.createElement("div");
                it.appendChild(dqiv);
                me.itemspace.appendChild(it);
                me.deltas[id] = new Quill(dqiv, {
                    theme: "bubble"
                }); //picky quill needs to be attached to dom to initalise :/

                //check whether or not description is quill compatible; if not, then upgrade.
                if (core.items[id].synergist.description && typeof core.items[id].synergist.description == "string") {
                    core.items[id].synergist.description = [{
                        insert: core.items[id].synergist.description
                    }];
                }
                me.deltas[id].setContents(core.items[id].synergist.description);
            }
            //if in this view, position it
            if (core.items[id].synergist.viewData[me.settings.currentViewName]) {
                //position it
                it.style.display = "block";
                it.style.left = Math.floor(core.items[id].synergist.viewData[me.settings.currentViewName].x * me.itemspace.clientWidth) +
                    "px";
                it.style.top = Math.floor(core.items[id].synergist.viewData[me.settings.currentViewName].y * me.itemspace.clientHeight) +
                    "px";
            } else {
                //otherwise hide it
                it.style.display = "none";
            }
            //set the contents of the quill
            /*q.setContents([{

            }])*/
        } // arrange all items
        for (let i in core.items) {
            me.arrangeItem(i);
        }
    })


    this.removeItem = function (id) {

    }

    this.createItem = function (x, y) {
        let itm = new _item();
        //register it with the core
        let id = core.insertItem(itm);
        itm.title = "";
        itm.synergist = {
            viewData: {},
            description: ""
        };
        itm.synergist.viewData[me.settings.currentViewName] = {
            x: x,
            y: y
        };
        //register a change
        core.fire("create", {
            sender: this,
            id: id
        });
        core.fire("updateItem", {
            sender: this,
            id: id
        });
        this.arrangeItem(id);
    }

    this.removeItem = function (id) {
        this.rootdiv.querySelector(".floatingItem[data-id='" + id + "']").remove();
        core.fire("deleteItem", {
            id: id
        });
    }

    //Register changes with core
    this.somethingwaschanged = function () {
        core.fire("updateItem", {
            id: itemID,
            sender: this
        });
    }

    //Register focus with core
    this.somethingwasfocused = function () {
        core.fire("focus", {
            id: itemID,
            sender: this
        });
    }


    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    this.fromSaveData = function (d) {
        Object.assign(this.settings, d);
        this.processSettings();
    }



    //Handle a change in settings (either from load or from the settings dialog or somewhere else)
    this.processSettings = function () {
        // add a new view if there is no existing view
        if (this.settings.currentViewName == undefined) {
            let itm = new _item();
            let id = core.insertItem(itm);
            itm.title = "New View";
            itm.synergist = {
                type: "blank",
                viewName: "main"
            }
            this.settings.currentViewName = id;
            this.switchView(id);
            core.fire("create", {
                id: id
            });
            core.fire("updateItem", {
                id: id
            });
        } else {
            this.switchView(this.settings.currentViewName);
        }
    }

    //Create a settings dialog
    scriptassert([
        ["dialog", "genui/dialog.js"]
    ], () => {
        me.dialog = document.createElement("div");

        me.dialog.innerHTML = `
        <div class="dialog">
        </div>`;
        dialogManager.checkDialogs(me.dialog);
        //Restyle dialog to be a bit smaller
        me.dialog = me.dialog.querySelector(".dialog");
        me.innerDialog = me.dialog.querySelector(".innerDialog");
        operator.div.appendChild(me.dialog);
        let d = document.createElement("div");
        d.innerHTML = `
        WHAT YOU WANT TO PUT IN YOUR DIALOG
        `;
        me.innerDialog.appendChild(d);

        //When the dialog is closed, update the settings.
        me.dialog.querySelector(".cb").addEventListener("click", function () {
            me.updateSettings();
        })

        me.showSettings = function () {
            me.dialog.style.display = "block";
        }
    })



});