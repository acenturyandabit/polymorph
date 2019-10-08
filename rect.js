// the UI is composed of RECTS. 
// a RECT can have another RECT or an OPERATOR in it.


/// PASS OPERATORS INSTEAD OF CONTENT DIVS

const RECT_ORIENTATION_X = 0;
const RECT_ORIENTATION_Y = 1;
const RECT_FIRST_SIBLING = 0;
const RECT_SECOND_SIBLING = 1;
const RECT_BORDER_WIDTH = 10;

//parent is either undefined or another rect-like object
//pseudo parents should implement following methods:
//.core property
//

function _rect(core, parent, XorY, pos, firstOrSecond, operators) {
    //Putting all the variables here for quick reference.
    this.parent = parent;
    if (typeof XorY != 'object') {
        this.XorY = XorY; // XorY determines whether the split is in the X or the Y direction. 
        this.pos = pos; //if first, the size; otherwise position (and size);
        this.firstOrSecond = firstOrSecond;
    }
    this.core = core;
    this.outerDiv = undefined;
    this.children = [];
    this.split = -1; // if this flag is >=0, on the next mousemove that reenters the box, the box will be split into 2 smaller boxes. 
    this.resizing = -1; // if this flag is >=0, on the next mousemove that reenters the box, the box will resize. 
    let me = this;

    // Create the outerDiv: the one with the active borders.
    this.outerDiv = document.createElement("div");
    this.outerDiv.style.position = "absolute ";
    this.outerDiv.style["box-sizing"] = "border-box";
    this.outerDiv.style.height = "100%";
    this.outerDiv.style.width = "100%";
    this.outerDiv.style.overflow = "hidden";
    this.outerDiv.style.display = "flex";
    this.outerDiv.style['flex-direction'] = "column";
    this.outerDiv.style.background = "lightgrey";

    // For handling operators. Each operator has its own innerDiv, and a typespan (with the name, and a cross) in the tabspan bar.
    // Create the innerDivs and generator for innerDivs..
    this.innerDivs = [];
    this.createInnerDiv = function () {
        let indiv = document.createElement("div");
        indiv.style.cursor = "default";
        indiv.style.height = "100%";
        indiv.style.width = "100%";
        indiv.style.overflow = "hidden";
        indiv.style.background = "lightgrey";
        indiv.style.display = "none";
        return indiv;
    }

    this.tabspans = [];
    this.createTypeName = function () {
        let tyspan = document.createElement("span");
        let tyname = document.createElement("button");
        let tybtn = document.createElement("button");
        let tygear = document.createElement("img");
        tyname.style.cssText = tybtn.style.cssText = `
        background: unset;
        color:unset;
        border:unset;
        cursor:pointer;
        padding: 5px;
        `;
        tybtn.style.cssText += `color:red;font-weight:bold; font-style:normal`;
        tybtn.innerText = 'x';
        tybtn.style.display = "none";
        tygear.src = "assets/gear.png";
        tygear.style.cssText = "width: 1em; height:1em;"
        tygear.style.display = "none";

        tyspan.style.cssText = `border: 1px solid black;
        background: purple;
        color: white;
        align-items: center;
        display: inline-flex;`;
        tyspan.appendChild(tyname);
        tyspan.appendChild(tybtn);
        tyspan.appendChild(tygear);
        return tyspan;
    }

    //Function for adding an operator to this rect. Operator must already exist.
    this.tieOperator = function (operator, index) {
        if (!operator) {
            console.log("Ack!");
            return;
        }
        if (!this.operators) this.operators = [];
        if (!this.operators.includes(operator)) {
            if (index == undefined) this.operators.push(operator);
            else this.operators[index] = operator;
            let ts;
            let innrd;
            if (index == undefined) {
                this.tabspans.push(this.createTypeName());
                ts = this.tabspans[this.tabspans.length - 1];
                this.tabbar.insertBefore(ts, this.plus);
                //Create a tab for it
                this.innerDivs.push(this.createInnerDiv());
                innrd = this.innerDivs[this.innerDivs.length - 1];
                this.outerDiv.appendChild(innrd);
            } else {
                ts = this.tabspans[index];
                innrd = this.innerDivs[index];
                innrd.children[0].remove();
            }
            //Create a button for it
            ts.children[0].innerText = operator.tabbarName || operator.type;
            //Hook it up
            innrd.appendChild(operator.topdiv);
        } else {
            this.tabspans[this.operators.indexOf(operator)].children[0].innerText = operator.tabbarName || operator.type;
            //just refresh the tabspan.
        }
        operator.rect = this;
        if (operator.baseOperator && operator.baseOperator.refresh) operator.baseOperator.refresh();
    }

    //Callback for tab clicks to switch between operators.
    this.switchOperator = function (index) {
        this.selectedOperator = index;
        for (let i = 0; i < this.innerDivs.length; i++) {
            this.innerDivs[i].style.display = "none";
        }
        if (this.innerDivs[index]) this.innerDivs[index].style.display = "block";
        if (this.operators[index] && this.operators[index].baseOperator && this.operators[index].baseOperator.refresh) this.operators[index].baseOperator.refresh();
        // hide buttons on previous operator
        for (let i = 0; i < this.tabspans.length; i++) {
            this.tabspans[i].children[1].style.display = "none";
            this.tabspans[i].children[2].style.display = "none";
            this.tabspans[i].style.background = "mediumpurple";
        }
        //show buttons on this operator
        this.tabspans[index].children[1].style.display = "inline";
        this.tabspans[index].children[2].style.display = "inline";
        this.tabspans[index].style.background = "purple";
    }

    // The actual tabbar.
    this.tabbar = document.createElement("p");
    this.tabbar.style.cssText = `display:block;margin:0; width:100%;background:white`
    this.plus = document.createElement("button");
    this.plus.style.cssText = `color:blue;font-weight:bold; font-style:normal`;
    this.plus.innerText = "+";
    this.tabbar.appendChild(this.plus);

    //operator creation
    this.plus.addEventListener("click", () => {
        this.tieOperator(new core.operator("opSelect", this));
        this.switchOperator(this.operators.length - 1);
    })

    //Delegated operator switching
    this.tabbar.addEventListener("click", (e) => {
        //pass direct clicks so we don't switch to blank operators
        if (e.target == this.tabbar) return;
        if (!e.target.previousSibling) {
            let ptg = e.target;
            if (ptg.parentElement.tagName.toLowerCase() == 'span') ptg = ptg.parentElement;
            this.switchOperator(this.tabspans.indexOf(ptg));
        }
    })

    //Delegated cross button handler
    this.tabbar.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() == 'button' && e.target.innerText == "x") {
            let i = this.tabspans.indexOf(e.target.parentElement);
            e.target.parentElement.remove();
            //this.outerDiv.children[i+1].remove();
            this.innerDivs[i].remove();
            this.innerDivs.splice(i, 1);
            this.tabspans.splice(i, 1);
            this.operators.splice(i, 1);
            if (this.innerDivs.length == 0) {
                this.remove();
            } else {
                if (i < this.innerDivs.length - 1) this.switchOperator(i);
                else this.switchOperator(i - 1);
            }
        }
    })

    this.outerDiv.appendChild(this.tabbar);
    let tabmenu;
    //Delegated context menu click on tabs
    let c = new _contextMenuManager(this.outerDiv);
    let contextedOperatorIndex = 0;
    function tabfilter(e) {
        contextedOperatorIndex = -1;
        let t = e.target;
        while (t != this.tabbar) {
            if (t.tagName == "SPAN") {
                break;
            } else {
                t = t.parentElement;
            }
        }
        let tp = t.parentElement;
        for (let i = 0; i < tp.children.length; i++) {
            if (tp.children[i] == t) contextedOperatorIndex = i;
        }
        if (me.parent && me.parent.constructor.name == "_rect") {
            //i have a prent, show subframe parent button
            tabmenu.querySelector(".subframePR").style.display = "block";
        } else {
            tabmenu.querySelector(".subframePR").style.display = "none";
        }
        return true;
    }
    tabmenu = c.registerContextMenu(`
    <li class="subframe">Subframe this</li>
    <li class="subframePR">Subframe parent rect</li>
    <li class="cpfr">Copy frame settings</li>
    <li class="psfr">Paste frame settings</li>
    <li class="xpfr">Export frame to text...</li>
    <li class="mpfr">Import frame from text...</li>`, this.tabbar, undefined, tabfilter);
    tabmenu.querySelector(".subframePR").addEventListener("click", () => {
        // at the tab, create a new subframe operator
        let sf = (new core.operator("subframe", this.parent));
        let pcp = new _rect(core, sf.baseOperator.rootdiv, RECT_ORIENTATION_X, 1, 0);
        sf.baseOperator.rect = pcp;
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
        oldParent.tieOperator(sf);
        oldParent.innerDivs[0].style.display = "block";
        oldParent.refresh();
        oldParent.refresh();// could probably be more efficient than calling resize twice...
        core.fire("updateView", { sender: me });
        tabmenu.style.display = "none";
    })
    tabmenu.querySelector(".subframe").addEventListener("click", () => {
        // at the tab, create a new subframe operator
        let sf = (new core.operator("subframe", this));
        let oop = this.operators[contextedOperatorIndex];
        sf.tabbarName = oop.tabbarName;
        this.tieOperator(sf, contextedOperatorIndex);
        sf.baseOperator.rect.tieOperator(oop, 0);
        core.fire("updateView", { sender: me });
        tabmenu.style.display = "none";
    })

    tabmenu.querySelector(".cpfr").addEventListener("click", () => {
        // at the tab, create a new subframe operator
        core.copiedFrameData = this.operators[contextedOperatorIndex].toSaveData();
        core.fire("updateView", { sender: me });
        tabmenu.style.display = "none";
    })

    tabmenu.querySelector(".psfr").addEventListener("click", () => {
        // at the tab, create a new subframe operator
        this.operators[contextedOperatorIndex].fromSaveData(core.copiedFrameData);
        this.tieOperator(this.operators[contextedOperatorIndex], contextedOperatorIndex);
        core.fire("updateView", { sender: me });
        tabmenu.style.display = "none";
    })

    tabmenu.querySelector(".xpfr").addEventListener("click", () => {
        let tta = htmlwrap("<h1>Operator export:</h1><br><textarea style='height:30vh'></textarea>");
        tabmenu.style.display = "none";
        core.dialog.prompt(tta);
        tta.querySelector("textarea").value = JSON.stringify(this.operators[contextedOperatorIndex].toSaveData());
    })

    tabmenu.querySelector(".mpfr").addEventListener("click", () => {
        let tta = htmlwrap("<h1>Operator import:</h1><br><textarea style='height:30vh'></textarea><br><button>Import</button>");
        core.dialog.prompt(tta);
        tta.querySelector("button").addEventListener("click", () => {
            if (tta.querySelector("textarea").value) {
                let importObject = JSON.parse(tta.querySelector("textarea").value);
                this.operators[contextedOperatorIndex].fromSaveData(importObject);
                this.tieOperator(this.operators[contextedOperatorIndex], contextedOperatorIndex);
                core.fire("updateView", { sender: me });
                //force update all items to reload the view
                for (let i in core.items) {
                    core.fire('updateItem', { id: i });
                }
            }
        })
        tabmenu.style.display = "none";
    })

    this.selectedOperator = 0;
    //And a delegated settings button handler
    this.tabbar.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() == "img") {
            //dont show settings - instead, copy the settings div onto the core settings div.
            if (this.operators[this.selectedOperator].baseOperator.dialogDiv) {

                // this.selectedOperator is an index!

                this.settingsOperator = this.operators[this.selectedOperator].baseOperator;
                this.settingsOperator.showDialog();
                this.settingsDiv = document.createElement("div");
                this.settingsDiv.innerHTML = `<h1>Settings</h1>
                <h3> General settings </h3>
                <input class="tabDisplayName" placeholder="Tab display name:"/>
                <h3>Operator settings</h3>`;
                this.settingsOperator.dialogDiv.style.maxWidth = "50vw";
                this.settingsDiv.appendChild(this.settingsOperator.dialogDiv);
                this.settingsDiv.querySelector(".tabDisplayName").value = this.tabspans[this.selectedOperator].children[0].innerText;
                core.dialog.prompt(this.settingsDiv, (d) => {
                    this.operators[this.selectedOperator].tabbarName = d.querySelector("input.tabDisplayName").value;
                    this.tabspans[this.selectedOperator].children[0].innerText = this.operators[this.selectedOperator].tabbarName;
                   if (this.settingsOperator.dialogUpdateSettings) this.settingsOperator.dialogUpdateSettings();
                    core.fire("updateView");
                })
                //set the calling items.
                core.dialog.currentBaseOperator = this.settingsOperator;
                core.dialog.callingRect = this;
            } else {
                //old version
                if (this.operators[this.selectedOperator].baseOperator.showSettings) {
                    this.operators[this.selectedOperator].baseOperator.showSettings();
                }
            }
            //also render the datastreams if necessary.
            //this.renderDataStreams(this.operators[this.selectedOperator].baseOperator);
        }
    })

    // Generate placeholder content if no content is provided.
    if (operators) {
        for (let i = 0; i < operators.length; i++) this.tieOperator(operators[i]);
        this.switchOperator(0);
    } else {
        this.tieOperator(new core.operator("opSelect", this));
        this.switchOperator(0);
    }

    //handle a resize event.
    this.refresh = function () {
        if (this.XorY == RECT_ORIENTATION_X) {
            if (this.firstOrSecond == RECT_FIRST_SIBLING) {
                this.outerDiv.style.left = 0;
                this.outerDiv.style.width = this.outerDiv.parentElement.clientWidth * this.pos;
            } else {
                this.outerDiv.style.left = this.outerDiv.parentElement.clientWidth * this.pos;
                this.outerDiv.style.width = this.outerDiv.parentElement.clientWidth * (1 - this.pos);
            }
            this.outerDiv.style.height = this.outerDiv.parentElement.clientHeight;
            this.outerDiv.style.top = 0;
        } else {
            if (this.firstOrSecond == RECT_FIRST_SIBLING) {
                this.outerDiv.style.top = 0;
                this.outerDiv.style.height = this.outerDiv.parentElement.clientHeight * this.pos;
            } else {
                this.outerDiv.style.top = this.outerDiv.parentElement.clientHeight * this.pos;
                this.outerDiv.style.height = this.outerDiv.parentElement.clientHeight * (1 - this.pos);
            }
            this.outerDiv.style.width = this.outerDiv.parentElement.clientWidth;
            this.outerDiv.style.left = 0;
        }
        if (this.children.length) {
            //make sure children are attached to me.
            me.outerDiv.style.border = "none"; // verify border removal
            //hide other items
            me.tabbar.style.display = "none";
            this.children[0].refresh();
            this.children[1].refresh();
        } else {
            if (this.operators) {
                for (let i = 0; i < this.operators.length; i++) {
                    if (this.operators[i].baseOperator && this.operators[i].baseOperator.refresh) this.operators[i].baseOperator.refresh();
                }
            }
            me.tabbar.style.display = "block";
            me.outerDiv.style.border = RECT_BORDER_WIDTH + "px white solid";
        }
        core.fire('resize', {
            sender: this
        });
    }
    let rectChanged = false;
    //Make draggable borders.
    this.outerDiv.style.border = RECT_BORDER_WIDTH + "px white solid";
    // If parent is body, ensure loaded, so we can create a new rect whenever.
    //hmm what if we break this
    if (this.parent) {
        this.parent.outerDiv.appendChild(this.outerDiv);
    }
    //events
    this.mouseMoveHandler = function (e) {
        let inOrOut = [false, false, false, false];
        let borders = ['left', 'right', 'top', 'bottom'];
        //reset all border colors
        //this probably doesnt need to exist?
        if (me.borderInvalidated) {
            if (!me.children.length) {
                me.outerDiv.style.border = RECT_BORDER_WIDTH + "px white solid";
            } else {
                me.outerDiv.style.border = "";
            }
            me.borderInvalidated = false;
        }
        //Parsing the event

        if (me.parent) {
            //resizing along XorY is allowed.
        }
        let dirn = -1;
        let cr = me.outerDiv.getClientRects()[0];
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
        if (me.children.length) {
            //forward events to children
            me.children[0].mouseMoveHandler(e);
            me.children[1].mouseMoveHandler(e);
        } else {
            if (dirn != -1) {
                inOrOut[dirn] = true;
                if (!me.children.length) {
                    me.outerDiv.style["border-" + borders[dirn]] = RECT_BORDER_WIDTH + "px red solid";
                    me.borderInvalidated = true;
                }
            }
            if (me.split != -1 && me.split != dirn) {
                if (!(e.buttons % 2)) {
                    me.split = -1;
                    e.preventDefault();
                    //reset and return
                    return;
                }
                e.preventDefault();
                // a split has been called. Initialise the split!
                me.outerDiv.style.border = "none";
                me.tabbar.style.display = "none";
                for (let i = 0; i < me.innerDivs.length; i++) me.innerDivs[i].remove();
                me.innerDivs = [];
                me.tabspans = [];
                while (me.tabbar.children.length > 1) me.tabbar.children[0].remove();

                //me.outerDiv.appendChild(me.innerDiv);
                let _XorY = (me.split > 1) * 1;
                let _firstOrSecond = me.split % 2;
                if (_firstOrSecond) {
                    me.children = [new _rect(core, me, _XorY, 1, 0, me.operators), new _rect(core, me, _XorY, 1, 1)];
                } else {
                    me.children = [new _rect(core, me, _XorY, 0, 0), new _rect(core, me, _XorY, 0, 1, me.operators)];
                }
                rectChanged = true;
                me.operators = undefined;
                me.children[_firstOrSecond].resizing = me.split ^ 1;
                me.split = -1;
                //move the operator into the new box; create a blank box; set this box to a nonprimary box
            }
            //for resizing
            if (me.resizing != -1) {
                //cancel on mouseup
                if (!(e.buttons % 2) || me.resizing != me.XorY * 2 + !(me.firstOrSecond)) {
                    me.resizing = -1;
                    e.preventDefault();
                    //reset and return
                    return;
                }
                //don't resize if not appropriate border


                e.preventDefault();
                //calculate the pos parameter (it can be fed to both siblings)
                if (me.XorY) me.pos = (e.clientY - me.outerDiv.parentElement.getClientRects()[0].top) / me.outerDiv.parentElement.getClientRects()[0].height;
                else me.pos = (e.clientX - me.outerDiv.parentElement.getClientRects()[0].left) / me.outerDiv.parentElement.getClientRects()[0].width;
                if (me.pos < 0) {
                    me.pos = 0;
                    me.resizing = -1;
                }
                if (me.pos > 1) {
                    me.pos = 1;
                    me.resizing = -1;
                }
                if (me.parent) {
                    me.parent.children[!me.firstOrSecond * 1].pos = me.pos;
                    me.refresh();
                    me.parent.children[!me.firstOrSecond * 1].refresh();
                }
                e.preventDefault();
                rectChanged = true;
            }
        }
    }

    this.outerDiv.addEventListener("mousemove", this.mouseMoveHandler);

    this.mouseUpHandler = function (e) {
        //push the new view, if anything interesting happened
        me.resizing = -1;
        if (me.children.length > 0) {
            me.children[0].mouseUpHandler(e);
            me.children[1].mouseUpHandler(e);
        }
        if (rectChanged) {
            core.fire("updateView", {
                sender: me
            });
            rectChanged = false;
        }
    }
    this.outerDiv.addEventListener("mouseup", this.mouseUpHandler);

    this.outerDiv.addEventListener("mouseleave", () => {
        if (!me.children.length) {
            me.outerDiv.style.border = RECT_BORDER_WIDTH + "px white solid";
        } else {
            me.outerDiv.style.border = "";
        }
        me.split = -1;
    })
    this.outerDiv.addEventListener("mousedown", (e) => {
        let dirn = -1;
        let cr = me.outerDiv.getClientRects()[0];
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
            me.split = dirn;
        } else {
            me.resizing = dirn;
        }

    })
    ///Saving
    let toSaveProperties = ['XorY', 'firstOrSecond', 'pos'];
    this.toSaveData = function () {
        let obj = {};
        if (this.operators) {
            obj.operators = [];
            for (let i = 0; i < this.operators.length; i++) obj.operators.push({
                name: me.tabspans[i].children[0].innerText,
                opdata: this.operators[i].toSaveData()
            });
            obj.selectedOperator = this.selectedOperator;
        }
        for (let i = 0; i < toSaveProperties.length; i++) {
            obj[toSaveProperties[i]] = this[toSaveProperties[i]];
        }
        if (this.children.length) {
            obj.children = [this.children[0].toSaveData(), this.children[1].toSaveData()];
        }
        obj = transcopy(obj, {
            remap: {
                "XorY": "x",
                "firstOrSecond": "f",
                "operators": "o",
                "pos": "p",
                "selectedOperator": "s",
                "children": "c"
            }
        })
        return obj;
    }
    this.fromSaveData = function (obj) {
        //children first!
        if (!obj || !Object.keys(obj).length) return;
        obj = transcopy(obj, {
            remap: {
                "XorY": "x",
                "firstOrSecond": "f",
                "operators": "o",
                "pos": "p",
                "selectedOperator": "s",
                "children": "c"
            }, reverse: true
        });
        this.XorY = obj.XorY; // XorY determines whether the split is in the X or the Y direction. 
        this.pos = obj.pos; //if first, the size; otherwise position (and size);
        this.firstOrSecond = obj.firstOrSecond;
        if (obj.children) {
            me.outerDiv.style.border = "none";
            me.tabbar.style.display = "none";
            for (let i = 0; i < me.innerDivs.length; i++) me.innerDivs[i].remove();
            me.innerDivs = [];
            me.tabspans = [];
            while (me.tabbar.children.length > 1) me.tabbar.children[0].remove();
            me.operators = undefined;
            this.children = [new _rect(core, this, obj.children[0]), new _rect(core, this, obj.children[1])];
            for (let i = 0; i < toSaveProperties.length; i++) {
                this[toSaveProperties[i]] = obj[toSaveProperties[i]];
            }
        } else if (obj.operators) {
            for (let i = 0; i < this.innerDivs.length; i++) {
                this.innerDivs[i].remove();
            }
            this.innerDivs = [];
            for (let i = 0; i < this.tabbar.children.length; i++) {
                this.tabbar.children[i].remove();
            }
            this.tabbar.appendChild(this.plus);
            this.tabspans = [];
            //Clear everything; reinstantiate topbar
            //show opselect if it does not already exist
            this.operators = [];

            for (let i = 0; i < obj.operators.length; i++) {

                if (obj.operators[i].opdata) {
                    let op;
                    try {
                        op = new me.core.operator(obj.operators[i].opdata, me);
                        this.tieOperator(op);
                        this.tabspans[this.tabspans.length - 1].children[0].innerText = obj.operators[i].name
                    } catch (e) {
                        console.log(e);
                        //aborttt
                    }
                } else {
                    let op = new me.core.operator(obj.operators[i], me)
                    this.tieOperator(op);
                }
            }
            if (obj.selectedOperator) this.selectedOperator = obj.selectedOperator;
            if (this.selectedOperator > this.operators.length - 1) this.selectedOperator = this.operators.length - 1;
            this.switchOperator(this.selectedOperator);
        } else if (obj.operator) {
            //legacy support
            this.tieOperator(new me.core.operator(obj.operator, me));
            this.switchOperator(this.selectedOperator);
        } else {
            for (let i = 0; i < this.outerDiv.children.length; i++) {
                if (this.outerDiv.children[i] != this.tabbar) {
                    this.outerDiv.children[i].remove();
                }
            }
            this.innerDivs = [];
            for (let i = 0; i < this.tabbar.children.length; i++) {
                this.tabbar.children[i].remove();
            }
            this.tabbar.appendChild(this.plus);
            this.tabspans = [];
            //Clear everything; reinstantiate topbar
            //show opselect if it does not already exist
            this.operators = [];
            this.tieOperator(new me.core.operator("opSelect", me));
            this.switchOperator(0);
        }
    }
    if (typeof XorY == 'object') this.fromSaveData(XorY);

    this.remove = function () {
        //signal my brother to promote itself
        if (this.parent) this.parent._remove(me.firstOrSecond, this);
    }
    this._remove = function (_firstOrSecond) {
        core.fire("updateView", {
            sender: me
        });
        //if remaining innerDiv has an operator, adopt it
        if (this.children[(!_firstOrSecond) * 1].operators && this.children[(!_firstOrSecond) * 1].operators.length) {
            for (let i = 0; i < this.children[(!_firstOrSecond) * 1].operators.length; i++) this.tieOperator(this.children[(!_firstOrSecond) * 1].operators[i]);
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

    this.activateTargets = function () {
        if (me.children && me.children.length) {
            me.children[0].activateTargets();
            me.children[1].activateTargets();
        } else {
            for (let i = 0; i < this.operators.length; i++) {
                this.operators[i].activateTargets();
            }
        }
    }
    this.deactivateTargets = function () {
        if (me.children && me.children.length) {
            me.children[0].deactivateTargets();
            me.children[1].deactivateTargets();
        } else {
            for (let i = 0; i < this.operators.length; i++) {
                this.operators[i].deactivateTargets();
            }
        }
    }

    this.getOperator = function (id) {
        let result = undefined;
        let iterable;
        if (this.operators) iterable = this.operators;
        else iterable = this.children;
        for (let i = 0; i < iterable.length; i++) {
            result = result || iterable[i].getOperator(id)
        }
        return result;
    }
    this.listOperators = function (list) {
        let iterable;
        if (this.operators) iterable = this.operators;
        else iterable = this.children;
        for (let i = 0; i < iterable.length; i++) {
            iterable[i].listOperators(list)
        }
    }
}