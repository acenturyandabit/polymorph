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

    this.queryLoader = new _queryLoader({
        loaders: [{
            f: function (id) {
                loadFromURL();
            }
        }],
        blank: function () {
            me.filescreen.showSplash();
        }
    });

    this.dataSources = [];

    this.registerSaveSource = function (id, f) {
        me.dataSources[id] = new f();
    }

    function loadFromURL() { // very first load
        //screw the id, we just gonna use urlparams straight up
        let params = new URLSearchParams(window.location.search);
        let source = params.get("src") || 'lf';
        let id = params.get("doc");
        userLoad(source, id, true);
    }

    function userLoad(source, id, initial = false) { // direct from URL
        //reset
        resetDocument();
        if (me.dataSources[source]) {
            me.currentDocName = id;
            //load from loadsource
            me.dataSources[source].pullAll(id).then((d) => {
                let params = new URLSearchParams(window.location.search);
                if (!d) {
                    d = {
                        settings: {
                            displayName: id,
                            saveSources: [source]
                        },
                        currentView: "default",
                        views: {}
                    }
                    if (!params.has("auto")) {
                        d.settings.displayName = id;
                    } else {
                        d.settings.displayName = "New Workspace"
                    }
                    /*if (!tutorialStarted) {
                        core.tutorial.start();
                    }*/
                }
                me.filescreen.saveRecentDocument(id, undefined, d.settings.displayName);
                me.fromSaveData(d);

                let tutorialStarted = false;
                if (params.has("view")) {
                    me.currentDoc.currentView = params.get("view");
                } else if (!me.currentDoc.currentView) me.currentDoc.currentView = "default";
                if (params.has("t")) {
                    core.tutorial.start(params.get("t"));
                    tutorialStarted = true;
                }


            });

        } else if (initial) {
            console.log("Warning - no save source could be identified. Falling back to localforage...");
            userLoad("lf", id);
            return;
        }
    }

    this.fromSaveData = function (data) {
        //load metadata, including views
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
    }

    this.userSave = function () {
        // just save the damn doc
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
        if (!me.currentDoc.settings.saveSources){
            me.currentDoc.settings.saveSources=['lf'];
        }
        me.currentDoc.settings.saveSources.forEach(e => {
            me.dataSources[e].pushAll(me.currentDocName, me.currentDoc);
        });
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
        ).innerText = this.currentDoc.settings.displayName;
        document.querySelector("title").innerHTML =
            this.currentDoc.settings.displayName + " - Polymorph";
        me.filescreen.saveRecentDocument(me.docName, undefined, me.settings.currentDoc.displayName);
    };

    documentReady(() => {
        document.querySelector(".docName").addEventListener("keyup", () => {
            this.settings.currentDoc.displayName = document.body.querySelector(".docName").innerText;
            /*if (this.firebase && this.firebase.unsub) {
              docNameEditCapacitor.submit();
            }*/
            document.querySelector("title").innerHTML =
                this.settings.currentDoc.displayName + " - Polymorph";
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
    document.addEventListener(
        "DOMContentLoaded",
        () => {
            document.body.querySelector(".rectspace").innerHTML = "";
            me.baseRect = new _rect(
                me,
                document.body.querySelector(".rectspace"),
                RECT_ORIENTATION_X,
                0,
                1
            )
        }
    );
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
                    return "&src=fb";
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

    scriptassert([
        ["dialog", "genui/dialog.js"]
    ], () => {
        let loadDialog = document.createElement("div");
        loadDialog.classList.add("dialog");
        loadDialog = dialogManager.checkDialogs(loadDialog)[0];
        let loadInnerDialog = document.createElement("div");
        loadDialog.querySelector(".innerDialog").appendChild(loadInnerDialog);
        loadInnerDialog.innerHTML = `
          <h1>Sharing</h1>
          <p class="shareNow">
              Share this document now!
              <input class="slink" placeholder="shareable link" disabled/>
              <button class="snow">Share now!</button>
          </p>
          <p class="firebase">
              Firebase
              <label><input class="enableSync" type="checkbox">Enable sync</label>
              <input class="ref" placeholder="Enter Reference..."/>
              <input disabled class="pswd" placeholder="Enter Password..."/>
              <button disabled class="pswdbtn">Set password</button>
          </p>
          <p class="server">
              Server
              <input class="url" placeholder="Enter URL...">
              <input class="docid" placeholder="Enter Document ID...">
              <input class="srv_pass" placeholder="Enter Password...">
              <button class="save">Save to source</button>
              <button class="load">Load from source</button>
          </p>
          <p class="local">
              Local
              <label><input type="checkbox" class="autosave">Enable autosave</label>
              <button class="save">Save to source</button>
              <button class="load">Load from source</button>
          </p>
          <button class="setting">Save settings</button>
          `;
        documentReady(() => {
            document.body.appendChild(loadDialog);
            document.querySelector(".dataSources").addEventListener("click", () => {
                //fill in the apporpriate datasources
                //firebase name
                if (me.currentDoc.firebaseDocName)
                    loadDialog.querySelector(".firebase input.ref").value =
                    me.currentDoc.firebaseDocName;
                //firebase sync enabled?
                if (me.currentDoc.firebaseSync)
                    loadDialog.querySelector(".firebase input.enableSync").checked = true;
                //server url
                if (me.currentDoc.saveAddress)
                    loadDialog.querySelector(".server input.url").value =
                    me.currentDoc.saveAddress;
                //autosave
                if (me.currentDoc.autosave)
                    loadDialog.querySelector(".local input.autosave").checked = true;
                loadDialog.style.display = "block";
            });
            document.querySelector(".snow").addEventListener("click", () => {
                this.readyFirebase();
                if (!this.currentDoc.firebaseDocName) {
                    this.currentDoc.firebaseDocName = guid(7);
                    this.forceFirebasePush(this.currentDoc.firebaseDocName);
                }
                this.saveUserData();
                //fill in the input
                loadInnerDialog.querySelector(".slink").value = generateSelfURL();
                loadInnerDialog.querySelector(".slink").disabled = false;
                loadInnerDialog.querySelector(".slink").select();
                document.execCommand("copy");
            })
        });

        loadInnerDialog
            .querySelector("button.setting")
            .addEventListener("click", function () {
                //"save changes"
                //TODO: ID validation
                //firebase
                let name = loadInnerDialog.querySelector(".firebase>input.ref").value;
                if (
                    !(
                        name &&
                        loadInnerDialog.querySelector(".firebase input[type='checkbox']")
                        .checked
                    )
                ) {
                    if (me.firebase && me.firebase.unsub) {
                        for (let i in me.firebase.unsub) me.firebase.unsub[i]();
                        delete me.firebase.unsub;
                    }
                    me.currentDoc.firebaseDocName = "";
                    me.currentDoc.firebaseSync = false;
                } else {
                    me.currentDoc.firebaseDocName = name;
                    me.currentDoc.firebaseSync = true;
                    //unsub first
                    if (me.firebase && me.firebase.unsub) {
                        for (let i in me.firebase.unsub) me.firebase.unsub[i]();
                        delete me.firebase.unsub;
                    }
                    //and resub
                    me.firebaseSync(name);
                }
                //server
                me.currentDoc.saveAddress = loadInnerDialog.querySelector(".server>input.url").value;
                //autosave
                if (loadInnerDialog.querySelector(".local input.autosave").checked) {
                    me.currentDoc.autosave = true;
                }
                me.saveUserData();
            });
        //handle the save buttons
        loadInnerDialog
            .querySelector(".server>button.save")
            .addEventListener("click", function () {
                let url = loadInnerDialog.querySelector(".server>input.url").value;
                me.saveToServer(me.currentDoc.saveAddress);
                me.saveUserData();
            });
        //local save
        loadInnerDialog
            .querySelector(".local>button.save")
            .addEventListener("click", function () {
                me.saveToLocal();
            });
        //handle the load buttons
        loadInnerDialog
            .querySelector(".server>button.load")
            .addEventListener("click", function () {
                let url = loadInnerDialog.querySelector(".server>input.url").value;
                me.currentDoc.saveAddress = url;
                core.loadFromServer(url);
                me.saveUserData();
            });
        //local load
        loadInnerDialog
            .querySelector(".local>button.load")
            .addEventListener("click", function () {
                me.directLoadFromSaveData(obj);
            });
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

    ///////////////////////////////////////////////////////////////////////////////////////
    //
    //----------Autosave----------//
    let autosaveCapacitor = new capacitor(200, 20, me.saveToLocal);
    this.on("updateItem", function (d) {
        if (me.currentDoc.autosave) {
            autosaveCapacitor.submit();
        }
    });







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