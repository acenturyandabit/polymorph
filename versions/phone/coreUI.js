/*
Data storage reference
core.currentDoc={
    views:{rect:rectData},
    items:[],
    displayName: "whatever"
}

core.userData={
    uniqueStyle=some style
}

*/


core.startUI = function () {
    core.toggleMenu = function (visible) {
        if (visible == undefined) {
            visible = (document.body.querySelector("#menulist").parentElement.style.left != "0px"); //because we are toggling
        }
        if (visible) {
            document.body.querySelector("#menulist").parentElement.style.left = "0px";
        } else {
            document.body.querySelector("#menulist").parentElement.style.left = "-100%";
        }
    }
    document.body.querySelector("#menu").addEventListener("click", () => {
        core.toggleMenu(true);
    });
    document.body.querySelector("#newoperator").addEventListener("click", () => {
        core.baseRect.split();
    });
    document.body.querySelector("#menulist").parentElement.addEventListener("click", (e) => {
        if (e.currentTarget == e.target) {
            core.toggleMenu(false);//hide on direct taps
        }
    });

    document.querySelector(".open").addEventListener("click", () => {
        window.open(window.location.pathname);
    })
}

documentReady(() => {
    document.body.innerHTML = `
        <div id="topbar" style="flex: 0 0 2em">
            <button id="menu" style="font-size: 1.5em;width: 1.5em;height: 1.5em;text-align:center; overflow:hidden;">*</button>
            <span class="docName" contentEditable>Polymorph</span>
        </div>
        <div style="width:100%; flex: 1 1 100%; overflow: hidden">
            <div style="position: absolute;top:0;bottom:0; left:-100%; background:rgba(0,0,0,0.5); width:100%; z-index:100;">
                <div id="menulist" style="position: absolute;top:0;bottom:0; background:blueviolet; width:70%">    
                    <p><button class="saveSources">save</button>
                        <button class="viewdialog">view</button>
                        <button class="open">open</button></p>
                    <div id="oplists" style="position: absolute;
                    top: 3em;
                    bottom: 0;
                    overflow: auto;
                    width: 100%;">
                    <p id="newoperator">Add an operator...</p>
                    </div>    
                    
                </div>
            </div>
            <div id="body">
                <span></span><!--burner-->
            </div>
        </div>
        <div class="wall"
            style="position:absolute; width:100%; height:100%; top:0; left: 0; background: rgba(0,0,0,0.5); display: block">
            <div style="height:100%; display:flex; justify-content: center; flex-direction: column">
                <h1 style="color:white; text-align:center">Hold on, we're loading your data...</h1>
        </div>
            `;
})
core.on("documentCreated",(id)=>{
    core.userData.documents[id] = {};
    core.userData.documents[id].autosave = true;// by default make autosave true, so user does not have to save
})

///////////////////////////////////////////////////////////////////////////////////////
//Operator conveinence functions
//Add showOperator

core.showOperator = function (op) {
    let bcr = document.body.querySelector("#body").parentElement.getBoundingClientRect();
    document.body.querySelector("#body").style.height = bcr.height;
    document.body.querySelector("#body").style.width = bcr.width;
    document.body.querySelector("#body").children[0].remove();
    document.body.querySelector("#body").appendChild(op.topdiv);
    if (op.baseOperator && op.baseOperator.refresh) op.baseOperator.refresh();
}

///////////////////////////////////////////////////////////////////////////////////////
//UI handling

//Instantiate filemanager
core.filescreen = new _filescreen({
    headprompt: htmlwrap(`
        <div style="text-align:center">
    <h1>Polymorph: Effective Organisation</h1>
    <button class="__fsnewbtn"><h2>Create a new document</h2></button>
    <style>
    .buttons>button{
        flex: 0 0 25%;
    }
    button:disabled{
        background: repeating-linear-gradient(-60deg, #333333 0px,#333333 10px,#0000ee 10px, #0000ee 20px);
    }
    button:disabled>*{
        background: rgba(100,100,100,0.7);
        color: white;
    }
    .olol>button{
        flex: 1 0 auto;
        background: darkgrey;
    }
    .olol>button.selected{
        background: blue;
        color: white;
    }
    </style>
    <div id="__fsnew" style="display: none">
        <div style="display:flex;flex-direction:row;" class="olol"><button class="selected" data-source="lf">Work offline</button><button data-source="fb">Collaborate in real time</button></div>
        <div style="display:flex;flex-direction:row;overflow-x:scroll" class="buttons">
            <button data-template="brainstorm"><h1>Brainstorm</h1><p>Brainstorm and lay out ideas with others!</p></button>
            <button ><h1>Custom</h1><p>Use Polymorph's customisability to build your own user interface.</p></button>
            <button disabled><h1>Coming soon...</h1></button>
            <button data-template="chatmode" disabled><h1>Chat mode</h1><p>Have a chat with yourself or a friend, and let Polymorph build the structure for you!</p></button>
            <button data-template="kanban" disabled><h1>Kanban board</h1><p>Simple, ticket based project management.</p></button>
            <button data-template="calendar" disabled><h1>Calendar</h1><p>A text-based calendar / tasklist combination.</p></button>
        </div>
    </div>
    </div>
    `),
    formats: false,
    tutorialEnabled: false,
    savePrefix: "polymorph"
});
core.filescreen.baseDiv.querySelector(".__fsnewbtn").addEventListener("click", () => {
    core.filescreen.baseDiv.querySelector("#__fsnew").style.display = "block";
})
core.filescreen.baseDiv.querySelector(".buttons").addEventListener("click", (e) => {
    let t = e.target;
    while (t != core.filescreen.baseDiv) {
        if (t.tagName == "BUTTON" && !t.disabled) {
            let url = window.location.pathname + "?doc=" + guid(7) + "&src=" + core.filescreen.baseDiv.querySelector('.olol .selected').dataset.source;
            if (t.dataset.template) url += "&tmp=" + t.dataset.template;
            window.location.href = url;
            break;
        } else {
            t = t.parentElement;
        }
    }
})

core.filescreen.baseDiv.querySelector(".olol").addEventListener("click", (e) => {
    if (e.target.tagName == "BUTTON") {
        let btns = core.filescreen.baseDiv.querySelectorAll(".olol>button");
        for (let i = 0; i < btns.length; i++)btns[i].classList.remove("selected");
        e.target.classList.add("selected");
    }
})

/*this.filescreen.baseDiv.querySelector("button.gstd").addEventListener("click", () => {
    // create a new workspace, then load it
    window.location.href += "?doc=" + guid(7) + "&src=lf";
})*/


core.resetView=function() {
    core.baseRect = new _rect(core,
        document.body.querySelector("#oplists"), {});
}

