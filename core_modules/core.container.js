//container. Wrapper around an operator.
//child is this.operator.
polymorph_core.container = function container(containerID) {
    this.id = containerID;// necessary when rect passes container down to chilren.
    polymorph_core.containers[containerID] = this;
    //settings and data management
    //#region
    //regions are a vscode thing that allow you to hide stuff without putting it in blocks. It's great. Get vscode.

    Object.defineProperty(this, "settings", {
        get: () => {
            return polymorph_core.items[containerID]._od;
        }
    })

    //with our new getter model, default settings are a little harder.
    let defaultSettings = {
        t: "opSelect",
        data: {},
        inputRemaps: {},
        outputRemaps: {},
        tabbarName: "New Operator"
    };
    Object.assign(defaultSettings, this.settings);
    polymorph_core.items[containerID]._od = defaultSettings;

    Object.defineProperty(this, "rect", {
        get: () => {
            return polymorph_core.rects[this.settings.p];
        }
    })

    //topmost 'root' div.
    this.outerDiv = htmlwrap(`<div style="width:100%;height:100%; background:rgba(230, 204, 255,0.1)"></div>`);

    //inner div. for non shadow divs. has a uuid for an id so that it can be referred to uniquely by the operator. (this is pretty redundant imo)
    this.innerdiv = document.createElement("div");
    this.outerDiv.appendChild(this.innerdiv);
    this.innerdiv.id = guid(12);

    //shadow root.
    this.shader = document.createElement("div");
    this.shader.style.width = "100%";
    this.shader.style.height = "100%";
    this.outerDiv.appendChild(this.shader);
    this.shadow = this.shader.attachShadow({
        mode: "open"
    });
    //#endregion

    this.waitOperatorReady = (type, data) => {
        let h1 = document.createElement("h1");
        h1.innerHTML = "Loading operator...";
        this.innerdiv.appendChild(h1);
        this.shader.style.display = "none";
        if (!polymorph_core.operatorLoadCallbacks[type]) polymorph_core.operatorLoadCallbacks[type] = [];
        polymorph_core.operatorLoadCallbacks[type].push({
            op: this,
            data: data
        });
    };

    //bulkhead for item selection.
    this.bulkhead = document.createElement("div");
    this.bulkhead.style.cssText = `display: none; background: rgba(0,0,0,0.5); width: 100%; height: 100%; position: absolute; zIndex: 100`
    //bulkhead styling
    this.bulkhead.innerHTML = `<div style="display: flex; width:100%; height: 100%;"><p style="margin:auto; color:white"></p></div>`
    this.outerDiv.appendChild(this.bulkhead);
    this.bulkhead.addEventListener("click", (e) => {
        this.bulkhead.style.display = "none";
        polymorph_core.submitTarget(containerID);
        e.stopPropagation();
    })

    //Interfacing with the underlying operator
    this.visible = () => {
        return this.outerDiv.offsetHeight != 0;
    }

    this.refresh = function () {
        if (this.operator.refresh) this.operator.refresh();
    }

    //event remapping
    addEventAPI(this);
    this._on = this.on;
    //we need the garbagecollector to work still
    this.on = (e, f) => {
        if (e == "updateItem") polymorph_core.on("updateItem", f);
        else (this._on(e, f));
    }
    this.incomingEvents = [];
    this.on("*", (args, e) => {

        for (let i = 0; i < this.incomingEvents.length; i++) {
            if (this.incomingEvents[i].e == e && this.incomingEvents[i].args == args) return;
        }

        if (this.settings.outputRemaps[e]) e = this.settings.outputRemaps[e];
        else {
            e = [e, e + "_" + containerID];
        }

        e.forEach((v) => {
            polymorph_core.fire(v, args);
        })

    })

    polymorph_core.on("*", (args, e) => {
        //with this setup, updateItem will be called twice - so dont handle updateItem
        if (e == "updateItem") return;
        this.incomingEvents.push({ e: e, args: args });
        if (this.settings.inputRemaps[e] != undefined) e = this.settings.inputRemaps[e];
        this.fire(e, args);
        this.incomingEvents.pop();
    })

    //Input event remapping
    //#region
    this.remappingDiv = document.createElement("div");
    this.remappingDiv.innerHTML = `
    <h3>Input Remaps</h3>
    <p>Remap calls from the polymorph_core to internal calls, to change operator behaviour.</p>
    <p>This operator's ID: ${containerID}</p>
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
            elem = htmlwrap(`<p>polymorph_core fires <input>, we process<select></select><button>x</button></p>`);
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
        this.remappingDiv.children[2].innerText = `This operator's ID: ${containerID}`;
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
    //#endregion

    //saving and loading
    //#region
    this.toSaveData = () => {
        this.settings.data = this.operator.toSaveData();
        return this.settings;
    };

    //parse options and decide what to do re: a div
    if (polymorph_core.operators[this.settings.t]) {
        let options = polymorph_core.operators[this.settings.t].options;
        //clear the shadow and the div
        if (options.noShadow) {
            this.div = this.innerdiv;
        } else {
            this.div = this.shadow;
        }
        if (options.outerScroll) {
            this.outerDiv.style.overflowY = "auto";
        } else {
            this.outerDiv.style.overflowY = "hidden";
        }
        try {
            this.operator = new polymorph_core.operators[this.settings.t].constructor(this, this.settings.data);
            this.operator.container = this;
        } catch (e) {
            console.log(e);
        }
    } else {
        this.waitOperatorReady(this.settings.t, this.settings._data);
    }
    //#endregion

    //Attach myself to a rect
    if (this.settings.p && polymorph_core.items[this.settings.p]._rd) {
        //there is or will be a rect for it.
        if (polymorph_core.rects[this.settings.p]) {
            polymorph_core.rects[this.settings.p].tieContainer(containerID);
        } else {
            if (!polymorph_core.rectLoadCallbacks[this.settings.p]) polymorph_core.rectLoadCallbacks[this.settings.p] = [];
            polymorph_core.rectLoadCallbacks[this.settings.p].push(rectID);
        }
    }

};



// targeter
polymorph_core.targeter = undefined;
polymorph_core.dialoghide = false;
polymorph_core.submitTarget = function (id) {
    if (me.targeter) {
        me.targeter(id); //resolves promise
        me.targeter = undefined;
        //untarget everything
        me.baseRect.deactivateTargets();
        if (polymorph_core.dialoghide) {
            me.dialog.div.style.display = "block";
            polymorph_core.dialoghide = false;
        }
    }
}
polymorph_core.target = function () {
    // activate targeting
    me.baseRect.activateTargets();
    if (me.dialog.div.style.display == "block") {
        polymorph_core.dialoghide = true;
        me.dialog.div.style.display = "none";
    }
    let promise = new Promise((resolve) => {
        me.targeter = resolve;
    })
    return promise;
}