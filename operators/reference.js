core.registerOperator("reference", {
    displayName: "Reference",
    description: "Here we list all the different features that Polymorph supports for you. If you're looking to get started quick, check out template.js instead!"
}, function (container) {
    let me = this;
    me.container = container;
    this.settings = {};
    //Add styling info here. Don't worry, it won't affect anything outside your component. (Shadow DOM yay!!!!1)
    this.style = document.createElement("style");
    this.style.innerHTML = `
        button{
            width: 5em;
            display:block;
        }
    `
    container.div.appendChild(this.style);


    this.rootdiv = document.createElement("div");
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.rootdiv.innerHTML = ``;

    container.div.appendChild(this.rootdiv);

    //////////////////Handle core item updates//////////////////

    //these are optional but can be used as a reference.
    container.on("updateItem", function (d) {
        let id = d.id;
        let sender = d.sender;
        if (sender == me) return;
        //Check if item is shown
        //Update item if relevant
        //This will be called for all items when the items are loaded.
        //This is also called when items are created.
    });

    container.on("focus", function (d) {
        let id = d.id;
        let s = d.sender;
        // An item was focused.
    });

    container.on("deleteItem", function (d) {
        let id = d.id;
        let s = d.sender;
        if (sender == me) return;
        // An item was deleted.
    });

    container.on("dateUpdate", function (d) {
        let id = d.id;
        let s = d.sender;
        if (sender == me) return;
        // The date of an item was updated.
    });

    this.refresh = function () {
        // This is called when my parent rect is resized.
    }

    //For interoperability between views you may fire() and on() your own events. You may only pass one object to the fire() function; use the properties of that object for additional detail.


    //////////////////Handling local changes to push to core//////////////////

    //Handle item creation, locally
    this.createItem = function () {
        //Create a new item
        let it = {};

        //register it with the core
        let id = core.insertItem(it);

        //register a change
        container.fire("updateItem", {
            sender: this,
            id: id
        });
    }

    //Register changes with core
    this.somethingwaschanged = function () {
        container.fire("updateItem", {
            id: itemID,
            sender: this
        });
    }

    //Register focus with core
    this.somethingwasfocused = function () {
        container.fire("focus", {
            id: itemID,
            sender: this
        });
    }

    this.somethingwasdeleted = function () {
        container.fire("deleteItem", {
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
    //Sample options using our _options in house options settings
    let ops = [
        new _option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "echoOn",
            label: "Echo commands"
        }), new _option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "wsautocon",
            label: "Autoconnect websocket on disconnect"
        }), new _option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "wsthru",
            label: "Use as dedicated websocket interface"
        })
    ];

    this.showDialog = function () {
        ops.forEach((op) => { op.load(); });
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