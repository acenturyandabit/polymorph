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
var _option=(function(){
    //snippet that pre-evaluates functions, so that we can quickly load dynmaics
    function iff(it){
        if (typeof it =="function"){
            return it();
        }else return it;
    }
    
    function _option(settings) {
        let appendedElement;
        ///////////////////////////////////////////////////////////////////////////////////////
        //Create the input and register an event handler
        switch (settings.type) {
            case "bool":
                appendedElement = document.createElement("input");
                appendedElement.type = "checkbox";
                appendedElement.addEventListener("input", () => {
                    let actualObject=iff(settings.object);
                    actualObject[settings["property"]] = appendedElement.checked;
                })
                break;
            case "text":
                appendedElement = document.createElement("input");
                appendedElement.style.display="block";
                appendedElement.addEventListener("input", () => {
                    let actualObject=iff(settings.object);
                    actualObject[settings["property"]] = appendedElement.value;
                })
                break;
            case "select":
                appendedElement = document.createElement("select");
                appendedElement.addEventListener("changed", () => {
                    let actualObject=iff(settings.object);
                    actualObject[settings["property"]] = appendedElement.value;
                })
                break;
        }
        if (settings.label) {
            let lb = document.createElement("label");
            lb.innerHTML = settings.label;
            lb.appendChild(appendedElement);
            lb.style.display = "block";
            settings.div.appendChild(lb);
        } else {
            settings.div.appendChild(appendedElement);
        }
        //initially load the property value.
        this.load = function () {
            let actualObject=iff(settings.object);
            switch (settings.type) {
                case "bool":
                    if (actualObject[settings["property"]])appendedElement.checked = actualObject[settings["property"]];
                    else appendedElement.checked = false;
                    break;
                case "text":
                    if (actualObject[settings["property"]])appendedElement.value = actualObject[settings["property"]] || "";
                    else appendedElement.value ="";
                    break;
                case "select":
                    //clear my div
                    appendedElement.innerHTML="";
                    let _source = iff(settings.source);
                    //if source is an array
                    if (_source.length){
                        //differentiate between array of objects and array of string
                    }else
                    for (let i in _source){
                        let op=document.createElement("option");
                        op.innerText=_source[i];
                        op.value=i;
                        appendedElement.appendChild(op);
                    }
                    if (settings["object"][settings["property"]])appendedElement.value = settings["object"][settings["property"]];
                    break;
            }
        }
    }

    return _option;
})()


/*To integrate (when you have time)

//Options manager V 0.1 A quick way of creating a standardised options menu.
//Usage:
//Pass an object 'userSettings' to the intialisation of optionsmanager.

//userSettings detail:
/*
{
    root: div; where the settings should be initailised
    head: string; // The name to be displayed at the top of the options box.
    opts: [
        {
            id: string; the name of the option
            prompt: string; A prompt for the user.
            type: string; one of various types of options.
            validator: (data)=>{}; return true or false for validating an option. If left uninitialised, any value will be accepted.
        }
    ]
    access:{
        read: (id,callback,data)=>{
            //use some sort of saving system to read a key 'id'. Pass the value of 'id' as the first argument of continue.
            if (data){
                callback(data[id]);
            }else{
                callback(fetch(id)); 
            }
            //The callback function is used because data fetching may be asynchronous. No biggie if it's synchronous.
        }; 
        write: (id, val)=>{}; save a property based on a string id. It will be passed the ID for the options in opts. Self is the optionsmanager; you can probably access some property to assist in context menus.
    }
}

Other functions:
optionsManager.update(data){
    Load the current form with the specified data. For each option, the read() function will be called with data as the second argument.
}


Different types of prompt: 
text
textarea
checkbox
none

Some default access types: You can pass an object with {type,params} instead of {read,write} for access if you are using these.
(not yet implemented)
{type: "chromeStorageLocal"} : chrome.storage.local storage system.
{type: "localStorage",prefix:"somePrefix"}: localstorage. The prefix will be appended when fetching. 
//





function _optionsManager(userSettings) {
    this.settings = Object.assign({
        //default settings here
        head: "Options",
        opts: []
    }, userSettings);
    //if a root is provided, setup the ui.
    if (this.settings.root) {
        let h1 = document.createElement("h1");
        h1.innerText = this.settings.head;
        this.settings.root.appendChild(h1);
        for (let i = 0; i < this.settings.opts.length; i++) {
            //prompt
            let prompt = document.createElement("p");
            prompt.innerText = this.settings.opts[i].prompt;
            this.settings.root.append(prompt);
            //input creation and initial read; and event handler.
            let ini;
            switch (this.settings.opts[i].type) {
                case "none":
                    break;
                case "text":
                case "checkbox":
                    ini = document.createElement("input");
                    ini.type = this.settings.opts[i].type;
                    ini.dataset.settingID = this.settings.opts[i].id;
                    this.settings.root.append(ini);
                    break;
                case "textarea":
                    ini = document.createElement("textarea");
                    ini.dataset.settingID = this.settings.opts[i].id;
                    this.settings.root.append(ini);
                    break;
            }
            let validator = this.settings.opts[i].validator;
            //initial read
            let me=this;
            this.settings.access.read(this.settings.opts[i].id, (val) => {
                if (val){
                    switch (me.settings.opts[i].type) {
                        case "none":
                            break;
                        case "text":
                        case "textarea":
                            ini.value = val;
                            break;
                        case "checkbox":
                            ini.checked = val;
                            break;
                    }
                }
                //event handling
                ini.addEventListener("change", () => {
                    //Extract from different types of inputs.
                    let extractedValue;
                    switch (ini.type) {
                        case "checkbox":
                            extractedValue = ini.checked;
                            break;
                        default:
                            extractedValue = ini.value;
                    }
                    //validate and write
                    if (!(validator) || validator(extractedValue)) me.settings.access.write(ini.dataset.settingID, extractedValue);
                });
            });
        }
    }
    //Otherwise just load all the settings.
    this.getSetting = function (id, callback) {
        this.settings.access.read(id, callback);
    }
}


*/