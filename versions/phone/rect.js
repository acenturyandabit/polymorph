function _rect(polymorph_core, parent, data) {
    //Putting all the variables here for quick reference.
    this.parent = parent; // parent is either a DOM element or another rect. The DOM element is the one in the sidebar that contains the label for the operators.
    this.polymorph_core = polymorph_core; // allows us to load even if there is no other stuff around.
    this.isRoot = !((this.parent) && true); // if parent is not a rect, then this is a root rect.
    this.children = [];
    let me = this;
    //manage the internal object if we are importing from e.g. a desktop file
    this.intlobj = {};
    this.outerDiv = document.createElement("div");

    this.split = function () {
        // if i have children, delegate the task to my children
        if (me.children.length) {
            me.children[0].split();
            return;
        }
        //otherwise, create and tie a new operator
        let newop = new polymorph_core.container("opSelect", me);
        me.operators.push(newop);
        me.tieOperator(newop);
    }

    this.removeOperator = function (op) {
        for (i = 0; i < me.operators.length; i++) {
            if (me.operators[i] == op) {
                me.operators.splice(i, 1);
                polymorph_core.fire("updateView", { sender: me });
                break;
            }
        }
    }

    this.tieOperator = function (op, rectponsible) {
        if (!rectponsible) rectponsible = me;
        if (!me.isRoot) {
            me.parent.tieOperator(op, rectponsible);
        } else {
            if (!op.tab) {
                // create a div for it
                let d = document.createElement('div');
                d.innerHTML = `<p><span>${op.settings.tabbarName}</span><button class="remove">X</button></p>`
                // add the name to the list.
                me.outerDiv.insertBefore(d, me.outerDiv.children[me.outerDiv.children.length - 1]);
                d.addEventListener("click", (e) => {
                    if (d.children[0].contains(e.target)) {
                        if (e.target.matches("button.remove")) {
                            //deregister the operator
                            d.remove();
                            rectponsible.removeOperator(op);
                        } else {
                            polymorph_core.toggleMenu(false);
                            polymorph_core.showOperator(op);
                        }
                    }
                })
                op.tab = d;
            } else {
                op.tab.children[0].innerText = op.settings.tabbarName;
            }
        }
    }
    this.getOperatorPath = function (op) {
        if (!op) op = polymorph_core.currentOperator;
        if (me.operators) {
            for (let i = 0; i < me.operators.length; i++) {
                if (me.operators[i] == op) return i;
                else if (me.operators[i].operator.getOperatorPath) {
                    if (me.operators[i].operator.getOperatorPath(op) != -1) return i;
                }
            }
        } else if (me.children) {
            for (let i = 0; i < me.children.length; i++) {
                if (me.children[i].getOperatorPath(op) != -1) return i;
            }
        }
        return -1; // not found
    }

    ///Saving
    this.toSaveData = function () {
        //check that the internal object is viable; i.e. all the xory, firstorsecond and pos exist
        if (!me.intlobj.XorY) {
            //if they don't, set some defaults
            me.intlobj.XorY = 0;
            me.intlobj.pos = 0;
            me.intlobj.firstOrSecond = 1;
        }
        if (me.operators) {
            me.intlobj.operators = [];
            for (let i = 0; i < me.operators.length; i++) {
                od = me.operators[i].toSaveData();
                me.intlobj.operators.push({
                    name: od.tabbar,
                    opdata: od
                });
            }
            me.intlobj.selectedOperator = me.selectedOperator;
        } else if (me.children.length) {
            me.intlobj.children = [me.children[0].toSaveData(), me.children[1].toSaveData()];
        }
        //find a 'path' to the currently focused operator
        let path = me.getOperatorPath();
        me.intlobj.path = path;

        me.intlobj = transcopy(me.intlobj, {
            remap: {
                "XorY": "x",
                "firstOrSecond": "f",
                "operators": "o",
                "pos": "p",
                "selectedOperator": "s",
                "children": "c"
            }
        })
        return me.intlobj;
    }

    this.fromSaveData = function (obj) {
        //children first!
        if (!obj) return;
        if (!obj.x) {
            //this is a new object... generate it
            Object.assign(obj, {
                x: 0,
                p: 0,
                f: 1,
            })
        }
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
        me.intlobj = obj;
        if (obj.path) me.pathBias = obj.path;
        if (obj.children) {
            //children are not recognised formally in phone mode, but to preserve the data structure, we honor this and create a new rect in memory.
            me.children = [new _rect(polymorph_core, me, obj.children[0]), new _rect(polymorph_core, me, obj.children[1])];
        } else if (obj.operators) {
            if (!me.operators) me.operators = [];
            for (let i in obj.operators) {
                //create the operator
                let newop = new polymorph_core.container(obj.operators[i].opdata, me);
                me.operators.push(newop);
                me.tieOperator(newop);
            }
        } else {
            //do nothing. The next non-phone version will take care of it....
        }
    }
    if (data) this.fromSaveData(data);
    this.refresh = function () {
        let path = -1;
        if (me.pathBias != undefined) {
            if (me.pathBias == -1) return;
            path = me.pathBias;
            delete me.pathBias;
        }
        if (path == -1 || path == undefined) path = 0;
        if (me.children && me.children.length) {
            me.children[path].refresh();
        } else if (me.operators) {
            polymorph_core.showOperator(me.operators[path]);
        } else {
            if (!me.operators) me.operators = [];
            let newop = new polymorph_core.container('opSelect', me);
            me.operators.push(newop);
            me.tieOperator(newop);
            polymorph_core.showOperator(newop);
        }
    }
}