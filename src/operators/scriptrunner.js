{
    // Use a background worker for background realtime timing
    let timerSize = 200;
    let blob = new Blob([
        `onmessage = function(e) { setTimeout(()=>postMessage('tick'),${timerSize}); }`]);

    // Obtain a blob URL reference to our worker 'file'.
    let blobURL = window.URL.createObjectURL(blob);
    let scriptRunnerTimers = [];
    let worker = new Worker(blobURL);
    worker.onmessage = function (e) {
        scriptRunnerTimers.forEach(i => i());
        worker.postMessage(0);
    };
    worker.postMessage(0); // Start the worker.
    let referenceHTML;
    let updateReferenceMD = [];
    (async () => {
        let converter = new showdown.Converter();
        let referenceMD = await (await fetch("docs/operators/scriptrunner_reference.md")).text();
        referenceHTML = converter.makeHtml(referenceMD);
        updateReferenceMD.forEach(i=>i());
    })();

    polymorph_core.registerOperator("scriptrunner", {
        displayName: "Script Runner",
        description: "Runs scripts.",
        section: "Advanced",
        imageurl: "assets/operators/scriptrunner.png",
        mustColdLoad: true
    }, function (container) {
        let defaultSettings = {
            autorun: false,
            reallyAutorun: false,
            forceCareAbout: "",
            uiOnly: false,
            processDuringLoad: false,
            persistence:{}
        };
        polymorph_core.operatorTemplate.call(this, container, defaultSettings);

        //Add content-independent HTML here.
        this.rootdiv.style.color = "white";
        this.rootdiv.innerHTML = `
        <div style="display:flex" class="switchTabs">
            <style>
                .switchTabs p{
                    width: 50%;
                    margin: 3px;
                    padding: 3px;
                    font-size: 0.7em;
                    border:1px solid black;
                    border-radius: 3px;
                }

                .logBlueFlash{
                    white-space: pre-wrap;
                    margin: 0;
                    animation: firstShowBlink 0.3s;
                }
                @keyframes firstShowBlink{
                    from {background: blue;}
                    to {background: none;}
                }
            </style>
            <p data-switchto="code">Code</p>
            <p data-switchto="ui">UI</p>
        </div>
        <div>
            <div class="lpanel" data-switchto="code" style="display:flex; flex-direction: column; height: calc(100% - 30px)">
                <h1 style="margin:0">WARNING: SCRIPTS CAN BE DANGEROUS.</h1>
                <ul style="margin:0">
                    <li>Only run trusted scripts. </li>
                    <li>Press here for a <a class="showRef" href="#">reference</a>.</li>
                    <li>Press 'Update' to execute this script.</li>
                </ul>
                <textarea style="width: 100%; flex: 1 1 80%; tab-size:4; white-space: nowrap" placeholder="Enter script here:"></textarea>
                <button class="updatebtn">Update</button>
                <button class="stopbtn">Stop script</button>
                <button class="clogs">Clear logs</button>
                <div id="output" style="overflow-y: auto; height: 10%;"></div>
            </div>
            <div class="lpanel" data-switchto="ui" style="display:none; flex-direction: column">
            </div>
        </div>
        `;
        let instructionsDiv=document.createElement("div");
        if (!referenceHTML){
            updateReferenceMD.push(()=>{
                instructionsDiv.innerHTML=referenceHTML;
            })
        }else{
            instructionsDiv.innerHTML=referenceHTML;
        }
        let showRefBtn = this.rootdiv.querySelector(".showRef");
        showRefBtn.addEventListener("click", (e) => {
            polymorph_core.dialog.prompt(instructionsDiv);
        })
        let tabs = Array.from(this.rootdiv.querySelectorAll("div[data-switchto]")).reduce((p, i) => { p[i.dataset.switchto] = i; return p; }, {});
        this.rootdiv.querySelector(".switchTabs").addEventListener("click", (e) => {
            if (e.target.matches("[data-switchto]")) {
                for (let t in tabs) {
                    if (t == e.target.dataset.switchto) {
                        tabs[t].style.display = "flex";
                    } else {
                        tabs[t].style.display = "none";
                    }
                }
            }
        })

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


        container.div.appendChild(this.rootdiv);

        //////////////////Handle polymorph_core item updates//////////////////

        //this is called when an item is updated (e.g. by another container)
        let selfLooping = false;
        container.on("*", (d, e) => {
            if (!d) return; // documentCreated &c
            if ((!d.sender || d.sender != "GARBAGE_COLLECTOR") && !selfLooping && (!d.loadProcess || this.settings.processDuringLoad)) {
                selfLooping = true;
                e.forEach(e => {
                    if (this.currentInstance) this.currentInstance._fire(e, d);
                })
                selfLooping = false; // not sure if this is helping or hindering but we'll see
            }
            return false;
        });

        let me = this;

        function instance() {
            this.log = function (data) {
                let p = document.createElement("p");
                p.classList.add("logBlueFlash");
                p.innerHTML = JSON.stringify(data, null, 4);
                me.rootdiv.querySelector("#output").appendChild(p);
                p.scrollIntoView();
            }
            this.logEx = (data) => {
                this.log(String(data))
            }
            this.instanceID = Date.now();
            this.isAlive = true;
            this.intervals = [];
            this.timeoutNonce = 0;
            this.timeouts = {};
            this.setInterval = (f, t) => {
                this.intervals.push({ f: f, t: t, t0: t });
                return this.intervals.length;
            }
            this.clearInterval = (n) => {
                if (this.intervals[n]) this.intervals[n].f = undefined;
            }
            this.setTimeout = (f, t) => {
                if (this.isAlive) {
                    //console.log("set new timeout for " + this.instanceID);
                    // if setTimeout sets new timeout after instance destroyed (due to async await), 
                    // don't allow code to still setTimeout.
                    this.timeoutNonce++;
                    this.timeouts[this.timeoutNonce] = {
                        func: f,
                        timeout: t,
                        ref: Date.now()
                    };
                    return this.timeoutNonce;
                }
            }
            this.clearTimeout = (i) => {
                if (this.timeouts[i]) {
                    delete this.timeouts[i];
                }
            }
            polymorph_core.addEventAPI(this, this.logEx);
            this._fire = this.fire;
            this.fire = (e, d) => {
                //overwrite the fire fn for internal use (firing updateitems)
                container.fire(e, d);
            }
        }

        // Background timer subsystem.
        scriptRunnerTimers.push(() => {
            if (this.currentInstance) {
                this.currentInstance.intervals.forEach(i => {
                    if (i.f && i.t < 0) {
                        try {
                            i.f();
                        } catch (e) {
                            this.currentInstance.logEx(e);
                        }
                        i.t = i.t0;
                    }
                    i.t -= timerSize;
                })
                for (let timeout in this.currentInstance.timeouts) {
                    if (Date.now() > this.currentInstance.timeouts[timeout].ref + this.currentInstance.timeouts[timeout].timeout) {
                        this.currentInstance.timeouts[timeout].func();
                        delete this.currentInstance.timeouts[timeout];
                    }
                }
            }
        })

        this.stop = () => {
            if (this.currentInstance) {
                this.currentInstance.isAlive = false;
                delete this.currentInstance;
            }
        }

        let persistence = new Proxy({},{
            get:(target, prop, recv)=>{
                return this.settings.persistence[prop];
            },
            set: (obj, prop, value)=>{
                this.settings.persistence[prop]=value;
                polymorph_core.fire("updateItem",{id: container.id, sender:this});
            }
        })

        this.execute = () => {
            this.stop();
            this.currentInstance = new instance();
            let wrapped = `(function factory(instance, setInterval, clearInterval,setTimeout, uidiv, persistence){
            ${this.settings.script}
        })`;
            try {
                let uidiv = document.createElement("div");
                Array.from(tabs["ui"].children).forEach(i => i.remove());
                tabs["ui"].appendChild(uidiv);
                eval(wrapped)(this.currentInstance, this.currentInstance.setInterval, this.currentInstance.clearInterval, this.currentInstance.setTimeout, uidiv, persistence);
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

        this.rootdiv.querySelector(".clogs").addEventListener("click", () => {
            let op = this.rootdiv.querySelector("#output");
            while (op.children.length) op.children[0].remove();
        });


        this.rootdiv.querySelector(".updatebtn").addEventListener("click", () => {
            textarea.style.background = "white";
            this.settings.script = this.rootdiv.querySelector("textarea").value;
            container.fire("updateItem", { id: this.container.id, sender: this });
            this.execute();
        })

        container.on("updateItem", (d) => {
            if (d.id == this.container.id && d.sender != this) {
                // consider updating the script
                // again very dangerous xss target :(((
                this.rootdiv.querySelector("textarea").value = this.settings.script;
                textarea.style.background = "lightgreen";
                // actually yes this is terrifying, DO NOT execute
                //this.execute();
            }
        })

        this.rootdiv.querySelector(".stopbtn").addEventListener("click", () => {
            this.stop();
            textarea.style.background = "green";
        })


        //Handle the settings dialog click!
        this.dialogDiv = document.createElement("div");
        this.dialogDiv.innerHTML = `WARNING: DO NOT ACCEPT OTHERS' SCRIPTS YOU DONT UNDERSTAND!`;
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
                type: "bool",
                object: this.settings,
                property: "processDuringLoad",
                label: "Process events during loading (reduces load performance)"
            }),
            new polymorph_core._option({
                div: this.dialogDiv,
                type: "text",
                object: this.settings,
                property: "forceCareAbout",
                label: "Items to keep safe from garbage collector (csv)"
            }),
            new polymorph_core._option({
                div: this.dialogDiv,
                type: "bool",
                object: this.settings,
                property: "uiOnly",
                label: "Only show the UI (use with autorun!)"
            })
        ];

        this.itemRelevant = (id) => this.settings.forceCareAbout.split(",").includes(id);

        this.showDialog = function () {
            ops.forEach((op) => { op.load(); });
        }
        this.dialogUpdateSettings = () => {
            if (this.settings.uiOnly) {
                this.rootdiv.querySelector(".switchTabs").style.display = "none";
                this.rootdiv.querySelector(".lpanel[data-switchto='code']").style.display = "none";
                this.rootdiv.querySelector(".lpanel[data-switchto='ui']").style.display = "flex";
            } else {
                this.rootdiv.querySelector(".switchTabs").style.display = "flex";
                this.rootdiv.querySelector(".lpanel[data-switchto='code']").style.display = "flex";
                this.rootdiv.querySelector(".lpanel[data-switchto='ui']").style.display = "none";
            }
            // pull settings and update when your dialog is closed.
        }
        this.dialogUpdateSettings();

    });
}