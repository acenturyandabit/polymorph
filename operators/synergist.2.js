core.registerOperator("itemcluster2", {
    displayName: "Itemcluster 2",
    description: "Another version of itemcluster. Will eventually replace 1... be ready!"
}, function (container) {
    let me = this;
    addEventAPI(this);
    me.container = container; //not strictly compulsory bc this is expected and automatically enforced - just dont touch it pls.
    this.settings = {};
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
    </style>
<div>
    <div class="itemcluster-container">
        <div class="itemcluster-banner">
            <span class="topbar">
                <a>View:</a>
                <span>
                    <a class="viewNameContainer" style="background:rgb(132, 185, 218);"><span><span contenteditable class="viewName" data-listname='main' style="cursor:text"></span><span
                                class="listDrop">&#x25BC</span>
                        </span><img class="gears" src="resources/gear.png"></a>
                    <div class="viewNameDrop" style="display:none">
                    </div>
                </span>
            </span>
        </div>
        <div class="itemcluster"  style="flex: 1 1 100%;position: relative; background:grey;">
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
    //////////////////Handle core item updates//////////////////
    core.on("updateItem", function (d) {
        let id = d.id;
        let sender = d.sender;
        if (sender == me) return;
        if (me.arrangeItem) return me.arrangeItem(id, true);
        //Check if item is shown
        //Update item if relevant
        //This will be called for all items when the items are loaded.
    });



    ///////////////////////////////////////////////////////////////////////////////////////
    //Views
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
                let aa = document.createElement("a");
                aa.dataset.listname = i;
                aa.innerHTML = core.items[i].itemcluster.viewName;
                me.viewDropdown.appendChild(aa);
            }
            //v = itemcluster.views[i].name;
        }
        let aa = document.createElement("a");
        aa.dataset.isnew = "yes";
        aa.innerHTML = `<em>Add another view</em>`;
        me.viewDropdown.appendChild(aa);
        me.viewDropdown.style.display = "block";
    });
    this.rootdiv.addEventListener("mousedown", function (e) {
        let p = e.target;
        while (p != me.rootdiv) {
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


            this.viewName.innerText =
                core.items[me.settings.currentViewName].itemcluster.viewName;
            //if this is a subview, add a button on the back; otherwise remove all buttons
            if (preview != ln) {
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
        core.fire("updateItem", {
            sender: this,
            id: id
        });
        this.switchView(id);
    };
    this.destroyView = function (viewName, auto) {
        // Destroy the itemcluster property of the item but otherwise leave it alone
        delete core.items[viewName].itemcluster.viewName;
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
    //Context menu

    scriptassert([
        ["contextmenu", "genui/contextMenu.js"]
    ], () => {
        let contextMenuManager = new _contextMenuManager(me.rootdiv);

        me.rootcontextMenu = contextMenuManager.registerContextMenu(`
        <li class="pastebtn">Paste</li>
        <li class="collect">Collect items here</li>
        <li class="hierarchy">Arrange in hierarchy</li>
        `, me.rootdiv);
        me.rootcontextMenu.querySelector(".pastebtn").addEventListener("click", () => {
            if (me.cpyelem) {
                let rect = me.itemSpace.getBoundingClientRect();
                let rect2 = me.rootcontextMenu.getBoundingClientRect();
                core.items[me.cpyelem].itemcluster.viewData[me.settings.currentViewName] = {
                    x: (rect2.left - rect.left) / me.itemSpace.clientWidth +
                        (core.items[me.settings.currentViewName].itemcluster.cx || 0),
                    y: (rect2.top - rect.top) / me.itemSpace.clientHeight +
                        (core.items[me.settings.currentViewName].itemcluster.cy || 0),
                }
                me.rootcontextMenu.style.display = "none";
                me.arrangeItem(me.cpyelem);
                core.fire("updateItem", {
                    id: me.cpyelem,
                    sender: me
                });
            }
        })
        me.rootcontextMenu.querySelector(".collect").addEventListener("click", (e) => {
            let rect = me.itemSpace.getBoundingClientRect();
            for (let i in core.items) {
                if (core.items[i].itemcluster && core.items[i].itemcluster.viewData && core.items[i].itemcluster.viewData[me.settings.currentViewName]) {
                    core.items[i].itemcluster.viewData[me.settings.currentViewName].x = e.clientX - rect.left - (core.items[me.settings.currentViewName].itemcluster.cx || 0);
                    core.items[i].itemcluster.viewData[me.settings.currentViewName].y = e.clientY - rect.top - (core.items[me.settings.currentViewName].itemcluster.cy || 0);
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
                if (core.items[visibleItems[i].id].itemcluster.links) {
                    for (let j in core.items[visibleItems[i].id].itemcluster.links) {
                        if (indexedOrder.indexOf(visibleItems[i].id) > -1 && indexedOrder.indexOf(j) > -1) {
                            links.push({
                                a: visibleItems[i].id,
                                b: j
                            });
                        }
                    }
                }
            }
            //internally reverse sort links by order
            for (let i = 0; i < links.length; i++) {
                let ina = indexedOrder.indexOf(links[i].a);
                let inb = indexedOrder.indexOf(links[i].b);
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
                    let nex = visibleItems[indexedOrder.indexOf(links[lin].b)].idx + 1;
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
                if (visibleItems[i].parent) visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].children.push(visibleItems[i].id);
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
            let currentx = e.clientX - rect.left - (core.items[me.settings.currentViewName].itemcluster.cx || 0) - tw / 2;
            let currenty = e.clientY - rect.top - (core.items[me.settings.currentViewName].itemcluster.cy || 0);

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
                me.cpyelem = me.contextedElement.dataset.id;
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
                let rect = me.svg.select("[data-id='" + id + "']").members[0];
                if (rect) {
                    rect.hide();
                }
                return true;
            }

            let rect = me.svg.select("[data-id='" + id + "']").members[0];
            if (!rect) {
                //need to make a new rectangle
                //let _rect = rect.rect(100, 50);
                rect = me.svg.foreignObject(100, 50).attr({
                    "data-id": id,
                    class: "floatingItem"
                });
                rect.appendChild("div");
                rect.node.querySelector("div").appendChild(document.createElement("textarea"));
            }
            rect.show();
            if (core.items[id].itemcluster.viewData[me.settings.currentViewName]) {
                rect.move(core.items[id].itemcluster.viewData[me.settings.currentViewName].x + (core.items[me.settings.currentViewName].itemcluster.cx || 0), core.items[id].itemcluster.viewData[me.settings.currentViewName].y + (core.items[me.settings.currentViewName].itemcluster.cy || 0));
            }
            //fill in the textarea inside
            me.rootdiv.querySelector("[data-id='" + id + "']>div>textarea").value = core.items[id].title || "";
            if (core.items[id].style) {
                me.rootdiv.querySelector("[data-id='" + id + "']>div>textarea").style.background = core.items[id].style.background || "";
                me.rootdiv.querySelector("[data-id='" + id + "']>div>textarea").style.color = core.items[id].style.color || "";
            }
            if (!core.items[id].boxsize) {
                core.items[id].boxsize = {
                    w: "200px",
                    h: "100px"
                };
            }
            me.rootdiv.querySelector("[data-id='" + id + "']>div").style.width = core.items[id].boxsize.w || "";
            me.rootdiv.querySelector("[data-id='" + id + "']>div").style.height = core.items[id].boxsize.h || "";
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
            if (core.items[id].itemcluster && core.items[id].itemcluster.links) {
                for (let i in core.items[id].itemcluster.links) {
                    me.enforceLine(i, id);
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

            //send an updated item list to everyone who is listening to me
            let existingItems = me.rootdiv.querySelectorAll("[data-id='" + id + "']");
            let eis = [];
            for (let i = 0; i < existingItems.length; i++) eis.push(existingItems[i].dataset.id);
            me.fire('updateItemList', eis);

            return true;
        }

        ///////////////////////////////////////////////////////////////////////////////////////
        //Lines api


        me.linkingLine = me.svg.line(0, 0, 0, 0).stroke({
            width: 5
        }).back();
        me.activeLines = {};
        me.toggleLine = function (start, end) {
            //enforce start is start end is end
            let _start = start;
            let _end = end;
            start = 0;
            end = 0;
            for (i in _start) start = start + _start.charCodeAt(i)
            for (i in _end) end = end + _end.charCodeAt(i)
            if (start > end) {
                start = _start;
                end = _end;
            } else {
                start = _end;
                end = _start;
            }
            //check if linked; if linked, remove link
            if (!core.items[start].itemcluster.links)
                core.items[start].itemcluster.links = {};
            if (!core.items[end].itemcluster.links)
                core.items[end].itemcluster.links = {};
            if (core.items[start].itemcluster.links[end]) {
                delete core.items[start].itemcluster.links[end];
                delete core.items[end].itemcluster.links[start];
                if (me.activeLines[start]) me.activeLines[start][end].remove();
                delete me.activeLines[start][end];
            } else {
                //otherwise create link
                core.items[start].itemcluster.links[end] = true;
                core.items[end].itemcluster.links[start] = true;
                me.enforceLine(start, end);
            }
        };


        me.enforceLine = function (start, end) {
            let sd = me.rootdiv.querySelector("[data-id='" + start + "']");
            let ed = me.rootdiv.querySelector("[data-id='" + end + "']");
            if (!sd || !ed) {
                return;
            }
            //ordering  
            let _start = start;
            let _end = end;
            start = 0;
            end = 0;
            for (i in _start) start = start + _start.charCodeAt(i)
            for (i in _end) end = end + _end.charCodeAt(i)
            if (start > end) {
                start = _start;
                end = _end;
            } else {
                start = _end;
                end = _start;
            }
            //check if line already exists
            if (me.activeLines[start] && me.activeLines[start][end]) {
                l = me.activeLines[start][end];
            } else {
                l = me.svg.line(0, 0, 0, 0).stroke({
                    width: 3
                });
                if (!me.activeLines[start]) me.activeLines[start] = {};
                me.activeLines[start][end] = l;
            }
            let r1 = sd.getBoundingClientRect();
            let r2 = ed.getBoundingClientRect();
            let rb = me.itemSpace.getBoundingClientRect();
            //if either is not visible, then dont draw
            if (sd.style.display == "none" || ed.style.display == "none") {
                l.hide();
                return;
            }
            l.show();
            l.plot(
                r1.left + r1.width / 2 - rb.left,
                r1.top + r1.height / 2 - rb.top,
                r2.left + r2.width / 2 - rb.left,
                r2.top + r2.height / 2 - rb.top
            );
            try {
                l.back();
            } catch (e) {}
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
    this.itemSpace.addEventListener("click", function (e) {
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
            if (e.which != 1) return;
            if (!e.getModifierState("Shift")) {
                let it = e.target;
                while (!it.matches(".floatingItem")) it = it.parentElement;

                if (it.classList.contains("anchored")) return;
                if (me.dragging) return;
                me.movingDiv = me.svg.select("[data-id='" + it.dataset.id + "']").members[0];
                let relements = me.rootdiv.querySelectorAll(".floatingItem");
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
                let rect = it.getBoundingClientRect();
                me.dragDX = e.pageX - (rect.left + document.body.scrollLeft);
                me.dragDY = e.pageY - (rect.top + document.body.scrollTop);
                //e.preventDefault();
                //return false;
            } else {
                let it = e.target;
                while (!it.matches(".floatingItem")) it = it.parentElement;
                me.linkingDiv = it;
                let rect = it.getBoundingClientRect();
                me.linking = true;
            }
        } else {
            //shift to pan
            if (e.getModifierState("Shift") || e.which == 2) {
                me.globalDrag = true;
                me.dragDX = e.pageX;
                me.dragDY = e.pageY;
                me.ocx = core.items[me.settings.currentViewName].itemcluster.cx || 0;
                me.ocy = core.items[me.settings.currentViewName].itemcluster.cy || 0;
            }
        }
    });

    let c = new capacitor(100, 100, () => {
        me.switchView(me.settings.currentViewName);
    });

    this.itemSpace.addEventListener("mousemove", function (e) {
        //stop from creating an item if we are resizing another item
        me.possibleResize = true;
        if (me.dragging) {
            /*if (me.movingDiv.parentElement.parentElement.matches(".floatingItem")) {
                //nested items
                me.itemSpace.appendChild(me.movingDiv);
                me.clearParent(me.movingDiv.dataset.id);
                //me.items[me.movingDiv.dataset.id].viewData[me.currentView].parent = undefined;
            }*/
            //me.movingDiv.classList.add("moving");
            let rect = me.itemSpace.getBoundingClientRect();
            me.movingDiv.x(e.clientX - me.dragDX - rect.left);
            me.movingDiv.y(e.clientY - me.dragDY - rect.top);
            let elements = me.rootdiv.getRootNode().elementsFromPoint(e.clientX, e.clientY);
            //borders for the drag item in item
            let fi = me.rootdiv.querySelectorAll(".floatingItem");
            for (let i = 0; i < fi.length; i++) {
                fi[i].style.border = "";
            }
            for (let i = 0; i < elements.length; i++) {
                if (elements[i].matches(".floatingItem") && elements[i].dataset.id != me.movingDiv.attr("data-id")) {
                    elements[i].style.border = "3px dotted red";
                    break;
                }

            }
            //if we are moving something ensure it wont be twice-click selected.
            me.preselected = undefined;
            //redraw all lines
            for (let i in me.activeLines) {
                for (let j in me.activeLines[i]) me.enforceLine(i, j);
            }
        } else if (me.linking) {
            // draw a line from the object to the mouse cursor
            let rect = me.linkingDiv.getBoundingClientRect();
            let rect2 = me.itemSpace.getBoundingClientRect();
            me.linkingLine.plot(
                rect.left + rect.width / 2 - rect2.left,
                rect.top + rect.height / 2 - rect2.top,
                e.clientX - rect2.left,
                e.clientY - rect2.top
            );
        } else if (me.globalDrag) {
            // shift the view by delta
            core.items[me.settings.currentViewName].itemcluster.cx =
                me.ocx + (e.pageX - me.dragDX);
            core.items[me.settings.currentViewName].itemcluster.cy =
                me.ocy + (e.pageY - me.dragDY);
            //arrange all items
            c.submit();
        }
    });

    this.itemSpace.addEventListener("mouseup", e => {
        me.handleMoveEnd(e);
    });
    this.itemSpace.addEventListener("mouseleave", e => {
        me.handleMoveEnd(e);
    });

    me.handleMoveEnd = function (e, touch) {
        if (me.globalDrag) {
            setTimeout(() => c.submit(), 500);
            me.globalDrag = false;
        }
        if (me.dragging) {
            //disengage drag
            me.dragging = false;
            //me.movingDiv.classList.remove("moving");
            let fi = me.rootdiv.querySelectorAll(".floatingItem");

            for (let i = 0; i < fi.length; i++) {
                fi[i].style.border = "";
            }


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
            for (let i = 0; i < elements.length; i++) {
                if (
                    elements[i].matches(".floatingItem") &&
                    elements[i].dataset.id != thing
                ) {
                    core.items[thing].itemcluster.viewData[elements[i].dataset.id] = {
                        x: 0,
                        y: 0
                    };
                    me.switchView(elements[i].dataset.id, true, true);
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
            me.linkingLine.plot(0, 0, 0, 0);
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
    });
    this.itemSpace.addEventListener("dblclick", function (e) {
        if (me.possibleResize) {
            me.possibleResize = false;
            return;
        }
        if (e.target == me.itemSpace || e.target.tagName.toLowerCase() == "svg") {
            let rect = me.itemSpace.getBoundingClientRect();
            me.createItem(
                (e.pageX - rect.left) -
                (core.items[me.settings.currentViewName].itemcluster.cx || 0),
                (e.pageY - rect.top) -
                (core.items[me.settings.currentViewName].itemcluster.cy || 0)
            );
            // Make a new item
        }
    });

    //----------item functions----------//
    this.updatePosition = function (id) {
        let it = me.rootdiv.querySelector(".floatingItem[data-id='" + id + "']");
        core.items[id].itemcluster.viewData[this.settings.currentViewName].x =
            (it.getBoundingClientRect().left -
                me.itemSpace.getBoundingClientRect().left) -
            (core.items[me.settings.currentViewName].itemcluster.cx || 0);
        core.items[id].itemcluster.viewData[this.settings.currentViewName].y =
            (it.getBoundingClientRect().top -
                me.itemSpace.getBoundingClientRect().top) -
            (core.items[me.settings.currentViewName].itemcluster.cy || 0);
        core.fire("updateItem", {
            id: id
        });
        me.arrangeItem(id);
    };

    this.clearParent = function (id) {
        delete core.items[id].links.parent;
        let itm = me.itemSpace.querySelector(
            ".floatingitem[data-id='" + id + "']"
        );
        itm.style.border = "";
        itm.style.position = "absolute";
    };

    this.setParent = function (childID, parentID) {
        if (!core.items[childID].links) core.items[childID].links = {};
        core.items[childID].links.parent = parentID;
        core.fire("updateItem", {
            sender: this,
            id: childID
        });
        me.arrangeItem(childID);
    };

    this.createItem = function (x, y) {
        let itm = new _item();
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
        delete core.items[id].itemcluster.links;
        me.arrangeItem(id);

        core.fire("deleteItem", {
            id: id
        });
    };

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
    ///////////////////////////////////////////////////////////////////////////////////////
    //Core interactions

    this.resize = function () {
        if (me.svg) me.svg.size(me.rootdiv.clientWidth, me.rootdiv.clientHeight);
        me.switchView(me.settings.currentViewName, true);
    };
    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    this.fromSaveData = function (d) {
        //this is called when your operator is started OR your operator loads for the first time
        Object.assign(this.settings, d);
        me.switchView(me.settings.currentViewName, true);
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
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        let its = me.dialogDiv.querySelectorAll("[data-role]");
        for (let i = 0; i < its.length; i++) {
            me.settings[its[i].dataset.role] = its[i].value;
        }
        core.fire("updateView");
        // pull settings and update when your dialog is closed.
    }
});