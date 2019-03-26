core.registerOperator("reference", {
    displayName: "Reference",
    description: "Here we list all the different features that Polymorph supports for you. If you're looking to get started quick, check out template.js instead!"
}, function (operator) {
    let me = this;
    me.operator = operator;
    this.settings = {};
    //Add styling info here. Don't worry, it won't affect anything outside your component. (Shadow DOM yay!!!!1)
    this.style = document.createElement("style");
    this.style.innerHTML = `
        button{
            width: 5em;
            display:block;
        }
    `
    operator.div.appendChild(this.style);


    this.rootdiv = document.createElement("div");
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.rootdiv.innerHTML = ``;

    operator.div.appendChild(this.rootdiv);

    //////////////////Handle core item updates//////////////////

    //these are optional but can be used as a reference.
    core.on("updateItem", function (d) {
        let id = d.id;
        let sender = d.sender;
        if (sender == me) return;
        //Check if item is shown
        //Update item if relevant
        //This will be called for all items when the items are loaded.
        //This is also called when items are created.
    });

    core.on("focus", function (d) {
        let id = d.id;
        let s = d.sender;
        // An item was focused.
    });

    core.on("create", function (d) {
        let id = d.id;
        let s = d.sender;
        if (sender == me) return;
        // An item was created.
    });

    core.on("deleteItem", function (d) {
        let id = d.id;
        let s = d.sender;
        if (sender == me) return;
        // An item was deleted.
    });

    core.on("dateUpdate", function (d) {
        let id = d.id;
        let s = d.sender;
        if (sender == me) return;
        // The date of an item was updated.
    });

    this.resize = function () {
        // This is called when my parent rect is resized.
    }

    //For interoperability between views you may fire() and on() your own events. You may only pass one object to the fire() function; use the properties of that object for additional detail.


    //////////////////Handling local changes to push to core//////////////////

    //Handle item creation, locally
    this.createItem = function () {
        //Create a new item
        let it = new _item();

        //register it with the core
        let id = core.insertItem(it);

        //register a change
        core.fire("create", {
            sender: this,
            id: id
        });
        core.fire("updateItem", {
            sender: this,
            id: id
        });
    }

    //Register changes with core
    this.somethingwaschanged = function () {
        core.fire("updateItem", {
            id: itemID,
            sender: this
        });
    }

    //Register focus with core
    this.somethingwasfocused = function () {
        core.fire("focus", {
            id: itemID,
            sender: this
        });
    }

    this.somethingwasdeleted = function () {
        core.fire("deleteItem", {
            id: itemID,
            sender: this
        });
        //Don't actually delete() the item! core will manage that.
    }

    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    this.fromSaveData = function (d) {
        Object.assign(this.settings, d);
        this.processSettings();
    }



    //Handle a change in settings (either from load or from the settings dialog or somewhere else)
    this.processSettings = function () {

    }

    //Handle the settings dialog click!
    this.dialogDiv=document.createElement("div");
    this.dialogDiv.innerHTML=`Some html`;
    this.showDialog=function(){
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings=function(){
        // pull settings and update when your dialog is closed.
    }

    this.quickAdd=function(data){
        // An operation that is called to quickly add an item. may be called by other operators sometimes. data will always be plaintext. do what you will with it.
    }

    //Terminal protocol: If you want to add terminal-callable functions, put them under this.callables
    this.callables={}
    this.callables.fn=this.fn; //etc

});