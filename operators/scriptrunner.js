polymorph_core.registerOperator("scriptrunner", {
    displayName: "Scriptrunner",
    description: "Runs scripts."
}, function (container) {
    let defaultSettings = {
        autorun: false,
        reallyAutorun: false,
        forceCareAbout: ""
    };
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here.
    this.rootdiv.style.color = "white";
    this.rootdiv.innerHTML = `
        <h1>WARNING: THIS SCRIPT IS POTENTIALLY INSECURE. ONLY RUN TRUSTED SCRIPTS.</h1>
        <p>Press 'Update' to execute this script.</p>
        <textarea style="width: 100%; height: 50%"; placeholder="Enter script here:"></textarea>
        <br>
        <button class="updatebtn">Update</button>
        <button class="stopbtn">Stop script</button>
        <div id="output" style="overflow-y: auto; height: 30%;"></div>
    `;

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
        this.settings.script = this.rootdiv.querySelector("textarea").value;
    });


    /*Example script:*/
    /*
    instance.on("updateItem",(d)=>{
        instance.log(polymorph_core.items[d.id]);
    })
    */

    container.div.appendChild(this.rootdiv);

    //////////////////Handle polymorph_core item updates//////////////////

    //this is called when an item is updated (e.g. by another container)
    container.on("updateItem,deleteItem,createItem", (d, e) => {
        if (d.sender != "GARBAGE_COLLECTOR") {
            e.forEach(e => {
                if (this.currentInstance) this.currentInstance.fire(e, d);
            })
        }
        return false;
    });

    let me = this;
    function instance() {
        this.log = function (data) {
            let p = document.createElement("p");
            p.style.whiteSpace = "pre-wrap";
            p.innerHTML = JSON.stringify(data, null, 4);
            me.rootdiv.querySelector("#output").appendChild(p);
        }
        this.logEx = (data) => {
            this.log(String(data))
        }
        this.intervals = [];
        this.setInterval = (f, t) => {
            this.intervals.push({ f: f, t: t, t0: t });
            return this.intervals.length;
        }
        this.clearInterval = (n) => {
            if (this.intervals[n]) this.intervals[n].f = undefined;
        }
        polymorph_core.addEventAPI(this, this.logEx);
    }
    setInterval(() => {
        if (this.currentInstance) this.currentInstance.intervals.forEach(i => {
            if (i.f && i.t < 0) {
                i.f();
                i.t = i.t0;
            }
            i.t -= 100;
        })
    }, 100)
    this.stop=()=>{
        delete this.currentInstance;
    }
    this.execute = () => {
        this.currentInstance = new instance();
        let wrapped = `(function factory(instance, setInterval, clearInterval){
            ${this.settings.script}
        })`;
        try {
            eval(wrapped)(this.currentInstance, this.currentInstance.setInterval, this.currentInstance.clearInterval);
        } catch (e) {
            this.currentInstance.log(e.toString());
        }

    }

    //this is called when your container is started OR your container loads for the first time
    this.rootdiv.querySelector("textarea").value = this.settings.script || "";
    if (this.settings.autorun && this.settings.reallyAutorun) {
        this.execute();
    } else {
        //don't execute, just flag this as needing attention
        textarea.style.background = "green";
    }


    this.rootdiv.querySelector(".updatebtn").addEventListener("click", () => {
        textarea.style.background = "white";
        this.settings.script = this.rootdiv.querySelector("textarea").value;
        this.execute();
    })

    this.rootdiv.querySelector(".stopbtn").addEventListener("click", () => {
        this.stop();
        textarea.style.background = "green";
    })


    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `WARNING: DO NOT ACCEPT OTHERS' SCRIPTS IN GENERAL!`;
    let ops = [
        new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "autorun",
            label: "Autorun on start"
        }), new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "reallyAutorun",
            label: "Confirm autorun on start"
        }),
        new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "forceCareAbout",
            label: "Items to keep safe from garbage collector (csv)"
        })
    ];

    this.itemRelevant = (id) => this.settings.forceCareAbout.split(",").includes(id);

    this.showDialog = function () {
        ops.forEach((op) => { op.load(); });
    }
    this.dialogUpdateSettings = function () {
        // pull settings and update when your dialog is closed.
    }

});