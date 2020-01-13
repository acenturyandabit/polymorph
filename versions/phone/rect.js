polymorph_core.newRect = function (parent) {
    let ID = polymorph_core.insertItem({
        _rd: {
            p: parent,
            f: RECT_FIRST_SIBLING,
            x: RECT_ORIENTATION_X,
            ps: 1
        }
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
            if (this.settings.p) return polymorph_core.rects[this.settings.p];
            else return polymorph_core;
        }
    })

    this.split = -1; // if this flag is >=0, on the next mousemove that reenters the box, the box will be split into 2 smaller boxes. 
    this.resizing = -1; // if this flag is >=0, on the next mousemove that reenters the box, the box will resize. 

    // Create the outerDiv: the one with the active borders.
    this.outerDiv = document.createElement("div");
    this.tieRect = function (id) {
        polymorph_core.rects[id].outerDiv = this.outerDiv;
    }
    this.tieContainer = function (id) {
        let ts = document.createElement('div');
        ts.innerText = polymorph_core.containers[id].settings.tabbarName;
        this.outerDiv.appendChild(ts);
        ts.dataset.containerid = id;
        ts.addEventListener("click", () => {
            polymorph_core.toggleMenu(false);
            Array.from(document.querySelectorAll("#body>*")).forEach(e => e.style.display = "none");
            document.querySelector(`#body>[data-container='${id}']`).style.display = "block";
            polymorph_core.currentOperator = id;
        })
        polymorph_core.containers[id].outerDiv.dataset.container = id;
        polymorph_core.containers[id].outerDiv.style.display = "none";
        document.querySelector("#body").appendChild(polymorph_core.containers[id].outerDiv);
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

    this.refresh = () => {
        //pick an arbitrary operator and focus it.. for now.
        let oneToFocus = Object.keys(polymorph_core.containers)[0];
        if (oneToFocus) {
            //if refresh called before container load, this happens :(
            polymorph_core.containers[oneToFocus].outerDiv.style.display = "block";
            polymorph_core.currentOperator = oneToFocus;
        }
    };
    this.toSaveData = () => { };
};