core.registerOperator("httree", function (operator) {
    let me = this;
    me.operator=operator;
    this.settings = {};

    this.style = document.createElement("style");
    this.style.innerHTML = `
        textarea{
            min-width: 5em;
            width:100%;
            height:5em;
            resize:none; 
        }
        button{
            width: 100%;
            display:block;
        }
        .containerDiv{
            display:flex;
            flex-direction: row;
        }
        .containerDiv>div{
            display: flex;
            flex-direction: column;
            align-items: center;
        }
    `
    operator.div.appendChild(this.style);
    this.rootdiv = document.createElement("div");
    this.rootdiv.style.width = "fit-content";
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.plusbutton = document.createElement("button");
    this.plusbutton.innerText = "+";
    this.rootdiv.appendChild(this.plusbutton);
    this.secondaryDiv = document.createElement("div");
    this.secondaryDiv.classList.add("containerDiv");
    this.rootdiv.appendChild(this.secondaryDiv);

    this.template = document.createElement("div");
    this.template.innerHTML = `
    <button>x</button>
    <textarea></textarea>
    <button>+</button>
    <div class="containerDiv"></div>
    `
    //delegated handler for the plus button
    this.rootdiv.addEventListener("click", function (e) {
        if (e.target.tagName.toLowerCase() == "button") {
            if (e.target.innerText == "+") {
                //Create a new item
                let it = new _item();
                it.httree = {};
                it.httree.parent = e.target.parentElement.dataset.id;
                //register it with the core
                let id = core.insertItem(it);

                //register a change
                core.fire("create", {
                    sender: me,
                    id: id
                });
                core.fire("updateItem", {
                    sender: me,
                    id: id
                });
            } else if (e.target.innerText == "x") {
                //remove the current item
                core.fire("deleteItem", {
                    id: e.target.parentElement.dataset.id,
                    sender: me
                });
            }
        }
    })
    operator.div.appendChild(this.rootdiv);

    //////////////////Handle core item updates//////////////////
    //cache requests to items that haven't been updated yet.
    this.cachedUpdateRequests = {};
    //these are optional but can be used as a reference.

    this.drawItem = function (id) {
        //Check if item is shown
        if (core.items[id].httree) {
            let cdiv = me.rootdiv.querySelector("[data-id='" + id + "']");
            if (!cdiv) {
                if (core.items[id].httree.parent) {


                    let pdiv = me.rootdiv.querySelector("[data-id='" + core.items[id].httree.parent + "']");
                    if (!pdiv) {
                        if (!this.cachedUpdateRequests[core.items[id].httree.parent]) this.cachedUpdateRequests[core.items[id].httree.parent] = [];
                        this.cachedUpdateRequests[core.items[id].httree.parent].push(id);
                    } else {
                        cdiv = me.template.cloneNode(true);
                        cdiv.dataset.id = id;
                        pdiv.children[3].appendChild(cdiv);
                        if (this.cachedUpdateRequests[id])
                            for (let i = 0; i < this.cachedUpdateRequests[id].length; i++) this.drawItem(this.cachedUpdateRequests[id][i]);
                    }
                } else {
                    cdiv = me.template.cloneNode(true);
                    cdiv.dataset.id = id;
                    me.secondaryDiv.appendChild(cdiv);
                    if (this.cachedUpdateRequests[id])
                        for (let i = 0; i < this.cachedUpdateRequests[id].length; i++) this.drawItem(this.cachedUpdateRequests[id][i]);
                }
            }
            if (cdiv) {
                cdiv.children[1].value = core.items[id].title;
            }
        }
    }


    core.on("updateItem", (d) => {
        this.drawItem(d.id)
    });

    //Update item if relevant
    //This will be called for all items when the items are loaded.
    //This is also called when items are created.

    core.on("focus", function (d) {
        let id = d.id;
        let s = d.sender;
        if (s == me) return;
        if (core.items[id].httree) {
            let cdiv = me.rootdiv.querySelector("[data-id='" + id + "']");
            if (cdiv) {
                cdiv.scrollIntoViewIfNeeded();
            }
        }
        // An item was focused.
    });

    core.on("deleteItem", function (d) {
        let id = d.id;
        let cdiv = me.rootdiv.querySelector("[data-id='" + id + "']");
        if (cdiv) {
            cdiv.remove();
        }
        // An item was deleted.
    });

    this.resize = function () {
        // This is called when my parent rect is resized.
    }

    //For interoperability between views you may fire() and on() your own events. You may only pass one object to the fire() function; use the properties of that object for additional detail.


    //////////////////Handling local changes to push to core//////////////////

    //Register changes with core

    this.rootdiv.addEventListener("input", (e) => {
        core.items[e.target.parentElement.dataset.id].title = e.target.value;
        let itemID = e.target.parentElement.dataset.id;
        core.fire("updateItem", {
            id: itemID,
            sender: this
        })
    })

    //Register focus with core
    this.somethingwasfocused = function () {
        core.fire("focus", {
            id: itemID,
            sender: this
        });
    }

    this.somethingwasdeleted = function () {

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

    //Create a settings dialog
    scriptassert([
        ["dialog", "genui/dialog.js"]
    ], () => {
        me.dialog = document.createElement("div");

        me.dialog.innerHTML = `
        <div class="dialog">
        </div>`;
        dialogManager.checkDialogs(me.dialog);
        //Restyle dialog to be a bit smaller
        me.dialog = me.dialog.querySelector(".dialog");
        me.innerDialog = me.dialog.querySelector(".innerDialog");
        operator.div.appendChild(me.dialog);
        let d = document.createElement("div");
        d.innerHTML = `
        WHAT YOU WANT TO PUT IN YOUR DIALOG
        `;
        me.innerDialog.appendChild(d);

        //When the dialog is closed, update the settings.
        me.dialog.querySelector(".cb").addEventListener("click", function () {
            me.processSettings();
            me.fire("viewUpdate");
        })

        me.showSettings = function () {
            me.dialog.style.display = "block";
        }
    })



});