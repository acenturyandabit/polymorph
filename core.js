// Items are just native objects now 
function _core() {
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

    this.currentDoc = 0; // a getter fn that points to core.items._meta.

    //Document level functions
    //#region
    this.updateSettings = () => {
        document.body.querySelector(
            ".docName"
        ).innerText = this.items._meta.displayName;
        document.querySelector("title").innerHTML =
            this.items._meta.displayName + " - Polymorph";
        this.filescreen.saveRecentDocument(this.currentDocID, undefined, this.items._meta.displayName);
        this.fire("updateSettings");
    };

    let tc = new capacitor(1000, 10, () => {
        core.fire("updateDoc");
    })
    //title updates
    this.on("UIstart", () => {
        document.querySelector(".docName").addEventListener("keyup", () => {
            this.items._meta.displayName = document.body.querySelector(".docName").innerText;
            tc.submit();
            document.querySelector("title").innerHTML =
                this.items._meta.displayName + " - Polymorph";
        });
    })
    //#endregion

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

    //Garbage collection: TODO

    //insert an item.
    this.insertItem = (itm) => {
        let nuid = guid(6, this.items);
        this.items[nuid] = itm;
        return nuid;
    }
    //#endregion

    this.operatorLoadCallbacks = {};
    this.rectLoadCallbacks = {};

    //A shared space for operators to access
    this.shared = {};
}

var core = new _core();
