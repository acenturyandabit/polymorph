core.registerOperator("itemcluster2", {
    displayName: "Itemcluster 2",
    description: "A brainstorming board. Add items, arrange them, and connect them with lines."
}, function (container) {
    let me = this;
    addEventAPI(this);
    me.container = container; //not strictly compulsory bc this is expected and automatically enforced - just dont touch it pls.
    this.settings = {
        itemcluster: {
            cx: 0,
            cy: 0,
            scale: 1
        }
    };
    this.rootdiv = document.createElement("div");
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.rootdiv.innerHTML = `
    <style>
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
    .itemcluster-container{
        height:100%;
    }

    .anchored>div>textarea{
        border: 3px dashed blue;
    }

    .floatingItem>div>textarea{
        resize:none;
        width: 100%;
        height: calc(100% - 15px);
    }

    .floatingItem>div{
        resize:both;
        overflow: auto;
        border: 1px solid black;
        box-sizing: border-box;
    }
    .itemcluster{
        position:relative;
    }
    .tray{
        position:absolute;
        transform: translateY(80px);
        height: 120px;
        width: 100%;
        bottom: 0;
        background: lightgrey;
        transition: all 0.5s ease;
        flex-direction:row;
        overflow-x:auto;
    }
    .tray:hover{
        transform: translateY(0);
    }
    .tray textarea{
        height:100%;
        resize: none;
    }
    </style>
<div>
    <div class="itemcluster-container">
        <div class="itemcluster-banner">
            <span class="topbar">
                <a>View:</a>
                <span>
                    <a class="viewNameContainer" style="background:rgb(132, 185, 218);"><span><span contenteditable class="viewName" data-listname='main' style="cursor:text"></span><span
                                class="listDrop">&#x25BC</span>
                        </span><!--<img class="gears" src="assets/gear.png" style="height:1em">--></a>
                    <div class="viewNameDrop" style="display:none">
                    </div>
                </span>
            </span>
        </div>
        <div class="itemcluster"  style="flex: 1 1 100%;position: relative; background:grey;">
        <div class="tray">
        </div>
        </div>
    </div>
</div>`;
    this.viewName = this.rootdiv.querySelector(".viewName");
    this.viewDropdown = this.rootdiv.querySelector(".viewNameDrop");
    this.viewDropdownButton = this.rootdiv.querySelector(".listDrop");
    this.viewDropdownContainer = this.rootdiv.querySelector(
        ".viewNameContainer"
    );
    this.itemSpace = this.rootdiv.querySelector(".itemcluster");
    container.div.appendChild(this.rootdiv);
    this.tray = this.rootdiv.querySelector(".tray");

    this.tray.addEventListener("wheel", (e) => {
        me.tray.scrollLeft += e.deltaY;
    })

    me.tray.addEventListener("input", (e) => {
        core.items[e.target.parentElement.dataset.id].title = e.target.value;
        core.fire('updateItem', { sender: me, id: e.target.parentElement.dataset.id });
    })

    me.mapPageToSvgCoords = function (pageX, pageY, vb) {
        let rels = me.svg.node.getBoundingClientRect();
        if (!vb) vb = me.svg.viewbox();
        let ret = {};
        ret.x = (pageX - rels.x) / rels.width * vb.width + vb.x;
        ret.y = (pageY - rels.y) / rels.height * vb.height + vb.y;
        return ret;
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //Tutorial

    if (!core.userData.introductions.itemcluster) {
        let tu = new _tutorial({
            root: me.rootdiv
        });
        tu.push({
            id: "hello",
            target: me.rootdiv,
            type: "shader",
            contents: `<p>Double click to add a new box.</p>
      <p>Click and drag to add new boxes!</p>`,
            to: [
                ["OK!"]
            ]
        });
        tu.start("hello").end(() => {
            core.userData.introductions.itemcluster = true;
            core.saveUserData();
        });
    }
    //////////////////////////// Focusing an item////////////////////
    core.on("focus", (d) => {
        if (d.sender == me) return;
        if (itemPointerCache[d.id] && core.items[d.id].itemcluster.viewData[me.settings.currentViewName]) {
            core.items[me.settings.currentViewName].itemcluster.cx = itemPointerCache[d.id].cx();
            core.items[me.settings.currentViewName].itemcluster.cy = itemPointerCache[d.id].cy();
            me.viewAdjust();
            if (me.preselected) {
                me.preselected.classList.remove("selected");
                me.preselected.classList.remove("anchored");
            }
            me.preselected = itemPointerCache[d.id].node;
            me.preselected.classList.add("anchored");
        }
    })


    ////////////////////////////////////////Handle core item updates//////////////////
    //lazily double up updates so that we can fix the lines
    // but only update items that are visible; and only update if we are visible
    let acp = new capacitor(200, 1000, () => {
        for (let i in core.items) {
            if (core.items[i].itemcluster && core.items[i].itemcluster.viewData && core.items[i].itemcluster.viewData[me.settings.currentViewName]) {
                me.arrangeItem(i);
            }
        }
    })

    core.on("updateItem", function (d) {
        let id = d.id;
        let sender = d.sender;
        if (sender == me) return;

        if (me.container.visible()) {
            let present = false;
            try {
                if (core.items[id].itemcluster.viewData[me.settings.currentViewName]) {
                    if (me.arrangeItem) {
                        me.arrangeItem(id);
                        acp.submit();
                    }
                    present = true;
                }
            } catch (e) {
            }
            if (!present && (!(me.settings.filter) || core.items[id][me.settings.filter])) {
                me.addToTray(id);
            }
        }
        return ((core.items[id].itemcluster && (core.items[id].itemcluster.viewData || core.items[id].itemcluster.viewName)) != undefined);
        //Check if item is shown
        //Update item if relevant
        //This will be called for all items when the items are loaded.
    });



    ///////////////////////////////////////////////////////////////////////////////////////
    //Views

    //Editing the name of a view
    this.viewName.addEventListener("keyup", function (e) {
        core.items[me.settings.currentViewName].itemcluster.viewName =
            e.currentTarget.innerText;
        core.fire("updateItem", {
            id: me.settings.currentViewName,
            sender: me
        });
    });

    /*
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
      });*/

    this.viewDropdown.addEventListener("click", function (e) {
        if (e.target.tagName.toLowerCase() == "a") {
            if (e.target.dataset.isnew) {
                //make a new view
                nv = me.makeNewView();
                me.switchView(nv);
            } else {
                ln = e.target.dataset.listname;
                me.switchView(ln);
            }
        } else {
            if (e.target.tagName.toLowerCase() == "em") {
                nv = Date.now().toString();
                nv = me.makeNewView();
                me.switchView(nv);
            }
        }
        me.viewDropdown.style.display = "none";
        e.stopPropagation();
    });

    this.viewDropdownButton.addEventListener("click", function () {
        me.viewDropdown.innerHTML = "";
        for (i in core.items) {
            if (core.items[i].itemcluster && core.items[i].itemcluster.viewName) {
                if (me.settings.filter && !(core.items[i][me.settings.filter])) continue;//apply filter to views
                let aa = document.createElement("a");
                aa.dataset.listname = i;
                aa.innerHTML = core.items[i].itemcluster.viewName;
                me.viewDropdown.appendChild(aa);
            }
            //v = itemcluster.views[i].name;
        }
        me.viewDropdown.appendChild(htmlwrap(`<a data-isnew="yes"><em>Add another view</em></a>`));
        me.viewDropdown.appendChild(htmlwrap(`<a data-isnew="yes"><em>Create view from filter</em></a>`));
        me.viewDropdown.style.display = "block";
    });
    this.rootdiv.addEventListener("mousedown", function (e) {
        let p = e.target;
        while (p != me.rootdiv && p) {
            if (p == me.viewDropdown) return;
            p = p.parentElement;
        }
        me.viewDropdown.style.display = "none";
    });
    this.switchView = function (ln, assert, subview) {
        let preview = me.settings.currentViewName;
        me.settings.currentViewName = ln;
        if (!me.settings.currentViewName) {
            //if not switching to any particular view, switch to first available view.
            let switched = false;
            for (let i in core.items) {
                if (core.items[i].itemcluster && core.items[i].itemcluster.viewName) {
                    if (me.settings.filter && !(core.items[i][me.settings.filter])) {
                        continue;
                    }
                    this.switchView(i);
                    switched = true;
                    break;
                }
            }
            //If no views, make a new view to switch to.
            if (!switched) {
                this.switchView(guid(4), true);
            }
            //Show blank
        } else {
            if (!core.items[me.settings.currentViewName]) {
                if (assert) {
                    core.items[me.settings.currentViewName] = {};
                } else {
                    me.switchView();
                    return;
                }
            }
            if (!core.items[me.settings.currentViewName].itemcluster) {
                if (assert) {
                    core.items[me.settings.currentViewName].itemcluster = {};
                } else {
                    me.switchView();
                    return;
                }
            }
            if (!core.items[me.settings.currentViewName].itemcluster.viewName) {
                if (assert) {
                    core.items[me.settings.currentViewName].itemcluster.viewName = core.items[ln].title || ln
                    core.fire("updateItem", {
                        id: me.settings.currentViewName
                    });
                } else {
                    me.switchView();
                    return;
                }
            }

            //buttons
            this.viewName.innerText =
                core.items[me.settings.currentViewName].itemcluster.viewName.replace(/\n/ig, "");
            //if this is a subview, add a button on the back; otherwise remove all buttons
            if (preview != ln && preview) {
                if (subview) {
                    let b = document.createElement("button");
                    b.dataset.ref = preview;
                    b.innerText = core.items[preview].itemcluster.viewName;
                    b.addEventListener("click", () => {
                        me.switchView(b.dataset.ref, true, false);
                        while (b.nextElementSibling.tagName == "BUTTON") b.nextElementSibling.remove();
                        b.remove();
                    })
                    this.viewName.parentElement.insertBefore(b, this.viewName);
                } else if (subview != false) {
                    //subview is undefined; hard switch (killall buttons)
                    let bs = this.viewName.parentElement.querySelectorAll("button");
                    for (let i = 0; i < bs.length; i++) {
                        bs[i].remove();
                    }
                }
            }
            //kill all lines
            for (let i in me.activeLines) {
                for (let j in me.activeLines[i]) {
                    me.activeLines[i][j].remove();
                    delete me.activeLines[i][j];
                }
            }
            //reposition all items, also updating viewbox
            for (i in core.items) {
                if (core.items[i].itemcluster && core.items[i].itemcluster.viewData) {
                    if (me.arrangeItem) me.arrangeItem(i);
                    //position the item appropriately.
                }
            }
            for (i in core.items) {
                if (core.items[i].itemcluster && core.items[i].itemcluster.viewData) {
                    if (me.arrangeItem) me.arrangeItem(i);
                    //twice so that all lines show up. How efficient.
                }
            }
            me.viewAdjust();
        }
    };

    this.makeNewView = function () {
        //register it with the core
        let itm = {};
        let id = core.insertItem(itm);
        itm.title = "New view";
        itm.itemcluster = {
            viewName: "New View"
        };
        if (me.settings.filter) {
            if (!itm[me.settings.filter]) itm[me.settings.filter] = true;
        }
        //register a change
        core.fire("updateItem", {
            sender: this,
            id: id
        });
        this.switchView(id);
        return id;
    };

    this.cloneView = function () {
        //register it with the core
        let itm = {};
        let id = core.insertItem(itm);
        itm.title = "New view";
        itm.itemcluster = {
            viewName: "Copy of" + core.items[me.settings.currentViewName].itemcluster.viewName
        };
        itm.title = core.items[me.settings.currentViewName].itemcluster.viewName;
        if (me.settings.filter) {
            if (!itm[me.settings.filter]) itm[me.settings.filter] = true;
        }
        core.fire("updateItem", {
            sender: this,
            id: id
        });
        //clone positions as well
        for (let i in core.items) {
            if (core.items[i].itemcluster && core.items[i].itemcluster.viewData && core.items[i].itemcluster.viewData[me.settings.currentViewName]) {
                core.items[i].itemcluster.viewData[id] = core.items[i].itemcluster.viewData[me.settings.currentViewName];
            }
        }
        this.switchView(id);
    };
    this.destroyView = function (viewName, auto) {
        // Destroy the itemcluster property of the item but otherwise leave it alone
        delete core.items[viewName].itemcluster.viewName;
        if (me.settings.filter) {
            delete core.items[viewName][me.settings.filter];
        }
        core.fire("deleteItem", {
            id: viewName
        });
        this.switchView();
    };

    core.on("focus", (e) => {
        if (me.settings.operationMode == "focus") {
            if (e.sender.container.uuid == me.settings.focusOperatorID) {
                me.switchView(e.id, true);
            }
        }
    })

    ///////////////////////////////////////////////////////////////////////////////////////
    //Various context menus

    scriptassert([
        ["contextmenu", "genui/contextMenu.js"]
    ], () => {
        let contextMenuManager = new _contextMenuManager(me.rootdiv);
        function chk(e) {
            if (e.target.tagName.toLowerCase() == "svg") return true;//only activate on clicks to the background.
        }
        me.rootcontextMenu = contextMenuManager.registerContextMenu(`
        <li class="pastebtn">Paste</li>
        <li class="collect">Collect items here</li>
        <li class="hierarchy">Arrange in hierarchy</li>
        `, me.rootdiv, undefined, chk);
        me.rootcontextMenu.querySelector(".pastebtn").addEventListener("click", (e) => {
            if (core.shared.synergistCopyElement) {
                let coords = me.mapPageToSvgCoords(e.pageX, e.pageY);
                core.items[core.shared.synergistCopyElement].itemcluster.viewData[me.settings.currentViewName] = {
                    x: coords.x,
                    y: coords.y,
                }
                me.rootcontextMenu.style.display = "none";
                me.arrangeItem(core.shared.synergistCopyElement);
                core.fire("updateItem", {
                    id: core.shared.synergistCopyElement,
                    sender: me
                });
            }
        })
        me.rootcontextMenu.querySelector(".collect").addEventListener("click", (e) => {
            let rect = me.itemSpace.getBoundingClientRect();
            for (let i in core.items) {
                if (core.items[i].itemcluster && core.items[i].itemcluster.viewData && core.items[i].itemcluster.viewData[me.settings.currentViewName]) {
                    core.items[i].itemcluster.viewData[me.settings.currentViewName].x = e.clientX - rect.left;
                    core.items[i].itemcluster.viewData[me.settings.currentViewName].y = e.clientY - rect.top;
                    me.arrangeItem(i);
                }
            }
            for (let i in core.items) {
                //second update to fix lines; also alert everyone of changes.
                core.fire("updateItem", {
                    id: i
                });
            }
        })
        me.rootcontextMenu.querySelector(".hierarchy").addEventListener("click", (e) => {
            let rect = me.itemSpace.getBoundingClientRect();
            //order items
            let visibleItems = [];
            for (let i in core.items) {
                if (core.items[i].itemcluster && core.items[i].itemcluster.viewData && core.items[i].itemcluster.viewData[me.settings.currentViewName]) {
                    visibleItems.push({
                        id: i,
                        x: core.items[i].itemcluster.viewData[me.settings.currentViewName].x,
                        y: core.items[i].itemcluster.viewData[me.settings.currentViewName].y,
                        children: []
                    });
                }
            }
            visibleItems.sort((a, b) => {
                return a.y - b.y
            }); // higher items appear first in array.
            let indexedOrder = visibleItems.map((i) => {
                return i.id
            });
            //make a list of links
            let links = [];
            for (let i = 0; i < visibleItems.length; i++) {
                for (let j in core.items[visibleItems[i].id].to) {
                    links.push({
                        a: visibleItems[i].id,
                        b: j
                    });
                }
            }
            //internally reverse sort links by order
            for (let i = 0; i < links.length; i++) {
                let ina = indexedOrder.indexOf(links[i].a);
                let inb = indexedOrder.indexOf(links[i].b);
                if (ina == -1 || inb == -1) {
                    //delete this item
                    links.splice(i, 1);
                    i--;
                }
                if (ina < inb) { //enforce a=lower<-b=higher
                    let c = links[i].b;
                    links[i].b = links[i].a;
                    links[i].a = c;
                }
            }
            //sort link array in reverse by order
            links.sort((a, b) => {
                let ina = indexedOrder.indexOf(a.a);
                let inb = indexedOrder.indexOf(b.a);
                let oua = indexedOrder.indexOf(a.b);
                let oub = indexedOrder.indexOf(b.b);
                return (ina - inb) + !(ina - inb) * (oua - oub); //enforce ones with higher targets are higher.
            })
            //remove duplicate links (i cbs because we just need to divide by a factor of 2 later, no worries)
            //give each of them an order
            let lin = 0; //index of the links
            for (let i = 0; i < visibleItems.length; i++) {
                visibleItems[i].idx = 0;
                while (links[lin] && links[lin].a == visibleItems[i].id) {
                    let nex = 0;
                    if (indexedOrder.indexOf(links[lin].b) != -1) {
                        nex = visibleItems[indexedOrder.indexOf(links[lin].b)].idx + 1;
                    }
                    visibleItems[i].idx = (nex > visibleItems[i].idx) ? nex : visibleItems[i].idx;
                    lin++;
                }
            }

            //sort by IDX, then x.
            visibleItems.sort((a, b) => {
                return (a.idx - b.idx) + !(a.idx - b.idx) * (a.x - b.x);
            })

            //update indexedorder to reflect new sort
            indexedOrder = visibleItems.map((i) => {
                return i.id
            });

            //for each item, give it a direct parent
            for (let l = 0; l < links.length; l++) {
                visibleItems[indexedOrder.indexOf(links[l].a)].parent = links[l].b;

            }
            //get all children of all items
            for (let i = 0; i < visibleItems.length; i++) {
                if (visibleItems[i].parent && indexedOrder.indexOf(visibleItems[i].parent) >= 0) visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].children.push(visibleItems[i].id);
            }

            //calculate widths
            function getWidth(id) {
                let c = visibleItems[indexedOrder.indexOf(id)].children;
                if (!c.length) {
                    return Number(/\d+/.exec(core.items[id].boxsize.w)) + 10;
                } else {
                    let sum = 0;
                    for (let i = 0; i < c.length; i++) {
                        sum = sum + getWidth(c[i]);
                    }
                    let alt = Number(/\d+/.exec(core.items[id].boxsize.w)) + 10;
                    if (sum < alt) sum = alt;
                    return sum;
                }
            }
            for (let i = 0; i < visibleItems.length; i++) {
                //this needs to be optimised with caching.
                visibleItems[i].width = getWidth(visibleItems[i].id);
            }

            // calculate total width
            let tw = 0;
            for (let i = 0; i < visibleItems.length; i++) {
                if (!visibleItems[i].parent) tw += visibleItems[i].width;
                else break;
            }

            //Start rendering!
            let currentx = e.clientX - rect.left - tw / 2;
            let currenty = e.clientY - rect.top;

            function render(itm, tx, ty) { // itm is a visibleItem
                core.items[itm.id].itemcluster.viewData[me.settings.currentViewName].x = tx + (itm.width - Number(/\d+/ig.exec(core.items[itm.id].boxsize.w))) / 2;
                core.items[itm.id].itemcluster.viewData[me.settings.currentViewName].y = ty;
                let ctx = tx;
                for (let i = 0; i < itm.children.length; i++) {
                    ctx += render(visibleItems[indexedOrder.indexOf(itm.children[i])], ctx, ty + 200);
                }
                me.arrangeItem(itm.id);
                return itm.width;
            }

            for (let i = 0; i < visibleItems.length; i++) {
                if (!visibleItems[i].parent) currentx += render(visibleItems[i], currentx, currenty);
            }

            for (let i in core.items) {
                //second update to fix lines; also alert everyone of changes.
                core.fire("updateItem", {
                    id: i
                });
            }

        })
        me.viewContextMenu = contextMenuManager.registerContextMenu(
            `<li class="viewDeleteButton">Delete</li>
                  <li class="viewCloneButton">Clone view</li>`,
            me.viewDropdownContainer
        );
        me.viewDeleteButton = me.viewContextMenu.querySelector(
            ".viewDeleteButton"
        );
        me.viewDeleteButton.addEventListener("click", e => {
            //delete the view
            me.destroyView(me.settings.currentViewName);
            me.viewContextMenu.style.display = "none";
        });

        me.viewCloneButton = me.viewContextMenu.querySelector(".viewCloneButton");
        me.viewCloneButton.addEventListener("click", e => {
            //delete the view
            me.cloneView(me.settings.currentViewName);
            me.viewContextMenu.style.display = "none";
        });
        me.itemContextMenu = contextMenuManager.registerContextMenu(
            `<li class="deleteButton">Delete</li>
          <li class="cpybtn">Copy (between views)</li>
          <li class="subview">Open Subview</li>
          <li>Edit style
          <ul class="submenu">
            <li class="cstyl">Copy style</li>
            <li class="pstyl">Paste style</li>
            <li><input class="background" placeholder="Background"></li>
            <li><input class="color" placeholder="Color"></li>
          </ul>
          </li>
          <li class="orientation">Reorient subitems</li>
          `,
            me.rootdiv,
            ".floatingItem",
            e => {
                let cte = e.target;
                while (!cte.matches(".floatingItem")) cte = cte.parentElement;
                me.contextedElement = cte;
                if (core.items[cte.dataset.id].style) {
                    me.itemContextMenu.querySelector(".background").value = core.items[cte.dataset.id].style.background || "";
                    me.itemContextMenu.querySelector(".color").value = core.items[cte.dataset.id].style.color || "";
                }
                return true;
            }
        );

        function updateStyle(e) {
            let cid = me.contextedElement.dataset.id;
            if (!core.items[cid].style) core.items[cid].style = {};
            core.items[cid].style[e.target.className] = e.target.value;
            core.fire("updateItem", {
                sender: this,
                id: cid
            });
        }
        me.itemContextMenu
            .querySelector(".cstyl")
            .addEventListener("click", ()=>{
                let cid = me.contextedElement.dataset.id;
                me.copiedStyle=core.items[cid].style;
                me.itemContextMenu.style.display = "none";
            });
        me.itemContextMenu
            .querySelector(".pstyl")
            .addEventListener("click", ()=>{
                let cid = me.contextedElement.dataset.id;
                core.items[cid].style=me.copiedStyle;
                me.arrangeItem(cid);
                core.fire("updateItem", {
                    sender: this,
                    id: cid
                });
                me.itemContextMenu.style.display = "none";
            });
        me.itemContextMenu
            .querySelector(".background")
            .addEventListener("input", updateStyle);
        me.itemContextMenu
            .querySelector(".color")
            .addEventListener("input", updateStyle);

        me.itemContextMenu
            .querySelector(".deleteButton")
            .addEventListener("click", e => {
                //delete the div and delete its corresponding item
                me.removeItem(me.contextedElement.dataset.id);
                me.itemContextMenu.style.display = "none";
            });
        me.itemContextMenu
            .querySelector(".cpybtn")
            .addEventListener("click", e => {
                core.shared.synergistCopyElement = me.contextedElement.dataset.id;
                me.itemContextMenu.style.display = "none";
            });
        me.itemContextMenu
            .querySelector(".orientation")
            .addEventListener("click", e => {
                //toggle the itemcluster orientation
                core.items[me.contextedElement.dataset.id].itemcluster.subitemOrientation = !core.items[me.contextedElement.dataset.id].itemcluster.subitemOrientation;
                //reupdate
                me.arrangeItem(me.contextedElement.dataset.id);
                me.itemContextMenu.style.display = "none";
            });

        me.itemContextMenu
            .querySelector(".subView")
            .addEventListener("click", e => {
                core.items[
                    me.contextedElement.dataset.id
                ].itemcluster.viewName = core.items[
                    me.contextedElement.dataset.id
                ].title;
                me.switchView(me.contextedElement.dataset.id, true, true);
                me.itemContextMenu.style.display = "none";
            });
    });



    ///////////////////////////////////////////////////////////////////////////////////////
    //Items
    let itemPointerCache = {};

    scriptassert([
        ["svg", "3pt/svg.min.js"],
        ["foreignobject", "3pt/svg.foreignobject.js"]
    ], () => {
        me.svg = SVG(me.rootdiv.querySelector(".itemcluster"));
        me.arrangeItem = function (id) {
            if (!core.items[id].itemcluster || (!core.items[id].itemcluster.viewData && !core.items[id].itemcluster.viewName))
                return false;
            if (!core.items[id].itemcluster.viewData) return true; // this is not an item - its a view, but we still care about it
            if (!core.items[id].itemcluster.viewData[me.settings.currentViewName]) {
                //if an item of it exists, hide the item
                let rect = itemPointerCache[id];
                if (rect) {
                    rect.hide();
                }
                return true;
            }
            //enforce a property on it with viewName.
            if (!core.items[id][`__itemcluster_${me.settings.currentViewName}`]) core.items[id][`__itemcluster_${me.settings.currentViewName}`] = true;
            let rect = itemPointerCache[id];
            if (!rect) {
                //need to make a new rectangle
                //let _rect = rect.rect(100, 50);
                rect = me.svg.foreignObject(100, 50).attr({
                    "data-id": id,
                    class: "floatingItem"
                });
                rect.appendChild("div");
                itemPointerCache[id] = rect;
                itemPointerCache[id].node.children[0].appendChild(document.createElement("textarea"));
            }
            rect.show();
            if (core.items[id].itemcluster.viewData[me.settings.currentViewName]) {
                rect.move(core.items[id].itemcluster.viewData[me.settings.currentViewName].x, core.items[id].itemcluster.viewData[me.settings.currentViewName].y);
            }
            //fill in the textarea inside
            let tta = itemPointerCache[id].node.children[0].children[0];
            tta.value = core.items[id].title || "";
            if (core.items[id].style) {
                tta.style.background = core.items[id].style.background || "";
                tta.style.color = core.items[id].style.color || matchContrast((/rgba?\([\d,\s]+\)/.exec(getComputedStyle(tta).background) || ['#ffffff'])[0]);
            }
            if (!core.items[id].boxsize) {
                core.items[id].boxsize = {
                    w: "200px",
                    h: "100px"
                };
            }
            itemPointerCache[id].node.children[0].style.width = core.items[id].boxsize.w || "";
            itemPointerCache[id].node.children[0].style.height = core.items[id].boxsize.h || "";
            rect.size(Number(/\d+/ig.exec(core.items[id].boxsize.w)[0]), Number(/\d+/ig.exec(core.items[id].boxsize.h)[0]));

            //add icons if necessary
            if (core.items[id].itemcluster.viewName) {
                //this has a subview, make it known!.
                let subviewItemCount;
                if (rect.node.querySelector(".subviewItemCount")) {
                    subviewItemCount = rect.node.querySelector(".subviewItemCount");
                } else {
                    subviewItemCount = document.createElement("p");
                    subviewItemCount.style.cssText = `
      display: block;
      width: 1em;
      height: 1em;
      font-size: 0.7em;
      margin: 0px;
      text-align: center;
      background: orange;
      `;
                    subviewItemCount.classList.add("subviewItemCount");
                    rect.node.children[0].appendChild(subviewItemCount);
                    //also count all the items in my subview and report.
                }
                let count = 0;
                for (let i in core.items) {
                    if (core.items[i].itemcluster && core.items[i].itemcluster.viewData && core.items[i].itemcluster.viewData[id]) count++;
                }
                subviewItemCount.innerText = count;
            } else {
                if (rect.node.children[0].querySelector(".subviewItemCount")) {
                    rect.node.children[0].querySelector(".subviewItemCount").remove();
                }
            }
            //draw its lines
            if (core.items[id].to) {
                for (let i in core.items[id].to) {
                    me.enforceLine(id, i);
                }
            }
            /*
            .fill('#0044dd')
            .mousedown(startMove)
            .mouseup(linkDrop)
            .on('contextmenu',elemContext)
            .click(selectThis);
            */
            //also delete lines associated with it
            return true;
        }

        ///////////////////////////////////////////////////////////////////////////////////////
        //Lines


        me.linkingLine = me.svg.line(0, 0, 0, 0).stroke({
            width: 3
        }).back();
        me.activeLines = {};
        me.toggleLine = function (start, end) {
            //start and end is now directional. 
            //check if linked; if linked, remove link
            if (core.isLinked(start, end) % 2) {
                core.unlink(start, end);
                if (me.activeLines[start] && me.activeLines[start][end]) me.activeLines[start][end].remove();
                delete me.activeLines[start][end];
            } else {
                core.link(start, end);
                me.enforceLine(start, end);
            }
        };

        me.enforceLine = function (start, end) {
            let sd = itemPointerCache[start];
            let ed = itemPointerCache[end];
            if (!sd || !ed) {
                return;
            }
            //check if line already exists
            if (me.activeLines[start] && me.activeLines[start][end]) {
                //if so, remove
                me.activeLines[start][end].remove();
            }

            //if either is not visible, then dont draw
            if (sd.style.display == "none" || ed.style.display == "none") {
                return;
            } else {
                if (!me.activeLines[start]) me.activeLines[start] = {};
                let x = [sd.cx(), 0, ed.cx()];
                let y = [sd.cy(), 0, ed.cy()];
                x[1] = (x[0] + x[2]) / 2;
                y[1] = (y[0] + y[2]) / 2;
                let l = me.svg.path(`M ${x[0]} ${y[0]} L ${x[1]} ${y[1]} L ${x[2]} ${y[2]}`).stroke({ width: 2, color: "#000" });
                l.marker('mid', 9, 6, function (add) {
                    add.path("M0,0 L0,6 L9,3 z").fill("#000");
                })
                me.activeLines[start][end] = l;
                l.back();
            }
        };


        //arrange items 
        for (let i in core.items) {
            me.arrangeItem(i);
        }
        //twice for lines
        for (let i in core.items) {
            me.arrangeItem(i);
        }
    });

    //More items shenanigans

    this.itemSpace.addEventListener("click", function (e) {
        //click: anchor and deanchor.
        if (me.preselected) {
            me.preselected.classList.remove("selected");
            me.preselected.classList.remove("anchored");
        }
        if (
            e.target.matches(".floatingItem") ||
            e.target.matches(".floatingItem *")
        ) {
            let it = e.target;
            while (!it.matches(".floatingItem")) it = it.parentElement;
            if (me.preselected == it) {
                //keep it anchored
                it.classList.add("anchored");
            } else {
                me.preselected = it;
                it.classList.add("selected");
            }
        } else {
            me.preselected = undefined;
        }
    });

    this.itemSpace.addEventListener("dblclick", function (e) {
        if (me.preselected) {
            me.preselected.classList.remove("selected");
            me.preselected.classList.remove("anchored");
        }
        if (
            e.target.matches(".floatingItem") ||
            e.target.matches(".floatingItem *")
        ) {
            let it = e.target;
            while (!it.matches(".floatingItem")) it = it.parentElement;

            me.preselected = it;
            it.classList.add("anchored");
        } else {
            me.preselected = undefined;
        }
    });

    this.dragging = false;
    this.itemSpace.addEventListener("mousedown", function (e) {
        if (
            e.target.matches(".floatingItem") ||
            e.target.matches(".floatingItem *")
        ) {
            // If we are clicking on an item:
            if (e.which != 1) return;
            if (!e.getModifierState("Shift")) {
                //if not lineing
                let it = e.target;
                while (!it.matches(".floatingItem")) it = it.parentElement;

                if (it.classList.contains("anchored")) return;
                if (me.dragging) return;
                me.movingDiv = itemPointerCache[it.dataset.id];
                //adjust x indexes
                let relements = Object.values(itemPointerCache);
                let minzind = me.settings.maxZ;

                for (let i = 0; i < relements.length; i++) {
                    relements[i].style.border = "";
                    let contest = Number(relements[i].style["z-index"]);
                    if (minzind > contest) minzind = contest;
                }
                core.fire("focus", {
                    id: it.dataset.id,
                    sender: me
                });
                //it.style.border = "3px solid #ffa2fc";
                me.settings.maxZ -= minzind;
                me.settings.maxZ += 1;
                for (let i = 0; i < relements.length; i++) {
                    let contest = Number(relements[i].style["z-index"]);
                    relements[i].style["z-index"] = contest - minzind + 1;
                }
                it.style["z-index"] = ++me.settings.maxZ;
                me.dragging = true;
                //set relative drag coordinates
                let coords = me.mapPageToSvgCoords(e.pageX, e.pageY);
                me.dragDX = coords.x - me.movingDiv.x();
                me.dragDY = coords.y - me.movingDiv.y();
                /*
                let rect = it.getBoundingClientRect();
                me.dragDX = e.pageX - (rect.left + document.body.scrollLeft);
                me.dragDY = e.pageY - (rect.top + document.body.scrollTop);*/
                //e.preventDefault();
                //return false;
            } else {
                let it = e.target;
                while (!it.matches(".floatingItem")) it = it.parentElement;
                me.linkingDiv = it;
                me.linking = true;
            }
        } else if (e.target.matches(".tray textarea")) {
            me.fromTray = e.target.parentElement.dataset.id;
        } else {
            //Pan
            //if (e.getModifierState("Shift") || e.which == 2) {
            me.globalDrag = true;
            let coords = me.mapPageToSvgCoords(e.pageX, e.pageY);
            me.originalViewBox = me.svg.viewbox();
            me.dragDX = coords.x;
            me.dragDY = coords.y;
            me.ocx = core.items[me.settings.currentViewName].itemcluster.cx || 0;
            me.ocy = core.items[me.settings.currentViewName].itemcluster.cy || 0;
            //}
        }
    });

    this.itemSpace.addEventListener("mousemove", function (e) {
        //stop from creating an item if we are resizing another item
        if (Math.abs(e.offsetX - me.mouseStoredX) > 5 || Math.abs(e.offsetY - me.mouseStoredY) > 5) {
            me.possibleResize = true;
        }
        if (me.fromTray) {
            let cid = me.fromTray;
            //make us drag the item
            me.removeFromTray(cid);
            if (!core.items[cid].itemcluster) core.items[cid].itemcluster = {};
            if (!core.items[cid].itemcluster.viewData) core.items[cid].itemcluster.viewData = {};
            core.items[cid].itemcluster.viewData[me.settings.currentViewName] = { x: 0, y: 0 };
            me.arrangeItem(cid);
            me.movingDiv = itemPointerCache[cid];
            // force a mousemove
            let coords = me.mapPageToSvgCoords(e.pageX, e.pageY);
            me.dragDX = 30;
            me.dragDY = 30;
            me.movingDiv.x(coords.x - me.dragDX);
            me.movingDiv.y(coords.y - me.dragDY);

            me.updatePosition(cid);
            me.dragging = true;
            //set a flag so we dont instantly return it to the tray
            me.stillInTray = true;
            me.fromTray = false;
        }
        if (me.dragging) {
            //dragging an item

            /*if (me.movingDiv.parentElement.parentElement.matches(".floatingItem")) {
                //nested items
                me.itemSpace.appendChild(me.movingDiv);
                me.clearParent(me.movingDiv.dataset.id);
                //me.items[me.movingDiv.dataset.id].viewData[me.currentView].parent = undefined;
            }*/
            //me.movingDiv.classList.add("moving");
            //translate position of mouse to position of rectangle
            let coords = me.mapPageToSvgCoords(e.pageX, e.pageY);
            me.movingDiv.x(coords.x - me.dragDX);
            me.movingDiv.y(coords.y - me.dragDY);
            let elements = me.rootdiv.getRootNode().elementsFromPoint(e.clientX, e.clientY);
            //borders for the drag item in item
            if (me.hoverOver) {
                me.hoverOver.style.border = "";
            }
            let stillInTray = false;
            for (let i = 0; i < elements.length; i++) {
                if (elements[i].matches(".tray")) {
                    if (me.stillInTray) {
                        stillInTray = true;
                        break;
                    }
                    //send to tray, and end interaction
                    // delete the item from this view
                    let cid = me.movingDiv.attr("data-id");
                    delete core.items[cid].itemcluster.viewData[me.settings.currentViewName];
                    delete core.items[cid][`__itemcluster_${me.settings.currentViewName}`];
                    me.arrangeItem(cid);
                    me.addToTray(cid);
                    me.dragging = false;
                    core.fire("updateItem", { sender: me, id: cid });
                }
                if (elements[i].matches(".floatingItem") && elements[i].dataset.id != me.movingDiv.attr("data-id")) {
                    me.hoverOver = elements[i];
                    elements[i].style.border = "3px dotted red";
                    break;
                }
            }
            if (!stillInTray) me.stillInTray = false;
            //if we are moving something ensure it wont be twice-click selected.
            me.preselected = undefined;
            //redraw all ITS lines
            let ci = me.movingDiv.node.dataset.id
            for (let i in me.activeLines) {
                for (let j in me.activeLines[i]) {
                    if (i == ci || j == ci) {// this could STILL be done better
                        me.enforceLine(i, j);
                    }
                }
            }
        } else if (me.linking) {
            // draw a line from the object to the mouse cursor
            let rect = itemPointerCache[me.linkingDiv.dataset.id];
            let p = me.mapPageToSvgCoords(e.pageX, e.pageY)
            me.linkingLine.plot(
                rect.x() + rect.width() / 2,
                rect.y() + rect.height() / 2,
                p.x,
                p.y
            ).stroke({
                width: 3
            }).marker('end', 9, 6, function (add) {
                add.path("M0,0 L0,6 L9,3 z").fill("#000");
            });
        } else if (me.globalDrag) {
            // shift the view by delta
            let coords = me.mapPageToSvgCoords(e.pageX, e.pageY, me.originalViewBox);

            core.items[me.settings.currentViewName].itemcluster.cx =
                me.ocx - (coords.x - me.dragDX);
            core.items[me.settings.currentViewName].itemcluster.cy =
                me.ocy - (coords.y - me.dragDY);
            //arrange all items
            me.viewAdjust();
        }
    });

    this.viewAdjust = function () {
        let ic = core.items[me.settings.currentViewName].itemcluster;
        let ww = me.itemSpace.clientWidth * (ic.scale || 1);
        let hh = me.itemSpace.clientHeight * (ic.scale || 1);
        if (me.svg) {
            me.svg.viewbox((ic.cx || 0) - ww / 2, (ic.cy || 0) - hh / 2, ww, hh);
        } else {
            setTimeout(me.viewAdjust, 200);
        }
    }

    this.itemSpace.addEventListener("wheel", (e) => {
        if (e.target.matches(".floatingItem") ||
            e.target.matches(".floatingItem *") || me.tray.contains(e.target)) {
            return;
        }
        //calculate old width constant
        let ic = core.items[me.settings.currentViewName].itemcluster;
        let br = me.itemSpace.getBoundingClientRect();
        ic.scale = ic.scale || 1;
        let vw = me.itemSpace.clientWidth * ic.scale;
        let vh = me.itemSpace.clientHeight * ic.scale;
        let wc = ic.cx - vw / 2 + (e.clientX - br.x) / br.width * vw;
        let hc = ic.cy - vh / 2 + (e.clientY - br.y) / br.height * vh;
        if (e.deltaY > 0) {
            ic.scale *= 1.1;
        } else {
            ic.scale *= 0.9;
        }
        //correct the new view centre
        vw = me.itemSpace.clientWidth * ic.scale;
        vh = me.itemSpace.clientHeight * ic.scale;
        ic.cx = wc - (e.clientX - br.x) / br.width * vw + vw / 2;
        ic.cy = hc - (e.clientY - br.y) / br.height * vh + vh / 2;
        me.viewAdjust();
    })

    this.itemSpace.addEventListener("mouseup", e => {
        me.handleMoveEnd(e);
    });
    this.itemSpace.addEventListener("mouseleave", e => {
        me.handleMoveEnd(e);
    });

    me.handleMoveEnd = function (e, touch) {
        me.fromTray = false;
        if (me.globalDrag) {
            setTimeout(me.viewAdjust, 500);
            me.globalDrag = false;
        }
        if (me.dragging) {
            //disengage drag
            me.dragging = false;
            //me.movingDiv.classList.remove("moving");
            if (me.hoverOver) me.hoverOver.style.border = "";

            //define some stuff
            let thing = me.movingDiv.attr("data-id");

            let elements = me.rootdiv
                .getRootNode()
                .elementsFromPoint(e.clientX, e.clientY);
            /*
                      case 1: hidden
                      case 2: dragged into another object
                      case 3: dragged to a position
            */
            //adding to another view
            for (let i = 0; i < elements.length; i++) {
                if (
                    elements[i].matches(".floatingItem") &&
                    elements[i].dataset.id != thing
                ) {
                    core.items[thing].itemcluster.viewData[elements[i].dataset.id] = {
                        x: 0,
                        y: 0
                    };
                    if (!e.ctrlKey) {
                        delete core.items[thing].itemcluster.viewData[me.settings.currentViewName];
                        me.arrangeItem(thing);
                    }
                    //me.switchView(elements[i].dataset.id, true, true);
                    break;
                }
            }
            me.updatePosition(thing);
            core.fire("updateItem", {
                sender: me,
                id: thing
            });
        } else if (me.linking) {
            //reset linking line
            me.linkingLine.plot(0, 0, 0, 0).stroke({ width: 0 });
            me.linking = false;
            //change the data
            let linkedTo;
            let elements = container.div.elementsFromPoint(e.clientX, e.clientY);
            for (let i = 0; i < elements.length; i++) {
                if (
                    elements[i].matches("textarea") &&
                    elements[i].parentElement.parentElement.dataset.id != me.linkingDiv.dataset.id
                ) {
                    linkedTo = elements[i].parentElement.parentElement;
                    break;
                }
            }
            if (linkedTo) {
                //add a new line connecting the items
                me.toggleLine(me.linkingDiv.dataset.id, linkedTo.dataset.id);
                //push the change
                core.fire("updateItem", {
                    sender: me,
                    id: me.linkingDiv.dataset.id
                });
                core.fire("updateItem", {
                    sender: me,
                    id: linkedTo.dataset.id
                });
            }
        } else if (me.preselected) {
            if (!core.items[me.preselected.dataset.id].boxsize) core.items[me.preselected.dataset.id].boxsize = {};
            bs = core.items[me.preselected.dataset.id].boxsize;
            bs.w = me.preselected.children[0].style.width;
            bs.h = me.preselected.children[0].style.height;
            me.arrangeItem(me.preselected.dataset.id); // handle resizes
        }
    };
    this.itemSpace.addEventListener("mousedown", function (e) {
        me.possibleResize = false;
        me.mouseStoredX = e.offsetX;
        me.mouseStoredY = e.offsetY;
    });
    this.itemSpace.addEventListener("dblclick", function (e) {
        if (me.possibleResize) {
            me.possibleResize = false;
            return;
        }
        if (e.target == me.itemSpace || e.target.tagName.toLowerCase() == "svg") {
            let coords = me.mapPageToSvgCoords(e.pageX, e.pageY);
            me.createItem(
                coords.x,
                coords.y
            );
            // Make a new item
        }
    });

    //----------item functions----------//
    this.updatePosition = function (id) {
        let it = itemPointerCache[id];
        core.items[id].itemcluster.viewData[this.settings.currentViewName].x = it.x();
        core.items[id].itemcluster.viewData[this.settings.currentViewName].y = it.y();
        core.fire("updateItem", {
            id: id
        });
        me.arrangeItem(id);
    };

    this.createItem = function (x, y) {
        let itm = {};
        //register it with the core
        let id = core.insertItem(itm);
        itm.title = "";
        itm.itemcluster = {
            viewData: {},
            description: ""
        };
        itm.itemcluster.viewData[me.settings.currentViewName] = {
            x: x,
            y: y
        };
        if (me.settings.filter) {
            itm[me.settings.filter] = true;
        }
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
    };

    this.removeItem = function (id) {
        delete core.items[id].itemcluster.viewData[me.settings.currentViewName];
        me.arrangeItem(id);
        core.fire("deleteItem", {
            id: id
        });
    };

    this.rootdiv.addEventListener("focus", (e) => {
        if (e.target.parentElement.parentElement.matches("[data-id]")) {
            let id = e.target.parentElement.parentElement.dataset.id;
            core.fire("focus", {
                id: id,
                sender: this
            });
        }
    })

    this.rootdiv.addEventListener("input", (e) => {
        if (e.target.parentElement.parentElement.matches("[data-id]")) {
            let id = e.target.parentElement.parentElement.dataset.id;
            core.items[id].title = e.target.value;
            core.fire("updateItem", {
                id: id,
                sender: this
            });
        }
    })

    ////////////////////////////////////////////////////////////
    //The tray
    me.addToTray = function (id) {
        let cti = me.tray.querySelector(`div[data-id='${id}']`);
        if (!cti) {
            cti = htmlwrap(`
                <div data-id=${id}>
                <textarea></textarea>
                </div>
            `);
            me.tray.appendChild(cti);
        }
        cti.querySelector("textarea").value = core.items[id].title;
    }

    me.removeFromTray = function (id) {
        let cti = me.tray.querySelector(`div[data-id='${id}']`);
        if (cti) cti.remove();
    }
    me.emptyTray = function () {
        while (me.tray.children.length) {
            me.tray.children[0].remove();
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //Core interactions

    function updateSettings() {
        if (me.settings.tray) {
            //show the tray
            me.emptyTray();
            me.tray.style.display = "flex";
            //also populate the tray
            for (let i in core.items) {
                try {
                    if (core.items[i].itemcluster.viewData[me.settings.currentViewName]) {
                        continue;
                    }
                } catch (e) {
                }
                if (!(me.settings.filter) || core.items[i][me.settings.filter]) {
                    me.addToTray(i);
                }
            }
        } else {
            me.emptyTray();
            me.tray.style.display = "none";
        }
    }

    this.refresh = function () {
        if (me.svg) me.svg.size(me.rootdiv.clientWidth, me.rootdiv.clientHeight);
        me.switchView(me.settings.currentViewName, true);
    };
    //Saving and loading
    this.toSaveData = function () {
        //compile the current view path
        this.settings.viewpath = [];
        let bs = this.viewName.parentElement.querySelectorAll("button");
        for (let i = 0; i < bs.length; i++) {
            this.settings.viewpath.push(bs[i].dataset.ref);
        }
        this.settings.viewpath.push(this.settings.currentViewName);
        return this.settings;
    }

    this.fromSaveData = function (d) {
        //this is called when your operator is started OR your operator loads for the first time
        Object.assign(this.settings, d);
        if (this.settings.viewpath) {
            this.settings.currentViewName = undefined;//clear preview buffer to prevent a>b>a
            for (let i = 0; i < this.settings.viewpath.length; i++) {
                me.switchView(this.settings.viewpath[i], true, true);
            }
        } else {//for older versions
            me.switchView(me.settings.currentViewName, true, true);
        }
        updateSettings();
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `<h1>Mode</h1>
      <select data-role="operationMode">
      <option value="standalone">Standalone</option>
      <option value="focus">Display view from focused item</option>
      </select>
      <h2>Operator to link focus to:<h2>
      <input data-role="focusOperatorID" placeholder="Operator UID (use the button)">
      <button class="targeter">Select operator</button>
      `;
    let options = {
        tray: new _option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "tray",
            label: "Show item tray"
        }),
        filter: new _option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "filter",
            label: "Filter items by string:"
        })
    }
    let targeter = this.dialogDiv.querySelector("button.targeter");
    targeter.addEventListener("click", function () {
        core.target().then((id) => {
            me.dialogDiv.querySelector("[data-role='focusOperatorID']").value = id;
            me.settings['focusOperatorID'] = id
            me.focusOperatorID = me.settings['focusOperatorID'];
        })
    });
    this.showDialog = function () {
        for (i in me.settings) {
            let it = me.dialogDiv.querySelector("[data-role='" + i + "']");
            if (it) it.value = me.settings[i];
        }
        for (i in options) {
            options[i].load();
        }
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        let its = me.dialogDiv.querySelectorAll("[data-role]");
        for (let i = 0; i < its.length; i++) {
            me.settings[its[i].dataset.role] = its[i].value;
        }
        updateSettings();
        core.fire("updateView");
        // pull settings and update when your dialog is closed.

    }
});