/*
To implement a dialog:


see reference lol


*/


function _dialogManager(userSettings) {
    let me = this;
    this.settings = {
        //set to true to allow the dialog manager to automatically detect new dialogs. May result in diminished performance.
        autoDialogUpgrade: false,

        //if true, will add a close button (a big X) next to the innermost level
        addCloseButton: true,
        //Items with this class will not add a close button, even if addClosebutton is true.
        noCloseClass: "noClose",
        //class of the close button. A close handler is included but like don't include this elsewhere? Modify if you want
        closeButtonClass: 'cb',
        //////////////////The below is mostly styling, modify if you want.//////////////////
        closeButtonStyle: `
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
        `,

        dialogLayers: [ // Layers of wrapping for the dialog. The outermost layer will be scanned for.
            {
                className: "dialog",
                styling: `
                display: none;
                position: absolute;
                top: 0;
                left: 0;
                width:100%;
                height:100%;
                background-color: rgba(0,0,0,0.5);
                z-index:1000;
            `
            },
            {
                className: "midmid",
                styling: `
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 100%;
            `
            },
            {
                className: "mid",
                styling: `
                height:90%;
                margin-top:5%;
            `
            },
            {
                className: "innerDialog",
                styling: `
                position:relative;
                display: flex;
                flex-direction: column;
                margin: auto;
                min-height: 60%;
                max-width: 80%;
                max-height: 80%;
                overflow-y: auto;
                max-width: 80%;
                background-color: white;
                border-radius: 5px;
                padding: 30px;
            `
            }
        ]
    }

    if (userSettings) Object.assign(this.settings, userSettings);
    this.checkDialogs = (root) => {
        let returns = [];
        if (!root) root = document.body;
        let _toCheckDialogs = root.querySelectorAll("." + me.settings.dialogLayers[0].className);
        let toCheckDialogs = [];
        for (let i = 0; i < _toCheckDialogs.length; i++) {
            toCheckDialogs.push(_toCheckDialogs[i]);
        }
        if (root.matches("." + me.settings.dialogLayers[0].className)) toCheckDialogs.push(root);
        for (let i = 0; i < toCheckDialogs.length; i++) {
            let e = toCheckDialogs[i];
            if (!(e.children.length && e.children[0].classList.contains(me.settings.dialogLayers[1].className))) {
                //create the new dialog!
                let parent = e.parentElement;
                let prediv = e;
                for (let i = me.settings.dialogLayers.length - 1; i >= 0; i--) {
                    let thisdiv = document.createElement("div");
                    //chuck the relevant css in.
                    thisdiv.style.cssText = me.settings.dialogLayers[i].styling;
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
                    closeButton.style.cssText = me.settings.closeButtonStyle;
                    closeButton.classList.add(me.settings.closeButtonClass);
                    let closeDialogHandler = () => {
                        prediv.style.display = "none";
                        //act as if close button was clicked   
                    }
                    closeButton.addEventListener("click", closeDialogHandler);
                    e.parentElement.appendChild(closeButton);
                    //only bind escape close to dialogs that have a closeButton
                    window.addEventListener("keydown", (e) => {
                        if (e.key == "Escape" && prediv.style.display != "none") {
                            closeButton.click();
                        }
                    });
                }
                while (e.classList.length) e.classList.remove(e.classList[e.classList.length - 1]);

                if (parent) {
                    //add the stack to the parent
                    parent.appendChild(prediv);
                }
                //Block events to lower levels from dialogs: mostly doubleclick and click
                //This should not be delegated because we want to catch it as early up the dom tree as possible.
                prediv.addEventListener("click", (e) => {
                    e.stopImmediatePropagation()
                });
                prediv.addEventListener("dblclick", (e) => {
                    e.stopImmediatePropagation()
                });
                returns.push(prediv);
            }
        }
        return returns;
    }


    //css for the close button
    //let s=document.createElement("style");
    //s.innerHTML=`.` + me.settings.closeButtonClass + me.settings.closeButtonStyle;
    //document.head.appendChild(s);
    me.mo = new MutationObserver(me.checkDialogs);
    //document.addEventListener("DOMContentLoaded", () => {
    if (me.settings.autoDialogUpgrade) {
        let config = {
            childList: true,
            subtree: true
        };
        if (document.readyState != "loading") me.mo.observe(document.body, config);
        else document.addEventListener("DOMContentLoaded", () => me.mo.observe(document.body, config));
    }
}

var dialogManager = new _dialogManager();

polymorph_core.dialog = {};
polymorph_core.dialog.div = document.createElement("div");
polymorph_core.dialog.div.classList.add("dialog");
polymorph_core.dialog.div = dialogManager.checkDialogs(polymorph_core.dialog.div)[0];
polymorph_core.dialog.innerDialog = polymorph_core.dialog.div.querySelector(".innerDialog");
document.body.appendChild(polymorph_core.dialog.div)
    //polymorph_core.dialog.currentBaseOperator

//Register a dialog to a calling rect. Rect calls this when the settings cog is clicked.
polymorph_core.dialog.prompt = function(dialog, closeCallback) {
    //instantly show a dialog with contents 'dialog'.
    //use HTMLwrap to create a dom element or otherwise.
    while (polymorph_core.dialog.innerDialog.children.length > 2) polymorph_core.dialog.innerDialog.children[2].remove();
    polymorph_core.dialog.innerDialog.appendChild(dialog);
    polymorph_core.dialog.div.style.display = "block";
    polymorph_core.dialog.closeCB = closeCallback;
}
polymorph_core.dialog.div.querySelector(".cb").addEventListener("click", function() {
    if (polymorph_core.dialog.closeCB) {
        try {
            polymorph_core.dialog.closeCB(polymorph_core.dialog.innerDialog);
        } catch (e) {
            console.log(e);
        }
        polymorph_core.dialog.closeCB = undefined;
    }

})