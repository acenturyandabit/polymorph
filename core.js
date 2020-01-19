// Items are just native objects now 
function _polymorph_core() {
    //Event API. pretty important, it turns out.
    addEventAPI(this);

    //Reallly low level user identification, etc.
    //#region
    this.saveUserData = () => {
        localStorage.setItem("pm_userData", JSON.stringify(this.userData));
    };

    this.userData = {
        documents: {}
    }

    Object.assign(this.userData, JSON.parse(localStorage.getItem("pm_userData")));
    //#endregion

    //we need to update userdata  to the latest version as necessary... 

    // Starting function: this is only called once
    this.start = () => {
        this.fire("UIsetup");
        this.fire("UIstart");
        this.resetDocument();
        this.loadDocument();
    }

    Object.defineProperty(this, "currentDoc", {
        get: () => {
            return this.items._meta;
        }
    })

    //Document level functions
    this.updateSettings = () => {
        this.documentTitleElement.innerText = this.items._meta.displayName;
        document.querySelector("title").innerHTML =
            this.items._meta.displayName + " - Polymorph";
        this.filescreen.saveRecentDocument(this.currentDocID, undefined, this.items._meta.displayName);
        this.fire("updateSettings");
    };

    let tc = new capacitor(1000, 10, () => {
        polymorph_core.fire("updateDoc");
    })
    //title updates
    this.on("UIstart", () => {
        if (!this.documentTitleElement) {
            this.documentTitleElement = this.topbar.add("titleElement", document.createElement("a"));
            this.documentTitleElement.contentEditable = true;
        }
        this.documentTitleElement.addEventListener("keyup", () => {
            this.items._meta.displayName = document.body.querySelector(".docName").innerText;
            tc.submit();
            document.querySelector("title").innerHTML =
                this.items._meta.displayName + " - Polymorph";
        });
    })

    //Operator registration
    //#region
    this.operators = {};
    this.registerOperator = (type, options, _constructor) => {
        if (_constructor) {
            this.operators[type] = {
                constructor: _constructor,
                options: options
            };
        } else {
            this.operators[type] = {
                constructor: options,
                options: {}
            };
        }
        this.fire("operatorAdded", {
            type: type
        });
        for (let i = 0; i < this.operatorLoadCallbacks[type]; i++) {
            this.operatorLoadCallbacks[type][i].op.fromSaveData(
                this.operatorLoadCallbacks[type][i].data
            );
        }
    };
    //#endregion

    //Item management
    //#region
    this.items = {};
    //TODO: regenerate garbaged IDs on fromSaveData
    this.garbagedIDs = [];

    //garbage collection
    this.tryGarbageCollect = (id) => {
        if (polymorph_core.items[id]._od || polymorph_core.items[id]._rd) return;//never delete rects and operators? this wont end well
        if (id == "_meta") return;//dont delete the metaitem
        let toDelete = true;
        for (let i in this.containers) {
            if (this.containers[i].operator.itemRelevant && this.containers[i].operator.itemRelevant(id)) {
                toDelete = false;
            }
        }
        if (toDelete) {
            //flag it for future reuse.
            polymorph_core.items[id] = { _lu_: Date.now() }
        }
    }

    this.on("__polymorph_core_deleteItem", (d) => {
        this.tryGarbageCollect(d.id);
    })

    this.on("updateItem", (d) => {
        if (!d.loadProcess) this.items[d.id]._lu_ = Date.now();
    })

    this.recreateGarbageList = () => {
        this.garbagedIDs = Object.keys(this.items).filter(i => Object.keys(this.items[i]).length == 1 && Object.keys(this.items[i])[0] == "_lu_");
    }

    //insert an item.
    this.insertItem = (itm) => {
        this.recreateGarbageList();
        let nuid = guid(6, this.items);
        if (this.garbagedIDs.length) {
            nuid = this.garbagedIDs.pop();
        }
        this.items[nuid] = itm;
        return nuid;
    }
    //#endregion

    this.operatorLoadCallbacks = {};
    this.rectLoadCallbacks = {};

    //A shared space for operators to access
    this.shared = {};
}

var polymorph_core = new _polymorph_core();
