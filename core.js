function _item() {
    this.title = "";
    this.toSaveData = function () {
        return JSON.parse(JSON.stringify(this)); //remove all methods and return the object.
    }
    this.fromSaveData = function (item) {
        Object.assign(this, item);
    }
}

function _core() {
    //Event API. pretty important, it turns out.
    addEventAPI(this);

    //Instantiate filemanager (local only);
    let me = this;
    this.filescreen = new _filescreen({
        prompt: "Welcome to Polymorph.",
        formats: [{
                prompt: "Make a new local (offline) document"
            },
            {
                prompt: "Make a new shared (online) document",
                queryParam: "online"
            },
        ],
        tutorialEnabled: false,
        savePrefix: 'polymorph'
    });
    this.queryLoader = new _queryLoader({
        loaders: [{
                f: function (id) {
                    me.filescreen.saveRecentDocument(id);
                    me.docName = id;
                    localforage.getItem("__polymorph_" + id).then((d) => {
                        if (d) {
                            me.fromSaveData(d);
                        } else {
                            //make new doc -- right now do nothing
                        }
                    })
                }
            },
            {
                keyword: "online",
                f: function (docname) {
                    me.firebase={};
                    firebase.initializeApp({
                        apiKey: "AIzaSyA-sH4oDS4FNyaKX48PSpb1kboGxZsw9BQ",
                        authDomain: "backbits-567dd.firebaseapp.com",
                        databaseURL: "https://backbits-567dd.firebaseio.com",
                        projectId: "backbits-567dd",
                        storageBucket: "backbits-567dd.appspot.com",
                        messagingSenderId: "894862693076"
                    });
                    me.firebase.preid = undefined;
                    me.firebase.ccount = 0;
                    me.firebase.rcount=0;
                    me.firebase.db = firebase.firestore();
                    me.firebase.db.settings({
                        timestampsInSnapshots: true
                    });
                    me.firebase.itemRoot=me.firebase.db.collection("polymorph").doc(docname).collection("items");
                    me.firebase.update = function (id) {
                        let val = core.items[id];
                        let _val = JSON.parse(JSON.stringify(val));
                        me.firebase.itemRoot.doc(id).set(_val);
                    }
                    me.firebase.stackman = function (id) {
                        if (id != me.firebase.preid && me.firebase.preid) {
                            me.firebase.update(me.firebase.preid);
                            me.firebase.rcount=0;
                        }
                        me.firebase.preid = id;
                        me.firebase.ccount = 4;
                        me.firebase.rcount++;
                        if (me.firebase.rcount > 50) {
                            me.firebase.ccount = 0;
                            me.firebase.rcount = 0;
                            me.firebase.update(id);
                        }
                    }
                    setInterval(() => {
                        if (me.firebase.ccount > -1) me.firebase.ccount -= 1;
                        if (me.firebase.ccount == 0) {
                            me.firebase.update(me.firebase.preid);
                        }
                    }, 100)
                    
                    //two-way tie the items to a firebase backend
                    let localChange = false;;
                    core.on("updateItem", function (d) {
                        if (!localChange) {
                            me.firebase.stackman(d.id);
                        } else localChange = false;
                    })
                    core.on("deleteItem", function (d) {
                        me.firebase.itemRoot.doc(d.id).delete();
                    });

                    me.firebase.itemRoot.onSnapshot(shot => {
                        shot.docChanges().forEach(change => {
                            switch (change.type) {
                                case "added":
                                case "modified":
                                    core.items[change.doc.id] = change.doc.data();
                                    localChange = true;
                                    core.fire("updateItem", {
                                        id: change.doc.id
                                    });
                                    break;
                                case "removed":
                                    localChange = true;
                                    core.fire("deleteItem", {
                                        id: change.doc.id
                                    });
                                    break;
                            }
                        })
                    })
                    //two-way tie the view to the user's view profile in firebase

                    //register the special online operator
                }
            }
        ],
        blank: function () {
            me.filescreen.showSplash();
        }
    });

    //items
    this.items = {};
    //operator
    this.operators = {};
    this.operatorLoadCallbacks = {};
    this.operator = function operator(_type, _rect) {
        this.rect = _rect;
        let top = this;
        this.topdiv = document.createElement("div");
        this.topdiv.style.height = "100%";
        this.topdiv.style.width = "100%";
        this.topdiv.style.overflowY = "auto"
        this.topdiv.overflow = "hidden";
        this.topdiv.style.background = "lightgrey";
        this.div = this.topdiv.attachShadow({
            mode: "open"
        });
        this.reload = function (__type) {
            this.div.innerHTML = "";
            if (typeof (__type) == 'string') {
                this.type = __type;
                if (me.operators[__type]) {
                    this.baseOperator = new me.operators[__type](this);
                    this.baseOperator.fromSaveData();
                } else {
                    this.waitOperatorReady(__type);
                }
            } else {
                if (me.operators[__type.type]) {
                    this.baseOperator = new me.operators[__type.type](this);
                    this.baseOperator.fromSaveData(__type.data);
                } else {
                    this.waitOperatorReady(__type);
                }
                this.type = __type.type;
            }
        }

        this.waitOperatorReady = function (__type) {
            let h1 = document.createElement("h1");
            h1.innerHTML = "Loading operator..."
            this.div.appendChild(h1);
            this.operatorLoadCallbacks[__type].push({
                op: top,
                data: __type
            });
        }
        this.reload(_type);
        this.toSaveData = function () {
            let obj = {};
            obj.type = this.type;
            obj.data = this.baseOperator.toSaveData();
            return obj;
        }
    }
    this.registerOperator = function (type, _constructor) {
        this.operators[type] = _constructor;
        me.fire("operatorAdded", {
            type: type
        });
        for (let i = 0; i < this.operatorLoadCallbacks[type]; i++) {
            this.operatorLoadCallbacks[type][i].op.load(this.operatorLoadCallbacks[type][i].data);
        }
    }
    //live operators
    document.addEventListener("DOMContentLoaded", () => me.baseRect = new _rect(me, document.body.querySelector(".rectspace"), RECT_ORIENTATION_X, 0, 1));
    this.insertItem = function (itm) {
        let nuid;
        do {
            nuid = guid();
        } while (this.items[nuid]);
        this.items[nuid] = itm;
        return nuid;
    }

    this.toSaveData = function () {
        let obj = {};
        // recursively save the rect object
        obj.rect = this.baseRect.toSaveData();
        // save all items
        obj.items = {};
        for (let i in this.items) {
            obj.items[i] = this.items[i].toSaveData();
        }
        return obj;
    }
    this.fromSaveData = function (obj) {
        //completely wipe everything previously
        document.body.querySelector(".rectspace").innerHTML = "";
        this.baseRect = new _rect(this, document.body.querySelector(".rectspace"), RECT_ORIENTATION_X, 0, 1);
        //Regenerate rects
        this.items = {};
        //Regenerate items
        for (let i in obj.items) {
            this.items[i] = new _item();
            this.items[i].fromSaveData(obj.items[i]);
        }
        this.baseRect.fromSaveData(obj.rect);
        for (let i in obj.items) {
            this.fire("updateItem", {
                id: i
            });
        }
    }

    //Handling delete item.
    this.on("deleteItem", (d) => {
        delete this.items[d.id];
    })
}

var core = new _core();

//What else? 
//Saving.
document.addEventListener("DOMContentLoaded", (e) => {
    document.body.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key == "s") {
            localforage.setItem("__polymorph_" + core.docName, core.toSaveData());
            e.preventDefault();
        }
    })
})