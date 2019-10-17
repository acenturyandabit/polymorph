//v0.2 Options.js. Shorthand for creating inputs and buttons on divs that relate to properties.

//Usage:
/*
//general: 
To load the option e.g. when a dialog or menu is shown:
op.load();
To retrieve a property: just access it as usual.

//checkbox
let op=new _option({
    div:parent element,
    type:"bool",
    object:Object (an object to retrieve settings at),
    property:String (the name of the property value in the object. e.g. if object=cabbage and property='tastiness', you could retrieve the option value at cabbage.tastiness.),
    label:String (the label associated with the input.)
});

//text
let op=new _option({
    div:parent element,
    type:"text",
    object:Object (an object to retrieve settings at),
    property:String (the name of the property value in the object. e.g. if object=cabbage and property='tastiness', you could retrieve the option value at cabbage.tastiness.),
    label:String (The label associated with the input.)
});

//select
let op=new _option({
    div:parent element,
    type:"select",
    object:Object (an object to retrieve settings at),
    property:String (the name of the property value in the object. e.g. if object=cabbage and property='tastiness', you could retrieve the option value at cabbage.tastiness.),
    source: Array / object / function to get objects from.
    label:String (the label associated with the input.)
});

//List (Advanced form of select with multiple options)


*/
function isPhone() {
    var mobiles = [
        "Android",
        "iPhone",
        "Linux armv8l",
        "Linux armv7l",
        "Linux aarch64"
    ];
    if (mobiles.includes(navigator.platform) || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true;
    }
    return false;
}

var _option = (function () {
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
                    if (typeof actualObject != "object") actualObject = {};// this doesnt always work :///
                    if (settings.beforeInput) settings.beforeInput(e);
                    actualObject[settings["property"]] = appendedElement.checked;
                    if (settings.afterInput) settings.afterInput(e);
                })
                break;
            case "text":
                appendedElement = document.createElement("input");
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
                appendedElement.addEventListener("changed", (e) => {
                    let actualObject = iff(settings.object);
                    if (typeof actualObject != "object") actualObject = {};
                    if (settings.beforeInput) settings.beforeInput(e);
                    actualObject[settings["property"]] = appendedElement.value;
                    if (settings.afterInput) settings.afterInput(e);
                })
                break;
            case "array":
                appendedElement = document.createElement("div");
                appendedElement.style.display="flex";
                appendedElement.style.flexDirection="column";
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
                        appendedElement.insertBefore(s,appendedElement.children[appendedElement.children.length-1]);
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
        }
        if (!isPhone()) appendedElement.style.float = "right";
        if (settings.label) {
            let lb = document.createElement("label");
            lb.innerHTML = settings.label;
            lb.appendChild(appendedElement);
            lb.style.display = "block";
            lb.style.margin = "3px";
            settings.div.appendChild(lb);
        } else {
            settings.div.appendChild(appendedElement);
        }
        //initially load the property value.
        this.load = function () {
            let actualObject = iff(settings.object);
            if (!actualObject) console.log("Warning: attempt to reference an undefined object");
            else {
                switch (settings.type) {
                    case "bool":
                        if (actualObject[settings["property"]]) appendedElement.checked = actualObject[settings["property"]];
                        else appendedElement.checked = false;
                        break;
                    case "text":
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
                        if (actualObject[settings["property"]]) for (let i = 0; i < actualObject[settings['property']].length; i++) {
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
    }

    return _option;
})();