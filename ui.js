// the UI is composed of RECTS. 
// a RECT can have another RECT or an OPERATOR in it.


/// PASS OPERATORS INSTEAD OF CONTENT DIVS

const RECT_ORIENTATION_X = 0;
const RECT_ORIENTATION_Y = 1;
const RECT_FIRST_SIBLING = 0;
const RECT_SECOND_SIBLING = 1;
const RECT_BORDER_WIDTH = 10;

function _rect(core, parent, XorY, pos, firstOrSecond, operator) {
    //Putting all the variables here for quick reference.
    this.parent = parent; // parent is either a CSS Query String or another rect.
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

    //Handle the parent in general
    if (typeof (this.parent) == "string") {
        this.isRoot = true;
    } else {
        this.parentRect = this.parent;
    }

    // Create the innerDiv
    this.outerDiv = document.createElement("div");
    this.outerDiv.style.position = "absolute ";
    this.outerDiv.style["box-sizing"] = "border-box";
    this.outerDiv.style.height = "100%";
    this.outerDiv.style.width = "100%";
    this.outerDiv.style.overflow = "hidden";
    this.outerDiv.style.display = "flex";
    this.outerDiv.style['flex-direction'] = "column";
    this.outerDiv.style.background = "lightgrey";

    this.innerDiv = document.createElement("div");
    this.innerDiv.style.height = "100%";
    this.innerDiv.style.width = "100%";
    this.innerDiv.style.overflow = "hidden";
    this.innerDiv.style.background = "lightgrey";
    this._typeName = document.createElement("p");
    this.typeName = document.createElement("span");;
    this._typeName.style.cssText = `display:block;margin:0; width:100%;background:white`
    this.cross = document.createElement("button");
    this.cross.addEventListener("click", () => {
        me.remove()
    })
    this.cross.style.cssText = `color:red;font-weight:bold; font-style:normal`;
    this.cross.innerHTML = "x";
    this._typeName.appendChild(this.typeName);
    this.settingsgear=document.createElement("img");
    this.settingsgear.src="assets/gear.png";
    this.settingsgear.style.cssText="width: 1em; height:1em;"
    this.settingsgear.addEventListener("click",()=>{
        this.operator.baseOperator.showSettings();
    })
    this._typeName.appendChild(this.settingsgear);
    this._typeName.appendChild(this.cross);
    this.outerDiv.appendChild(this._typeName);
    this.outerDiv.appendChild(this.innerDiv);



    this.refreshBlankScreen = function (recursive) {
        if (!this.operator) {
            this.innerDiv.innerHTML = "";
            this.blankinnerDiv = document.createElement("div");
            this.blankinnerDiv.style.height = "100%";
            this.blankinnerDiv.style.width = "100%";
            this.blankinnerDiv.overflow = "hidden";
            this.blankinnerDiv.style.background = "lightgrey";
            let _innerHTML = `<h1>Select a view</h1>`
            this.blankinnerDiv.innerHTML = _innerHTML;
            for (let i in core.operators) {
                let b = document.createElement("button");
                b.innerHTML = i;
                b.addEventListener("click", () => {
                    me.operator = new core.operator(b.innerHTML, me);
                })
                this.blankinnerDiv.appendChild(b);
            }
            this.innerDiv.appendChild(this.blankinnerDiv);
        }
        if (recursive && this.children.length > 0) {
            this.children[0].refreshBlankScreen();
            this.children[1].refreshBlankScreen();
        }
    }

    // Generate placeholder content if no content is provided.
    if (operator) {
        this.operator = operator;
        operator.setParent(this);
    } else {
        this.refreshBlankScreen();
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
            me._typeName.style.display = "none";
            this.children[0].resize();
            this.children[1].resize();
        }else{
            me._typeName.style.display = "block";
            me.outerDiv.style.border = RECT_BORDER_WIDTH + "px white solid";
        }
    }

    //Make draggable borders.
    this.outerDiv.style.border = RECT_BORDER_WIDTH + "px white solid";
    // If parent is body, ensure loaded, so we can create a new rect whenever.
    function appendToParentString() {
        parent = document.body.querySelector(parent);
        parent.appendChild(me.outerDiv);
        me.resize();
    }
    if (this.isRoot) {
        if (document.readyState != "loading") appendToParentString();
        else document.addEventListener("DOMContentLoaded", appendToParentString);
    } else {
        parent.innerDiv.appendChild(this.outerDiv);
        this.resize();
    }
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
                // a split has been called. Initialise the split!
                me.outerDiv.style.border = "none";
                me._typeName.style.display = "none";
                me.outerDiv.appendChild(me.innerDiv);
                let _XorY = (me.split > 1) * 1;
                let _firstOrSecond = me.split % 2;
                if (_firstOrSecond) {
                    me.children = [new _rect(core, me, _XorY, 1, 0, me.operator), new _rect(core, me, _XorY, 1, 1)];
                } else {
                    me.children = [new _rect(core, me, _XorY, 0, 0), new _rect(core, me, _XorY, 0, 1, me.operator)];
                }
                me.operator=undefined;
                me.children[_firstOrSecond].resizing = me.split;

                me.split = -1;
                //move the operator into the new box; create a blank box; set this box to a nonprimary box
            }
            if (me.resizing != -1) {
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
            }
        }

    }

    this.outerDiv.addEventListener("mousemove", this.mouseMoveHandler);

    this.mouseUpHandler = function (e) {
        me.resizing = -1;
        if (me.children.length > 0) {
            me.children[0].mouseUpHandler(e);
            me.children[1].mouseUpHandler(e);
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
        if (this.operator) obj.operator = this.operator.toSaveData();
        for (let i = 0; i < toSaveProperties.length; i++) {
            obj[toSaveProperties[i]] = this[toSaveProperties[i]];
        }
        if (this.children.length) {
            obj.children = [this.children[0].toSaveData(), this.children[1].toSaveData()];
        }
        return obj;
    }
    this.fromSaveData = function (obj) {
        if (obj.operator) this.operator = new me.core.operator(obj.operator, me);
        else {
            for (let i = 0; i < toSaveProperties.length; i++) {
                this[toSaveProperties[i]] = obj[toSaveProperties[i]];
            }
            if (obj.children) {
                me.innerDiv.innerHTML = "";
                this.children = [new _rect(core, this, obj.children[0]), new _rect(core, this, obj.children[1])];
            }
            this.resize();
        }
    }
    if (typeof XorY == 'object') this.fromSaveData(XorY);

    this.remove = function () {
        //signal my brother to promote itself
        this.parentRect._remove(me.firstOrSecond);
    }
    this._remove = function (_firstOrSecond) {
        //if remaining innerDiv has an operator, adopt it
        this.operator = this.children[(!_firstOrSecond) * 1].operator;
        if (this.operator) {
            this.operator.setParent(this);
            this.children = [];
        } else {
            //otherwise adopt the children
            this.children = this.children[(!_firstOrSecond) * 1].children;
            while (this.innerDiv.firstChild) {
                this.innerDiv.removeChild(this.innerDiv.firstChild);
            }
            if (this.children.length) {
                //kick out the old children and in with the new   
                this.children[0].parentRect = this;
                this.children[1].parentRect = this;
                this.innerDiv.appendChild(this.children[0].outerDiv);
                this.innerDiv.appendChild(this.children[1].outerDiv);
            }
        }

        //delete this.children[0];
        //delete this.children[1];
        this.resize();
    }
}