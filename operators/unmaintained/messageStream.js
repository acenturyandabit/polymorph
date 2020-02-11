polymorph_core.registerOperator("messageStream", {
    displayName: "Message stream",
    description: "Useful for displaying streams of messages."
}, function (container) {
    let me = this;
    me.container = container;//not strictly compulsory bc this is expected and automatically enforced - just dont touch it pls.
    this.settings = {
        timeprop: "t",
        filter: "",
        messageprop: "msg",
        userProp: "",
        userEquals: true,
        focusOperator: ""
    };

    this.rootdiv = document.createElement("div");
    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `<div class="messagebox"></div><div class="inputbox"><input></input><button>Send</button></div>`;
    let mb = this.rootdiv.querySelector(".messagebox");


    container.div.appendChild(this.rootdiv);

    /*
    Todo:
    -sending
    -focus changing
    
    */

    function clearMessageBox(b) {
        while (mb.children.length) mb.children.remove();
    }

    function refreshMessages() {
        for (let i = 0; i < mb.children.length; i++) {
            mb.children[i].classList.add("remove");
        }
        for (let i in polymorph_core.items) {
            if (polymorph_core.items[i][this.settings.filter]) {
                let ci = mb.querySelector(`[data-id='${i}']`);
                if (!ci) {
                    ci = htmlwrap(`<div></div>`);
                }
                ci.classList.remove("remove");
                ci.innerText=polymorph_core.items[i][me.settings.messageprop];
            }
        }
        for (let i = 0; i < mb.children.length; i++) {
            if (mb.children[i].classList.contains("remove")) {
                mb.children[i].remove();
                i--;
            }
        }
    }

    function setFilter(f) {
        this.settings.filter = f;
        refreshMessages();
    }

    container.on("focusItem", (d) => {
        //change the focused thread
        if (d.sender == this.settings.focusOperator) {
            setFilter(d.item);
        }
    })

    //////////////////Handle polymorph_core item updates//////////////////

    //this is called when an item is updated (e.g. by another container)
    container.on("updateItem", function (d) {
        let id = d.id;
        //do stuff with the item.

        //return true or false based on whether we can or cannot edit the item from this container.
        //otherwise your items will be deleted by the polymorph_core garbage collector when the user saves.
        return false;
    });

    this.refresh = function () {
        // This is called when my parent rect is resized.
    }

    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    this.fromSaveData = function (d) {
        //this is called when your container is started OR your container loads for the first time
        Object.assign(this.settings, d);
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    this.showDialog = function () {
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // pull settings and update when your dialog is closed.
    }

});