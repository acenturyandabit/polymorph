// Items are just native objects now 
function _polymorph_core() {
    //Event API. Controls all underlying events.

    this.guid = (count = 6, priorkeys) => {
        let pool = "1234567890qwertyuiopasdfghjklzxcvbnm";
        let newGuid = "";
        do {
            newGuid = "";
            for (i = 0; i < count; i++) newGuid += pool[Math.floor(Math.random() * pool.length)];
        } while (priorkeys && (priorkeys[i] ||
            (priorkeys.length != undefined && priorkeys.includes(i))
        ));
        return newGuid;
    }

    this.addEventAPI = (itm, errf = console.error) => {
        itm.events = {};
        itm.fire = function (e, args) {
            let _e = e.split(",");
            let _oe = e.split(","); //original elevents
            _e.push("*"); // a wildcard event listener
            _e.forEach((i) => {
                if (!itm.events[i]) return;
                //prime the ketching function with a starter object to prime it.
                let cnt = true;
                if (itm.events[i].cetches) itm.events[i].cetches.forEach((f) => {
                    if (cnt != false) cnt = f(args, true, e)
                });
                //fire each event
                if (itm.events[i].events) {
                    itm.events[i].events.forEach((f) => {
                        if (cnt == false) return;
                        try {
                            result = f(args, _oe);
                            if (itm.events[i].cetches) itm.events[i].cetches.forEach((f) => {
                                if (cnt != false) cnt = f(result, undefined, i)
                            });
                        } catch (er) {
                            errf(er);
                        }

                    });
                }
                if (itm.events[i].cetches) itm.events[i].cetches.forEach((f) => (f(args, false, e)));
            })
        };
        itm.on = function (e, f) {
            let _e = e.split(',');
            _e.forEach((i) => {
                if (!itm.events[i]) itm.events[i] = {};
                if (!itm.events[i].events) itm.events[i].events = [];
                itm.events[i].events.push(f);
            })
        };
        itm.cetch = function (i, f) {
            if (!itm.events[i]) itm.events[i] = {};
            if (!itm.events[i].cetches) itm.events[i].cetches = [];
            itm.events[i].cetches.push(f);
        }
    }

    this.addEventAPI(this);

    this._option = (function () {
        //snippet that pre-evaluates functions, so that we can quickly load dynmaics
        function iff(it) {
            if (typeof it == "function") {
                return it();
            } else return it;
        }

        function _option(settings) {
            let appendedElement;
            ///////////////////////////////////////////////////////////////////////////////////////
            //Create the input and register an event handler
            switch (settings.type) {
                case "bool":
                case "boolean":
                    appendedElement = document.createElement("input");
                    appendedElement.type = "checkbox";
                    appendedElement.addEventListener("input", (e) => {
                        let actualObject = iff(settings.object);
                        if (typeof actualObject != "object") actualObject = {}; // this doesnt always work :///
                        if (settings.beforeInput) settings.beforeInput(e);
                        actualObject[settings["property"]] = appendedElement.checked;
                        if (settings.afterInput) settings.afterInput(e);
                    })
                    break;
                case "textarea":
                case "text":
                case "number":
                    appendedElement = document.createElement(settings.type == "textarea" ? "textarea" : "input");
                    appendedElement.style.display = "block";
                    appendedElement.addEventListener("input", (e) => {
                        let actualObject = iff(settings.object);
                        if (typeof actualObject != "object") actualObject = {};
                        if (settings.beforeInput) settings.beforeInput(e);
                        actualObject[settings["property"]] = appendedElement.value;
                        if (settings.afterInput) settings.afterInput(e);
                    })
                    break;
                case "select":
                    appendedElement = document.createElement("select");
                    appendedElement.addEventListener("click", (e) => { //apparently click is better than change or select
                        let actualObject = iff(settings.object);
                        if (typeof actualObject != "object") actualObject = {};
                        if (settings.beforeInput) settings.beforeInput(e);
                        actualObject[settings["property"]] = appendedElement.value;
                        if (settings.afterInput) settings.afterInput(e);
                    })
                    break;
                case "array":
                    appendedElement = document.createElement("div");
                    appendedElement.style.display = "flex";
                    appendedElement.style.flexDirection = "column";
                    appendedElement.addEventListener("input", (e) => {
                        let actualObject = iff(settings.object);
                        if (!actualObject[settings["property"]]) actualObject[settings["property"]] = [];
                        let te = e.target.parentElement;
                        let index = 0;
                        while (te.previousElementSibling) {
                            te = te.previousElementSibling;
                            index++;
                        }
                        actualObject[settings['property']][index] = e.target.value;
                    });
                    appendedElement.addEventListener("click", (e) => {
                        let actualObject = iff(settings.object);
                        if (e.target.tagName != "BUTTON") return;
                        if (!actualObject[settings["property"]]) actualObject[settings["property"]] = [];
                        if (e.target.innerText == "+") {
                            let s = document.createElement("span");
                            s.innerHTML = `<input><button>x</button>`;
                            s.style.width = "100%";
                            appendedElement.insertBefore(s, appendedElement.children[appendedElement.children.length - 1]);
                            actualObject[settings['property']].push("");
                        } else {
                            let index = 0;
                            let te = e.target.parentElement;
                            while (te.previousElementSibling) {
                                te = te.previousElementSibling;
                                index++;
                            }
                            actualObject[settings['property']].splice(index, 1);
                            e.target.parentElement.remove();
                        }
                    });
                    break;
                case 'button':
                    appendedElement = document.createElement("button");
                    appendedElement.innerText = settings.label;
                    appendedElement.addEventListener("click", (e) => {
                        settings.fn();
                    })
                    break;
            }
            if (settings.placeholder) appendedElement.placeholder = settings.placeholder;
            if (settings.label && settings.type != "button") {
                let lb = document.createElement("label");
                lb.innerHTML = settings.label;
                lb.appendChild(appendedElement);
                lb.style.display = "flex";
                lb.style.justifyContent = "space-between";
                settings.div.appendChild(lb);
            } else {
                //create ghost wrapper so element doesnt become inoperable
                let lb = document.createElement("label");
                lb.innerHTML = "&nbsp;";
                lb.appendChild(appendedElement);
                lb.style.display = "flex";
                lb.style.justifyContent = "space-between";
                settings.div.appendChild(lb);
            }
            //initially load the property value.
            this.load = function () {
                let actualObject = iff(settings.object);
                if (!actualObject) console.log("Warning: attempt to reference an undefined object");
                else {
                    switch (settings.type) {
                        case "bool":
                        case "boolean":
                            if (actualObject[settings["property"]]) appendedElement.checked = actualObject[settings["property"]];
                            else appendedElement.checked = false;
                            break;
                        case "text":
                        case "textarea":
                        case "number":
                            if (actualObject[settings["property"]]) appendedElement.value = actualObject[settings["property"]] || "";
                            else appendedElement.value = "";
                            break;
                        case "select":
                            //clear my div
                            appendedElement.innerHTML = "";
                            let _source = iff(settings.source);
                            //if source is an array
                            if (_source.length) {
                                //differentiate between array of objects and array of string
                                _source.forEach(i => {
                                    let op = document.createElement("option");
                                    op.innerText = i;
                                    op.value = i;
                                    appendedElement.appendChild(op);
                                })
                            } else
                                for (let i in _source) {
                                    let op = document.createElement("option");
                                    op.innerText = _source[i];
                                    op.value = i;
                                    appendedElement.appendChild(op);
                                }
                            if (actualObject[settings["property"]]) appendedElement.value = actualObject[settings["property"]];
                            break;
                        case "array": //array of text
                            while (appendedElement.children.length) appendedElement.children[0].remove();
                            if (actualObject[settings["property"]])
                                for (let i = 0; i < actualObject[settings['property']].length; i++) {
                                    let s = document.createElement("span");
                                    s.innerHTML = `<input value="${actualObject[settings['property']][i]}"><button>x</button>`;
                                    s.style.width = "100%";
                                    appendedElement.appendChild(s);
                                }
                            let b = document.createElement("button");
                            b.innerHTML = "+";
                            b.style.width = "100%";
                            appendedElement.appendChild(b);
                            break;
                    }
                }
            }
            this.appendedElement = appendedElement;
        }

        return _option;
    })();


    //Reallly low level user identification, etc.
    //#region
    this.saveUserData = () => {
        localStorage.setItem("pm_userData", JSON.stringify(this.userData));
    };

    this.userData = {
        documents: {},
        uniqueID: this.guid(7),
        itemsCreatedCount: 0,
    }

    Object.assign(this.userData, JSON.parse(localStorage.getItem("pm_userData")));
    //#endregion


    Object.defineProperty(this, "currentDoc", {
        get: () => {
            return this.items._meta;
        }
    })

    //Document level functions
    this.updateSettings = () => {
        this.documentTitleElement.innerText = this.items._meta.displayName;
        if (!polymorph_core.isStaticMode()) {
            document.querySelector("title").innerHTML =
                this.items._meta.displayName + " - Polymorph";
        }
        if (!polymorph_core.isLoading) this.filescreen.saveRecentDocument(this.currentDocID, undefined, this.items._meta.displayName);
        this.fire("updateSettings");
    };

    this.on("updateSettings", (d) => {
        this.fire("updateItem", { id: "_meta" });
    })
    let tc = new capacitor(1000, 10, () => {
        polymorph_core.fire("updateSettings");
    });
    //title updates
    this.on("UIstart", () => {
        if (!this.documentTitleElement) {
            this.documentTitleElement = document.createElement("a");
            if (!this.isStaticMode()) {
                this.documentTitleElement.contentEditable = true;
            }
            this.topbar.add("titleElement", this.documentTitleElement);
        }
        this.documentTitleElement.addEventListener("keyup", () => {
            this.items._meta.displayName = this.documentTitleElement.innerText;
            tc.submit();
            document.querySelector("title").innerHTML =
                this.items._meta.displayName + " - Polymorph";
        });
    })

    //Operator registration
    //#region
    this.operators = {};
    this.registerOperator = (type, options, _constructor) => {
        if (_constructor) {
            this.operators[type] = {
                constructor: _constructor,
                options: options
            };
        } else {
            this.operators[type] = {
                constructor: options,
                options: {}
            };
        }
        this.fire("operatorAdded", {
            type: type
        });
        for (let i = 0; i < this.operatorLoadCallbacks[type]; i++) {
            this.operatorLoadCallbacks[type][i].op.fromSaveData(
                this.operatorLoadCallbacks[type][i].data
            );
        }
    };
    //#endregion

    //Item management
    //#region
    this.items = {};

    this.oldCache = {}; // literally a copy of polymorph_core.items.
    this.on("updateItem", (d) => {
        let copyOfItem = JSON.parse(JSON.stringify(this.items[d.id]));
        if (copyOfItem) {
            delete copyOfItem._lu_;
            copyOfItem = JSON.stringify(copyOfItem);
            if (!d.loadProcess && !d.unedit) {
                if (this.oldCache[d.id] && copyOfItem != this.oldCache[d.id]) {
                    //console.log(`updated ${copyOfItem} against ${this.oldCache[d.id]}`)
                    this.items[d.id]._lu_ = Date.now();
                    this.fire("modifiedItem", d);
                }
            }
            this.oldCache[d.id] = copyOfItem;
        }
    })

    let _Rixits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/";

    function b64(n) {
        var rixit; // like 'digit', only in some non-decimal radix 
        var residual = n;
        var result = '';
        while (true) {
            rixit = residual % 64
            result = _Rixits.charAt(rixit) + result;
            residual = Math.floor(residual / 64);
            if (residual == 0)
                break;
        }
        return result;
    }

    //insert an item.
    this.insertItem = (itm) => {
        let UID = `${this.userData.uniqueID}_${b64(Date.now())}_${this.userData.itemsCreatedCount}`;
        this.userData.itemsCreatedCount++;
        this.items[UID] = itm;
        return UID;
    }
    //#endregion

    this.operatorLoadCallbacks = {};
    this.rectLoadCallbacks = {};

    //A shared space for operators to access
    this.shared = {};


    // Starting function: this is only called once by filemanager.
    this.start = (isStaticMode) => {
        this.fire("UIsetup");
        this.fire("UIstart");
        this.resetDocument();
        if (isStaticMode) {
            this.handleStaticData();
        } else {
            this.handleURL();
        }
    }

}

var polymorph_core = new _polymorph_core();


