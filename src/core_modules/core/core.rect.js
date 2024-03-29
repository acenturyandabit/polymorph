// the UI is composed of RECTS. 
// a RECT can have another RECT or an OPERATOR in it.
const RECT_ORIENTATION_X = 0;
const RECT_ORIENTATION_Y = 1;
const RECT_FIRST_SIBLING = 0;
const RECT_SECOND_SIBLING = 1;
const RECT_BORDER_WIDTH = 5;
const RECT_BORDER_COLOR = "rgba(230, 204, 255,0.1)"; //"transparent";
if (!isPhone()) {

    /// PASS OPERATORS INSTEAD OF CONTENT DIVS


    //parent is either undefined or another rect-like object
    //pseudo parents should implement following methods:
    //.polymorph_core property
    //
    polymorph_core.newRect = function (parent, ID) {
        if (!ID) ID = polymorph_core.insertItem({
            _rd: {
                p: parent,
                f: RECT_FIRST_SIBLING,
                x: RECT_ORIENTATION_X,
                ps: 1
            }
        })
        else {
            polymorph_core.items[ID]._rd = {
                p: parent,
                f: RECT_FIRST_SIBLING,
                x: RECT_ORIENTATION_X,
                ps: 1
            }
        }
        polymorph_core.rects[ID] = new polymorph_core.rect(ID);
        return ID;
    }

    let globalKeyDownRectBarCalls = {
        shiftx: [],
        borderRedraw: []
    };

    document.addEventListener("keydown", (e) => {
        if (e.getModifierState("Shift")) {
            globalKeyDownRectBarCalls.shiftx.forEach(i => i());
        }
        if ((e.key == "Shift" || e.key == "Control" || e.key == "Meta")) {
            let shiftPressed = e.shiftKey && (e.ctrlKey || e.metaKey)
            globalKeyDownRectBarCalls.borderRedraw.forEach(i => i(shiftPressed));
        }
    })

    polymorph_core.rect = function (rectID) {
        this.id = rectID; //might be helpful
        polymorph_core.rects[rectID] = this;
        Object.defineProperty(this, "settings", {
            get: () => {
                return polymorph_core.items[rectID]._rd;
            }
        })


        Object.defineProperty(this, "childrenIDs", {
            get: () => {
                if (!this._childrenIDs) {
                    this._childrenIDs = [];
                }
                //if i dont have two good children, return none
                if (this._childrenIDs.length == 2 &&
                    polymorph_core.items[this._childrenIDs[0]] && polymorph_core.items[this._childrenIDs[0]]._rd &&
                    polymorph_core.items[this._childrenIDs[1]] && polymorph_core.items[this._childrenIDs[1]]._rd) {
                    return this._childrenIDs;
                } else {
                    this._childrenIDs = [];
                    for (let i in polymorph_core.items) {
                        if (!polymorph_core.items[i]) continue; // an "" appeared as undefined and idek why but safety first!
                        if (polymorph_core.items[i]._rd && polymorph_core.items[i]._rd.p == rectID) {
                            this._childrenIDs.push(i);
                        }
                    }
                    if (this._childrenIDs.length == 2) return this._childrenIDs;
                }
                return undefined;
            }
        })

        Object.defineProperty(this, "children", {
            get: () => {
                if (this.childrenIDs) {
                    if (polymorph_core.rects[this.childrenIDs[0]] && polymorph_core.rects[this.childrenIDs[1]])
                        return [polymorph_core.rects[this.childrenIDs[0]], polymorph_core.rects[this.childrenIDs[1]]];
                }
                return undefined;
            }
        })

        Object.defineProperty(this, "containerids", {
            get: () => {
                this._containerids = [];
                for (let i in polymorph_core.items) {
                    if (polymorph_core.items[i]._od && polymorph_core.items[i]._od.p == rectID) {
                        this._containerids.push(i);
                    }
                }
                return this._containerids;
            }
        })

        Object.defineProperty(this, "containers", {
            get: () => {
                if (this.containerids) {
                    return this.containerids.map((v) => polymorph_core.containers[v]);
                }
                return undefined;
            }
        })

        Object.defineProperty(this, "parent", {
            get: () => {
                if (this.settings.p) {
                    if (polymorph_core.rects[this.settings.p]) return polymorph_core.rects[this.settings.p];
                    else if (polymorph_core.containers[this.settings.p]) return polymorph_core.containers[this.settings.p];
                } else return polymorph_core;
            }
        })

        Object.defineProperty(this, "otherSiblingID", {
            get: () => {
                if (this._otherSiblingID &&
                    polymorph_core.items[this._otherSiblingID]._rd &&
                    polymorph_core.items[this._otherSiblingID]._rd.p == this.settings.p &&
                    this._otherSiblingID != rectID
                ) return this._otherSiblingID;
                for (let i in polymorph_core.items) {
                    if (polymorph_core.items[i]._rd && polymorph_core.items[i]._rd.p == this.settings.p && i != rectID) {
                        this._otherSiblingID = i;
                        return this._otherSiblingID;
                    }
                }
                return undefined;
            }
        })

        Object.defineProperty(this, "otherSiblingSettings", {
            get: () => {
                return polymorph_core.items[this.otherSiblingID]._rd;
            }
        })

        Object.defineProperty(this, "otherSibling", {
            get: () => {
                return polymorph_core.rects[this.otherSiblingID];
            }
        })

        this.split = -1; // if this flag is >=0, on the next mousemove that reenters the box, the box will be split into 2 smaller boxes. 
        this.resizing = -1; // if this flag is >=0, on the next mousemove that reenters the box, the box will resize. 

        // Create the outerDiv: the one with the active borders.
        this.outerDiv = document.createElement("div");
        this.outerDiv.classList.add("rect_outer_div");
        this.outerDiv.style.cssText = `
        box-sizing: border-box;
        height: 100%; width:100%;
        overflow: hidden;
        display:flex;
        flex-direction:column;
        flex: 0 1 auto;
    `;

        this.createTabSpan = (containerid) => {
            let tabSpan = document.createElement("span");
            tabSpan.classList.add("tab");
            tabSpan.style.cssText = `
        border: 1px solid black;
        color: white;
        align-items: center;
        display: inline-flex;
        flex: 0 0 auto;
        margin-right: 0.1em;
        border-radius: 3px;
        `;

            let tabName = document.createElement("button");
            tabName.style.cssText = `
        background: unset;
        color:unset;
        border:unset;
        cursor:pointer;
        padding: 5px;
        `;
            tabSpan.appendChild(tabName);

            if (!polymorph_core.isStaticMode()) {
                let tabDelete = document.createElement("button");
                tabDelete.style.cssText = tabName.style.cssText;
                tabDelete.style.cssText += `color:red;font-weight:bold; font-style:normal`;
                tabDelete.innerText = 'x';
                tabDelete.style.display = "none";
                let tabGear = document.createElement("img");
                tabGear.src = "assets/gear.png";
                tabGear.style.cssText = "width: 1em; height:1em;"
                tabGear.style.display = "none";
                tabSpan.appendChild(tabDelete);
                tabSpan.appendChild(tabGear);
            }

            tabSpan.dataset.containerid = containerid;
            return tabSpan;
        }

        // The actual tabbar.
        this.tabbar = document.createElement("p");
        this.tabbar.style.cssText = `display:flex;margin:0; width:100%; overflow-x: auto`
        this.plus = document.createElement("button");
        this.plus.style.cssText = `color:blue;font-weight:bold; font-style:normal`;
        this.plus.innerHTML = "+";
        this.addPlusIfNeeded = () => {
            if (!polymorph_core.isStaticMode()) {
                this.tabbar.appendChild(this.plus);
            }
        };
        this.addPlusIfNeeded();
        this.outerDiv.appendChild(this.tabbar);

        // For handling operators. Each operator has its own innerDiv, and a tabSpan (with the name, and a cross) in the tabspan bar.
        // Create the innerDivs and generator for innerDivs..
        this.createInnerDiv = (containerid) => {
            let indiv = document.createElement("div");
            indiv.style.cursor = "default";
            indiv.style.height = "100%";
            indiv.style.width = "100%";
            indiv.style.overflow = "hidden";
            indiv.style.display = "none";
            indiv.dataset.containerid = containerid;
            return indiv;
        }


        this.innerDivContainer = htmlwrap(`<div style="flex:1 1 auto; overflow-y:auto; width:100%; height: 100%; "></div>`);
        this.outerDiv.appendChild(this.innerDivContainer);



        //Function for adding an operator to this rect. Operator must already exist.
        //This function is called: on operator create by operator; OR inernally by rearranging tabspans (later).
        this.tieContainer = (containerid, index) => {
            let container = polymorph_core.containers[containerid];
            if (!container) {
                console.log("Ack!");
                return;
            }

            if (index == undefined) {
                index = this.tabbar.children.length - 1;
            }

            // Just move the tabbar around, and attach some information to the tabbar so 
            // we know what to do when a button is clicked.
            let currentTabSpan = this.tabbar.querySelector(`span[data-containerid="${containerid}"]`);
            if (currentTabSpan) {
                currentTabSpan.remove(); // clear and reapply since tiecontainer should be overwrite
                index--;
            }
            currentTabSpan = this.createTabSpan(containerid);

            currentTabSpan.children[0].innerText = container.settings.tabbarName;
            this.tabbar.insertBefore(currentTabSpan, this.tabbar.children[index]);

            let currentInnerDiv = this.innerDivContainer.querySelector(`div[data-containerid="${containerid}"]`);
            if (currentInnerDiv) currentInnerDiv.remove();
            currentInnerDiv = this.createInnerDiv(containerid);
            currentInnerDiv.appendChild(container.outerDiv);
            this.innerDivContainer.insertBefore(currentInnerDiv, this.innerDivContainer.children[index]);

            //dont refresh on start unless im the root rect, then let it propagate
            //if (container.operator && container.operator.refresh) container.operator.refresh();


            // because during initial load, this needs to be called to actually show anything.
            // refresh does this on initial load, if we do it here then container wont be connected to dom on load causing issues
            //if (containerid == this.settings.s) this.switchOperator(this.settings.s);
        }

        //Callback for tab clicks to switch between operators.
        this.switchOperator = (containerid) => {
            if (!this.innerDivContainer.querySelector(`div[data-containerid="${containerid}"]`)) return false; //we cant do that
            this.settings.s = containerid;
            for (let i = 0; i < this.innerDivContainer.children.length; i++) {
                this.innerDivContainer.children[i].style.display = "none";
            }
            this.innerDivContainer.querySelector(`div[data-containerid="${containerid}"]`).style.display = "block";
            // hide buttons on previous operator
            for (let i = 0; i < this.tabbar.children.length - 1; i++) {
                if (!polymorph_core.isStaticMode()) {
                    this.tabbar.children[i].children[1].style.display = "none";
                    this.tabbar.children[i].children[2].style.display = "none";
                }
                this.tabbar.children[i].classList.remove("active");
            }
            //show buttons on this operator
            let currentTab = this.tabbar.querySelector(`span[data-containerid="${containerid}"]`);
            if (!polymorph_core.isStaticMode()) {
                currentTab.children[1].style.display = "inline";
                currentTab.children[2].style.display = "inline";
            }
            currentTab.classList.add("active");
            polymorph_core.containers[containerid].refresh();
            //Overall refresh because borders are dodgy
            polymorph_core.containers[this.settings.s].refresh();
            polymorph_core.fire("updateItem", { id: this.id });
            return true;
        }

        //operator creation / rect deletion
        this.plus.addEventListener("click", (e) => {
            // When shift is held, plus turns into a cross
            if (e.getModifierState("Shift") && this.parent instanceof polymorph_core.rect) {
                if (confirm("WARNING: You are about to delete this rect and all its containers. THIS CAN HAVE SERIOUS CONSEQUENCES. Are you sure you want to do this?")) {
                    let myIndex = this.parent.children.indexOf(this);
                    let mySibling = this.parent.children[!myIndex + 0];
                    this.parent.outerDiv.parentElement.insertBefore(mySibling.outerDiv, this.parent.outerDiv);
                    Object.assign(mySibling.settings, this.parent.settings);
                    mySibling.settings.p = this.parent.settings.p; //If parent is undefined.
                    if (polymorph_core.items._meta.currentView == this.parent.id) {
                        // fix root level rect deletion
                        polymorph_core.items._meta.currentView = mySibling.id;
                    }
                    this.parent.outerDiv.remove();
                    mySibling.refresh();
                    let pid = this.parent.id; //deleting things messes with the parent getter
                    //delete parent rect
                    delete polymorph_core.rects[pid];
                    delete polymorph_core.items[pid]._rd;
                    //delete this rect
                    delete polymorph_core.rects[rectID];
                    delete polymorph_core.items[rectID]._rd;
                }
            } else {
                // Operator creation
                let newContainer = { _od: { t: "opSelect", p: rectID } };
                let newContainerID = polymorph_core.insertItem(newContainer);
                polymorph_core.fire("updateItem", { id: newContainerID });
                polymorph_core.containers[newContainerID] = new polymorph_core.container(newContainerID);
                this.switchOperator(newContainerID);
            }

        })

        //Delegated operator switching
        this.tabbar.addEventListener("click", (e) => {
            //pass direct clicks so we don't switch to blank operators
            let el = e.target;
            while (el != this.tabbar) {
                if (el.dataset.containerid) {
                    this.switchOperator(el.dataset.containerid);
                    return;
                }
                el = el.parentElement;
            }
        })

        //Delegated cross button handler
        this.tabbar.addEventListener("click", (e) => {
            if (e.target.tagName.toLowerCase() == 'button' && e.target.innerText == "x" && e.target.parentElement.tagName == "SPAN" && confirm("Warning: closing operators is irreversible and may lead to data loss. Continue?")) {
                let containerid = e.target.parentElement.dataset.containerid;
                e.target.parentElement.remove();
                let currentInnerDiv = this.innerDivContainer.querySelector(`[data-containerid="${containerid}"]`);
                let switchToID;
                if (currentInnerDiv.previousElementSibling) switchToID = currentInnerDiv.previousElementSibling.dataset.containerid;
                else if (currentInnerDiv.nextElementSibling) switchToID = currentInnerDiv.nextElementSibling.dataset.containerid;
                currentInnerDiv.remove();
                this.switchOperator(switchToID);
                //nerf the item
                polymorph_core.containers[containerid].remove();
                delete polymorph_core.containers[containerid];
                delete polymorph_core.items[containerid]._od;
                polymorph_core.fire("updateItem", { id: containerid });
            }
        })

        // Click and drag tabs to rearrange
        this.tabbar.addEventListener("mousedown", (e) => {
            //pass direct clicks so we don't switch to blank operators
            let el = e.target;
            while (el != this.tabbar) {
                if (el.dataset.containerid) {
                    this.pulledDiv = el;
                    this.pullingCommitted = false;
                }
                el = el.parentElement;
            }
        })

        document.addEventListener("mousemove", (e) => {
            if (this.pulledDiv) {
                if (this.pullingCommitted) {
                    //lift the item, by setting its display to position absolute
                    this.pulledDiv.style.position = "absolute";
                    this.pulledDiv.style.display = "flex"; //instead of inline flex
                    let rect = this.tabbar.getBoundingClientRect();
                    this.pulledDiv.style.left = (e.clientX - rect.left) + "px"; //x position within the element.
                    this.pulledDiv.style.top = 0;
                } else {
                    let eventComposedPath = e.composedPath();
                    for (let i = 0; i < eventComposedPath.length; i++) {
                        if (eventComposedPath[i] == this.pulledDiv) {
                            break;
                        } else if (eventComposedPath[i] == this.pulledDiv.parentElement) {
                            this.pullingCommitted = true;
                        }
                    }
                }
            }
        })
        document.addEventListener("mouseup", (e) => {
            if (this.pulledDiv) {
                if (this.pullingCommitted) {
                    let rect = this.tabbar.getBoundingClientRect();
                    let elementsAtPoint = this.tabbar.getRootNode().elementsFromPoint(e.clientX, rect.top);
                    this.pulledDiv.style.display = "inline-flex";
                    this.pulledDiv.style.position = "static";
                    let droppedOnSpanIdx = 0;
                    while (droppedOnSpanIdx < elementsAtPoint.length && !(!elementsAtPoint[droppedOnSpanIdx].classList.contains("active") && elementsAtPoint[droppedOnSpanIdx].tagName == "SPAN")) {
                        droppedOnSpanIdx++;
                    }
                    if (elementsAtPoint[droppedOnSpanIdx] && elementsAtPoint[droppedOnSpanIdx].tagName == "SPAN") {
                        let childs = Array.from(this.tabbar.children)
                        let pulledIndex = childs.indexOf(this.pulledDiv);
                        let otherIndex = childs.indexOf(elementsAtPoint[droppedOnSpanIdx])
                        if (otherIndex < pulledIndex) {
                            this.tabbar.insertBefore(this.pulledDiv, elementsAtPoint[droppedOnSpanIdx]);
                        } else {
                            this.tabbar.insertBefore(this.pulledDiv, elementsAtPoint[droppedOnSpanIdx].nextElementSibling);
                        }
                    }
                    //save the order of my containers in settings
                    this.settings.containerOrder = Array.from(this.tabbar.children).map(i => i.dataset.containerid);
                    this.settings.containerOrder.pop(); //remove button with undefined id
                }
                this.pulledDiv = undefined;
            }
        })

        globalKeyDownRectBarCalls.shiftx.push(() => {
            this.plus.innerHTML = "x";
            this.plus.style.color = "red";
        });
        document.addEventListener("keyup", (e) => {
            if (e.getModifierState && !e.getModifierState("Shift")) { // odd error when dropdowns are fired this throws, so check e.getModifierState even exists first.
                if (this.plus.innerHTML != "+")
                    this.plus.innerHTML = "+";
                this.plus.style.color = "blue";
            }
        })

        let tabmenu;
        //Delegated context menu click on tabs
        let c = new _contextMenuManager(this.outerDiv);
        this.outerDiv.style.position = "relative"; // needs to be here for context menus to work
        let contextedOperatorIndex = undefined;
        let tabfilter = (e) => {
            let t = e.target;
            while (t != this.tabbar) {
                if (t.tagName == "SPAN") {
                    break;
                } else {
                    t = t.parentElement;
                }
            }
            contextedOperatorIndex = t.dataset.containerid;
            let tp = t.parentElement;
            if (this.parent instanceof polymorph_core.rect) {
                //i have a prent, show subframe parent button
                tabmenu.querySelector(".subframePR").style.display = "block";
            } else {
                tabmenu.querySelector(".subframePR").style.display = "none";
            }
            return true;
        }
        tabmenu = c.registerContextMenu(`
    <li>Subframing
        <ul class="submenu">
            <li class="subframe">Subframe Contents</li>
            <li class="subframePR">Subframe Parent Rect</li>
        </ul>
    </li>
    <li>Export/Import
    <ul class="submenu">
        <li class="cpfr">Copy frame settings</li>
        <li class="psfr">Paste frame settings</li>
        <!--
        <li class="xpfr">Export frame to text...</li>
        <li class="mpfr">Import frame from text...</li>
        <li class="xdoc">Export frame as document...</li>
        -->
    </ul>
    </li>
    `, this.tabbar, undefined, tabfilter);
        tabmenu.querySelector(".subframePR").addEventListener("click", () => {
            // at the tab, create a new subframe operator
            let newContainerID = polymorph_core.insertItem({
                _od: {
                    t: "subframe",
                    p: rectID,
                    data: {},
                    outputRemaps: {},
                    inputRemaps: {},
                    tabbarName: polymorph_core.containers[contextedOperatorIndex].settings.tabbarName
                }
            });
            let sf = (new polymorph_core.container(newContainerID));
            let seenNewContainer = false;
            while (this.innerDivContainer.children.length > 1) {
                //the container ties itself, so we need to make sure it does not eat itself
                let containerid = this.innerDivContainer.children[0].dataset.containerid;
                if (containerid == newContainerID) {
                    seenNewContainer = true;
                }
                if (seenNewContainer) {
                    containerid = this.innerDivContainer.children[1].dataset.containerid;
                }
                this.tabbar.querySelector(`[data-containerid="${containerid}"]`).remove();
                this.innerDivContainer.querySelector(`[data-containerid="${containerid}"]`).remove();
                sf.operator.rect.tieContainer(containerid);
                polymorph_core.containers[containerid].settings.p = sf.operator.rect.id;
            }
            this.tieContainer(sf, contextedOperatorIndex);
            this.switchOperator(newContainerID);
            sf.operator.rect.switchOperator(contextedOperatorIndex);
            polymorph_core.fire("updateItem", { id: rectID, sender: this });
            tabmenu.style.display = "none";
        })
        tabmenu.querySelector(".subframe").addEventListener("click", () => {
            // at the tab, create a new subframe operator
            let newContainerID = polymorph_core.insertItem({
                _od: {
                    t: "subframe",
                    p: rectID,
                    data: {},
                    outputRemaps: {},
                    inputRemaps: {},
                    tabbarName: polymorph_core.containers[contextedOperatorIndex].settings.tabbarName
                }
            });
            let sf = (new polymorph_core.container(newContainerID));
            sf.loadOperator(); // dont lazy intitalise, we want it now
            sf.operator.createAndAssignNewRect();

            this.tabbar.querySelector(`[data-containerid="${contextedOperatorIndex}"]`).remove();
            this.innerDivContainer.querySelector(`[data-containerid="${contextedOperatorIndex}"]`).remove();
            this.tieContainer(sf, contextedOperatorIndex);
            let oop = polymorph_core.containers[contextedOperatorIndex];
            sf.operator.rect.tieContainer(contextedOperatorIndex, 0);
            oop.settings.p = sf.operator.rect.id;
            polymorph_core.fire("updateItem", { id: rectID, sender: this });
            this.switchOperator(newContainerID);
            sf.operator.rect.switchOperator(contextedOperatorIndex);
            tabmenu.style.display = "none";
            this.refresh();
        })

        tabmenu.querySelector(".cpfr").addEventListener("click", () => {
            // at the tab, create a new subframe operator
            polymorph_core.copiedFrameID = contextedOperatorIndex;
            tabmenu.style.display = "none";
        })
        /*tabmenu.querySelector(".xdoc").addEventListener("click", () => {
            //export as a whole doc! how generous
            let tta = htmlwrap("<h1>Operator export:</h1><br><textarea style='height:30vh'></textarea>");
            tabmenu.style.display = "none";
            polymorph_core.dialog.prompt(tta);
            //how about this - export all the items, then the importer can just run the garbage cleaner on it when it starts?
            //or even better for future security: create a separate polymorph_core instance, and get it to GC itself. TODO!
            let collatedItems = polymorph_core.items;
            tta.querySelector("textarea").value = `{"displayName":"export-${new Date().toDateString()}","currentView":"default","id":"${polymorph_core.guid(5)}","views":{"default":{
            "o":[${JSON.stringify(this.containers[contextedOperatorIndex].toSaveData())}],"s":0,"x":0,"f":1,"p":0}},"items":${JSON.stringify(collatedItems)}}`;
        })*/

        tabmenu.querySelector(".psfr").addEventListener("click", () => {
            // Ditch the old container
            let containerid = contextedOperatorIndex;
            this.tabbar.querySelector(`[data-containerid="${containerid}"]`).remove();
            this.innerDivContainer.querySelector(`[data-containerid="${containerid}"]`).remove();
            delete polymorph_core.containers[containerid];
            delete polymorph_core.items[containerid]._od;
            let newID = polymorph_core.insertItem(JSON.parse(JSON.stringify(polymorph_core.items[polymorph_core.copiedFrameID])));
            polymorph_core.items[newID]._od.p = this.id;
            polymorph_core.items[newID]._od.data.operatorClonedFrom = polymorph_core.copiedFrameID; //facilitate subframe deep copy
            polymorph_core.containers[contextedOperatorIndex] = new polymorph_core.container(newID);
            this.switchOperator(newID);
            tabmenu.style.display = "none";
            polymorph_core.fire("updateItem", { id: this.id, sender: this });
            polymorph_core.fire("updateItem", { id: newID, sender: this });
            polymorph_core.fire("updateItem", { id: containerid, sender: this });
        })
        /*
tabmenu.querySelector(".xpfr").addEventListener("click", () => {
let tta = htmlwrap("<h1>Operator export:</h1><br><textarea style='height:30vh'></textarea>");
tabmenu.style.display = "none";
polymorph_core.dialog.prompt(tta);
tta.querySelector("textarea").value = JSON.stringify(this.containers[contextedOperatorIndex].toSaveData());
})
 
tabmenu.querySelector(".mpfr").addEventListener("click", () => {
let tta = htmlwrap("<h1>Operator import:</h1><br><textarea style='height:30vh'></textarea><br><button>Import</button>");
polymorph_core.dialog.prompt(tta);
tta.querySelector("button").addEventListener("click", () => {
if (tta.querySelector("textarea").value) {
let importObject = JSON.parse(tta.querySelector("textarea").value);
this.containers[contextedOperatorIndex].fromSaveData(importObject);
this.tieContainer(this.containers[contextedOperatorIndex], contextedOperatorIndex);
polymorph_core.fire("updateItem", { id: rectID, sender: this });
//force update all items to reload the view
for (let i in polymorph_core.items) {
polymorph_core.fire('updateItem', { id: i });
}
}
})
tabmenu.style.display = "none";
})
*/
        //And a delegated settings button handler
        this.tabbar.addEventListener("click", (e) => {
            if (e.target.tagName.toLowerCase() == "img") {
                //dont show settings - instead, copy the settings div onto the polymorph_core settings div.
                if (polymorph_core.containers[this.settings.s].operator.dialogDiv) {
                    this.settingsOperator = polymorph_core.containers[this.settings.s].operator;
                    this.settingsOperator.showDialog();
                    this.settingsDiv = document.createElement("div");
                    this.settingsDiv.innerHTML = `<h1>Settings</h1>
                <h3> General settings </h3>
                <input class="tabDisplayName" placeholder="Tab display name:"/>
                <h3>Operator settings</h3>`;
                    this.settingsOperator.dialogDiv.style.maxWidth = "50vw";
                    this.settingsDiv.appendChild(this.settingsOperator.dialogDiv);
                    this.settingsDiv.querySelector(".tabDisplayName").value = this.tabbar.querySelector(`[data-containerid="${this.settings.s}"]`).children[0].innerText;
                    //add remapping by the operator
                    polymorph_core.containers[this.settings.s].readyRemappingDiv();
                    this.settingsDiv.appendChild(polymorph_core.containers[this.settings.s].remappingDiv);

                    polymorph_core.dialog.prompt(this.settingsDiv, (d) => {
                        polymorph_core.containers[this.settings.s].settings.tabbarName = d.querySelector("input.tabDisplayName").value;
                        this.tabbar.querySelector(`[data-containerid="${this.settings.s}"]`).children[0].innerText = polymorph_core.containers[this.settings.s].settings.tabbarName;
                        if (this.settingsOperator.dialogUpdateSettings) this.settingsOperator.dialogUpdateSettings();
                        polymorph_core.containers[this.settings.s].processRemappingDiv();
                        polymorph_core.fire("updateItem", { id: rectID });
                        polymorph_core.fire("updateItem", { id: this.settings.s });
                    })
                } else {
                    //old version
                    if (polymorph_core.containers[this.settings.s].operator.showSettings) {
                        polymorph_core.containers[this.settings.s].operator.showSettings();
                    }
                }
                //also render the datastreams if necessary.
                //this.renderDataStreams(this.containers[this.settings.s].operator);
            }
        })

        //handle a resize event.
        this.refresh = (scalingOnly) => {
            //perform some sanity checks; if these fail, do nothing (in worse case that we accidentally manually delete sth)
            if (this.settings.f != RECT_FIRST_SIBLING && !(this.otherSiblingID)) {
                console.log(`refresh assert failed for ${rectID}`);
                return;
            }
            if (this.settings.x == RECT_ORIENTATION_X) {
                this.outerDiv.parentElement.style.flexDirection = "row";
                this.outerDiv.style.order = this.settings.f;
                if (this.settings.f == RECT_FIRST_SIBLING) {
                    //this.outerDiv.style.left = 0;
                    this.outerDiv.style.flexBasis = this.outerDiv.parentElement.offsetWidth * this.settings.ps + "px";
                } else {
                    //dont use this.settings.ps, use my sibling's ps.
                    //this.outerDiv.style.left = this.outerDiv.parentElement.offsetWidth * this.otherSiblingSettings.ps;
                    this.outerDiv.style.flexBasis = this.outerDiv.parentElement.offsetWidth * (1 - this.otherSiblingSettings.ps) + "px";
                }
                this.outerDiv.style.height = "100%"; //this.outerDiv.parentElement.offsetHeight;
                this.outerDiv.style.top = 0;
            } else {
                this.outerDiv.parentElement.style.flexDirection = "column";
                this.outerDiv.style.order = this.settings.f;
                if (this.settings.f == RECT_FIRST_SIBLING) {
                    //this.outerDiv.style.top = 0;
                    this.outerDiv.style.flexBasis = this.outerDiv.parentElement.offsetHeight * this.settings.ps + "px";
                } else {
                    //this.outerDiv.style.top = this.outerDiv.parentElement.offsetHeight * this.otherSiblingSettings.ps;
                    this.outerDiv.style.flexBasis = this.outerDiv.parentElement.offsetHeight * (1 - this.otherSiblingSettings.ps) + "px";
                }
                this.outerDiv.style.width = "100%"; //this.outerDiv.parentElement.offsetWidth;
                //this.outerDiv.style.left = 0;
            }
            if (!scalingOnly) {
                //also refresh any of my children
                if (this.children) {
                    //when tieing doubly-nested rects, sometimes a refresh is called on a child before it is tied, resulting in parentElement error.
                    //so check parentElement before refreshing
                    this.children.forEach((c) => {
                        if (c.outerDiv.parentElement) c.refresh(true);
                    });
                    // refresh a second time because scaling adjustments take two to tango;
                    this.children.forEach((c) => {
                        if (c.outerDiv.parentElement) c.refresh();
                    });
                } else {
                    //show my container
                    this.switchOperator(this.settings.s);
                    //order the tabbars
                    if (this.settings.containerOrder) {
                        this.settings.containerOrder.forEach(i => {
                            let currentTab = this.tabbar.querySelector(`[data-containerid='${i}']`);
                            if (currentTab) this.tabbar.appendChild(currentTab);
                        })
                        this.addPlusIfNeeded();
                    }
                }
                if (this.containers) this.containers.forEach((c) => {
                    //containers may not exist on fromSaveData
                    if (c) c.refresh(true)
                });
            }
        }
        let rectChanged = false;

        this.rectsTied = [];
        this.tieRect = (rectID) => {
            if (this.rectsTied.indexOf(rectID) != -1) {
                // ignore - we already tied this rect
                // this occurs if there are multiple save sources and an existing rect tries to reattach to us.
                return;
            }
            this.innerDivContainer.remove();
            this.tabbar.remove();
            this.outerDiv.appendChild(polymorph_core.rects[rectID].outerDiv);
            this.rectsTied.push(rectID);
            if (this.rectsTied.length > 2) {
                console.log("multiple rect ties BAD; arbitration in progress");
                //likely due to some split going wrong
                //first group rects
                let contenders = {};
                let side1 = [];
                let side0 = [];
                for (let r of this.rectsTied) {
                    console.log(r);
                    console.log(polymorph_core.items[r]._rd);
                    contenders[r] = {
                        //id:r,
                        operatorCount: Object.values(polymorph_core.containers).filter(i => i.settings.p == r).length,
                        nonZeroPS: polymorph_core.items[r]._rd.ps != 0
                    };
                    //cluster 
                    if (polymorph_core.items[r]._rd.f) {
                        side1.push(r);
                    } else {
                        side0.push(r);
                    };
                    side0.sort((a, b) => {
                        if (contenders[b].operatorCount != contenders[a].operatorCount) {
                            return contenders[b].operatorCount - contenders[a].operatorCount;
                        } else return contenders[b].nonZeroPS - contenders[a].nonZeroPS;
                    })
                    side1.sort((a, b) => {
                        if (contenders[b].operatorCount != contenders[a].operatorCount) {
                            return contenders[b].operatorCount - contenders[a].operatorCount;
                        } else return contenders[b].nonZeroPS - contenders[a].nonZeroPS;
                    })
                    side0.slice(1).forEach(i => {
                        polymorph_core.rects[i].outerDiv.remove();
                        delete polymorph_core.items[i]._rd.p;
                        console.log("arbitration nerfed " + i);
                    });
                    side1.slice(1).forEach(i => {
                        polymorph_core.rects[i].outerDiv.remove();
                        delete polymorph_core.items[i]._rd.p;
                        console.log("arbitration nerfed " + i);
                    });
                }
                // case 1: two rects conflicting
                // case 2: one pair and one lone rect conflicting
                // case 3: two pairs of rects conflicting
            }
        }

        this.containerVisible = (id) => {
            if (this.parent) return this.settings.s == id && (this.parent == polymorph_core || this.parent.visible());
            else return false;
        }

        this.visible = () => {
            if (this.parent == polymorph_core) return true;
            else if (this.parent) return (this.parent.visible());
            else return false; // not attached yet
        }

        this.shiftPressed = false;
        let highlightDirn = -1;
        let borders = ['left', 'right', 'top', 'bottom'];

        this.redrawBorders = () => {
            if (!this.settings) return;
            if (this.shiftPressed) {
                if (!this.children) {
                    this.outerDiv.style.border = RECT_BORDER_WIDTH + `px ${RECT_BORDER_COLOR} solid`;
                    if (this.parent instanceof polymorph_core.rect) {
                        /*if (this.settings.x) {
                            this.outerDiv.style.width = this.outerDiv.parentElement.clientWidth - 2 * RECT_BORDER_WIDTH;
                        } else {
                            this.outerDiv.style.height = this.outerDiv.parentElement.clientHeight - 2 * RECT_BORDER_WIDTH;
                        }*/
                    }
                    if (highlightDirn != -1) {
                        this.outerDiv.style["border-" + borders[highlightDirn]] = RECT_BORDER_WIDTH + "px red solid";
                    }
                } else {
                    this.outerDiv.style.border = "";
                }
            } else if (this.parent instanceof polymorph_core.rect) {
                this.outerDiv.style.border = "";
                if (this.settings.f) {
                    this.outerDiv.style["border-" + (this.settings.x ? "top" : "left")] = RECT_BORDER_WIDTH + `px ${RECT_BORDER_COLOR} solid`;
                }
                if ((this.settings.f && ((highlightDirn == 2 && this.settings.x == 1) || (highlightDirn == 0 && this.settings.x == 0)))) {
                    this.outerDiv.style["border-" + borders[highlightDirn]] = RECT_BORDER_WIDTH + "px red solid";
                }
                if (this.outerDiv.parentElement) {
                    // on load parentElement doesnt exist
                    /*if (this.settings.x) {
                        this.outerDiv.style.width = this.outerDiv.parentElement.clientWidth;
                    } else {
                        this.outerDiv.style.height = this.outerDiv.parentElement.clientHeight;
                    }*/
                }
            } else {
                this.outerDiv.style.border = "";
            }

        }
        //Make draggable borders.
        this.redrawBorders();

        //Mouse move handler: Handles resizing and splitting rects.
        //this is called by both actual mouse moves and delegations, so don't put it directly as the handler.
        this.mouseMoveHandler = (e) => {
            if (this.children) {
                //forward events to children
                this.children[0].mouseMoveHandler(e);
                this.children[1].mouseMoveHandler(e);
            }
            if (this.parent instanceof polymorph_core.rect || (e.shiftKey && (e.ctrlKey || e.metaKey) && !this.children)) {
                highlightDirn = -1;
                let cr = this.outerDiv.getClientRects()[0];
                if (e.clientX - cr.left >= 0 && cr.left + cr.width - e.clientX >= 0 && e.clientY - cr.top >= 0 && cr.top + cr.height - e.clientY >= 0) {
                    if (e.clientX - cr.left <= RECT_BORDER_WIDTH && e.clientX - cr.left >= 0) {
                        highlightDirn = 0;
                    } else if (cr.left + cr.width - e.clientX <= RECT_BORDER_WIDTH && cr.left + cr.width - e.clientX >= 0) {
                        highlightDirn = 1;
                    } else if (e.clientY - cr.top <= RECT_BORDER_WIDTH && e.clientY - cr.top >= 0) {
                        highlightDirn = 2;
                    } else if (cr.top + cr.height - e.clientY <= RECT_BORDER_WIDTH && cr.top + cr.height - e.clientY >= 0) {
                        highlightDirn = 3;
                    }
                }

                if (this.split != -1 && this.split != highlightDirn && !this.children) {
                    if (!(e.buttons % 2)) {
                        this.split = -1;
                        e.preventDefault();
                        //reset and return
                        return;
                    }
                    e.preventDefault();


                    // a split has been called. Initialise the split!
                    let IDsToUpdate = [this.id];
                    this.outerDiv.style.border = "none";
                    //remove all my children
                    //except the tutorial div
                    let savedTutorialDiv;
                    if (this.outerDiv.querySelector(".tutorial")) savedTutorialDiv = this.outerDiv.querySelector(".tutorial");
                    while (this.outerDiv.children.length) this.outerDiv.children[0].remove();
                    if (savedTutorialDiv) this.outerDiv.appendChild(savedTutorialDiv);

                    //Create new rects
                    let _XorY = (this.split > 1) * 1;
                    let _firstOrSecond = this.split % 2;
                    let newRectIDs = [
                        polymorph_core.insertItem({ _rd: { p: rectID, x: _XorY, f: 0, ps: _firstOrSecond } }),
                        polymorph_core.insertItem({ _rd: { p: rectID, x: _XorY, f: 1, ps: _firstOrSecond } })
                    ];
                    IDsToUpdate = [...IDsToUpdate, ...newRectIDs];

                    //instantiate the rects
                    newRectIDs.forEach((v) => {
                        polymorph_core.rects[v] = new polymorph_core.rect(v);
                        polymorph_core.rects[v].attach();
                    });
                    //copy in operators
                    this.containers.forEach((v, i) => {
                        v.settings.p = newRectIDs[!_firstOrSecond * 1];
                        polymorph_core.rects[newRectIDs[!_firstOrSecond * 1]].tieContainer(v.id);
                        polymorph_core.rects[newRectIDs[!_firstOrSecond * 1]].settings.s = v.id;
                        IDsToUpdate.push(v.id);
                    });

                    //force a refresh
                    this.children.forEach((v) => {
                        v.refresh();
                        v.resizing = this.split ^ 1
                    });

                    //Fire updates to everything so it saves
                    IDsToUpdate.forEach(i => polymorph_core.fire("updateItem", { id: i }));
                }
                //for resizing
                if (this.resizing != -1) {
                    //cancel on mouseup
                    if (!(e.buttons % 2) || this.resizing != this.settings.x * 2 + !(this.settings.f)) {
                        this.resizing = -1;
                        e.preventDefault();
                        //reset and return
                        return;
                    }
                    //don't resize if not appropriate border


                    e.preventDefault();
                    //calculate the pos parameter (it can be fed to both siblings)
                    if (this.settings.x) this.settings.ps = (e.clientY - this.outerDiv.parentElement.getClientRects()[0].top) / this.outerDiv.parentElement.getClientRects()[0].height;
                    else this.settings.ps = (e.clientX - this.outerDiv.parentElement.getClientRects()[0].left) / this.outerDiv.parentElement.getClientRects()[0].width;
                    if (this.settings.ps < 0) {
                        this.settings.ps = 0;
                        this.resizing = -1;
                    }
                    if (this.settings.ps > 1) {
                        this.settings.ps = 1;
                        this.resizing = -1;
                    }
                    if (this.parent instanceof polymorph_core.rect) {
                        this.otherSiblingSettings.ps = this.settings.ps;
                        this.refresh();
                        if (this.otherSibling) this.otherSibling.refresh();
                    }
                    e.preventDefault();
                    rectChanged = true;
                }
                //reset all border colors

                this.redrawBorders();
            }
        };
        this.outerDiv.addEventListener("mousemove", this.mouseMoveHandler);

        globalKeyDownRectBarCalls.borderRedraw.push((shiftPressed) => {
            if (!this.shiftPressed && shiftPressed) this.redrawBorders();
            this.shiftPressed = shiftPressed;
        })
        document.addEventListener("keyup", (e) => {
            if (e.key == "Shift" || e.key == "Control" || e.key == "Meta") {
                this.shiftPressed = e.shiftKey && (e.ctrlKey || e.metaKey);
                this.redrawBorders();
            }
        })
        this.mouseUpHandler = (e) => {
            //push the new view, if anything interesting happened
            this.resizing = -1;
            if (this.children) {
                this.children[0].mouseUpHandler(e);
                this.children[1].mouseUpHandler(e);
            }
            if (rectChanged) {
                polymorph_core.fire("updateItem", {
                    id: rectID,
                    sender: this
                });
                rectChanged = false;
            }
        }
        this.outerDiv.addEventListener("mouseup", this.mouseUpHandler);

        this.outerDiv.addEventListener("mouseleave", () => {
            this.redrawBorders();
            this.split = -1;
        })
        this.outerDiv.addEventListener("mousedown", (e) => {
            let dirn = -1;
            let cr = this.outerDiv.getClientRects()[0];
            if (e.clientX - cr.left <= RECT_BORDER_WIDTH && e.clientX - cr.left >= 0) {
                dirn = 0;
            } else if (cr.left + cr.width - e.clientX <= RECT_BORDER_WIDTH && cr.left + cr.width - e.clientX >= 0) {
                dirn = 1;
            } else if (e.clientY - cr.top <= RECT_BORDER_WIDTH && e.clientY - cr.top >= 0) {
                dirn = 2;
            } else if (cr.top + cr.height - e.clientY <= RECT_BORDER_WIDTH && cr.top + cr.height - e.clientY >= 0) {
                dirn = 3;
            }
            if (e.shiftKey) {
                this.split = dirn;
            } else {
                this.resizing = dirn;
            }

        })
        ///Saving
        this.toSaveData = () => {
            //just ensure your item data is accurate.
            return this.settings;
        }

        //connect to my parent. Called after creation in load process.
        this.attach = () => {
            if (this.settings.p && polymorph_core.items[this.settings.p]) {
                //there is or will be a rect / subframe for it.
                if (polymorph_core.rects[this.settings.p]) {
                    polymorph_core.rects[this.settings.p].tieRect(rectID);
                } else {
                    if (!polymorph_core.rectLoadCallbacks[this.settings.p]) polymorph_core.rectLoadCallbacks[this.settings.p] = [];
                    polymorph_core.rectLoadCallbacks[this.settings.p].push(rectID);
                }
            }

            //Signal all children waiting for this that they can connect to this now.
            if (polymorph_core.rectLoadCallbacks[rectID]) polymorph_core.rectLoadCallbacks[rectID].forEach((v) => {
                if (polymorph_core.items[v]._od) {
                    //v is container
                    this.tieContainer(v);
                } else {
                    //v is rect
                    this.tieRect(v);
                }
            });
        }
        this.remove = () => {
            // nerf all containers
            this.containers.forEach(i => i.remove());
            this.containerids.forEach(i => {
                delete polymorph_core.items[i]._od;
            });
            delete polymorph_core.items[rectID]._rd;
            delete polymorph_core.rects[rectID]; //seppuku
        }
    }

    Object.defineProperty(polymorph_core, "baseRect", {
        get: () => {
            try {
                if (polymorph_core.rects[polymorph_core.items._meta.currentView]) {
                    return polymorph_core.rects[polymorph_core.items._meta.currentView];
                } else {
                    polymorph_core.items._meta.currentView = Object.keys(polymorph_core.rects)[0]; //if the base rect is deleted
                    return polymorph_core.rects[polymorph_core.items._meta.currentView];
                }
            } catch (e) {
                return undefined;
            }
        }
    })

    polymorph_core.rects = {};

}


// make sure that new operators are properly instantiated
polymorph_core.on("updateItem", (d) => {
    let itm = polymorph_core.items[d.id];
    if (itm._rd && !polymorph_core.rects[d.id]) {
        polymorph_core.rects[d.id] = new polymorph_core.rect(d.id);
        polymorph_core.switchView(polymorph_core.currentDoc.currentView)
    }
})