//v0.2. 

/*
How to use:
- Instantiate: 
var t = new _tutorial({
    root: rootElement,
    indicateRemaining: true // whether or not to list the number of steps remaining
});

- Push steps:
var id=t.push({
    
    id: 'uniqueID' (optional),
    
    target: DOMElement OR
    target: ()=>{return DOMElement}

    type: "overlay" (darken and text in center) OR 
    type: "highlight" (just like intro.js) OR
    type: "internal" (tooltip without hiding)
    contents: 'some text' OR 'HTML string' OR DOMElement,
    to: 'nextID', OR
    to: [{button:'buttonText',id:'uniqueID'},{button:'buttonText',id:'uniqueID'}],
    location: (for type=="internal" OR "highlight" only) 'above' OR 'below' OR 'left' OR 'right',OR a number between 0 and 1
    arrowCentering: (for type=="internal" OR "highlight" only) 'center' OR 'start' OR 'end' OR a number between 0 and 1
    boxCentering: (for type=="internal" OR "highlight" only) 'center' OR 'start' OR 'end' OR a number between 0 and 1
})

- Run the tutorial!
t.start(uuid);

*/
var _tutorial = (function () {
    function evalGet(itm) {
        if (typeof (itm) == "function") return itm();
        else return itm;
    }

    let types = {
        shader: {
            render: function (itm, callback) {
                let data = {};
                data.div = document.createElement("div");
                data.div.style.cssText = `position:absolute; 
                height:100%; 
                width:100%; 
                display:flex;
                flex-direction:column;
                background: rgba(0,0,0,0.7);
                z-index:300;
                top:0;
                left:0;`;
                data.innerdiv = document.createElement("div");
                data.div.appendChild(data.innerdiv);
                data.innerdiv.innerHTML = itm.contents;
                data.innerdiv.style.cssText = `flex: 0 1 auto;
                margin: auto;
                text-align: center;
                color: white;
                padding: 1em;
                `;
                if (itm.to) {
                    for (let i = 0; i < itm.to.length; i++) {
                        let btn = document.createElement("button");
                        btn.innerHTML = itm.to[i][0];
                        btn.addEventListener("click", () => {
                            callback(itm.to[i][1]);
                        })
                        data.innerdiv.appendChild(btn);
                    }
                } else {
                    data.button = document.createElement("button");
                    data.button.innerHTML = "Next";
                    data.button.addEventListener("click", function () {
                        callback();
                    })
                    data.innerdiv.appendChild(data.button);
                }
                evalGet(itm.target).appendChild(data.div);

                return data;
            },
            unrender: function (data) {
                data.div.remove();
            }
        },
        internal: {
            render: function (itm, callback) {
                let data = {};
                data.div = document.createElement("div");
                data.div.style.cssText = `position: absolute;
                height: fit-content;
                width: fit-content;
                display: block;
                background: rgba(0, 0, 0, 0.7);
                z-index: 300;`;
                switch (itm.location) {
                    default:
                    case 'left':
                        data.div.style.cssText += `top: 50%;
                        transform: translateY(-50%);`;
                        break;
                    case 'bottom':
                        data.div.style.cssText += `bottom: 0%;
                        left: 50%;
                        transform: translateX(-50%);`;
                        break;
                    case 'top':
                        data.div.style.cssText += `
                        left: 50%;
                        top: 0%;
                        transform: translateX(-50%);`;
                        break;
                    case 'center':
                        data.div.style.cssText += `
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%,-50%);`;
                        break;
                }
                data.innerdiv = document.createElement("div");
                data.div.appendChild(data.innerdiv);
                data.innerdiv.innerHTML = itm.contents;
                data.innerdiv.style.cssText = `flex: 0 1 auto;
                margin: auto;
                text-align: center;
                color: white;
                padding: 1em;
                `;
                if (itm.to) {
                    for (let i = 0; i < itm.to.length; i++) {
                        let btn = document.createElement("button");
                        btn.innerHTML = itm.to[i][0];
                        btn.addEventListener("click", () => {
                            callback(itm.to[i][1]);
                        })
                        data.innerdiv.appendChild(btn);
                    }
                } else {
                    data.button = document.createElement("button");
                    data.button.innerHTML = "Next";
                    data.button.addEventListener("click", function () {
                        callback();
                    })
                    data.innerdiv.appendChild(data.button);
                }
                evalGet(itm.target).appendChild(data.div);

                return data;
            },
            unrender: function (data) {
                data.div.remove();
            }
        }
    }





    function _tutorial(options) {
        this.guid = function (count = 6) {
            let pool = "1234567890qwertyuiopasdfghjklzxcvbnm";
            tguid = "";
            for (i = 0; i < count; i++) tguid += pool[Math.floor(Math.random() * pool.length)];
            return tguid;
        }
        this.firstItem = false;
        this.items = {};
        let lastData;
        let lastType;
        let me = this;
        this.present = function (id) {
            //hide the previous slide
            if (lastData) {
                types[lastType].unrender(lastData);
            }
            if (id) {
                //present the current item
                if(!me.items[id])return;
                lastType = me.items[id].type;
                lastData = types[me.items[id].type].render(me.items[id], me.present);
            }else{
                if (me.end)me.end();
            }
            //otherwise finish
        }
        this.push = function (item) {
            //if no id then generate a uuid? 
            if (!item.id) {
                item.id = this.guid();
            }
            if (!this.firstItem) {
                this.firstItem = item.id;
            }
            this.items[item.id] = item;
            return item.id
        }
        this.start = function (id) {
            if (!id) {
                id = this.firstItem;
            }
            this.present(id);
            return {
                end:(f)=>{me.end=f;}
            }
        }
    }
    return _tutorial;
})();







