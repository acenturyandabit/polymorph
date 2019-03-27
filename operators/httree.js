core.registerOperator("httree", {
    outerScroll: true
}, function (operator) {
    let me = this;
    me.operator = operator;
    this.settings = {};

    this.style = document.createElement("style");
    this.style.innerHTML = `
        textarea{
            min-width: 5em;
            width:100%;
            height:5em;
            resize:none; 
        }
        button{
            width: 100%;
            display:block;
        }
        .containerDiv{
            display:flex;
            flex-direction: row;
        }
        .containerDiv>div{
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .bar{
            width: 100%;
            display: flex;
            flex-direction: row;
            border-top: 1px solid black;
        }
        .bar>span{
            flex:1 1 70%;
            background:white;
        }
        .bar>img{
            flex: 0 0 auto;
            height:1.5em;
        }
        .bar>button{
            flex:0 0 20%;
        }
    `
    operator.div.appendChild(this.style);
    this.rootdiv = document.createElement("div");
    this.rootdiv.style.minWidth = "100%";
    this.rootdiv.style.width = "fit-content";
    this.rootdiv.style.minHeight = "100%";
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.plusbutton = document.createElement("button");
    this.plusbutton.innerText = "+";
    this.rootdiv.appendChild(this.plusbutton);
    this.secondaryDiv = document.createElement("div");
    this.secondaryDiv.classList.add("containerDiv");
    this.rootdiv.appendChild(this.secondaryDiv);
    this.settings.selected = undefined;

    function select(id) {
        let cdiv = me.rootdiv.querySelector("[data-id='" + id + "']");
        if (cdiv) {
            cdiv.scrollIntoViewIfNeeded();
            let cbtn = me.rootdiv.querySelector("[data-id='" + id + "']>button");
            cbtn.style.background = "lightpink";
        }
        me.settings.selected = id;
    }

    function deselect() {
        btns = me.rootdiv.querySelectorAll("button");
        for (let i = 0; i < btns.length; i++) {
            btns[i].style.background = "";
        }
    }

    this.secondaryDiv.addEventListener("click", function (e) {
        if (e.target.tagName.toLowerCase() == "textarea") {
            deselect();
            let t = e.target;
            while (!t.dataset.id) {
                t = t.parentElement;
            }
            select(t.dataset.id);
            core.fire("focus", {
                sender: me,
                id: t.dataset.id
            });
        }
    })

    this.template = document.createElement("div");
    this.template.draggable = true;
    this.template.innerHTML = `
    <span class="bar"><img src="assets/draghandler.jpg" draggable="false" user-select:"none"/><span></span><button>x</button></span>
    <textarea></textarea>
    <button>+</button>
    <div class="containerDiv"></div>
    `
    this.template.querySelector("img").draggable.true;
    this.template.ondragover = (e) => {
        e.preventDefault()
    };
    //delegated handler for the plus button
    this.rootdiv.addEventListener("click", function (e) {
        if (e.target.tagName.toLowerCase() == "button") {
            if (e.target.innerText == "+") {
                //Create a new item
                let it = new _item();
                it.httree = {};
                it.httree.parent = e.target.parentElement.dataset.id;
                //register it with the core
                let id = core.insertItem(it);
                if(me.settings.filter && !it[me.settings.filter]){
                    it[me.settings.filter]=true;
                }
                //register a change
                core.fire("create", {
                    sender: me,
                    id: id
                });
                core.fire("updateItem", {
                    sender: me,
                    id: id
                });
            } else if (e.target.innerText == "x") {
                //remove the current item
                core.fire("deleteItem", {
                    id: e.target.parentElement.parentElement.dataset.id,
                    sender: me
                });
            }
        }
    })
    operator.div.appendChild(this.rootdiv);

    //delegated drag event handler
    let draggingNode;
    let preventDrag;
    this.rootdiv.addEventListener("mousedown", (e) => {
        if (e.target.tagName == "TEXTAREA") {
            preventDrag = true;
        }
    })
    this.rootdiv.addEventListener("dragstart", (e) => {
        if (preventDrag) {
            preventDrag = false;
            return;
        }
        draggingNode = e.target;
    })
    //while dragging, if hovering over a box, higlight one side
    this.rootdiv.addEventListener("drag", (e) => {
        //reset everyone
        let dataids = operator.div.querySelectorAll("[data-id]");
        for (let i = 0; i < dataids.length; i++) {
            dataids[i].style.borderLeft = "none";
            dataids[i].style.borderRight = "none";
        }
        let els = operator.div.elementsFromPoint(e.clientX, e.clientY);
        for (let i = 0; i < els.length; i++) {
            if (els[i].matches("[data-id]")) {
                let deltaX = e.clientX - els[i].clientLeft;
                if (deltaX > els[i].clientWidth / 2) {
                    els[i].style.borderRight = "3px solid red";
                } else {
                    els[i].style.borderLeft = "3px solid red";
                }
            }
        }
    });

    //the drop itself
    this.drophandle = function (e) {
        let dataids = operator.div.querySelectorAll("[data-id]");
        for (let i = 0; i < dataids.length; i++) {
            dataids[i].style.borderLeft = "none";
            dataids[i].style.borderRight = "none";
        }
        e.preventDefault();
        let divtarget = e.target;
        while (!(divtarget.matches("[data-id]") || divtarget == me.rootdiv)) {
            divtarget = divtarget.parentElement;
        }
        if (divtarget.matches("[data-id]")) {
            let dropLocation = divtarget.dataset.id;
            e.preventDefault();
            let id = draggingNode.dataset.id;
            //change the httree.parent of the element
            core.items[id].httree.parent = core.items[dropLocation].httree.parent;
            //insert the div itself
            divtarget.parentNode.insertBefore(draggingNode, divtarget.nextSibling);
            core.fire("updateItem", {
                sender: this,
                id: id
            });
        }
    }

    //////////////////Handle core item updates//////////////////
    //cache requests to items that haven't been updated yet.
    this.cachedUpdateRequests = {};
    //these are optional but can be used as a reference.

    this.drawItem = function (id) {
        //Check if item is shown
        function mkdiv(id) {
            let cdiv = me.template.cloneNode(true);
            cdiv.ondragover = (e) => {
                e.preventDefault()
            };
            cdiv.addEventListener("drop", me.drophandle);
            cdiv.dataset.id = id;
            return cdiv;
        }
        if (core.items[id].httree && (!me.settings.filter || core.items[id][me.settings.filter])) {
            let cdiv = me.rootdiv.querySelector("[data-id='" + id + "']");
            if (!cdiv) {
                if (core.items[id].httree.parent) {


                    let pdiv = me.rootdiv.querySelector("[data-id='" + core.items[id].httree.parent + "']");
                    if (!pdiv) {
                        if (!this.cachedUpdateRequests[core.items[id].httree.parent]) this.cachedUpdateRequests[core.items[id].httree.parent] = [];
                        this.cachedUpdateRequests[core.items[id].httree.parent].push(id);
                    } else {
                        cdiv = mkdiv(id);
                        pdiv.children[3].appendChild(cdiv);
                        if (this.cachedUpdateRequests[id])
                            for (let i = 0; i < this.cachedUpdateRequests[id].length; i++) this.drawItem(this.cachedUpdateRequests[id][i]);
                    }
                } else {
                    cdiv = mkdiv(id);
                    me.secondaryDiv.appendChild(cdiv);
                    if (this.cachedUpdateRequests[id])
                        for (let i = 0; i < this.cachedUpdateRequests[id].length; i++) this.drawItem(this.cachedUpdateRequests[id][i]);
                }
            }
            if (cdiv) {
                cdiv.children[1].value = core.items[id].title;
                if (core.items[id].style) {
                    cdiv.children[1].style.background = core.items[id].style.background;
                    cdiv.children[1].style.color = core.items[id].style.color;
                }
                me.nudge(cdiv.children[1]);
            }
        }
    }


    core.on("updateItem", (d) => {
        this.drawItem(d.id)
    });

    //Update item if relevant
    //This will be called for all items when the items are loaded.
    //This is also called when items are created.

    core.on("focus", function (d) {
        let id = d.id;
        let s = d.sender;
        if (s == me) return;
        deselect();
        if (core.items[id].httree) {
            select(id);
        }
        // An item was focused.
    });

    core.on("deleteItem", function (d) {
        let id = d.id;
        let cdiv = me.rootdiv.querySelector("[data-id='" + id + "']");
        if (cdiv) {
            cdiv.remove();
        }
        // An item was deleted.
    });

    this.nudge = function (elem) {
        if (elem.scrollHeight > elem.offsetHeight) {
            elem.style.minWidth = (elem.offsetWidth + 10) + "px";
            setTimeout(() => {
                this.nudge(elem)
            }, 100);
        }
    }

    this.resize = function () {
        // This is called when my parent rect is resized.
        let tas = this.rootdiv.querySelectorAll("textarea");
        for (let i = 0; i < tas.length; i++) {
            this.nudge(tas[i]);
        }
    }

    setInterval(() => {
        let tas = this.rootdiv.querySelectorAll("textarea");
        for (let i = 0; i < tas.length; i++) {
            this.nudge(tas[i]);
        }
    }, 5000);

    //For interoperability between views you may fire() and on() your own events. You may only pass one object to the fire() function; use the properties of that object for additional detail.


    //////////////////Handling local changes to push to core//////////////////

    //Register changes with core

    this.rootdiv.addEventListener("input", (e) => {
        if (!e.target.parentElement.matches("[data-id]")) return;
        core.items[e.target.parentElement.dataset.id].title = e.target.value;
        this.nudge(e.target);
        let itemID = e.target.parentElement.dataset.id;
        core.fire("updateItem", {
            id: itemID,
            sender: this
        })
    })

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
    this.processSettings = function () {
        //dummy required for fromsavedata. leave blank or remove processSettings() calls!
    }

    this.quickAdd = function (data) {
        //Create a new item
        let it = new _item();
        it.httree = {};
        it.httree.parent = me.settings.selected;
        it.title = data;
        //register it with the core
        let id = core.insertItem(it);
        if(me.settings.filter && !it[me.settings.filter]){
            it[me.settings.filter]=true;
        }
        //register a change
        core.fire("create", {
            sender: me,
            id: id
        });
        core.fire("updateItem", {
            sender: me,
            id: id
        });
        deselect();
        select(id);
        core.fire("updateItem", {
            id: id,
            sender: me
        });
    }

    scriptassert([
        ["contextmenu", "genui/contextMenu.js"],
    ], () => {
        let contextMenuManager = new _contextMenuManager(me.rootdiv);
        let contextedElement;

        function ctxhook(e) {
            let tgt = e.target;
            while (!tgt.matches("[data-id]")) {
                tgt = tgt.parentElement;
            }
            contextedElement = tgt.dataset.id;
            return true;
        }
        me.viewContextMenu = contextMenuManager.registerContextMenu(
            `<li><span>Edit style</span></li>
            <li><input class="background" placeholder="Background"></li>
            <li><input class="color" placeholder="Color"></li>
            `,
            me.rootdiv, ".bar", ctxhook);

        function updateStyle(e) {
            if (!core.items[contextedElement].style) core.items[contextedElement].style = {};
            core.items[contextedElement].style[e.target.className] = e.target.value;
            core.fire("updateItem", {
                sender: this,
                id: contextedElement
            });
        }
        me.viewContextMenu.querySelector(".background").addEventListener("input", updateStyle);
        me.viewContextMenu.querySelector(".color").addEventListener("input", updateStyle);
    })


    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `<h2>Filter</h2>
    <p>Only show items with the following property:</p>
    <input class="filterclass"></input>
    `;
    this.showDialog = ()=>{
        if (this.settings.filter)this.dialogDiv.querySelector(".filterclass").value=this.settings.filter;
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = ()=>{
        this.settings.filter=this.dialogDiv.querySelector(".filterclass").value;
        // pull settings and update when your dialog is closed.
        core.fire("viewUpdate");
        for (let i=0;i<this.secondaryDiv.children.length;i++){
            this.secondaryDiv.children[i].remove();
        }
        for (let i in core.items){
            this.drawItem(i);
        }
    }

    //support the terminal protocol
    this.callables = {};
    this.callables.add = this.quickAdd;
});