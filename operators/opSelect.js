core.registerOperator("opSelect", function (operator) {
    let me = this;
    me.operator=operator;
    this.settings = {};

    this.rootdiv = document.createElement("div");
    //Add div HTML here
    this.rootdiv.innerHTML = `<h1>Select a view</h1>`;

    core.on("operatorAdded", me.reloadContents);
    this.reloadContents = function () {
        for (let i in core.operators) {
            let b = document.createElement("button");
            b.innerHTML = i;
            b.addEventListener("click", () => {
                operator.reload(b.innerHTML);
                core.fire("viewUpdate",{sender:this});
                operator.rect.tieOperator(operator);
            })
            this.rootdiv.appendChild(b);
        }
    }
    this.reloadContents();
    operator.div.appendChild(this.rootdiv);

    //////////////////Handle core item updates//////////////////

    //these are optional but can be used as a reference.


    //////////////////Handling local changes to push to core//////////////////
    
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
        `;//WHAT YOU WANT TO PUT IN YOUR DIALOG
        me.innerDialog.appendChild(d);

        //When the dialog is closed, update the settings.
        me.dialog.querySelector(".cb").addEventListener("click", function () {
            me.updateSettings();
            me.fire("viewUpdate");
        })

        me.showSettings = function () {
            me.dialog.style.display = "block";
        }
    })



});