// V0.1. Still dependent heavily on jquery (soz)... Will attempt to download jQuery from CDN if it does not have access to jQuery. At least there's that.
//With JQinit V2.2 to fill said dependency.

//on hold. using intro.js for now.


//mutation observer to listen for things which are ".dialog".

tutorialManager = {
    steps: [{
            type: "overlay",
            position: ["30vw", '30vh'],
            //focusElement:()=>{return $(".synergist")[0]},
            prompt: "Welcome to Synergist!",
        }


    ],

    //not yet implemented
    //Set to true if you want the tutorial to automatically play. Alternatively, put your own condition in the function!
    autoplayIf: () => {
        return false;
    },







    //////////////////Down here there isn't really much for you to change, unless you're particularly annoyed at sth.//////////////////

    showStep: function (step) {
        //load this step
        let thisStep = this.steps[step];
        //clear the previous step
        $("tutorial").empty();
        //load this step
        switch (thisStep.type) {
            case "overlay":
                $("tutorial").append(`<div class="tutorialShader"></div>`);
                $("tutorial").append()
                //Apply little shader.
                //put text in box at coords.

        }
    },

    play: function () {
        this.showStep(0);
    },

    init: function () {
        //add a tutorial div to the body.
        $("body").append(`<div class="tutorial"></div>`);
        //add styling
        $("head").append(`<style>
        .tutorialShader{

        }
        
        
        </style>`);
    }
}




// JQInit 2.2. Now nice and fancy and supports multiple instances of JQinit!
try {
    if (JQInit.run) {
        console.log("Readying JQ...")
    };
} catch (e) {
    JQInit = {
        run: false,
        fWhenReady: [],
        start: function (_f) {
            if (this.run) { // If I have already been run...
                if (this.jQueryReady) {
                    $(_f);
                } else {
                    this.fWhenReady.push(_f);
                }
            } else {
                this.run = true;
                if (jQuery) {
                    this.jQueryReady = true;
                    $(_f);
                } else {
                    let scr = document.createElement("script");
                    scr.src = src = "https://code.jquery.com/jquery-3.3.1.slim.min.js";
                    scr.addEventListener("load", () => {
                        JQInit.fWhenReady.forEach((v, i) => {
                            $(_f)
                        });
                    });
                }
            }
        }
    }
}