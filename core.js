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
    }
    me.saveUserData();

    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Starting function: this is only called once
    me.start = function () {
        me.fire("UIstart");
        me.resetDocument();
        let params = new URLSearchParams(window.location.search);
        if (params.has("doc")) {
            me.loadFromURL(params);
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
        me.filescreen.saveRecentDocument(me.currentDocID, undefined, me.currentDoc.displayName);
        me.fire("updateSettings");
    };

    let tc = new capacitor(1000, 10, () => {
        core.fire("updateDoc");
    })

    ///////////////////////////////////////////////////////////////////////////////////////
    //View level functions

    this.presentView = function (view) {
        //reset and present a view
        me.resetView();
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

    this.standardiseItem=function(itm){
        //Clean items to follow established standards here. Ideally dont do too much but sometimes necessary.
        if (core.items[itm].links){
            //bidirectional links upgrade
            if (!core.items[i].from)core.items[itm].from={};
            if (!core.items[i].to)core.items[itm].to={};
            for (let i in core.items[itm].links){
                if (!core.items[i].from)core.items[i].from={};
                if (!core.items[i].to)core.items[i].to={};
                core.items[i].from[itm]=true;
                core.items[i].to[itm]=true;
                core.items[itm].from[i]=true;
                core.items[itm].to[i]=true;
            }
            delete core.items[itm].links;
        }
    }

    this.isLinked=function(A,B){
        let ret=0; //unlinked
        if (core.items[A].to && core.items[B].from && (core.items[A].to[B] || core.items[B].from[A])){
            //make sure to enforce both sides of link
            core.items[A].to[B]=core.items[A].to[B]||true;
            core.items[B].from[A]=core.items[B].from[A]||true;
            ret=ret+1;// 1: there is a link FROM A to B
        }
        if (core.items[A].from && core.items[B].to && (core.items[A].from[B] || core.items[B].to[A])){
            //make sure to enforce both sides of link
            core.items[A].from[B]=core.items[A].from[B]||true;
            core.items[B].to[A]=core.items[B].to[A]||true;
            ret=ret+2;// 2: there is a link FROM B to A
        }
        return ret;
    }

    this.link=function(A,B,undirected=false){
        core.items[A].to=core.items[A].to||{};
        core.items[B].from=core.items[B].from||{};
        core.items[A].to[B]=core.items[A].to[B]||true;
        core.items[B].from[A]=core.items[B].from[A]||true;
        if (undirected){
            this.link(B,A);
        }
    }
    this.unlink=function(A,B,undirected=false){
        core.items[A].to=core.items[A].to||{};
        core.items[B].from=core.items[B].from||{};
        delete core.items[A].to[B];
        delete core.items[B].from[A];
        if (undirected){
            this.unlink(B,A);
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
    me.resetView = function () {
        document.body.querySelector(".rectspace").innerHTML = "";
        me.baseRect = new _rect(me,
            document.body.querySelector(".rectspace"),
            RECT_ORIENTATION_X,
            0,
            1);
    }
    this.resetDocument=function() {
        me.documentIsClean=true;
        me.items = {};
        me.resetView();
        me.baseRect.refresh();
    }

    //Merging
    me.tryMerge=function(){
        //cry for now
    }
}

var core = new _core();


// save source example:
// cases:
// user save
// autosave
// remote update