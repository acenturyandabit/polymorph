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


function _item() {
    return {};
}

// Items are just native objects now 
function _core() {
    let me = this;
    this.tutorial = new _tutorial();
    readyTutorial(this);
    //Event API. pretty important, it turns out.
    addEventAPI(this);
    //call the dialog manager
    dialogSystemManager(this);


    function resetDocument() {
        me.items = {};
        documentReady(() => {
            document.body.querySelector(".rectspace").innerHTML = "";
            me.baseRect = new _rect(me,
                document.body.querySelector(".rectspace"),
                RECT_ORIENTATION_X,
                0,
                1);
        });
    }

    resetDocument();
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
            alias: guid(10),
        };
        me.saveUserData();
    }
    if (!me.userData.introductions) {
        me.userData.introductions = {};
    }
    ///////////////////////////////////////////////////////////////////////////////////////
    //Accept loading sources; default is local saving.

    //bye queryloaderrr you basically do nothing cry
    document.addEventListener("DOMContentLoaded", () => {
        let params = new URLSearchParams(window.location.search);
        if (params.has("doc")) {
            loadFromURL(params);
        }else if (p.entries.length){
            //try each save source to see if it can handle this kind of request
            for (let i in me.saveSources){
                if (me.saveSources[i].canHandle && me.saveSources[i].canHandle(params)){
                    //TODO: put a try catch around here.
                    userLoad(i,params);
                    break;
                }
            }
        } else {
            me.filescreen.showSplash();
        }
    })


    this.saveSources = [];

    this.registerSaveSource = function (id, f) {
        me.saveSources[id] = new f(core);
        //also register its settings in the save dialog
        if (me.saveSources[id].dialog) me.loadInnerDialog.appendChild(me.saveSources[id].dialog);
    }

    function loadFromURL(params) { // very first load
        //screw the id, we just gonna use urlparams straight up

        let source = params.get("src") || 'lf';
        let id = params.get("doc");
        userLoad(source, id, true);
    }

    function userLoad(source, id, initial = false) { // direct from URL
        //reset
        resetDocument();
        if (me.saveSources[source]) {
            me.currentDocName = id;
            //put up a wall
            document.querySelector(".wall").style.display = "block";


            //load from loadsource
            me.saveSources[source].pullAll(id).then((d) => {
                document.querySelector(".wall").style.display = "none";
                let params = new URLSearchParams(window.location.search);
                if (!d) {
                    d = {
                        displayName: id,
                        saveSources: {},
                        currentView: "default",
                        views: {},
                        items: {}
                    }
                    if (!params.has("auto")) {
                        d.displayName = id;
                    } else {
                        d.displayName = "New Workspace"
                    }
                    d.saveSources[source] = id;
                    /*if (!tutorialStarted) {
                        core.tutorial.start();
                    }*/
                }
                //reconcile that particular save source within the copy of the document
                d.saveSources = d.saveSources || {}; //neat instadeclare!
                d.saveSources[source] = id;
                me.fromSaveData(d);
                me.filescreen.saveRecentDocument(id, undefined, me.currentDoc.displayName);
                let tutorialStarted = false;
                if (params.has("view")) {
                    me.currentDoc.currentView = params.get("view");
                } else if (!me.currentDoc.currentView) me.currentDoc.currentView = "default";
                if (params.has("t")) {
                    core.tutorial.start(params.get("t"));
                    tutorialStarted = true;
                }
                for (let i in d.saveSources) {
                    if (me.saveSources[i]) {
                        if (me.saveSources[i].hook) me.saveSources[i].hook(d.saveSources[i]);
                    } else {
                        console.log("Warning - The save source " + i + " is not available on this computer. Some saving functions may be disabled.");
                    }
                }
                //ensure that other save sources are appropriately registered.
            });

        } else if (initial) {
            console.log("Warning - no save source could be identified. Falling back to localforage...");
            userLoad("lf", id);
            return;
        }
    }
    this.userLoad = userLoad;

    this.fromSaveData = function (data) {
        //load metadata, including views
        resetDocument();
        this.currentDoc = data;
        this.items = data.items;
        if (!this.currentDoc.currentView) this.currentDoc.currentView = Object.keys(this.currentDoc.views)[0];
        this.presentView(this.currentDoc.currentView);
        this.baseRect.resize();
        for (let i in this.items) {
            this.fire("updateItem", {
                id: i
            });
        }
        this.updateSettings();
        me.unsaved = false;
    }

    this.toSaveData = function () {
        //patch current doc
        me.currentDoc.views[me.currentDoc.currentView] = me.baseRect.toSaveData();
        //clean up
        for (let i in me.items) {
            me.itemShouldBeDeleted = true;
            me.fire("updateItem", {
                id: i
            });
            if (me.itemShouldBeDeleted) {
                delete core.items[i];
            }
        }
        //patch items
        me.currentDoc.items = me.items;
        //save to all sources
        //upgrade older save systems
        return me.currentDoc;
    }

    this.userSave = function () {
        //save to all sources
        //upgrade older save systems
        let d = me.toSaveData();
        me.filescreen.saveRecentDocument(me.currentDocName, undefined, me.currentDoc.displayName);
        if (!me.currentDoc.saveSources) {
            me.currentDoc.saveSources = {
                lf: me.currentDocName
            };
        }
        for (let i in me.currentDoc.saveSources) {
            me.saveSources[i].pushAll(me.currentDoc.saveSources[i], d);
        }
    }

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
        me.filescreen.saveRecentDocument(me.currentDocName, undefined, me.currentDoc.displayName);
        me.fire("updateSettings");
    };

    let tc = new capacitor(1000, 10, () => {
        core.fire("updateDoc");
    })
    documentReady(() => {
        document.querySelector(".docName").addEventListener("keyup", () => {
            me.currentDoc.displayName = document.body.querySelector(".docName").innerText;
            tc.submit();
            document.querySelector("title").innerHTML =
                me.currentDoc.displayName + " - Polymorph";
        })
    })

    ///////////////////////////////////////////////////////////////////////////////////////
    //View level functions

    this.presentView = function (view) {
        //reset and present a view
        document.body.querySelector(".rectspace").innerHTML = "";
        //Regenerate rects
        this.baseRect = new _rect(
            this,
            document.body.querySelector(".rectspace"),
            RECT_ORIENTATION_X,
            0,
            1
        );
        this.baseRect.fromSaveData(me.currentDoc.views[view]);
        this.baseRect.pos = 0;
        this.baseRect.firstOrSecond = 1;
        //set user's current view
        me.currentDoc.currentView = view;
        me.saveUserData();
        for (let i in me.items) {
            me.fire("updateItem", {
                id: i
            });
        }
    };

    ///////////////////////////////////////////////////////////////////////////////////////
    //rect level functions

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
            this.operatorLoadCallbacks[type][i].op.load(
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
            me.fire("deletedItem",{id:d.id});
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

    ///////////////////////////////////////////////////////////////////////////////////////
    //UI handling

    //Instantiate filemanager
    this.filescreen = new _filescreen({
        headprompt: htmlwrap(`
    <h1>Welcome to Polymorph!</h1>
    <h2>Organise your work, your way.</h2>
    <button class="gstd"><h1>Get started!</h1></button>
    `, "div"),
        formats: [{
                prompt: "Make a new local (offline) document"
            },
            {
                prompt: "Make a new shared (online) document",
                queryParam: (id) => {
                    return "src=fb";
                }
            }
        ],
        tutorialEnabled: false,
        savePrefix: "polymorph"
    });

    this.filescreen.baseDiv.querySelector("button.gstd").addEventListener("click", () => {
        // create a new workspace, then load it
        window.location.href += "?doc=" + guid(7) + "&src=lf";
    })

    ///////////////////////////////////////////////////////////////////////////////////////
    //Top bar
    let tbman = new _topbarManager();
    tbman._init();
    //select the topbar
    document.addEventListener("DOMContentLoaded", function () {
        let t = document.querySelector(".banner");
        tbman.checkTopbars(t);
    });
    tbman.checkTopbars();

    loadDialog = document.createElement("div");
    loadDialog.classList.add("dialog");
    loadDialog = dialogManager.checkDialogs(loadDialog)[0];

    this.loadInnerDialog = document.createElement("div");
    loadDialog.querySelector(".innerDialog").appendChild(this.loadInnerDialog);
    this.loadInnerDialog.innerHTML = `
          <h1>Load/Save settings</h1>
          `;
    let autosaveOp = new _option({
        div: this.loadInnerDialog,
        type: "bool",
        object: () => {
            return me.currentDoc
        },
        property: "autosave",
        label: "Autosave all changes"
    });
    documentReady(() => {
        document.body.appendChild(loadDialog);
        document.querySelector(".saveSources").addEventListener("click", () => {
            for (let i in me.saveSources)
                if (me.saveSources[i].readyDialog) me.saveSources[i].readyDialog();
            autosaveOp.load();
            loadDialog.style.display = "block";
        });
    });
    //----------Autosave----------//
    let autosaveCapacitor = new capacitor(200, 20, me.userSave);
    this.on("updateItem", function (d) {
        if (me.currentDoc.autosave) {
            autosaveCapacitor.submit();
        }
    });
    ///////////////////////////////////////////////////////////////////////////////////////
    //Views dialog
    /*
        press views dialog to open views dialog
        list all available views
        make add new view button
        fix firebase integration
        change save structure
        */

    scriptassert([
        ["dialog", "genui/dialog.js"]
    ], () => {
        let viewDialog = document.createElement("div");
        viewDialog.classList.add("dialog");
        viewDialog = dialogManager.checkDialogs(viewDialog)[0];
        let viewInnerDialog = document.createElement("div");
        viewDialog.querySelector(".innerDialog").appendChild(viewInnerDialog);
        viewInnerDialog.innerHTML = `
        <h1>Choose a view to load!</h1>
        <div class="buttons" style=display:flex; flex-direction:column;">
        </div>
        <h2> Or, make a new view...</h2>
        <input class="newView"><button class="nb">Make new view</button>
        `;
        documentReady(() => {
            document.body.appendChild(viewDialog);
            document.querySelector(".viewdialog").addEventListener("click", () => {
                //add all current views
                viewDialog.querySelector(".buttons").innerHTML = "";
                for (let i in me.views) {
                    let b = document.createElement("button");
                    b.innerHTML = i;
                    viewDialog.querySelector(".buttons").appendChild(b);
                }
                viewDialog.style.display = "block";
            });
        });

        //existing view buttons
        viewInnerDialog
            .querySelector(".buttons")
            .addEventListener("click", function (e) {
                if (e.target.matches("button")) {
                    me.presentView(e.target.innerHTML);
                    viewDialog.style.display = "none";
                    me.currentDoc.currentView = e.target.innerHTML;
                    me.saveUserData();
                }
            });
        //new view buttons
        viewInnerDialog.querySelector(".nb").addEventListener("click", function (e) {
            if (viewInnerDialog.querySelector(".newView").value.length) {
                me.views[viewInnerDialog.querySelector(".newView").value] = {};
                me.presentView(viewInnerDialog.querySelector(".newView").value);
                me.currentDoc.currentView = viewInnerDialog.querySelector(
                    ".newView"
                ).value;
                me.saveUserData();
                viewDialog.style.display = "none";
            }
        });
    });

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
        me.unsaved = true;
    })
    window.addEventListener("beforeunload", (e) => {
        if (me.unsaved) {
            e.preventDefault();
            e.returnValue = "Hold up, you seem to have some unsaved changes. Are you sure you want to close this window?";
        }
    })





}

var core = new _core();

document.addEventListener("DOMContentLoaded", e => {
    window.addEventListener("resize", () => {
        core.baseRect.resize();
    })
    document.body.addEventListener("keydown", e => {
        if (e.ctrlKey && e.key == "s") {
            core.userSave();
            e.preventDefault();
            core.unsaved = false;
            //also do the server save
        }
    });
    document.querySelector(".topbar .new").addEventListener("click", () => {
        window.open(window.location.pathname);
    })
});


// save source example:
// cases:
// user save
// autosave
// remote update