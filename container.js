//container. Wrapper around an operator.
//child is this.operator.
core.container = function container(_type, _rect) {
    this.rect = _rect;
    let me = this;

    //options, settings, whatnot
    this.uuid = guid(6);
    this.options = {};
    this.remaps = {
        "focus": "focus",
    };

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

    this.toSaveData = function () {
        let obj = {};
        obj.type = this.type;
        obj.uuid = this.uuid;
        obj.tabbarName = this.tabbarName;
        if (this.operator) obj.data = this.operator.toSaveData();
        else obj.data = {};
        obj.remaps = this.remaps || {};
        return obj;
    };
    this.fromSaveData = function (__type) {
        let data;
        me.options = {
            noShadow: false
        };
        if (typeof __type == "string") {
            this.type = __type;
            this.uuid = guid(6); //make a guid!
        } else {
            this.type = __type.type;
            this.tabbarName = __type.tabbarName;
            this.remaps = __type.remaps || {};
            this.uuid = __type.uuid;
            this.tabbarName = __type.tabbarName;
            if (!this.uuid) this.uuid = guid(6); //upgrade older versions.
            data = __type.data;
        }

        //parse options and decide what to do re: a div
        if (core.operators[this.type]) {
            if (core.operators[this.type].options)
                Object.assign(me.options, core.operators[this.type].options);
            //clear the shadow and the div
            this.shadow.innerHTML = "";
            this.innerdiv.innerHTML = "";
            if (!me.tabbarName) me.tabbarName = core.operators[me.type].options.displayName || me.type;
            if (me.options.noShadow) {
                this.div = this.innerdiv;
            } else {
                this.div = this.shadow;
                this.shader.style.display = "block";
            }
            if (me.options.outerScroll) {
                this.topdiv.style.overflowY = "auto";
            } else {
                this.topdiv.style.overflowY = "hidden";
            }
            try {
                this.operator = new core.operators[this.type].constructor(this);
                if (data) this.operator.fromSaveData(data);
                if (!this.operator.container) this.operator.container = this;
            } catch (e) {
                console.log(e);
            }
        } else {
            this.waitOperatorReady(this.type);
        }
    };

    this.waitOperatorReady = function (__type) {
        let h1 = document.createElement("h1");
        h1.innerHTML = "Loading operator...";
        this.innerdiv.appendChild(h1);
        this.shader.style.display = "none";
        if (!core.operatorLoadCallbacks[__type]) core.operatorLoadCallbacks[__type] = [];
        core.operatorLoadCallbacks[__type].push({
            op: me,
            data: __type
        });
    };

    this.passthrough = function (fname, args) {
        //perhaps the operator has to do some stuff too - so let it do its stuff
        let result;
        if (this[fname]) {
            result = this[fname](args);
        }
        if (this.operator.passthrough) {
            result = result || this.operator.passthrough(fname, args);
        }
        return result;
    }

    //bulkhead for item selection.
    this.bulkhead = document.createElement("div");
    this.bulkhead.style.cssText = `display: none; background: rgba(0,0,0,0.5); width: 100%; height: 100%; position: absolute; zIndex: 100`
    //bulkhead styling
    this.bulkhead.innerHTML = `<div style="display: flex; width:100%; height: 100%;"><p style="margin:auto; color:white"></p></div>`
    this.topdiv.appendChild(this.bulkhead);
    this.bulkhead.addEventListener("click", function (e) {
        me.bulkhead.style.display = "none";
        core.submitTarget(me.uuid);
        e.stopPropagation();
    })

    this.activateTargets = () => {
        // put a grey disabled div on me of the basediv.
        // also put some info about the underlying operator, i.e. what events it fires.
        this.bulkhead.children[0].children[0].innerHTML = "The following events are available from this operator:";
        while (this.bulkhead.children[0].children.length > 1) this.bulkhead.children[1].remove();
        if (!this.operator.passthrough) this.bulkhead.style.display = "block";
    }
    this.deactivateTargets = () => {
        if (!this.operator.passthrough) this.bulkhead.style.display = "none";
    }
    this.getOperator = (id) => {
        if (this.uuid == id) {
            return this;
        }
    }
    this.listOperators = function (list) {
        list.push({ id: me.uuid, type: me.type });
    }

    //Interfacing with the underlying operator
    this.visible = function () {
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
    this.on("*", (args, e) => {
        if (!(args && args.operatorSelfFire)) {
            core.fire(e, args);
            core.fire(e + "_" + this.uuid, args);
        }
    })

    core.on("*", (args, e) => {
        //with this setup, updateItem will be called twice - so dont handle updateItem
        if (e == "updateItem") return;
        if (!args) args = {};
        args.operatorSelfFire = true;
        if (this.remaps[e] != undefined) e = this.remaps[e];
        this.fire(e, args);
    })
    this.remappingDiv = document.createElement("div");
    this.remappingDiv.innerHTML = `
    <h3>Remaps</h3>
    <p>Remap calls from the core to internal calls, to change operator behaviour.</p>
    <p>This operator's ID: ${this.uuid}</p>
    <button>Add another remap...</button>
    `;
    function newRow() {
        return htmlwrap(`<p>core fires <input>, we process<input></p>`);
    }
    this.remappingDiv.children[this.remappingDiv.children.length - 1].addEventListener("click", () => {
        let row = newRow();
        this.remappingDiv.insertBefore(row, this.remappingDiv.children[this.remappingDiv.children.length - 1]);
    })
    this.readyRemappingDiv = () => {
        this.remappingDiv.children[2].innerText = `This operator's ID: ${this.uuid}`;
        while (this.remappingDiv.children.length > 4) this.remappingDiv.children[3].remove();
        for (let i in this.remaps) {
            let row = newRow();
            row.children[0].value = i;
            row.children[1].value = this.remaps[i];
            this.remappingDiv.insertBefore(row, this.remappingDiv.children[this.remappingDiv.children.length - 1]);
        }
    }

    this.processRemappingDiv = () => {
        this.remaps = {};
        for (let i = 3; i < this.remappingDiv.children.length - 1; i++) {
            let row = this.remappingDiv.children[i];
            this.remaps[row.children[0].value] = row.children[1].value;
        }
    }
    //initilisation
    this.fromSaveData(_type);
};