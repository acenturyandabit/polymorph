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
        headprompt: "Welcome to Polymorph.",
        onlineEnabled: false,
        offlineQueryParam: "",
        tutorialEnabled: false,
        savePrefix: 'polymorph'
    });
    this.queryLoader = new _queryLoader({
        defaultOffline: true,
        offlineLoad: function (id) {
            me.filescreen.saveRecentDocument(id);
            me.docName = id;
            localforage.getItem("__polymorph_" + id).then((d) => {
                if (d) {
                    me.fromSaveData(d);
                } else {
                    //make new doc -- right now do nothing
                }
            })
        },
        blank: function () {
            me.filescreen.showSplash();
        }
    });

    //items
    this.items = {};
    //operator
    this.operators = {};
    this.operator = function operator(_type, _rect) {
        this.div = document.createElement("div");
        this.div.style.height = "100%";
        this.div.style.width = "100%";
        this.div.style.overflowY="auto"
        this.div.overflow = "hidden";
        this.div.style.background = "lightgrey";
        if (typeof (_type) == 'string') {
            this.baseOperator = new me.operators[_type](this);
            this.type = _type;
        } else {
            this.baseOperator = new me.operators[_type.type](this);
            this.type = _type.type;
            this.baseOperator.fromSaveData(_type.data);
        }
        this.toSaveData = function () {
            let obj = {};
            obj.type = this.type;
            obj.data = this.baseOperator.toSaveData();
            return obj;
        }
        this.setParent = function (rect) {
            //Remove the old innerHTML
            rect.innerDiv.innerHTML = "";
            rect.typeName.innerHTML=this.type;
            rect.innerDiv.appendChild(this.div);
        }
        this.setParent(_rect);
    }
    this.registerOperator = function (type, _constructor) {
        this.operators[type] = _constructor;
        this.baseRect.refreshBlankScreen(true);
    }
    //live operators

    this.baseRect = new _rect(this, ".rectspace", RECT_ORIENTATION_X, 0, 1);
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
        document.body.querySelector(".rectspace").innerHTML="";
        this.baseRect = new _rect(this, ".rectspace", RECT_ORIENTATION_X, 0, 1);
        //Regenerate rects
        this.items={};
        this.baseRect.fromSaveData(obj.rect);
        //Regenerate items
        for (let i in obj.items) {
            this.items[i]= new _item();
            this.items[i].fromSaveData(obj.items[i]);
            this.fire("updateItem",{id:i});
        }
    }

    //Handling delete item.
    this.on("deleteItem", (d)=>{
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