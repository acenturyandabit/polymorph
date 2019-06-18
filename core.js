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
        me.saveUserData();
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


    ////////////////////////////////////////////////////////////////////////
    //very basic html
    documentReady(() => {
        document.body.innerHTML = `
        <div class="banner">
            <h1 class="docName" contentEditable>Pad name</h1>
            <div class="installPrompt" style="right: 0;position: absolute;top: 0;display:none"><button>Install our desktop app! It's free!</button></div>
            <div class="gdrivePrompt" style="right: 0;position: absolute;top: 0;display:none"><button>Try our Google Drive app for quick access to your files!</button></div>
            <!--<button class="sharer" style="background:blueviolet; border-radius:3px; border:none; padding:3px; color:white; position:absolute; top: 10px; right: 10px;">Share</button>-->
            <ul class="topbar">
                <li>File
                    <ul>
                        <li class="saveSources">Load/Save...</li> <!-- default is always localforage for now -->
                        <li class="new">New</li>
                    </ul>
                </li>
                <li class="viewdialog">Views</li>
                <li class="hlep">Help</li>
            </ul>
        </div>
        <div class="rectspace" style="width:100%; flex:1 0 auto;position:relative">
        
        </div>
        <div class="wall"
            style="position:absolute; width:100%; height:100%; top:0; left: 0; background: rgba(0,0,0,0.5); display: block">
            <div style="height:100%; display:flex; justify-content: center; flex-direction: column">
                <h1 style="color:white; text-align:center">Hold on, we're loading your data...</h1>
            </div>
        </div>
            `
    })

    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Starting function: this is only called once
    me.start = function () {
        resetDocument();
        let params = new URLSearchParams(window.location.search);
        if (params.has("doc")) {
            loadFromURL(params);
        } else if (window.location.search) {
            //For non-polymorph links, like drive links
            //try each save source to see if it can handle this kind of request
            let handled = false;
            for (let i in me.saveSources) {
                if (me.saveSources[i].canHandle && me.saveSources[i].canHandle(params)) {
                    //TODO: put a try catch around here.
                    //show the splash.
                    handled = true;
                    userLoad(i, params);
                    break;
                }
            }
            //otherwise just show filescreen as if nothing happened
            //TODO: add convenient error message
            if (!handled) me.filescreen.showSplash();
        } else {
            me.filescreen.showSplash();
        }
        //register some handlers
        window.addEventListener("resize", () => {
            me.baseRect.refresh();
        })
        document.body.addEventListener("keydown", e => {
            if (e.ctrlKey && e.key == "s") {
                e.preventDefault();
                core.userSave();
                core.unsaved = false;
                //also do the server save
            }
        });
        document.querySelector(".topbar .new").addEventListener("click", () => {
            window.open(window.location.pathname);
        })
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //Accept loading sources; default is local saving.


    this.saveSources = [];

    this.registerSaveSource = function (id, f) {
        me.saveSources[id] = new f(core);
        //create a wrapper for it in the loading dialog
        let wrapper = htmlwrap(`
        <div data-saveref='${id}'>
            <h1>${me.saveSources[id].prettyName || id}</h1>
            <span><label>Default save source<input type="radio" name="dflt"></input></label><label>Sync to this source<input data-role="tsync" type="checkbox"></input></label></span>
        </div>
        `);
        //also register its settings in the save dialog
        if (me.saveSources[id].dialog) wrapper.appendChild(me.saveSources[id].dialog);
        me.loadInnerDialog.appendChild(wrapper);
    }

    function loadFromURL(params) { // very first load
        //screw the id, we just gonna use urlme.userDataparams straight up

        let source = params.get("src") || 'lf';
        let id = params.get("doc");
        //if there is a template, knock off the template from the url and remember it (discreetly)
        let template;
        if (params.has("tmp")) {
            template = params.get("tmp");
            let loc = window.location.href
            loc = loc.replace(/&tmp=[^&]+/, "");
            history.pushState({}, "", loc);
            console.log(window.location.href);
        }
        userLoad(source, id, true, template);
    }

    function userLoad(source, id, initial = false, template) { // direct from URL
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
                        displayName: "New Workspace",
                        saveSources: {},
                        currentView: "default",
                        views: {},
                        items: {}
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
                if (template) {
                    core.baseRect.fromSaveData(polymorphTemplates[template]);
                }
                me.filescreen.saveRecentDocument(id, undefined, me.currentDoc.displayName);
                let tutorialStarted = false;
                if (params.has("view")) {
                    me.currentDoc.currentView = params.get("view");
                } else if (!me.currentDoc.currentView) me.currentDoc.currentView = "default";
                if (params.has("t")) {
                    core.tutorial.start(params.get("t"));
                    tutorialStarted = true;
                }
                // load / remember the save settings for this particular document on this particular device
                if (!me.userData.documents[id]) me.userData.documents[id] = {};
                me.userData.documents[id][source] = id;
                d.saveSources = me.userData.documents[id];

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
        this.baseRect.refresh();
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
            try{
                me.saveSources[i].pushAll(me.currentDoc.saveSources[i], d);
            }catch (e){
                continue;
            }
            
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
        me.unsaved = false;
    };

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

    ///////////////////////////////////////////////////////////////////////////////////////
    //UI handling

    //Instantiate filemanager
    this.filescreen = new _filescreen({
        headprompt: htmlwrap(`
    <h1>Welcome to Polymorph: Effective Organisation app</h1>
    <h2>Select an option below to get started!</h2>
    
    <style>
    .buttons>button{
        flex: 0 0 25%;
    }
    button:disabled{
        background: repeating-linear-gradient(-60deg, #333333 0px,#333333 10px,#0000ee 10px, #0000ee 20px);
    }
    button:disabled>*{
        background: rgba(100,100,100,0.7);
        color: white;
    }
    .olol>button{
        flex: 1 0 auto;
        background: darkgrey;
    }
    .olol>button.selected{
        background: blue;
        color: white;
    }
    </style>
    <div style="display:flex;flex-direction:row;" class="olol"><button class="selected" data-source="lf">Work offline</button><button data-source="fb">Collaborate in real time</button></div>
    <div style="display:flex;flex-direction:row;overflow-x:scroll" class="buttons">
        <button data-template="brainstorm"><h1>Brainstorm</h1><p>Brainstorm and lay out ideas with others!</p></button>
        <button ><h1>Custom</h1><p>Use Polymorph's customisability to build your own user interface.</p></button>
        <button disabled><h1>Coming soon...</h1></button>
        <button data-template="chatmode" disabled><h1>Chat mode</h1><p>Have a chat with yourself or a friend, and let Polymorph build the structure for you!</p></button>
        <button data-template="kanban" disabled><h1>Kanban board</h1><p>Simple, ticket based project management.</p></button>
        <button data-template="calendar" disabled><h1>Calendar</h1><p>A text-based calendar / tasklist combination.</p></button>
        
    </div>
    `, "div"),
        formats: false,
        tutorialEnabled: false,
        savePrefix: "polymorph"
    });

    this.filescreen.baseDiv.querySelector(".buttons").addEventListener("click", (e) => {
        let t = e.target;
        while (t != this.filescreen.baseDiv) {
            if (t.tagName == "BUTTON" && !t.disabled) {
                let url = window.location.pathname + "?doc=" + guid(7) + "&src=" + this.filescreen.baseDiv.querySelector('.olol .selected').dataset.source;
                if (t.dataset.template) url += "&tmp=" + t.dataset.template;
                window.location.href = url;
                break;
            } else {
                t = t.parentElement;
            }
        }
    })

    this.filescreen.baseDiv.querySelector(".olol").addEventListener("click", (e) => {
        if (e.target.tagName == "BUTTON") {
            let btns = this.filescreen.baseDiv.querySelectorAll(".olol>button");
            for (let i = 0; i < btns.length; i++)btns[i].classList.remove("selected");
            e.target.classList.add("selected");
        }
    })

    /*this.filescreen.baseDiv.querySelector("button.gstd").addEventListener("click", () => {
        // create a new workspace, then load it
        window.location.href += "?doc=" + guid(7) + "&src=lf";
    })*/

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

    //////////////////////////////////////////////////////////////////
    //Loading dialogs
    loadDialog = document.createElement("div");
    loadDialog.classList.add("dialog");
    loadDialog = dialogManager.checkDialogs(loadDialog)[0];

    this.loadInnerDialog = document.createElement("div");
    //me.userData.documents[id]
    loadDialog.querySelector(".innerDialog").appendChild(this.loadInnerDialog);
    this.loadInnerDialog.classList.add("loadInnerDialog")
    this.loadInnerDialog.innerHTML = `
    <style>
    .loadInnerDialog>div{
        border: 1px solid;
        position:relative;
    }
    .loadInnerDialog>div>span:nth-child(2){
        position:absolute;
        top: 0;
        right: 0;
    }
    </style>
          <h1>Load/Save settings</h1>
          `;
    let autosaveOp = new _option({
        div: this.loadInnerDialog,
        type: "bool",
        object: () => {
            return me.userData.documents[me.currentDocName]
        },
        property: "autosave",
        label: "Autosave all changes"
    });
    documentReady(() => {
        document.body.appendChild(loadDialog);
        document.querySelector(".saveSources").addEventListener("click", () => {
            for (let i in me.saveSources)
                if (me.saveSources[i].readyDialog) me.saveSources[i].readyDialog();
            for (let i in me.userData.documents[me.currentDocName]) {
                try{me.loadInnerDialog.querySelector(`div[data-saveref='${i}'] [data-role='tsync']`).checked = true;}
                catch (e){
                    console.log(e);
                }
            }
            let params = new URLSearchParams(window.location.search);
            if (params.get("src")) me.loadInnerDialog.querySelector(`div[data-saveref='${params.get('src')}'] [name='dflt']`).checked = true;
            autosaveOp.load();
            loadDialog.style.display = "block";
        });
    });
    //----------Autosave----------//
    let autosaveCapacitor = new capacitor(200, 20, me.userSave);
    this.on("updateItem", function (d) {
        if (me.userData.documents[me.currentDocName].autosave) {
            autosaveCapacitor.submit();
        }
    });

    //delegate toggle event handlers

    this.loadInnerDialog.addEventListener("input", (e) => {
        if (e.target.matches("[name='dflt']")) {
            //'change' the default save source, by changing the url
            window.history.pushState("", me.currentDoc.displayName, `?doc=${me.currentDocName}&src=${e.target.parentElement.parentElement.parentElement.dataset.saveref}`);
            me.filescreen.saveRecentDocument(me.currentDocName, undefined, me.currentDoc.displayName);
        } else if (e.target.matches("[data-role='tsync']")) {
            let csource = e.target.parentElement.parentElement.parentElement.dataset.saveref;
            if (e.target.checked) {
                me.userData.documents[me.currentDocName][csource] = me.currentDocName;
                if (me.saveSources[csource].hook) me.saveSources[csource].hook(me.currentDocName);
            } else {
                if (me.saveSources[csource].unhook) me.saveSources[csource].unhook(me.currentDocName);
                delete me.userData.documents[me.currentDocName][csource];
            }
            me.saveUserData();
        }
    })


    ///////////////////////////////////////////////////////////////////////////////////////
    //Views dialog
    /*
        press views dialog to open views dialog
        list all available views
        make add new view button
        fix firebase integration
        change save structure
        */
    /*
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
    */
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

    ///////////////////////////////////////////////////////////////
    //More useful bits

    //A shared space for operators to access
    this.shared = {};

    function resetDocument() {
        me.items = {};
        document.body.querySelector(".rectspace").innerHTML = "";

        me.baseRect = new _rect(me,
            document.body.querySelector(".rectspace"),
            RECT_ORIENTATION_X,
            0,
            1);
        me.baseRect.refresh();
    }
}

var core = new _core();


// save source example:
// cases:
// user save
// autosave
// remote update