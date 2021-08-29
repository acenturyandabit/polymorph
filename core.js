// Items are just native objects now 
function _polymorph_core() {
    //Event API. pretty important, it turns out.

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
        itm.fire = function(e, args) {
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
        itm.on = function(e, f) {
            let _e = e.split(',');
            _e.forEach((i) => {
                if (!itm.events[i]) itm.events[i] = {};
                if (!itm.events[i].events) itm.events[i].events = [];
                itm.events[i].events.push(f);
            })
        };
        itm.cetch = function(i, f) {
            if (!itm.events[i]) itm.events[i] = {};
            if (!itm.events[i].cetches) itm.events[i].cetches = [];
            itm.events[i].cetches.push(f);
        }
    }

    this.addEventAPI(this);

    this._option = (function() {
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
            this.load = function() {
                let actualObject = iff(settings.object);
                if (!actualObject) console.log("Warning: attempt to reference an undefined object");
                else {
                    switch (settings.type) {
                        case "bool":
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

    //we need to update userdata  to the latest version as necessary... 

    // Starting function: this is only called once
    this.start = () => {
        this.fire("UIsetup");
        this.fire("UIstart");
        this.resetDocument();
        this.handleURL();
    }

    Object.defineProperty(this, "currentDoc", {
        get: () => {
            return this.items._meta;
        }
    })

    //Document level functions
    this.updateSettings = (isLoading) => {
        this.documentTitleElement.innerText = this.items._meta.displayName;
        document.querySelector("title").innerHTML =
            this.items._meta.displayName + " - Polymorph";
        if (!isLoading) this.filescreen.saveRecentDocument(this.currentDocID, undefined, this.items._meta.displayName);
        this.fire("updateSettings");
    };

    let tc = new capacitor(1000, 10, () => {
            polymorph_core.fire("updateDoc");
        })
        //title updates
    this.on("UIstart", () => {
        if (!this.documentTitleElement) {
            this.documentTitleElement = document.createElement("a");
            this.documentTitleElement.contentEditable = true;
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

}

var polymorph_core = new _polymorph_core();



// http://www.w3.org/TR/AERT#color-contrast
function matchContrast(col) {
    var colours = {
        "aliceblue": "#f0f8ff",
        "antiquewhite": "#faebd7",
        "aqua": "#00ffff",
        "aquamarine": "#7fffd4",
        "azure": "#f0ffff",
        "beige": "#f5f5dc",
        "bisque": "#ffe4c4",
        "black": "#000000",
        "blanchedalmond": "#ffebcd",
        "blue": "#0000ff",
        "blueviolet": "#8a2be2",
        "brown": "#a52a2a",
        "burlywood": "#deb887",
        "cadetblue": "#5f9ea0",
        "chartreuse": "#7fff00",
        "chocolate": "#d2691e",
        "coral": "#ff7f50",
        "cornflowerblue": "#6495ed",
        "cornsilk": "#fff8dc",
        "crimson": "#dc143c",
        "cyan": "#00ffff",
        "darkblue": "#00008b",
        "darkcyan": "#008b8b",
        "darkgoldenrod": "#b8860b",
        "darkgray": "#a9a9a9",
        "darkgreen": "#006400",
        "darkkhaki": "#bdb76b",
        "darkmagenta": "#8b008b",
        "darkolivegreen": "#556b2f",
        "darkorange": "#ff8c00",
        "darkorchid": "#9932cc",
        "darkred": "#8b0000",
        "darksalmon": "#e9967a",
        "darkseagreen": "#8fbc8f",
        "darkslateblue": "#483d8b",
        "darkslategray": "#2f4f4f",
        "darkturquoise": "#00ced1",
        "darkviolet": "#9400d3",
        "deeppink": "#ff1493",
        "deepskyblue": "#00bfff",
        "dimgray": "#696969",
        "dodgerblue": "#1e90ff",
        "firebrick": "#b22222",
        "floralwhite": "#fffaf0",
        "forestgreen": "#228b22",
        "fuchsia": "#ff00ff",
        "gainsboro": "#dcdcdc",
        "ghostwhite": "#f8f8ff",
        "gold": "#ffd700",
        "goldenrod": "#daa520",
        "gray": "#808080",
        "green": "#008000",
        "greenyellow": "#adff2f",
        "honeydew": "#f0fff0",
        "hotpink": "#ff69b4",
        "indianred ": "#cd5c5c",
        "indigo": "#4b0082",
        "ivory": "#fffff0",
        "khaki": "#f0e68c",
        "lavender": "#e6e6fa",
        "lavenderblush": "#fff0f5",
        "lawngreen": "#7cfc00",
        "lemonchiffon": "#fffacd",
        "lightblue": "#add8e6",
        "lightcoral": "#f08080",
        "lightcyan": "#e0ffff",
        "lightgoldenrodyellow": "#fafad2",
        "lightgrey": "#d3d3d3",
        "lightgreen": "#90ee90",
        "lightpink": "#ffb6c1",
        "lightsalmon": "#ffa07a",
        "lightseagreen": "#20b2aa",
        "lightskyblue": "#87cefa",
        "lightslategray": "#778899",
        "lightsteelblue": "#b0c4de",
        "lightyellow": "#ffffe0",
        "lime": "#00ff00",
        "limegreen": "#32cd32",
        "linen": "#faf0e6",
        "magenta": "#ff00ff",
        "maroon": "#800000",
        "mediumaquamarine": "#66cdaa",
        "mediumblue": "#0000cd",
        "mediumorchid": "#ba55d3",
        "mediumpurple": "#9370d8",
        "mediumseagreen": "#3cb371",
        "mediumslateblue": "#7b68ee",
        "mediumspringgreen": "#00fa9a",
        "mediumturquoise": "#48d1cc",
        "mediumvioletred": "#c71585",
        "midnightblue": "#191970",
        "mintcream": "#f5fffa",
        "mistyrose": "#ffe4e1",
        "moccasin": "#ffe4b5",
        "navajowhite": "#ffdead",
        "navy": "#000080",
        "oldlace": "#fdf5e6",
        "olive": "#808000",
        "olivedrab": "#6b8e23",
        "orange": "#ffa500",
        "orangered": "#ff4500",
        "orchid": "#da70d6",
        "palegoldenrod": "#eee8aa",
        "palegreen": "#98fb98",
        "paleturquoise": "#afeeee",
        "palevioletred": "#d87093",
        "papayawhip": "#ffefd5",
        "peachpuff": "#ffdab9",
        "peru": "#cd853f",
        "pink": "#ffc0cb",
        "plum": "#dda0dd",
        "powderblue": "#b0e0e6",
        "purple": "#800080",
        "rebeccapurple": "#663399",
        "red": "#ff0000",
        "rosybrown": "#bc8f8f",
        "royalblue": "#4169e1",
        "saddlebrown": "#8b4513",
        "salmon": "#fa8072",
        "sandybrown": "#f4a460",
        "seagreen": "#2e8b57",
        "seashell": "#fff5ee",
        "sienna": "#a0522d",
        "silver": "#c0c0c0",
        "skyblue": "#87ceeb",
        "slateblue": "#6a5acd",
        "slategray": "#708090",
        "snow": "#fffafa",
        "springgreen": "#00ff7f",
        "steelblue": "#4682b4",
        "tan": "#d2b48c",
        "teal": "#008080",
        "thistle": "#d8bfd8",
        "tomato": "#ff6347",
        "turquoise": "#40e0d0",
        "violet": "#ee82ee",
        "wheat": "#f5deb3",
        "white": "#ffffff",
        "whitesmoke": "#f5f5f5",
        "yellow": "#ffff00",
        "yellowgreen": "#9acd32"
    };
    //returns either black or white from either a #COLOR or a rgb(color) or a name.
    cols = /\#(..)(..)(..)/i.exec(col)
    if (!cols) {
        cols = /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(col);
        if (!cols) {
            //its probably a name color
            col = col.toLowerCase();
            if (colours[col]) {
                return matchContrast(colours[col]);
            } else return "black"; //no idea
        }
    } else {
        cols = [cols[0], cols[1], cols[2], cols[3]];
        cols[1] = parseInt(cols[1], 16);
        cols[2] = parseInt(cols[2], 16);
        cols[3] = parseInt(cols[3], 16);
    }
    if (!cols) throw "Invalid color: " + col;
    let value = Math.round(((parseInt(cols[1]) * 299) +
        (parseInt(cols[2]) * 587) +
        (parseInt(cols[3]) * 114)) / 1000);
    return (value > 125) ? 'black' : 'white';
}