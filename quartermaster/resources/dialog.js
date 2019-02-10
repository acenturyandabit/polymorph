// V1.0. Still dependent heavily on jquery (soz)... Will attempt to download jQuery from CDN if it does not have access to jQuery. At least there's that.
//With JQinit V2.3 to fill said dependency.

//STATUS:
//SAMPLE CODE: NOT READY
//DEFAULTARGS: NOT READY
//FUNCTION INSTEAD OF OBJECT: YES
//JQINIT: YES
//REMOVE JQUERY DEPENDENCY: NO


/*
Documentation

1. Set parameters in dialogManager.
2. Call dialogManager.init(); (this is done in final line in this file).
3. Enjoy!

*/

//mutation observer to listen for things which are ".dialog".

// JQInit 2.3. Now nice and fancy and supports multiple instances of JQinit!
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

JQInit.start(() => {
    var dialogManager = new _dialogManager()
});

function _dialogManager(userSettings) {
    let me = this;
    this.settings = {
        //set to true to allow the dialog manager to automatically detect new dialogs. May result in diminished performance. 
        autoDialogUpgrade: true,

        //if true, will add a close button (a big X) next to the innermost level
        addCloseButton: true,
        //Items with this class will not add a close button, even if addClosebutton is true.
        noCloseClass: "noClose",
        //class of the close button. A close handler is included but like don't include this elsewhere? Modify if you want
        closeButtonClass: 'cb',
        //////////////////The below is mostly styling, modify if you want.//////////////////
        closeButtonStyle: `{
            position: absolute;
            top: 0px;
            right: 0px;
            font-size:2em;
            margin: 26px;
            padding: 3px;
            border-radius:20px;
            background: #ad2222;
            width: 1em;
            height: 1em;
            text-align: center;
            color: white;
            font-family: sans-serif;
        }`,

        dialogLayers: [ // Layers of wrapping for the dialog. The outermost layer will be scanned for.
            {
                className: "dialog",
                styling: `{
                display: none;
                position: absolute;
                top: 0;
                left: 0;
                width:100%;
                height:100%;
                background-color: rgba(0,0,0,0.5);
                z-index:100;
            }`
            },
            {
                className: "midmid",
                styling: `{
                display: table;
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 100%;
            }`
            },
            {
                className: "mid",
                styling: `{
                display: table-cell;
                vertical-align: middle;
            }`
            },
            {
                className: "innerDialog",
                styling: `{
                position:relative;
                display: flex;
                flex-direction: column;
                margin: auto;
                min-height: 60vh;
                width: 40vw;
                background-color: white;
                border-radius: 30px;
                padding: 30px;
            }`
            }
        ]
    }
    
    if (userSettings)Object.assign(this.settings, userSettings);
    this.checkDialogs = (root) => {
        if (!root) root=document.body;
        let dialogs=root.querySelectorAll("." + me.settings.dialogLayers[0].className);
        dialogs.forEach((e, i) => {
            if (!$(e).find("." + me.settings.dialogLayers[1].className).length) {
                //create the new dialog!
                let parent = e.parentElement;
                let prediv = e;
                for (let i = me.settings.dialogLayers.length - 1; i >= 0; i--) {
                    let thisdiv = document.createElement("div");
                    thisdiv.classList.add(me.settings.dialogLayers[i].className);
                    thisdiv.appendChild(prediv);
                    prediv = thisdiv;
                }
                //copy classes up to top level div
                e.classList.forEach((v, i) => {
                    prediv.classList.add(v);
                });
                //add the close button
                if (!e.classList.contains(me.settings.noCloseClass)) {
                    let closeButton = document.createElement("div");
                    closeButton.innerText = "X";
                    closeButton.classList.add(me.settings.closeButtonClass);
                    closeButton.addEventListener("click", () => {
                        prediv.style.display = "none";
                    })
                    e.parentElement.appendChild(closeButton);
                }
                while (e.classList.length) e.classList.remove(e.classList[e.classList.length - 1]);


                //add the stack to the parent                
                parent.appendChild(prediv);
                //Block events to lower levels from dialogs: mostly doubleclick and click
                //This should not be delegated because we want to catch it as early up the dom tree as possible.
                $(prediv).on("click dblclick", (e) => {
                    e.stopImmediatePropagation();
                    return false;
                });
            }
        })
    }
    //chuck the relevant css in.
    me.settings.dialogLayers.forEach((v, i) => {
        $("head").append(`<style>.` + v.className + v.styling + `</style>`);
    })
    //css for the close button
    $("head").append(`<style>.` + me.settings.closeButtonClass + me.settings.closeButtonStyle + `</style>`);
    me.mo = new MutationObserver(me.checkDialogs);
    //document.addEventListener("DOMContentLoaded", () => {
    let config = {
        childList: true,
        subtree: true
    };
    //me.mo.observe(document.body, config);
    //});
}