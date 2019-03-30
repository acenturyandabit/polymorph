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
    function getPath(id){
        let cit = id;
        let pathstr;
        if (cit) {
            pathstr = cit;
            while (core.items[cit].links && core.items[cit].links.parent) {
                cit = core.items[cit].links.parent
                pathstr = cit + ">" + pathstr;
            }
        } else pathstr = "";
        pathstr = pathstr + ">";
    }
    function getParentPath(id){
        if (core.items[id].links && core.items[id].links.parent){
            return getPath(core.items[id].links.parent);
        }
        else return ">";
    }
    let operatorRegexes = {
        echo: {
            help: "Type echo $1 to echo something.",
            regex: /echo (.+)/ig,
            operate: function (regres, state) {
                state.output(regres[1]);
            }
        },
        co: {
            regex: /^co(?: (.+))*$/ig,
            help: "This command can be thought of an equivalent to cd, for operators. Type co $1 to focus on an operator, or simply co to output the current operator.",
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
        },
        lo: {
            regex: /^lo$/ig,
            help: "This command can be thought of as an equivalent to ls, for operators. Type lo to list all available operators and their types.",
            operate: function (regres, state) {
                state.output(JSON.stringify(core.listOperators()));
            }
        },
        lai: {
            regex: /^lai$/ig,
            help: "This command can be thought of as an equivalent to ls, for items. Type lo to list all available items, in full detail.",
            operate: function (regres, state) {
                state.output(JSON.stringify(core.getItems()));
            }
        },
        mki: {
            regex: /^mki (.+)$/ig,
            help: "This command can be thought of as an equivalent to mkdir, for items. Type mkitm $1 $2 to make an item called $1 in the current path, with title $2.",
            operate: function (regres, state) {
                let it = new _item();
                it.links={};
                if (state.state.path)it.links.parent = state.state.path;
                it.title = regres[1];
                let safetitle=it.title.replace(/ /ig,"_");
                core.items[safetitle]=it;
                state.output(safetitle+":"+JSON.stringify(it));
            }
        },
        li: {
            regex: /^li$/ig,
            help: "This command can be thought of as an equivalent to ls, for items in the current path. Type lo to list all available items in the current path.",
            operate: function (regres, state) {
                if (state.state.path) {
                    for (let i in core.items) {
                        if (core.items[i].links && core.items[i].links.parent == state.state.path) {
                            state.output(core.items[i]);
                        }
                    }
                }else{
                    state.output(JSON.stringify(core.getItems()));
                }
            }
        },
        ci: {
            regex: /^ci(?: (.+))*$/ig,
            help: "This command can be thought of as an equivalent to cd, for the current path. Type ci by itself to list the current path; or type cd $1 to navigate to $1.",
            operate: function (regres, state) {
                if (regres[1]) {
                    if (core.items[regres[1]]) {
                        state.state.path = regres[1];
                    }
                    state.output("Switched to " + regres[1]);
                } else {
                    state.output(getPath(state.state.path));
                }
            }
        },
        ni: {
            regex: /^ni (.+?)(?: \"(.+?)\")?(?: \"(.+?)\")?$/ig,
            help: "This command can be thought of as an equivalent to nano, for items. Type ni $1 to display item i, or ni $1 \"$2\" to set the title of $1 to $2, and ni $1 \"$2\" \"$3\" to set property $2 on item $1 to $3.",
            operate: function (regres, state) {
                let cit=core.items[regres[1]];
                if (!cit){
                    state.output("No such item "+ regres[1] +" found. Use mki $1 to create an item.");
                    return;
                }
                if (getPath(state.state.path)!=getParentPath(state.state.path)){
                    state.output("Item "+ regres[1] +" found, but not at current path. Navigate to "+getParentPath(state.state.path)+" to edit this item, [or use nd with the same arguments.]");
                    return 
                }
                if (regres[3]) {
                    cit[regres[2]]=regres[3];
                }else if (regres[2]){
                    cit.title=regres[2];
                }
                state.output(cit);
            }
        },
        help: {
            regex: /^help(?: (.+))*$/ig,
            help: "For more help, type help $1 for more information on command $1.",
            operate: function (regres, state) {
                if (regres[1]) {
                    for (let i in operatorRegexes) {
                        if (regres[1] == i) {
                            state.output(i);
                            state.output(operatorRegexes[i].help);
                        }
                    }
                } else {
                    state.output("For more help, type help + the name of the command.");
                    state.output("Commands available:");
                    for (let i in operatorRegexes) {
                        state.output(i);
                    }
                }
            }
        },
        cls: {
            regex: /^cls$/ig,
            name: "cls",
            help: "Clears the screen.",
            operate: function (regres, state) {
                state.clearScreen();
            }
        },
        call: {
            name: "call",
            help: "Call a callable function on the current operator.",
            regex: /^call (.+?)\((.+)\)$/ig,
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
        },
        fx: {
            regex: /^fx$/ig,
            help: "List callable functions on the currently selected operator.",
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
        }
    };
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
        clearScreen: function () {
            me.textarea.value = "";
        }
    }

    this.state.state = this.settings.state;

    function processQuery(q) {
        for (let i in operatorRegexes) {
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
        this.state.state = this.settings.state;
        if (!this.state.state) this.state.state = {};
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