/*
Data storage reference
core.currentDoc={
    views:{rect:rectData},
    items:[],
    displayName: "whatever"
}

core.userData={
    uniqueStyle=some style
}

*/

// Items are just native objects now 
function _core() {
    let me = this;
    //Event API. pretty important, it turns out.
    addEventAPI(this);
    //call the dialog manager
    dialogSystemManager(this);
    ///////////////////////////////////////////////////////////////////////////////////////
    //Reallly low level user identification, etc.
    this.saveUserData = function () {
        localStorage.setItem("pm_userData", JSON.stringify(me.userData));
    };
    this.userData = JSON.parse(localStorage.getItem("pm_userData"));
    if (!me.userData) {
        let rc = randCSSCol();
        me.userData = {
            uniqueStyle: {
                background: rc,
                color: matchContrast(rc)
            },
            id: guid(10),
        };
    }
    if (!me.userData.introductions) {
        me.userData.introductions = {};
    }
    if (!me.userData.documents) {
        me.userData.documents = {};
    }
    if (!me.userData.id) {
        me.userData.id = me.userData.alias || guid(10);
    }
    if (!me.userData.version) {
        me.userData.version = "0.1";
        for (i in me.userData.documents) {
            me.userData.documents[i] = {
                saveSources: me.userData.documents[i],
                autosave: me.userData.documents[i].autosave
            }
        }
    } if (me.userData.version == "0.1") {
        me.userData.version = "0.2";
        for (i in me.userData.documents) {
            me.userData.documents[i].saveHooks = {};
            for (j in me.userData.documents[i].saveSources) {
                me.userData.documents[i].saveHooks[j] = true;
            }
        }
    }
    if (me.userData.version == "0.2") {
        me.userData.version = "0.3";
        for (i in me.userData.documents) {
            if (me.userData.documents[i].saveHooks) {
                me.userData.documents[i].saveSources = Object.keys(me.userData.documents[i].saveHooks);
                delete me.userData.documents[i].saveHooks;
            }
            me.userData.documents[i].v = 2;

        }
    }
    me.saveUserData();

    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Starting function: this is only called once
    me.start = function () {
        me.isNewDoc = true;
        me.fire("UIsetup");
        me.fire("UIstart");
        me.resetDocument();
        me.loadDocument();
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //Accept loading sources; default is local saving.


    /*
        //generate a URL which will allow another user to access the file, if it is registered to a firebase.
        function generateSelfURL() {
            if (!me.firebase) return "";
            return window.location.hostname + window.location.pathname + "?doc=" + me.currentDoc.firebaseDocName + "&f=" + me.currentDoc.firebaseDocName;
        }
    */
    ///////////////////////////////////////////////////////////////////////////////////////
    //Document level functions

    this.updateSettings = function () {
        document.body.querySelector(
            ".docName"
        ).innerText = this.currentDoc.displayName;
        document.querySelector("title").innerHTML =
            this.currentDoc.displayName + " - Polymorph";
        if (!core.isNewDoc) me.filescreen.saveRecentDocument(me.currentDocID, undefined, me.currentDoc.displayName);
        me.fire("updateSettings");
    };

    let tc = new capacitor(1000, 10, () => {
        core.fire("updateDoc");
    })

    ///////////////////////////////////////////////////////////////////////////////////////
    //Operator conveinence functions
    //items
    this.operators = {};
    this.operatorLoadCallbacks = {};
    this.registerOperator = function (type, options, _constructor) {
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
        me.fire("operatorAdded", {
            type: type
        });
        for (let i = 0; i < this.operatorLoadCallbacks[type]; i++) {
            this.operatorLoadCallbacks[type][i].op.reload(
                this.operatorLoadCallbacks[type][i].data
            );
        }
    };
    //live operators
    this.getOperator = function (id) {
        return me.baseRect.getOperator(id);
    }
    this.listOperators = function () {
        let list = [];
        me.baseRect.listOperators(list);
        return list;
    }
    ///////////////////////////////////////////////////////////////////////////////////////
    //Item management
    this.items = {};
    me.itemShouldBeDeleted = false;
    me.cetch("updateItem", (args, stat) => {
        if (me.itemShouldBeDeleted && stat == undefined && args == true) me.itemShouldBeDeleted = false;
    }); //dont delete if someone still cares

    //Handling delete item.
    this.on("deleteItem", d => {
        me.itemShouldBeDeleted = true;
        me.fire("updateItem", {
            id: d.id
        });
        if (me.itemShouldBeDeleted) {
            delete core.items[d.id];
            me.fire("deletedItem", {
                id: d.id
            });
        }
    });

    //insert an item.
    this.insertItem = function (itm) {
        let nuid;
        do {
            nuid = guid();
        } while (this.items[nuid]);
        this.items[nuid] = itm;
        //originally this would style an item if we were online... whelp
        /*
        if (this.firebase) {
            if (!me.userData.uniqueStyle) {
              let rc = randCSSCol();
              me.userData.uniqueStyle = {
                background: rc,
                color: matchContrast(rc)
              };
              me.saveUserData();
            }
            this.items[nuid].style = me.userData.uniqueStyle;
          }*/
        return nuid;
    }

    this.standardiseItem = function (itm) {
        //Clean items to follow established standards here. Ideally dont do too much but sometimes necessary.
        if (core.items[itm].links) {
            //bidirectional links upgrade
            if (!core.items[itm].to) core.items[itm].to = {};
            for (let i in core.items[itm].links) {
                if (!core.items[i].to) core.items[i].to = {};
                core.items[i].to[itm] = true;
                core.items[itm].to[i] = true;
            }
            delete core.items[itm].links;
        }
    }

    this.isLinked = function (A, B) {
        let ret = 0; //unlinked
        if (core.items[A].to && core.items[A].to[B]) {
            ret = ret + 1;// 1: there is a link FROM A to B
        }
        if (core.items[B].to && core.items[B].to[A]) {
            ret = ret + 2;// 2: there is a link FROM B to A
        }
        return ret;
    }

    this.link = function (A, B, undirected = false) {
        core.items[A].to = core.items[A].to || {};
        core.items[A].to[B] = core.items[A].to[B] || true;
        if (undirected) {
            this.link(B, A);
        }
    }
    this.unlink = function (A, B, undirected = false) {
        core.items[A].to = core.items[A].to || {};
        delete core.items[A].to[B];
        if (undirected) {
            this.unlink(B, A);
        }
    }

    //title updates
    me.on("UIstart", () => {
        document.querySelector(".docName").addEventListener("keyup", () => {
            me.currentDoc.displayName = document.body.querySelector(".docName").innerText;
            tc.submit();
            document.querySelector("title").innerHTML =
                me.currentDoc.displayName + " - Polymorph";
        });
    })
    ///////////////////////////////////////////////////////////////////////////////////////
    // targeter
    this.targeter = undefined;
    this.dialoghide = false;
    this.submitTarget = function (id) {
        if (me.targeter) {
            me.targeter(id); //resolves promise
            me.targeter = undefined;
            //untarget everything
            me.baseRect.deactivateTargets();
            if (this.dialoghide) {
                me.dialog.div.style.display = "block";
                this.dialoghide = false;
            }
        }
    }
    this.target = function () {
        // activate targeting
        me.baseRect.activateTargets();
        if (me.dialog.div.style.display == "block") {
            this.dialoghide = true;
            me.dialog.div.style.display = "none";
        }
        let promise = new Promise((resolve) => {
            me.targeter = resolve;
        })
        return promise;
    }
    //use:
    /*
    core.target().then(senderID){
  
    }
    */
    //a little nicety to warn user of unsaved items.
    this.unsaved = false;
    me.on("updateView,updateItem", (e) => {
        if (!e || !e.load) {//if event was not triggered by a loading action
            me.unsaved = true;
        }
    })
    window.addEventListener("beforeunload", (e) => {
        if (me.unsaved) {
            e.preventDefault();
            e.returnValue = "Hold up, you seem to have some unsaved changes. Are you sure you want to close this window?";
        }
    })

    ///////////////////////////////////////////////////////////////
    //More useful bits

    //A shared space for operators to access
    this.shared = {};
    this.resetDocument = function () {
        me.documentIsClean = true;
        me.items = {};
        me.resetView();
        me.baseRect.refresh();
    }

    //Merging
    me.tryMerge = function () {
        //cry for now
    }
}

var core = new _core();


// save source example:
// cases:
// user save
// autosave
// remote update