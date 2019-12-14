polymorph_core.registerOperator("itemcluster2", {
    displayName: "Itemcluster 2",
    description: "A brainstorming board. Add items, arrange them, and connect them with lines."
}, function (container) {
    addEventAPI(this);

    let defaultSettings = {
        itemcluster: {
            cx: 0,
            cy: 0,
            scale: 1
        },
        filter: guid(6),
        tray: true
    };


    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

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
        <div class="itemcluster"  style="flex: 1 1 100%;position: relative; background:transparent;">
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
        this.tray.scrollLeft += e.deltaY;
    })

    this.tray.addEventListener("input", (e) => {
        polymorph_core.items[e.target.parentElement.dataset.id].title = e.target.value;
        container.fire('updateItem', { sender: this, id: e.target.parentElement.dataset.id });
    })

    ///////////////////////////////////////////////////////////////////////////////////////
    //Tutorial

    //////////////////////////// Focusing an item////////////////////
    container.on("focus", (d) => {
        if (d.sender == this) return;
        if (this.itemPointerCache[d.id] && polymorph_core.items[d.id].itemcluster.viewData[this.settings.currentViewName]) {
            polymorph_core.items[this.settings.currentViewName].itemcluster.cx = this.itemPointerCache[d.id].cx();
            polymorph_core.items[this.settings.currentViewName].itemcluster.cy = this.itemPointerCache[d.id].cy();
            this.viewAdjust();
            if (this.preselected) {
                this.preselected.classList.remove("selected");
                this.preselected.classList.remove("anchored");
            }
            this.preselected = this.itemPointerCache[d.id].node;
            this.preselected.classList.add("anchored");
        }
    })


    ////////////////////////////////////////Handle polymorph_core item updates//////////////////
    //lazily double up updates so that we can fix the lines
    // but only update items that are visible; and only update if we are visible
    let doubleUpdateCapacitor = new capacitor(200, 1000, () => {
        for (let i in polymorph_core.items) {
            if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData && polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName]) {
                this.arrangeItem(i);
            }
        }
    })
    this.itemRelevant = (id) => {
        // I will be shown at some point by this container
        let isFiltered = (polymorph_core.items[id][this.settings.filter] != undefined);
        let hasView = polymorph_core.items[id].itemcluster != undefined && polymorph_core.items[id].itemcluster.viewName != undefined;
        if (polymorph_core.items[id].itemcluster && polymorph_core.items[id].itemcluster.viewData) {
            for (let i in polymorph_core.items[id].itemcluster.viewData) {
                if (polymorph_core.items[i] && ((!this.settings.filter) || (polymorph_core.items[i][this.settings.filter] != undefined))) {
                    hasView = true;
                }
            }
        }
        return (hasView || this.settings.tray) && (!(this.settings.filter) || isFiltered);

    }
    container.on("updateItem", (d) => {
        let id = d.id;
        let sender = d.sender;
        if (sender == this) return;

        if (this.container.visible()) {
            if (polymorph_core.items[id].itemcluster) {
                if (polymorph_core.items[id].itemcluster.viewData) {
                    if (polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName]) {
                        if (this.arrangeItem) {
                            this.arrangeItem(id);
                            doubleUpdateCapacitor.submit();//redraw lines
                        }
                    } else {
                        if (!(this.settings.filter) || polymorph_core.items[id][this.settings.filter]) this.addToTray(id);
                        else {
                            this.removeFromTray(id);
                        }
                    }
                }
            }
        }
        //Check if item is shown
        //Update item if relevant
        //This will be called for all items when the items are loaded.
    });



    ///////////////////////////////////////////////////////////////////////////////////////
    //Views

    //Editing the name of a view
    this.viewName.addEventListener("keyup", (e) => {
        polymorph_core.items[this.settings.currentViewName].itemcluster.viewName =
            e.currentTarget.innerText;
        container.fire("updateItem", {
            id: this.settings.currentViewName,
            sender: this
        });
    });

    this.viewDropdown.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() == "a") {
            if (e.target.dataset.isnew) {
                //make a new view
                let nv = this.makeNewView();
                this.switchView(nv);
            } else {
                let id = e.target.dataset.listname;
                this.switchView(id);
            }
        } else {
            if (e.target.tagName.toLowerCase() == "em") {
                nv = Date.now().toString();
                nv = this.makeNewView();
                this.switchView(nv);
            }
        }
        this.viewDropdown.style.display = "none";
        e.stopPropagation();
    });

    this.viewDropdownButton.addEventListener("click", () => {
        this.viewDropdown.innerHTML = "";
        for (i in polymorph_core.items) {
            if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewName) {
                if (this.settings.filter && !(polymorph_core.items[i][this.settings.filter])) continue;//apply filter to views
                let aa = document.createElement("a");
                aa.dataset.listname = i;
                aa.innerHTML = polymorph_core.items[i].itemcluster.viewName;
                this.viewDropdown.appendChild(aa);
            }
            //v = itemcluster.views[i].name;
        }
        this.viewDropdown.appendChild(htmlwrap(`<a data-isnew="yes"><em>Add another view</em></a>`));
        this.viewDropdown.appendChild(htmlwrap(`<a data-isnew="yes"><em>Create view from filter</em></a>`));
        this.viewDropdown.style.display = "block";
    });

    //hide the view dropdown button, if necessary.
    this.rootdiv.addEventListener("mousedown", (e) => {
        let p = e.target;
        while (p != this.rootdiv && p) {
            if (p == this.viewDropdown) return;
            p = p.parentElement;
        }
        this.viewDropdown.style.display = "none";
    });
    this.switchView = (id, assert, subview) => {
        let previousView = this.settings.currentViewName;
        this.settings.currentViewName = id;
        if (!this.settings.currentViewName) {
            //if not switching to any particular view, switch to first available view.
            let switched = false;
            for (let i in polymorph_core.items) {
                if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewName) {
                    if (this.settings.filter && !(polymorph_core.items[i][this.settings.filter])) {
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
            if (!polymorph_core.items[this.settings.currentViewName] ||
                !polymorph_core.items[this.settings.currentViewName].itemcluster ||
                !polymorph_core.items[this.settings.currentViewName].itemcluster.viewName) {
                if (assert) {
                    this.switchView(this.makeNewView(this.settings.currentViewName));
                } else {
                    //view doesnt exist, switch to any view
                    this.switchView();
                    return;
                }
            }
            //buttons
            this.viewName.innerText =
                polymorph_core.items[this.settings.currentViewName].itemcluster.viewName.replace(/\n/ig, "");
            //if this is a subview, add a button on the back; otherwise remove all buttons
            if (previousView != id && previousView) {
                if (subview) {
                    let b = document.createElement("button");
                    b.dataset.ref = previousView;
                    b.innerText = polymorph_core.items[previousView].itemcluster.viewName;
                    b.addEventListener("click", () => {
                        this.switchView(b.dataset.ref, true, false);
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
            for (let i in this.activeLines) {
                for (let j in this.activeLines[i]) {
                    this.activeLines[i][j].remove();
                    delete this.activeLines[i][j];
                }
            }
            //reposition all items, also updating viewbox
            for (i in polymorph_core.items) {
                if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData) {
                    if (this.arrangeItem) this.arrangeItem(i);
                    //position the item appropriately.
                }
            }
            for (i in polymorph_core.items) {
                if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData) {
                    if (this.arrangeItem) this.arrangeItem(i);
                    //twice so that all lines show up. How efficient.
                }
            }
            this.viewAdjust();
        }
    };

    this.makeNewView = (id) => {
        //register it with the polymorph_core
        let itm;
        if (!id) {
            itm = {};
            id = polymorph_core.insertItem(itm);
        } else {
            itm = polymorph_core.items[id] || {};
        }
        if (!itm.itemcluster) itm.itemcluster = {};
        itm.itemcluster.viewName = "New View"
        if (this.settings.filter) {
            if (!itm[this.settings.filter]) itm[this.settings.filter] = true;
        }
        polymorph_core.items[id] = itm;//in case we are creating from scratch
        //register a change
        container.fire("updateItem", {
            sender: this,
            id: id
        });
        return id;
    };

    this.cloneView = () => {
        //register it with the polymorph_core
        let newName = "Copy of " + polymorph_core.items[this.settings.currentViewName].itemcluster.viewName;
        let id = this.makeNewView();
        polymorph_core.items[id].itemcluster.viewName = newName;
        container.fire("updateItem", {
            sender: this,
            id: id
        });
        //clone positions as well
        for (let i in polymorph_core.items) {
            if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData && polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName]) {
                polymorph_core.items[i].itemcluster.viewData[id] = polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName];
            }
        }
        this.switchView(id);
    };
    this.destroyView = (viewName, auto) => {
        // Destroy the itemcluster property of the item but otherwise leave it alone
        if (this.settings.filter) {
            delete polymorph_core.items[viewName][this.settings.filter];
        } else {
            delete polymorph_core.items[viewName].itemcluster.viewName;
        }
        this.switchView();
    };

    container.on("focus", (e) => {
        if (e.sender == this) return;
        if (this.settings.operationMode == "focus") {
            if (e.sender.container.uuid == this.settings.focusOperatorID) {
                this.switchView(e.id, true);
            }
        }
    })

    ///////////////////////////////////////////////////////////////////////////////////////
    //Items
    this.itemPointerCache = {};
    this.cachedStyle = {};
    scriptassert([
        ["svg", "3pt/svg.min.js"],
        ["foreignobject", "3pt/svg.foreignobject.js"]
    ], () => {
        scriptassert([["itemcluster_svg", "operators/itemcluster.svg.js"]], () => {
            _itemcluster_extend_svg(this);
        });
    });

    //More items shenanigans

    this.itemSpace.addEventListener("click", (e) => {
        //click: anchor and deanchor.
        if (this.preselected) {
            this.preselected.classList.remove("selected");
            this.preselected.classList.remove("anchored");
        }
        if (
            e.target.matches(".floatingItem") ||
            e.target.matches(".floatingItem *")
        ) {
            let it = e.target;
            while (!it.matches(".floatingItem")) it = it.parentElement;
            if (this.preselected == it) {
                //keep it anchored
                it.classList.add("anchored");
            } else {
                this.preselected = it;
                it.classList.add("selected");
            }
        } else {
            this.preselected = undefined;
        }
    });

    this.itemSpace.addEventListener("dblclick", (e) => {
        if (this.preselected) {
            this.preselected.classList.remove("selected");
            this.preselected.classList.remove("anchored");
        }
        if (
            e.target.matches(".floatingItem") ||
            e.target.matches(".floatingItem *")
        ) {
            let it = e.target;
            while (!it.matches(".floatingItem")) it = it.parentElement;

            this.preselected = it;
            it.classList.add("anchored");
        } else {
            this.preselected = undefined;
        }
    });

    this.dragging = false;
    this.movingDivs = [];
    this.alreadyMoving = -1;//for deselecting nodes
    this.clearOutMovingDivs = () => {
        this.movingDivs.forEach((v) => { v.el.node.children[0].style.border = "1px solid black" });
        this.movingDivs = [];//empty them
    }
    this.itemSpace.addEventListener("mousedown", (e) => {
        if (e.target.matches(".floatingItem") || e.target.matches(".floatingItem *")) {
            // If we are clicking on an item:
            if (e.which != 1) return;
            if (e.getModifierState("Shift")) {
                let it = e.target;
                while (!it.matches(".floatingItem")) it = it.parentElement;
                this.linkingDiv = it;
                this.linking = true;
            } else {
                //if not lineing
                //clear the movingDivs if they need to be cleared
                this.shouldHighlightMovingDivs++;
                if (this.movingDivs.length && !e.getModifierState("Control")) {
                    //also reset the borders
                    this.clearOutMovingDivs();
                }
                let it = e.target;
                while (!it.matches(".floatingItem")) it = it.parentElement;
                if (it.classList.contains("anchored")) return;
                if (this.dragging) return;
                //check to see if we are already in movingDivs...
                this.alreadyMoving = -1;
                this.movingDivs.forEach((v, i) => {
                    if (v.el == this.itemPointerCache[it.dataset.id]) {
                        //remove the red border
                        v.el.node.children[0].style.border = "1px solid black"
                        this.alreadyMoving = i;
                    }
                })
                if (this.alreadyMoving == -1) {
                    this.movingDivs.push({
                        el: this.itemPointerCache[it.dataset.id]
                    });
                }
                this.lastMovingDiv = this.itemPointerCache[it.dataset.id];
                //style it so we can see it
                this.itemPointerCache[it.dataset.id].node.children[0].style.border = "1px solid red";
                //adjust x indexes
                this.itemPointerCache[it.dataset.id].front();
                container.fire("focus", {
                    id: it.dataset.id,
                    sender: this
                });
                //it.style.border = "3px solid #ffa2fc";
                this.dragging = true;
                //set relative drag coordinates
                let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
                for (let i = 0; i < this.movingDivs.length; i++) {
                    this.movingDivs[i].dx = coords.x - this.movingDivs[i].el.x();
                    this.movingDivs[i].dy = coords.y - this.movingDivs[i].el.y();
                }
                //Enforce its lines in blue.
                if (this.prevFocusID) this.redrawLines(this.prevFocusID);
                this.redrawLines(it.dataset.id, "red");
                this.prevFocusID = it.dataset.id;
                //return false;
            }
        } else if (e.target.matches(".tray textarea") && e.buttons % 2) {
            this.fromTray = e.target.parentElement.dataset.id;
        } else if (e.getModifierState("Control")) {
            //start a rectangleDrag!
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            this.rectangleDragging = {
                rect: this.svg.rect(0, 0).stroke({ width: 1, color: "red" }).fill({ opacity: 0 }),
                sx: coords.x,
                sy: coords.y
            }
        } else {
            //deselect
            if (this.movingDivs.length && !e.getModifierState("Control")) {
                //also reset the borders
                this.clearOutMovingDivs();
            }
            //Pan
            //if (e.getModifierState("Shift") || e.which == 2) {
            this.globalDrag = true;
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            this.originalViewBox = this.svg.viewbox();
            this.dragDX = coords.x;
            this.dragDY = coords.y;
            this.ocx = polymorph_core.items[this.settings.currentViewName].itemcluster.cx || 0;
            this.ocy = polymorph_core.items[this.settings.currentViewName].itemcluster.cy || 0;
            //}
        }
    });

    this.itemSpace.addEventListener("mousemove", (e) => {
        //stop from creating an item if we are resizing another item
        if (Math.abs(e.offsetX - this.mouseStoredX) > 5 || Math.abs(e.offsetY - this.mouseStoredY) > 5) {
            this.possibleResize = true;
        }
        if (this.fromTray) {
            let cid = this.fromTray;
            //make us drag the item
            this.removeFromTray(cid);
            if (!polymorph_core.items[cid].itemcluster) polymorph_core.items[cid].itemcluster = {};
            if (!polymorph_core.items[cid].itemcluster.viewData) polymorph_core.items[cid].itemcluster.viewData = {};
            polymorph_core.items[cid].itemcluster.viewData[this.settings.currentViewName] = { x: 0, y: 0 };
            this.arrangeItem(cid);
            //this is probably broken now
            let divrep = {
                el: this.itemPointerCache[cid],
                dx: 30,
                dy: 30
            };
            this.clearOutMovingDivs();
            this.movingDivs = [divrep];//overwrite the thing in the array
            this.lastMovingDiv = this.itemPointerCache[cid];
            // force a mousemove
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            this.lastMovingDiv.x(coords.x - divrep.dx);
            this.lastMovingDiv.y(coords.y - divrep.dy);

            this.updatePosition(cid);
            this.dragging = true;
            //set a flag so we dont instantly return it to the tray
            this.stillInTray = true;
            this.fromTray = false;
        }
        if (this.rectangleDragging) {
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            let dx = coords.x - this.rectangleDragging.sx;
            if (dx > 0) {
                this.rectangleDragging.rect.x(this.rectangleDragging.sx).width(dx);
            } else {
                this.rectangleDragging.rect.x(coords.x).width(-dx);
            }
            let dy = coords.y - this.rectangleDragging.sy;
            if (dy > 0) {
                this.rectangleDragging.rect.y(this.rectangleDragging.sy).height(dy);
            } else {
                this.rectangleDragging.rect.y(coords.y).height(-dy);
            }
            this.clearOutMovingDivs();
            for (let i in this.itemPointerCache) {
                if (((this.itemPointerCache[i].cx() > coords.x && this.itemPointerCache[i].cx() < this.rectangleDragging.sx) ||
                    (this.itemPointerCache[i].cx() < coords.x && this.itemPointerCache[i].cx() > this.rectangleDragging.sx)) &&
                    ((this.itemPointerCache[i].cy() > coords.y && this.itemPointerCache[i].cy() < this.rectangleDragging.sy) ||
                        (this.itemPointerCache[i].cy() < coords.y && this.itemPointerCache[i].cy() > this.rectangleDragging.sy))) {
                    this.movingDivs.push({
                        el: this.itemPointerCache[i]
                    });
                    this.itemPointerCache[i].node.children[0].style.border = "1px solid red";
                    //add to movingdivs
                }
            }
        }
        if (this.dragging) {
            this.dragged = true;
            //dragging an item
            //translate position of mouse to position of rectangle
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            for (let i = 0; i < this.movingDivs.length; i++) {
                this.movingDivs[i].el.x(coords.x - this.movingDivs[i].dx);
                this.movingDivs[i].el.y(coords.y - this.movingDivs[i].dy);
            }
            let elements = this.rootdiv.getRootNode().elementsFromPoint(e.clientX, e.clientY);
            //borders for the drag item in item
            if (this.hoverOver) {
                this.hoverOver.style.border = "";
            }
            let stillInTray = false;

            //if we send the items to tray
            for (let i = 0; i < elements.length; i++) {
                if (elements[i].matches(".tray")) {
                    if (this.stillInTray) {
                        stillInTray = true;
                        break;
                    }
                    //send to tray, and end interaction
                    // delete the item from this view
                    this.movingDivs.forEach((v) => {
                        let cid = v.el.attr("data-id");
                        delete polymorph_core.items[cid].itemcluster.viewData[this.settings.currentViewName];
                        delete polymorph_core.items[cid][`__itemcluster_${this.settings.currentViewName}`];
                        this.arrangeItem(cid);
                        this.addToTray(cid);
                        container.fire("updateItem", { sender: this, id: cid });
                    });
                    this.clearOutMovingDivs();
                    this.dragging = false;
                }
                if (elements[i].matches(".floatingItem") && elements[i].dataset.id != this.lastMovingDiv.attr("data-id")) {
                    this.hoverOver = elements[i];
                    elements[i].style.border = "3px dotted red";
                    break;
                }
            }
            if (!stillInTray) this.stillInTray = false;
            //if we are moving something ensure it wont be twice-click selected.
            this.preselected = undefined;
            //redraw all ITS lines
            for (let i = 0; i < this.movingDivs.length; i++) {
                this.redrawLines(this.movingDivs[i].el.node.dataset.id, "red");
            }
        } else if (this.linking) {
            // draw a line from the object to the mouse cursor
            let rect = this.itemPointerCache[this.linkingDiv.dataset.id];
            let p = this.mapPageToSvgCoords(e.pageX, e.pageY)
            this.linkingLine.plot(
                rect.x() + rect.width() / 2,
                rect.y() + rect.height() / 2,
                p.x,
                p.y
            ).stroke({
                width: 3
            }).marker('end', 9, 6, (add) => {
                add.path("M0,0 L0,6 L9,3 z").fill("#000");
            });
        } else if (this.globalDrag) {
            this.actualMotion = true;
            // shift the view by delta
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY, this.originalViewBox);

            polymorph_core.items[this.settings.currentViewName].itemcluster.cx =
                this.ocx - (coords.x - this.dragDX);
            polymorph_core.items[this.settings.currentViewName].itemcluster.cy =
                this.ocy - (coords.y - this.dragDY);
            //arrange all items
            this.viewAdjust();
        }
    });

    this.viewAdjust = () => {
        let ic = polymorph_core.items[this.settings.currentViewName].itemcluster;
        let ww = this.itemSpace.clientWidth * (ic.scale || 1);
        let hh = this.itemSpace.clientHeight * (ic.scale || 1);
        if (this.svg) {
            this.svg.viewbox((ic.cx || 0) - ww / 2, (ic.cy || 0) - hh / 2, ww, hh);
            this.viewGrid();
        } else {
            setTimeout(this.viewAdjust, 200);
        }
    }



    this.itemSpace.addEventListener("wheel", (e) => {
        if (e.target.matches(".floatingItem") ||
            e.target.matches(".floatingItem *") || this.tray.contains(e.target)) {
            return;
        }
        if (this.gridScroll) {
            this.handleGridScroll(e);
        } else {
            //calculate old width constant
            let ic = polymorph_core.items[this.settings.currentViewName].itemcluster;
            let br = this.itemSpace.getBoundingClientRect();
            ic.scale = ic.scale || 1;
            let vw = this.itemSpace.clientWidth * ic.scale;
            let vh = this.itemSpace.clientHeight * ic.scale;
            let wc = ic.cx - vw / 2 + (e.clientX - br.x) / br.width * vw;
            let hc = ic.cy - vh / 2 + (e.clientY - br.y) / br.height * vh;
            if (e.deltaY > 0) {
                ic.scale *= 1.1;
            } else {
                ic.scale *= 0.9;
            }
            //correct the new view centre
            vw = this.itemSpace.clientWidth * ic.scale;
            vh = this.itemSpace.clientHeight * ic.scale;
            ic.cx = wc - (e.clientX - br.x) / br.width * vw + vw / 2;
            ic.cy = hc - (e.clientY - br.y) / br.height * vh + vh / 2;
            this.viewAdjust();
            this.viewGrid();
        }
    })

    this.itemSpace.addEventListener("mouseup", e => {
        this.handleMoveEnd(e);
    });
    this.itemSpace.addEventListener("mouseleave", e => {
        this.handleMoveEnd(e);
    });

    this.handleMoveEnd = (e, touch) => {
        this.fromTray = false;
        if (this.globalDrag) {
            //setTimeout(this.viewAdjust, 500);
            this.globalDrag = false;
            if (this.viewGrid && this.actualMotion) this.viewGrid();
            this.actualMotion = false;
        }
        if (this.rectangleDragging) {
            this.rectangleDragging.rect.remove();
            this.rectangleDragging = undefined;
        }
        if (this.dragging) {
            //disengage drag
            this.dragging = false;
            if (!this.dragged) {
                if (this.alreadyMoving != -1) {
                    this.movingDivs[this.alreadyMoving].el.node.children[0].style.border = "1px solid black";
                    this.movingDivs.splice(this.alreadyMoving, 1);
                }
            }
            this.dragged = false;
            //this.movingDiv.classList.remove("moving");
            if (this.hoverOver) this.hoverOver.style.border = "";

            //define some stuff
            let cid = this.lastMovingDiv.attr("data-id");

            let elements = this.rootdiv
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
                    elements[i].dataset.id != cid && e.ctrlKey
                ) {
                    polymorph_core.items[elements[i].dataset.id].itemcluster.viewName = polymorph_core.items[elements[i].dataset.id].itemcluster.viewName || polymorph_core.items[elements[i].dataset.id].title || elements[i].dataset.id; //yay implicit ors
                    polymorph_core.items[cid].itemcluster.viewData[elements[i].dataset.id] = {
                        x: 0,
                        y: 0
                    };
                    if (!e.altKey) {//push drag in.
                        delete polymorph_core.items[cid].itemcluster.viewData[this.settings.currentViewName];
                        this.arrangeItem(cid);
                        this.movingDivs = [];//clear movingdivs so it doesnt come back
                    }
                    this.arrangeItem(elements[i].dataset.id);
                    //this.switchView(elements[i].dataset.id, true, true);
                    break;
                }
            }
            this.movingDivs.forEach((v) => {
                this.updatePosition(v.el.node.dataset.id);
            })
            container.fire("updateItem", {
                sender: this,
                id: cid
            });
        } else if (this.linking) {
            //reset linking line
            this.linkingLine.plot(0, 0, 0, 0).stroke({ width: 0 });
            this.linking = false;
            //change the data
            let linkedTo;
            let elements = container.div.elementsFromPoint(e.clientX, e.clientY);
            for (let i = 0; i < elements.length; i++) {
                if (
                    elements[i].matches("textarea") &&
                    elements[i].parentElement.parentElement.dataset.id != this.linkingDiv.dataset.id
                ) {
                    linkedTo = elements[i].parentElement.parentElement;
                    break;
                }
            }
            if (linkedTo) {
                //add a new line connecting the items
                this.toggleLine(this.linkingDiv.dataset.id, linkedTo.dataset.id);
                //push the change
                container.fire("updateItem", {
                    sender: this,
                    id: this.linkingDiv.dataset.id
                });
                container.fire("updateItem", {
                    sender: this,
                    id: linkedTo.dataset.id
                });
            }
        } else if (this.preselected) {
            if (!polymorph_core.items[this.preselected.dataset.id].boxsize) polymorph_core.items[this.preselected.dataset.id].boxsize = {};
            bs = polymorph_core.items[this.preselected.dataset.id].boxsize;
            bs.w = this.preselected.children[0].style.width;
            bs.h = this.preselected.children[0].style.height;
            this.arrangeItem(this.preselected.dataset.id); // handle resizes
        }
    };
    this.itemSpace.addEventListener("mousedown", (e) => {
        this.possibleResize = false;
        this.mouseStoredX = e.offsetX;
        this.mouseStoredY = e.offsetY;
    });

    this.itemSpace.addEventListener("dblclick", (e) => {
        if (e.target == this.itemSpace || e.target.tagName.toLowerCase() == "svg" || e.target == this.tempTR.node) {
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            this.createItem(
                coords.x,
                coords.y
            );
            // Make a new item
        }
    })

    //----------item functions----------//
    this.updatePosition = (id) => {
        let it = this.itemPointerCache[id];
        if (!polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName]) polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName] = {};
        //if there is a grid, then deal with it
        this.alignGrid(it);
        polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName].x = it.x();
        polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName].y = it.y();
        container.fire("updateItem", {
            id: id
        });
        this.arrangeItem(id);
    };

    this.createItem = (x, y) => {
        let itm = {};
        //register it with the polymorph_core
        let id = polymorph_core.insertItem(itm);
        itm.title = "";
        itm.itemcluster = {
            viewData: {},
            description: ""
        };
        itm.itemcluster.viewData[this.settings.currentViewName] = {
            x: x,
            y: y
        };
        if (this.settings.filter) {
            itm[this.settings.filter] = true;
        }
        //register a change
        container.fire("updateItem", {
            sender: this,
            id: id
        });
        this.arrangeItem(id);
    };

    this.removeItem = (id) => {
        delete polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName];
        //hide all the lines
        for (let i in this.activeLines) {
            for (let j in this.activeLines[i]) {
                if (i == id || j == id) {// this could STILL be done better
                    this.toggleLine(i, j);
                }
            }
        }
        this.arrangeItem(id);
        container.fire("deleteItem", {
            id: id
        });
    };

    this.rootdiv.addEventListener("focus", (e) => {
        if (e.target.parentElement.parentElement.matches("[data-id]")) {
            let id = e.target.parentElement.parentElement.dataset.id;
            container.fire("focus", {
                id: id,
                sender: this
            });
            if (this.prevFocusID) this.redrawLines(this.prevFocusID);
            this.redrawLines(id, "red");
            this.prevFocusID = id;
        }
    })

    this.rootdiv.addEventListener("input", (e) => {
        if (e.target.parentElement.parentElement.matches("[data-id]")) {
            let id = e.target.parentElement.parentElement.dataset.id;
            polymorph_core.items[id].title = e.target.value;
            container.fire("updateItem", {
                id: id,
                sender: this
            });
        }
    })

    ////////////////////////////////////////////////////////////
    //The tray
    this.addToTray = (id) => {
        let cti = this.tray.querySelector(`div[data-id='${id}']`);
        if (!cti) {
            cti = htmlwrap(`
                <div data-id=${id}>
                <textarea></textarea>
                </div>
            `);
            this.tray.appendChild(cti);
        }
        cti.querySelector("textarea").value = polymorph_core.items[id].title;
    }

    this.removeFromTray = (id) => {
        let cti = this.tray.querySelector(`div[data-id='${id}']`);
        if (cti) cti.remove();
    }
    this.emptyTray = () => {
        while (this.tray.children.length) {
            this.tray.children[0].remove();
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //polymorph_core interactions

    this.updateSettings = () => {
        if (this.settings.tray) {
            //show the tray
            this.emptyTray();
            this.tray.style.display = "flex";
            if (this.settings.filter && polymorph_core.items[this.settings.currentViewName] && !polymorph_core.items[this.settings.currentViewName][this.settings.filter]) {
                polymorph_core.items[this.settings.currentViewName][this.settings.filter] = true; // quick upgrade - to remove in future once things have settled
            }
            //also populate the tray
            for (let i in polymorph_core.items) {
                if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData) {
                    if (!polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName]) {//not in this view
                        if (!(this.settings.filter) || polymorph_core.items[i][this.settings.filter]) {
                            this.addToTray(i);
                        }
                    }
                }
            }
        } else {
            this.emptyTray();
            this.tray.style.display = "none";
        }
        if (this.svg && this.viewGrid) {
            this.viewGrid();
        }
    }
    this.refresh = () => {
        if (this.svg) this.svg.size(this.rootdiv.clientWidth, this.rootdiv.clientHeight);
        this.switchView(this.settings.currentViewName, true);
    };
    //Saving and loading
    this.toSaveData = () => {
        //compile the current view path
        this.settings.viewpath = [];
        let bs = this.viewName.parentElement.querySelectorAll("button");
        for (let i = 0; i < bs.length; i++) {
            this.settings.viewpath.push(bs[i].dataset.ref);
        }
        this.settings.viewpath.push(this.settings.currentViewName);
        return this.settings;
    }

    if (this.settings.viewpath) {
        this.settings.currentViewName = undefined;//clear preview buffer to prevent a>b>a
        for (let i = 0; i < this.settings.viewpath.length; i++) {
            this.switchView(this.settings.viewpath[i], true, true);
        }
    } else {//for older versions
        this.switchView(this.settings.currentViewName, true, true);
    }
    this.updateSettings();


    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `<h1>Mode</h1>
      <select data-role="operationMode">
      <option value="standalone">Standalone</option>
      <option value="focus">Display view from focused item</option>
      </select>
      <h2>container to link focus to:<h2>
      <input data-role="focusOperatorID" placeholder="container UID (use the button)">
      <button class="targeter">Select container</button>
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
    targeter.addEventListener("click", () => {
        polymorph_core.target().then((id) => {
            this.dialogDiv.querySelector("[data-role='focusOperatorID']").value = id;
            this.settings['focusOperatorID'] = id
            this.focusOperatorID = this.settings['focusOperatorID'];
        })
    });
    this.showDialog = () => {
        for (i in this.settings) {
            let it = this.dialogDiv.querySelector("[data-role='" + i + "']");
            if (it) it.value = this.settings[i];
        }
        for (i in options) {
            options[i].load();
        }
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = () => {
        let its = this.dialogDiv.querySelectorAll("[data-role]");
        for (let i = 0; i < its.length; i++) {
            this.settings[its[i].dataset.role] = its[i].value;
        }
        this.updateSettings();
        container.fire("updateItem", { id: this.container.id });
        // pull settings and update when your dialog is closed.
    }
    //extension API
    this.callables = {
        placeItem: (data) => {
            let item = data.item;
            let x = data.x;
            let y = data.y;
            if (x == undefined) {
                //they want us to decide where to place the item
                x = Math.random() * 1000;
                y = Math.random() * 1000;
            }
            let id = polymorph_core.insertItem(item);
            polymorph_core.items[id].itemcluster = { viewData: {} };
            polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName] = {};
            polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName].x = x;
            polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName].y = y;
            this.arrangeItem(id);
            container.fire("updateItem", { id: id, sender: this });
            return id;
        }
    }
    scriptassert([["itemcluster_contextmenu", "operators/itemcluster.contextmenu.js"]], () => {
        _itemcluster_extend_contextmenu(this);
    })
    scriptassert([["itemcluster_scalegrid", "operators/itemcluster.scalegrid.js"]], () => {
        _itemcluster_extend_scalegrid(this);
    })
});