core.registerOperator("terminal", {
    displayName: "Terminal",
    description: "A command-line way of interacting with polymorph. Designed to facilitate integrations with other clients!"
}, function (container) {
    let me = this;
    me.container = container; //not strictly compulsory bc this is expected and automatically enforced - just dont touch it pls.
    this.settings = {};

    this.rootdiv = document.createElement("div");
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.rootdiv.innerHTML = `
    <textarea style="flex: 1 0 auto"></textarea>
    <div>
    <input type="text"></input><button>Send</button>
    </div>
    `;
    this.rootdiv.style.cssText = `display: flex;
    flex-direction: column;
    height: 100%;`;
    let operatorRegexes = [{
        regex: /echo (.+)/ig,
        operate: function (regres, state) {
            state.output(regres[1]);
        }
    }, {
        regex: /cd(?: (.+))*/ig,
        operate: function (regres, state) {
            if (regres[1]) {
                state.operator = core.getOperator(regres[1])
                if (state.operator) {
                    state.state.operator = regres[1];
                    state.output("switched operator: " + regres[1]);
                }
            }
            state.output(JSON.stringify(state.state));
        }
    }, {
        regex: /ls/ig,
        operate: function (regres, state) {
            state.output(JSON.stringify(core.listOperators()));
        }
    }, {
        regex: /call (.+?)\((.+?)\)/ig,
        operate: function (regres, state) {
            if (!state.operator) {
                state.output("No operator selected!");
                return;
            }
            if (state.operator.baseOperator.callables[regres[1]]) {
                try {
                    state.output(state.operator.baseOperator.callables[regres[1]](JSON.parse(regres[2])));
                } catch (e) {
                    state.output(e);
                }
            } else {
                state.output("This operator does not have a function called " + regres[1] + " :/");
            }
        }
    }, {
        regex: /fx/ig,
        operate: function (regres, state) {
            if (!state.operator) {
                state.output("No operator selected!");
                return;
            }
            if (state.operator.baseOperator.callables) {
                state.output(Object.keys(state.operator.baseOperator.callables));
            } else {
                state.output("This operator does not have callable functions :/ Contact the dev and make some suggestions!");
            }
        }
    }]
    container.div.appendChild(this.rootdiv);
    this.state = {
        output: function (data) {
            if (typeof data != "string") {
                data = JSON.stringify(data);
            }
            me.textarea.value += data + "\n";
            if (me.ws) {
                me.ws.send(data);
            }
        },
        state: {}
    }

    function processQuery(q) {
        for (let i = 0; i < operatorRegexes.length; i++) {
            operatorRegexes[i].regex.lastIndex = 0; //force reset regex
            if ((regres = operatorRegexes[i].regex.exec(q))) {
                operatorRegexes[i].operate(regres, me.state);
            }
        }
    }
    this.textarea = this.rootdiv.querySelector("textarea");
    this.querybox = this.rootdiv.querySelector("input");
    this.querybox.addEventListener("keyup", (e) => {
        if (e.key == "Enter") {
            if (me.settings.echoOn) {
                me.state.output(me.querybox.value);
            }
            processQuery(me.querybox.value);
            me.querybox.value = "";
        }
    })
    this.button = this.rootdiv.querySelector("button");
    this.button.addEventListener("click", () => {
        processQuery(me.querybox.value);
        me.querybox.value = "";
    })
    //////////////////Handle core item updates//////////////////

    //Saving and loading
    this.toSaveData = function () {
        this.settings.record = me.textarea.value;
        return this.settings;
    }

    this.fromSaveData = function (d) {
        //this is called when your operator is started OR your operator loads for the first time
        Object.assign(this.settings, d);
        if (this.settings.record) me.textarea.value = this.settings.record;
        this.tryEstablishWS();
    }

    this.tryEstablishWS = function () {
        //close previous ws if open
        if (this.ws) this.ws.close();
        if (this.settings.wsurl) {
            try {
                this.ws = new WebSocket(this.settings.wsurl);
                this.ws.onmessage = function (e) {
                    if (me.settings.echoOn) {
                        me.state.output(e.data);
                    }
                    processQuery(e.data);
                }
            } catch (e) {
                console.log(e);
            }
        }
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `
        <h2>Websocket hook</h2>
        <p>Type an address for a websocket below for I/O to this terminal. </p>
        <input class="wshook" placeholder="Websocket URL (include prefix) - empty for none"></input>
        <button class="wsset">Set websocket</button>
    `;
    let op = new _option({
        div: this.dialogDiv,
        type: "bool",
        object: this.settings,
        property: "echoOn",
        label: "Echo commands"
    });
    this.dialogDiv.querySelector(".wsset").addEventListener("click", () => {
        this.settings.wsurl = this.dialogDiv.querySelector(".wshook").value;
        this.tryEstablishWS();
    })
    this.showDialog = function () {
        op.load();
        if (this.settings.wsurl) this.dialogDiv.querySelector(".wshook").value = this.settings.wsurl;
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // pull settings and update when your dialog is closed.
    }

});