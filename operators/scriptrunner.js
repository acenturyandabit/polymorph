polymorph_core.registerOperator("scriptrunner", {
    displayName: "Scriptrunner",
    description: "Runs scripts."
}, function (container) {
    let defaultSettings = {
        autorun: false,
        reallyAutorun: false
    };
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `
        <h1>WARNING: THIS SCRIPT IS POTENTIALLY INSECURE. ONLY RUN TRUSTED SCRIPTS.</h1>
        <p>Press 'Update' to execute this script.</p>
        <textarea style="width: 100%; height: 50%"; placeholder="Enter script here:"></textarea>
        <br>
        <button>Update</button>
        <div id="output" style="overflow-y: auto; height: 30%;"></div>
    `;

    /*Example script:*/
    /*
    instance.on("updateItem",(d)=>{
        console.log(polymorph_core.items[d.id]);
    })
    */

    container.div.appendChild(this.rootdiv);

    //////////////////Handle polymorph_core item updates//////////////////

    //this is called when an item is updated (e.g. by another container)
    container.on("updateItem", (d) => {
        if (d.sender != "GARBAGE_COLLECTOR") {
            if (this.currentInstance) this.currentInstance.fire("updateItem", d);
        }
        return false;
    });
    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    function instance() {
        this.log = function (data) {
            let p = document.createElement("p");
            p.innerHTML = JSON.stringify(data);
            me.rootdiv.querySelector("#output").appendChild(p);
        }
        this.logEx = (data) => {
            this.log(String(data))
        }
        addEventAPI(this, this.logEx);
    }

    this.execute = () => {
        this.currentInstance = new instance();
        let wrapped = `(function factory(instance){
            ${this.settings.script}
        })`;
        eval(wrapped)(this.currentInstance);
    }

    this.fromSaveData = (d) => {
        //this is called when your container is started OR your container loads for the first time
        Object.assign(this.settings, d);
        this.rootdiv.querySelector("textarea").value = this.settings.script || "";
        if (this.settings.autorun && this.settings.reallyAutorun) {
            this.execute();
        } else {
            //don't execute, just flag this as needing attention
            textarea.style.background = "green";
        }

    }
    this.rootdiv.querySelector("button").addEventListener("click", () => {
        textarea.style.background = "white";
        this.settings.script = this.rootdiv.querySelector("textarea").value;
        this.execute();
    })


    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `WARNING: DO NOT ACCEPT OTHERS' SCRIPTS IN GENERAL!`;
    let ops = [
        new _option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "autorun",
            label: "Autorun on start"
        }), new _option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "reallyAutorun",
            label: "Confirm autorun on start"
        })
    ];

    this.showDialog = function () {
        ops.forEach((op) => { op.load(); });
    }
    this.dialogUpdateSettings = function () {
        // pull settings and update when your dialog is closed.
    }

    //Allow tab to work
    let textarea = this.rootdiv.querySelector('textarea');
    textarea.addEventListener("keydown", (e) => {
        textarea.style.background = "lightgreen";
        if (e.keyCode == 9 || e.which == 9) {
            e.preventDefault();
            var s = e.target.selectionStart;
            e.target.value = e.target.value.substring(0, e.target.selectionStart) + "\t" + e.target.value.substring(e.target.selectionEnd);
            e.target.selectionEnd = s + 1;
        }
    });

});