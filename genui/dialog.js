//V2.0: finally removed JQ dependency. Also added global dialogmanager. yeets
/*
Todo: checkDialogs takes styling information and additional parameters.
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
                min-height: 60%;
                max-width: 80%;
                background-color: white;
                border-radius: 30px;
                padding: 30px;
            }`
            }
        ]
    }

    if (userSettings) Object.assign(this.settings, userSettings);
    this.checkDialogs = (root) => {
        if (!root)root=document.body;
        let toCheckDialogs=root.querySelectorAll("." + me.settings.dialogLayers[0].className);

        for (let i=0;i<toCheckDialogs.length;i++){
            let e = toCheckDialogs[i];
            if (!(e.children.length && e.children[0].classList.contains(me.settings.dialogLayers[1].className))) {
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
                prediv.addEventListener("click", (e)=>{e.stopImmediatePropagation()});
                prediv.addEventListener("dblclick", (e)=>{e.stopImmediatePropagation()});
            }
        }
    }
    //chuck the relevant css in.
    me.settings.dialogLayers.forEach((v, i) => {
        let s=document.createElement("style");
        s.innerHTML=`.` + v.className + v.styling;
        document.head.appendChild(s);
    })
    //css for the close button
    let s=document.createElement("style");
    s.innerHTML=`.` + me.settings.closeButtonClass + me.settings.closeButtonStyle;
    document.head.appendChild(s);
    me.mo = new MutationObserver(me.checkDialogs);
    //document.addEventListener("DOMContentLoaded", () => {
    if (me.settings.autoDialogUpgrade){
        let config = {
            childList: true,
            subtree: true
        };
        if (document.readyState != "loading") me.mo.observe(document.body, config);
        else document.addEventListener("DOMContentLoaded", () => me.mo.observe(document.body, config));
    }
}

var dialogManager = new _dialogManager();