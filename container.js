//container. Wrapper around an operator.
//child is this.operator.
core.container = function container(_type, _rect) {
    this.rect = _rect;
    let me = this;

    //options, settings, whatnot
    this.settings = {
        uuid: guid(6),
        inputRemaps: {},
        outputRemaps: {},
        type: "opSelect",
        tabbarName: "New Operator"
    }
    //the options are for operators and are transient.
    this.options = {};
    //topmost 'root' div.
    this.topdiv = htmlwrap(`<div style="width:100%;height:100%; background:rgba(230, 204, 255,0.1)"></div>`);

    //inner div. for non shadow divs. has a uuid for an id so that it can be referred to uniquely by the operator. (this is pretty redundant imo)
    this.innerdiv = document.createElement("div");
    this.topdiv.appendChild(this.innerdiv);
    this.innerdiv.id = guid(12);

    //shadow root.
    this.shader = document.createElement("div");
    this.shader.style.width = "100%";
    this.shader.style.height = "100%";
    this.topdiv.appendChild(this.shader);
    this.shadow = this.shader.attachShadow({
        mode: "open"
    });

    this.toSaveData = () => {
        let obj = {};
        Object.assign(obj, this.settings);
        if (this.operator) obj.data = this.operator.toSaveData();
        else obj.data = {};
        return obj;
    };
    this.fromSaveData = (__type) => {
        let data;
        this.options = {
            noShadow: false
        };
        if (typeof __type == "string") {
            this.settings.type = __type;
            this.settings.uuid = guid(6); //make a guid!
        } else {
            Object.assign(this.settings, __type);
            delete this.settings.data;
            this.settings.inputRemaps = __type.remaps || this.settings.inputRemaps;
            delete this.settings.remaps;
            data = __type.data;
        }

        //parse options and decide what to do re: a div
        if (core.operators[this.settings.type]) {
            if (core.operators[this.settings.type].options)
                Object.assign(this.options, core.operators[this.settings.type].options);
            //clear the shadow and the div
            this.shadow.innerHTML = "";
            this.innerdiv.innerHTML = "";
            if (!this.tabbarName) this.tabbarName = core.operators[this.settings.type].options.displayName || this.settings.type;
            if (this.options.noShadow) {
                this.div = this.innerdiv;
            } else {
                this.div = this.shadow;
                this.shader.style.display = "block";
            }
            if (this.options.outerScroll) {
                this.topdiv.style.overflowY = "auto";
            } else {
                this.topdiv.style.overflowY = "hidden";
            }
            try {
                this.operator = new core.operators[this.settings.type].constructor(this);
                if (data) this.operator.fromSaveData(data);
                if (!this.operator.container) this.operator.container = this;
            } catch (e) {
                console.log(e);
            }
        } else {
            this.waitOperatorReady(this.settings.type, __type);
        }
    };

    this.waitOperatorReady = (type, data) => {
        let h1 = document.createElement("h1");
        h1.innerHTML = "Loading operator...";
        this.innerdiv.appendChild(h1);
        this.shader.style.display = "none";
        if (!core.operatorLoadCallbacks[type]) core.operatorLoadCallbacks[type] = [];
        core.operatorLoadCallbacks[type].push({
            op: this,
            data: data
        });
    };

    this.passthrough = (fName, args) => {
        //perhaps the operator has to do sothis stuff too - so let it do its stuff
        let result;
        if (this[fName]) {
            result = this[fName](args);
        }
        if (this.operator.passthrough) {
            result = result || this.operator.passthrough(fName, args);
        }
        return result;
    }

    //bulkhead for item selection.
    this.bulkhead = document.createElement("div");
    this.bulkhead.style.cssText = `display: none; background: rgba(0,0,0,0.5); width: 100%; height: 100%; position: absolute; zIndex: 100`
    //bulkhead styling
    this.bulkhead.innerHTML = `<div style="display: flex; width:100%; height: 100%;"><p style="margin:auto; color:white"></p></div>`
    this.topdiv.appendChild(this.bulkhead);
    this.bulkhead.addEventListener("click", (e) => {
        this.bulkhead.style.display = "none";
        core.submitTarget(this.settings.uuid);
        e.stopPropagation();
    })

    this.activateTargets = () => {
        // put a grey disabled div on this of the basediv.
        // also put sothis info about the underlying operator, i.e. what events it fires.
        this.bulkhead.children[0].children[0].innerHTML = "The following events are available from this operator:";
        while (this.bulkhead.children[0].children.length > 1) this.bulkhead.children[1].remove();
        if (!this.operator.passthrough) this.bulkhead.style.display = "block";
    }
    this.deactivateTargets = () => {
        if (!this.operator.passthrough) this.bulkhead.style.display = "none";
    }
    this.getOperator = (id) => {
        if (this.settings.uuid == id) {
            return this;
        }
    }
    this.listOperators = (list) => {
        list.push({ id: this.settings.uuid, type: this.settings.type });
    }

    //Interfacing with the underlying operator
    this.visible = () => {
        return this.topdiv.offsetHeight != 0;
    }

    //event remapping
    addEventAPI(this);
    this._on = this.on;
    //we need the garbagecollector to work still
    this.on = (e, f) => {
        if (e == "updateItem") core.on("updateItem", f);
        else (this._on(e, f));
    }
    this.incomingEvents = [];
    this.on("*", (args, e) => {
        for (let i = 0; i < this.incomingEvents.length; i++) {
            if (this.incomingEvents[i].e == e && this.incomingEvents[i].args == args) return;
        }

        if (this.settings.outputRemaps[e]) e = this.settings.outputRemaps[e];
        else {
            e = [e, e + "_" + this.settings.uuid];
        }

        e.forEach((v) => {
            core.fire(v, args);
        })

    })

    core.on("*", (args, e) => {
        //with this setup, updateItem will be called twice - so dont handle updateItem
        if (e == "updateItem") return;
        this.incomingEvents.push({ e: e, args: args });
        if (this.settings.inputRemaps[e] != undefined) e = this.settings.inputRemaps[e];
        this.fire(e, args);
        this.incomingEvents.pop();
    })

    //input remaps

    this.remappingDiv = document.createElement("div");
    this.remappingDiv.innerHTML = `
    <h3>Input Remaps</h3>
    <p>Remap calls from the core to internal calls, to change operator behaviour.</p>
    <p>This operator's ID: ${this.settings.uuid}</p>
    <div>
    </div>
    <button>Add another input remap...</button>
    <h3>Output Remaps</h3>
    <div>
    </div>
    <button>Add another output remap...</button>
    `;
    let newRow = (io) => {
        let elem;
        if (io) {
            elem = htmlwrap(`<p>we fire <input>, send out <input><button>x</button></p>`);
        } else {
            elem = htmlwrap(`<p>core fires <input>, we process<select></select><button>x</button></p>`);
            for (let i in this.events) {
                if (i == "*") i = "";//replace any with none
                elem.querySelector("select").appendChild(htmlwrap(`<option>${i}</option>`));
            }
        }
        return elem;
    }

    //delegated cross handler

    this.remappingDiv.addEventListener("click", (e) => {
        if (e.target.tagName == "BUTTON" && e.target.innerText == "x") {
            e.target.parentElement.remove();
        }

    })
    for (let i = 0; i < 2; i++) {
        this.remappingDiv.querySelectorAll("button")[i].addEventListener("click", (e) => {
            let i;
            if (e.currentTarget.innerText.includes("output")) i = 1;
            else i = 0;
            let row = newRow(i);
            let insertDiv = this.remappingDiv.querySelectorAll("div")[i];
            insertDiv.appendChild(row);
        })
    }
    this.readyRemappingDiv = () => {
        this.remappingDiv.children[2].innerText = `This operator's ID: ${this.settings.uuid}`;
        for (let i = 0; i < 2; i++) {
            let div = this.remappingDiv.querySelectorAll("div")[i];
            while (div.children.length) div.children[0].remove();
        }
        let div = this.remappingDiv.querySelectorAll("div")[0];
        for (let i in this.settings.inputRemaps) {
            let row = newRow(0);
            row.children[0].value = i;
            row.children[1].value = this.settings.inputRemaps[i];
            div.appendChild(row);
        }
        div = this.remappingDiv.querySelectorAll("div")[1];
        for (let i in this.settings.outputRemaps) {
            if (this.settings.outputRemaps[i].length && typeof (this.settings.outputRemaps[i]) != "string") this.settings.outputRemaps[i].forEach((v) => {
                let row = newRow(1);
                row.children[0].value = i;
                row.children[1].value = v;
                div.appendChild(row);
            })
        }
    }

    this.processRemappingDiv = () => {
        this.settings.inputRemaps = {};
        let div = this.remappingDiv.querySelectorAll("div")[0];
        for (let i = 0; i < div.children.length; i++) {
            let row = div.children[i];
            this.settings.inputRemaps[row.children[0].value] = row.children[1].value;
        }
        this.settings.outputRemaps = {};
        div = this.remappingDiv.querySelectorAll("div")[1];
        for (let i = 0; i < div.children.length; i++) {
            let row = div.children[i];
            if (!this.settings.outputRemaps[row.children[0].value]) this.settings.outputRemaps[row.children[0].value] = [];
            this.settings.outputRemaps[row.children[0].value].push(row.children[1].value);
        }
    }

    //initilisation
    this.fromSaveData(_type);
};