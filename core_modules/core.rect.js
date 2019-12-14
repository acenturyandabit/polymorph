// the UI is composed of RECTS. 
// a RECT can have another RECT or an OPERATOR in it.


/// PASS OPERATORS INSTEAD OF CONTENT DIVS

const RECT_ORIENTATION_X = 0;
const RECT_ORIENTATION_Y = 1;
const RECT_FIRST_SIBLING = 0;
const RECT_SECOND_SIBLING = 1;
const RECT_BORDER_WIDTH = 5;
const RECT_OUTER_DIV_COLOR = "rgba(230, 204, 255,0.1)";
const RECT_BORDER_COLOR = "transparent";

//parent is either undefined or another rect-like object
//pseudo parents should implement following methods:
//.polymorph_core property
//

polymorph_core.newRect = function (parent) {
    let ID = polymorph_core.insertItem({
        p: parent,
        f: RECT_FIRST_SIBLING,
        x: RECT_ORIENTATION_X,
        ps: 1
    });
    polymorph_core.rects[ID] = new polymorph_core.rect(ID);
    return ID;
}

polymorph_core.rect = function (rectID) {
    this.id = rectID;//might be helpful
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

    Object.defineProperty(this, "containerIDs", {
        get: () => {
            this._containerIDs = [];
            for (let i in polymorph_core.items) {
                if (polymorph_core.items[i]._od && polymorph_core.items[i]._od.p == rectID) {
                    this._containerIDs.push(i);
                }
            }
            return this._containerIDs;
        }
    })

    Object.defineProperty(this, "containers", {
        get: () => {
            if (this.containerIDs) {
                return this.containerIDs.map((v) => polymorph_core.containers[v]);
            }
            return undefined;
        }
    })

    Object.defineProperty(this, "parent", {
        get: () => {
            if (this.settings.p) return polymorph_core.rects[this.settings.p];
            else return polymorph_core;
        }
    })

    this.split = -1; // if this flag is >=0, on the next mousemove that reenters the box, the box will be split into 2 smaller boxes. 
    this.resizing = -1; // if this flag is >=0, on the next mousemove that reenters the box, the box will resize. 

    // Create the outerDiv: the one with the active borders.
    this.outerDiv = document.createElement("div");
    this.outerDiv.style.cssText = `
        position: absolute;
        box-sizing: border-box;
        height: 100%; width:100%;
        overflow: hidden;
        display:flex;
        flex-direction:column;
        border-radius:5px;
        background: ${RECT_OUTER_DIV_COLOR}
    `;

    this.createTabSpan = (containerID) => {
        let tabSpan = document.createElement("span");
        let tabName = document.createElement("button");
        let tabDelete = document.createElement("button");
        let tabGear = document.createElement("img");
        tabName.style.cssText = tabDelete.style.cssText = `
        background: unset;
        color:unset;
        border:unset;
        cursor:pointer;
        padding: 5px;
        `;
        tabDelete.style.cssText += `color:red;font-weight:bold; font-style:normal`;
        tabDelete.innerText = 'x';
        tabDelete.style.display = "none";
        tabGear.src = "assets/gear.png";
        tabGear.style.cssText = "width: 1em; height:1em;"
        tabGear.style.display = "none";

        tabSpan.style.cssText = `
        border: 1px solid black;
        background: #C074E8;
        color: white;
        align-items: center;
        display: inline-flex;
        margin-right: 0.1em;
        border-radius: 3px;
        `;
        tabSpan.appendChild(tabName);
        tabSpan.appendChild(tabDelete);
        tabSpan.appendChild(tabGear);
        tabSpan.dataset.containerid = containerID;

        return tabSpan;
    }

    // The actual tabbar.
    this.tabbar = document.createElement("p");
    this.tabbar.style.cssText = `display:block;margin:0; width:100%;background:${RECT_OUTER_DIV_COLOR}`
    this.plus = document.createElement("button");
    this.plus.style.cssText = `color:blue;font-weight:bold; font-style:normal`;
    this.plus.innerText = "+";
    this.tabbar.appendChild(this.plus);
    this.outerDiv.appendChild(this.tabbar);

    // For handling operators. Each operator has its own innerDiv, and a tabSpan (with the name, and a cross) in the tabspan bar.
    // Create the innerDivs and generator for innerDivs..
    this.createInnerDiv = (containerID) => {
        let indiv = document.createElement("div");
        indiv.style.cursor = "default";
        indiv.style.height = "100%";
        indiv.style.width = "100%";
        indiv.style.overflow = "hidden";
        indiv.style.background = RECT_OUTER_DIV_COLOR;
        indiv.style.display = "none";
        indiv.dataset.containerid = containerID;
        return indiv;
    }


    this.innerDivContainer = htmlwrap(`<div style="height:100%; width:100%;"></div>`);
    this.outerDiv.appendChild(this.innerDivContainer);

    //Function for adding an operator to this rect. Operator must already exist.
    //This function is called: on operator create by operator; OR inernally by rearranging tabspans (later).
    this.tieContainer = (containerID, index) => {
        let container = polymorph_core.containers[containerID];
        if (!container) {
            console.log("Ack!");
            return;
        }

        if (index == undefined) {
            index = this.tabbar.children.length - 1;
        }

        // Just move the tabbar around, and attach some information to the tabbar so 
        // we know what to do when a button is clicked.
        let currentTabSpan = this.tabbar.querySelector(`span[data-containerID="${containerID}"]`);
        if (!currentTabSpan) currentTabSpan = this.createTabSpan(containerID);
        currentTabSpan.children[0].innerText = container.settings.tabbarName;
        this.tabbar.insertBefore(currentTabSpan, this.tabbar.children[index]);

        let currentInnerDiv = this.innerDivContainer.querySelector(`div[data-containerID="${containerID}"]`);
        if (!currentInnerDiv) currentInnerDiv = this.createInnerDiv(containerID);
        currentInnerDiv.appendChild(container.outerDiv);
        this.innerDivContainer.insertBefore(currentInnerDiv, this.innerDivContainer.children[index]);

        if (container.operator && container.operator.refresh) container.operator.refresh();
        // because during initial load, this needs to be called to actually show anything.
        if (containerID == this.settings.s) this.switchOperator(this.settings.s);
        else{
            //set the colour to a nope
        }
    }

    //Callback for tab clicks to switch between operators.
    this.switchOperator = (containerID) => {
        if (!this.innerDivContainer.querySelector(`div[data-containerid="${containerID}"]`)) return false;//we cant do that
        this.settings.s = containerID;
        for (let i = 0; i < this.innerDivContainer.children.length; i++) {
            this.innerDivContainer.children[i].style.display = "none";
        }
        this.innerDivContainer.querySelector(`div[data-containerid="${containerID}"]`).style.display = "block";
        // hide buttons on previous operator
        for (let i = 0; i < this.tabbar.children.length - 1; i++) {
            this.tabbar.children[i].children[1].style.display = "none";
            this.tabbar.children[i].children[2].style.display = "none";
            this.tabbar.children[i].style.background = "#C074E8";
        }
        //show buttons on this operator
        let currentTab = this.tabbar.querySelector(`span[data-containerid="${containerID}"]`);
        currentTab.children[1].style.display = "inline";
        currentTab.children[2].style.display = "inline";
        currentTab.style.background = "#8093FF";
        polymorph_core.containers[containerID].refresh();
        //Overall refresh because borders are dodgy
        polymorph_core.containers[this.settings.s].refresh();
        return true;
    }

    //operator creation
    this.plus.addEventListener("click", () => {
        let newContainer = { _od: { t: "opSelect", p: rectID } };
        let newContainerID = polymorph_core.insertItem(newContainer);
        polymorph_core.containers[newContainerID] = new polymorph_core.container(newContainerID);
        this.switchOperator(newContainerID);
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
        if (e.target.tagName.toLowerCase() == 'button' && e.target.innerText == "x" && confirm("Warning: closing operators is irreversible and may lead to data loss. Continue?")) {
            let containerID = e.target.parentElement.dataset.containerid;
            e.target.parentElement.remove();
            let currentInnerDiv = this.innerDivContainer.querySelector(`[data-containerID="${containerID}"]`);
            let switchToID;
            if (currentInnerDiv.previousElement) switchToID = currentInnerDiv.previousElement.dataset.containerid;
            else if (currentInnerDiv.nextElement) switchToID = currentInnerDiv.nextElement.dataset.containerid;
            currentInnerDiv.remove();

            this.switchOperator(switchToID);
            //nerf the item
            polymorph_core.destroyItem(conatinerID);
        }
    })

    let tabmenu;
    //Delegated context menu click on tabs
    let c = new _contextMenuManager(this.outerDiv);
    let contextedOperatorIndex = 0;
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
        if (this.parent && this.parent.constructor.name == "polymorph_core.rect") {
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
            <li class="subframePR">Subframe this</li>
        </ul>
    </li>
    <li>Export/Import
    <ul class="submenu">
        <li class="cpfr">Copy frame settings</li>
        <li class="psfr">Paste frame settings</li>
        <li class="xpfr">Export frame to text...</li>
        <li class="mpfr">Import frame from text...</li>
        <li class="xdoc">Export frame as document...</li>
    </ul>
    </li>
    `, this.tabbar, undefined, tabfilter);
    tabmenu.querySelector(".subframePR").addEventListener("click", () => {
        // at the tab, create a new subframe operator
        let sf = (new polymorph_core.container("subframe", this.parent));
        let pcp = new polymorph_core.rect(polymorph_core, sf.operator.rootdiv, RECT_ORIENTATION_X, 1, 0);
        sf.operator.rect = pcp;
        let oldParent = this.parent;
        pcp.children = this.parent.children;
        pcp.outerDiv.children[pcp.outerDiv.children.length - 1].remove();//remove rect, just to clean up
        pcp.outerDiv.appendChild(pcp.children[0].outerDiv);
        pcp.outerDiv.appendChild(pcp.children[1].outerDiv);
        pcp.children[0].parent = pcp;
        pcp.children[1].parent = pcp;
        oldParent.children = [];
        oldParent.innerDivs = [];
        oldParent.tabspans = [];
        oldParent.tieContainer(sf);
        oldParent.innerDivs[0].style.display = "block";
        oldParent.refresh();
        oldParent.refresh();// could probably be more efficient than calling resize twice...
        polymorph_core.fire("updateItem", { id: rectID, sender: this });
        tabmenu.style.display = "none";
    })
    tabmenu.querySelector(".subframe").addEventListener("click", () => {
        // at the tab, create a new subframe operator
        let sf = (new polymorph_core.container("subframe", this));
        let oop = this.containers[contextedOperatorIndex];
        sf.settings.tabbarName = oop.settings.tabbarName;
        this.tieContainer(sf, contextedOperatorIndex);
        sf.operator.rect.tieContainer(oop, 0);
        polymorph_core.fire("updateItem", { id: rectID, sender: this });
        tabmenu.style.display = "none";
    })

    tabmenu.querySelector(".cpfr").addEventListener("click", () => {
        // at the tab, create a new subframe operator
        polymorph_core.copiedFrameData = this.containers[contextedOperatorIndex].toSaveData();
        polymorph_core.fire("updateItem", { id: rectID, sender: this });
        tabmenu.style.display = "none";
    })
    tabmenu.querySelector(".xdoc").addEventListener("click", () => {
        //export as a whole doc! how generous
        let tta = htmlwrap("<h1>Operator export:</h1><br><textarea style='height:30vh'></textarea>");
        tabmenu.style.display = "none";
        polymorph_core.dialog.prompt(tta);
        //how about this - export all the items, then the importer can just run the garbage cleaner on it when it starts?
        //or even better for future security: create a separate polymorph_core instance, and get it to GC itself. TODO!
        let collatedItems = polymorph_core.items;
        tta.querySelector("textarea").value = `{"displayName":"export-${new Date().toDateString()}","currentView":"default","id":"${guid(5)}","views":{"default":{
        "o":[${JSON.stringify(this.containers[contextedOperatorIndex].toSaveData())}],"s":0,"x":0,"f":1,"p":0}},"items":${JSON.stringify(collatedItems)}}`;
    })

    tabmenu.querySelector(".psfr").addEventListener("click", () => {
        // at the tab, create a new subframe operator
        this.containers[contextedOperatorIndex].fromSaveData(polymorph_core.copiedFrameData);
        this.tieContainer(this.containers[contextedOperatorIndex], contextedOperatorIndex);
        polymorph_core.fire("updateItem", { id: rectID, sender: this });
        tabmenu.style.display = "none";
    })

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
    this.refresh = () => {
        if (this.settings.x == RECT_ORIENTATION_X) {
            if (this.settings.f == RECT_FIRST_SIBLING) {
                this.outerDiv.style.left = 0;
                this.outerDiv.style.width = this.outerDiv.parentElement.offsetWidth * this.settings.ps;
            } else {
                this.outerDiv.style.left = this.outerDiv.parentElement.offsetWidth * this.settings.ps;
                this.outerDiv.style.width = this.outerDiv.parentElement.offsetWidth * (1 - this.settings.ps);
            }
            this.outerDiv.style.height = this.outerDiv.parentElement.offsetHeight;
            this.outerDiv.style.top = 0;
        } else {
            if (this.settings.f == RECT_FIRST_SIBLING) {
                this.outerDiv.style.top = 0;
                this.outerDiv.style.height = this.outerDiv.parentElement.offsetHeight * this.settings.ps;
            } else {
                this.outerDiv.style.top = this.outerDiv.parentElement.offsetHeight * this.settings.ps;
                this.outerDiv.style.height = this.outerDiv.parentElement.offsetHeight * (1 - this.settings.ps);
            }
            this.outerDiv.style.width = this.outerDiv.parentElement.offsetWidth;
            this.outerDiv.style.left = 0;
        }
        //also refresh any of my children
        if (this.children) {
            this.outerDiv.style.border = "";
            this.children.forEach((c) => c.refresh());
        } else {
            //show my container
            this.switchOperator(this.settings.s);
        }
        if (this.containers) this.containers.forEach((c) => {
            //containers may not exist on fromSaveData
            if (c) c.refresh()
        });
    }
    let rectChanged = false;
    //Make draggable borders.
    this.outerDiv.style.border = RECT_BORDER_WIDTH + `px ${RECT_BORDER_COLOR} solid`;

    this.tieRect = (rectID) => {
        this.innerDivContainer.remove();
        this.tabbar.remove();
        this.outerDiv.appendChild(polymorph_core.rects[rectID].outerDiv);
        polymorph_core.rects[rectID].refresh();
    }


    //events
    //this is called by both actual mouse moves and delegations, so don't put it directly as the handler.
    this.mouseMoveHandler = (e) => {
        if (this.children) {
            //forward events to children
            this.children[0].mouseMoveHandler(e);
            this.children[1].mouseMoveHandler(e);
            return;
        } else {
            let dirn = -1;
            let cr = this.outerDiv.getClientRects()[0];
            if (e.clientX - cr.left >= 0 && cr.left + cr.width - e.clientX >= 0 && e.clientY - cr.top >= 0 && cr.top + cr.height - e.clientY >= 0) {
                if (e.clientX - cr.left <= RECT_BORDER_WIDTH && e.clientX - cr.left >= 0) {
                    dirn = 0;
                } else if (cr.left + cr.width - e.clientX <= RECT_BORDER_WIDTH && cr.left + cr.width - e.clientX >= 0) {
                    dirn = 1;
                } else if (e.clientY - cr.top <= RECT_BORDER_WIDTH && e.clientY - cr.top >= 0) {
                    dirn = 2;
                } else if (cr.top + cr.height - e.clientY <= RECT_BORDER_WIDTH && cr.top + cr.height - e.clientY >= 0) {
                    dirn = 3;
                }
            }

            if (this.split != -1 && this.split != dirn) {
                if (!(e.buttons % 2)) {
                    this.split = -1;
                    e.preventDefault();
                    //reset and return
                    return;
                }
                e.preventDefault();
                // a split has been called. Initialise the split!
                this.outerDiv.style.border = "none";
                //remove all my children
                while (this.outerDiv.children.length) this.outerDiv.children[0].remove();

                //Create new rects
                let _XorY = (this.split > 1) * 1;
                let _firstOrSecond = this.split % 2;
                let newRectIDs = [
                    polymorph_core.insertItem({ _rd: { p: rectID, x: _XorY, f: 0, ps: _firstOrSecond } }),
                    polymorph_core.insertItem({ _rd: { p: rectID, x: _XorY, f: 1, ps: _firstOrSecond } })
                ];
                //instantiate the rects
                newRectIDs.forEach((v) => {
                    polymorph_core.rects[v] = new polymorph_core.rect(v);
                })
                //copy in operators
                this.containers.forEach((v, i) => {
                    v.settings.p = newRectIDs[!_firstOrSecond * 1];
                    polymorph_core.rects[newRectIDs[!_firstOrSecond * 1]].tieContainer(v.id);
                });

                //force a refresh
                this.children.forEach((v) => { v.refresh(); v.resizing = this.split ^ 1 });
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
                if (this.parent) {
                    this.parent.children[!this.settings.f * 1].settings.ps = this.settings.ps;
                    this.refresh();
                    this.parent.children[!this.settings.f * 1].refresh();
                }
                e.preventDefault();
                rectChanged = true;
            }
            let borders = ['left', 'right', 'top', 'bottom'];
            //reset all border colors

            if (this.borderInvalidated) {
                if (!this.children) {
                    this.outerDiv.style.border = RECT_BORDER_WIDTH + `px ${RECT_BORDER_COLOR} solid`;
                } else {
                    this.outerDiv.style.border = "";
                }
                this.borderInvalidated = false;
            }

            if (dirn != -1) {
                if (!this.children) {
                    this.outerDiv.style["border-" + borders[dirn]] = RECT_BORDER_WIDTH + "px red solid";
                    this.borderInvalidated = true;
                }
            }
        }
    };
    this.outerDiv.addEventListener("mousemove", this.mouseMoveHandler);

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
        if (!this.children) {
            this.outerDiv.style.border = RECT_BORDER_WIDTH + `px ${RECT_BORDER_COLOR} solid`;
        } else {
            this.outerDiv.style.border = "";
        }
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
    let toSaveProperties = ['XorY', 'firstOrSecond', 'pos'];
    this.toSaveData = () => {
        //just ensure your item data is accurate.
        return this.settings;
    }

    //connect to my parent
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
    })

    this.remove = () => {
        //signal my brother to promote itself
        if (this.parent) this.parent._remove(this.settings.f, this);
    }
    this._remove = (_firstOrSecond) => {
        polymorph_core.fire("updateItem", {
            id: rectID,
            sender: this
        });
        //if remaining innerDiv has an operator, adopt it
        if (this.children[(!_firstOrSecond) * 1].operators && this.children[(!_firstOrSecond) * 1].operators.length) {
            for (let i = 0; i < this.children[(!_firstOrSecond) * 1].operators.length; i++) this.tieContainer(this.children[(!_firstOrSecond) * 1].operators[i]);
            //remove the children
            this.children[0].outerDiv.remove();
            this.children[1].outerDiv.remove();
            this.children = [];
            //reshow tabbar
            this.tabbar.style.display = "block";
        } else {
            //otherwise adopt the children
            this.children = this.children[(!_firstOrSecond) * 1].children;
            while (this.outerDiv.children.length > 1) {
                this.outerDiv.children[this.outerDiv.children.length - 1].remove();
            }
            this.outerDiv.appendChild(this.children[0].outerDiv);
            this.outerDiv.appendChild(this.children[1].outerDiv);
            this.children[0].parent = this;
            this.children[1].parent = this;
        }
        //delete this.children[0];
        //delete this.children[1];
        this.refresh();
        this.switchOperator(0);
    }

}

Object.defineProperty(polymorph_core, "baseRect", {
    get: () => {
        return polymorph_core.rects[polymorph_core.items._meta.currentView];
    }
})