// the UI is composed of RECTS. 
// a RECT can have another RECT or an OPERATOR in it.


/// PASS OPERATORS INSTEAD OF CONTENT DIVS

const RECT_ORIENTATION_X = 0;
const RECT_ORIENTATION_Y = 1;
const RECT_FIRST_SIBLING = 0;
const RECT_SECOND_SIBLING = 1;
const RECT_BORDER_WIDTH = 10;

function _rect(core, parent, XorY, pos, firstOrSecond, operators) {
    //Putting all the variables here for quick reference.
    this.parent = parent; // parent is either a DOM element or another rect.
    if (typeof XorY == 'object') {
        this.XorY = XorY.XorY; // XorY determines whether the split is in the X or the Y direction. 
        this.pos = XorY.pos; //if first, the size; otherwise position (and size);
        this.firstOrSecond = XorY.firstOrSecond;
    } else {
        this.XorY = XorY; // XorY determines whether the split is in the X or the Y direction. 
        this.pos = pos; //if first, the size; otherwise position (and size);
        this.firstOrSecond = firstOrSecond;
    }
    this.core = core;
    this.isRoot = false;
    this.outerDiv = undefined;
    this.children = [];
    this.split = -1; // if this flag is >=0, on the next mousemove that reenters the box, the box will be split into 2 smaller boxes. 
    this.resizing = -1; // if this flag is >=0, on the next mousemove that reenters the box, the box will resize. 
    let me = this;

    //Determine whether the item is a root item.
    if (!this.parent.core) {
        this.isRoot = true;
    } else {
        this.parentRect = this.parent;
    }

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
        let tyname = document.createElement("span");
        let tybtn = document.createElement("button");
        let tygear = document.createElement("img");
        tybtn.style.cssText = `color:red;font-weight:bold; font-style:normal`;
        tybtn.innerText = 'x';
        tygear.src = "assets/gear.png";
        tygear.style.cssText = "width: 1em; height:1em;"
        tyspan.style.border = "1px solid black";
        tyspan.appendChild(tyname);
        tyspan.appendChild(tybtn);
        tyspan.appendChild(tygear);
        return tyspan;
    }

    //Function for adding an operator to this rect. Operator must already exist.
    this.tieOperator = function (operator) {
        if (!this.operators) this.operators = [];
        if (!this.operators.includes(operator)) {
            this.operators.push(operator);
            //Create a button for it
            this.tabspans.push(this.createTypeName());
            this.tabspans[this.tabspans.length - 1].querySelector("span").innerText = operator.type;
            this.tabbar.insertBefore(this.tabspans[this.tabspans.length - 1], this.plus);
            //Create a tab for it
            this.innerDivs.push(this.createInnerDiv());
            //Hook it up
            this.innerDivs[this.innerDivs.length - 1].appendChild(operator.topdiv);
            this.outerDiv.appendChild(this.innerDivs[this.innerDivs.length - 1]);
        } else {
            this.tabspans[this.operators.indexOf(operator)].querySelector("span").innerText = operator.type;
            //just refresh the tabspan.
        }
        operator.rect = this;
    }

    //Callback for tab clicks to switch between operators.
    this.switchOperator = function (index) {
        this.selectedOperator = index;
        for (let i = 0; i < this.innerDivs.length; i++) {
            this.innerDivs[i].style.display = "none";
        }
        if (this.innerDivs[index]) this.innerDivs[index].style.display = "block";
        if (this.operators[index] && this.operators[index].baseOperator.resize)this.operators[index].baseOperator.resize();
    }

    // The actual tabbar.
    this.tabbar = document.createElement("p");
    this.tabbar.style.cssText = `displaparentElementy:block;margin:0; width:100%;background:white`
    this.plus = document.createElement("button");
    this.plus.style.cssText = `color:blue;font-weight:bold; font-style:normal`;
    this.plus.innerText = "+";
    this.tabbar.appendChild(this.plus);
    this.plus.addEventListener("click", () => {
        this.tieOperator(new core.operator("opSelect", this));
        this.switchOperator(this.operators.length - 1);
    })
    //Delegated operator switching
    this.tabbar.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() == 'span') {
            let ptg=e.target;
            if (ptg.parentElement.tagName.toLowerCase()=='span')ptg=ptg.parentElement;
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

    this.selectedOperator = 0;
    //And a delegated settings button handler
    this.tabbar.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() == "img") {
            this.operators[this.selectedOperator].baseOperator.showSettings();
        }
    })
    this.outerDiv.appendChild(this.tabbar);

    // Generate placeholder content if no content is provided.
    if (operators) {
        for (let i = 0; i < operators.length; i++) this.tieOperator(operators[i]);
        this.switchOperator(0);
    } else {
        this.tieOperator(new core.operator("opSelect", this));
        this.switchOperator(0);
    }

    //handle a resize event.
    this.resize = function () {
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
            me.outerDiv.style.border = "none"; // verify border removal
            //hide other items
            me.tabbar.style.display = "none";
            this.children[0].resize();
            this.children[1].resize();
        } else {
            if (this.operators) {
                for (let i = 0; i < this.operators.length; i++) {
                    if (this.operators[i].baseOperator.resize) this.operators[i].baseOperator.resize();
                }
            }
            me.tabbar.style.display = "block";
            me.outerDiv.style.border = RECT_BORDER_WIDTH + "px white solid";
        }
        core.fire('resize',{sender:this});
    }
    let rectChanged=false;
    //Make draggable borders.
    this.outerDiv.style.border = RECT_BORDER_WIDTH + "px white solid";
    // If parent is body, ensure loaded, so we can create a new rect whenever.
    if (this.isRoot) {
        parent.appendChild(me.outerDiv);
    } else {
        parent.outerDiv.appendChild(this.outerDiv);
    }
    this.resize();
    //events
    this.mouseMoveHandler = function (e) {
        let inOrOut = [false, false, false, false];
        let borders = ['left', 'right', 'top', 'bottom'];
        //reset all border colors
        if (!me.children.length) {
            me.outerDiv.style.border = RECT_BORDER_WIDTH + "px white solid";
        } else {
            me.outerDiv.style.border = "";
        }
        //Parsing the event

        if (!me.isRoot) {
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
                if (!me.children.length) me.outerDiv.style["border-" + borders[dirn]] = RECT_BORDER_WIDTH + "px red solid";
            }
            if (me.split != -1 && me.split != dirn) {
                if (!(e.buttons % 2)) {
                    me.split = -1;
                    e.preventDefault();
                    //reset and return
                    return;
                }
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
                rectChanged=true;
                me.operators = undefined;
                me.children[_firstOrSecond].resizing = me.split;
                me.split = -1;
                //move the operator into the new box; create a blank box; set this box to a nonprimary box
            }
            //for resizing
            if (me.resizing != -1) {
                if (!(e.buttons % 2)) {
                    me.resizing = -1;
                    e.preventDefault();
                    //reset and return
                    return;
                }
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
                me.parentRect.children[!me.firstOrSecond * 1].pos = me.pos;
                me.resize();
                me.parentRect.children[!me.firstOrSecond * 1].resize();
                e.preventDefault();
                rectChanged=true;
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
        if (rectChanged){
            core.fire("viewUpdate",{sender:me});
            rectChanged=false;
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
            me.resizing = dirn;
        } else {
            me.split = dirn;
        }

    })
    ///Saving
    let toSaveProperties = ['XorY', 'firstOrSecond', 'pos'];
    this.toSaveData = function () {
        let obj = {};
        if (this.operators) {
            obj.operators = [];
            for (let i = 0; i < this.operators.length; i++) obj.operators.push(this.operators[i].toSaveData());
            obj.selectedOperator = this.selectedOperator;
        }
        for (let i = 0; i < toSaveProperties.length; i++) {
            obj[toSaveProperties[i]] = this[toSaveProperties[i]];
        }
        if (this.children.length) {
            obj.children = [this.children[0].toSaveData(), this.children[1].toSaveData()];
        }
        return obj;
    }
    this.fromSaveData = function (obj) {
        //children first!
        if (!obj)return;
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

            for (let i = 0; i < obj.operators.length; i++) {
                let op=new me.core.operator(obj.operators[i], me)
                this.tieOperator(op);
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
        this.resize();
    }
    if (typeof XorY == 'object') this.fromSaveData(XorY);

    this.remove = function () {
        //signal my brother to promote itself
        this.parentRect._remove(me.firstOrSecond);
    }
    this._remove = function (_firstOrSecond) {
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
            this.children[0].parentRect = this;
            this.children[1].parentRect = this;
        }
        //delete this.children[0];
        //delete this.children[1];
        this.resize();
        this.switchOperator(0);
    }
}