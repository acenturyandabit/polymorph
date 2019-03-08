core.registerOperator("goframe",{noShadow:true}, function (operator) {
    let me = this;
    this.settings = {
        divid: guid()
    };

    this.rootdiv = document.createElement("div");
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.rootdiv.innerHTML = ``;
    this.rootdiv.style.width="100%";
    this.rootdiv.style.height="100%";
    operator.div.appendChild(this.rootdiv);
    me.rootdiv.id=this.settings.divid;
    scriptassert([
        ["go", "3pt/go-debug.js"]
    ], () => {
        me.redrawDiagram = function () {
            let gmk = go.GraphObject.make;
            me.diagram = gmk(go.Diagram, me.settings.divid);
            me.model = gmk(go.Model);
            me.model.nodeDataArray = [{
                    key: "Alpha"
                },
                {
                    key: "Beta"
                },
                {
                    key: "Gamma"
                }
            ];
            //me.settings.data;
            me.diagram.model = me.model;
        }
        me.redrawDiagram();
    })

    //////////////////Handling local changes to push to core//////////////////

    //Handle a change in settings (either from load or from the settings dialog or somewhere else)
    this.processSettings = function () {
        me.rootdiv.id=me.settings.divid;
        if (me.redrawDiagram) me.redrawDiagram();
    }

    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    this.fromSaveData = function (d) {
        Object.assign(this.settings, d);
        this.processSettings();
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
        })

        me.showSettings = function () {
            me.dialog.style.display = "block";
        }
    })



});