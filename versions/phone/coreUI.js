/*
Data storage reference
polymorph_core.currentDoc={
    views:{rect:rectData},
    items:[],
    displayName: "whatever"
}

polymorph_core.userData={
    uniqueStyle=some style
}

*/


polymorph_core.on("UIstart", () => {
    polymorph_core.toggleMenu = function (visible) {
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
        polymorph_core.toggleMenu(true);
    });
    document.body.querySelector("#newoperator").addEventListener("click", () => {
        polymorph_core.baseRect.split();
    });
    document.body.querySelector("#menulist").parentElement.addEventListener("click", (e) => {
        if (e.currentTarget == e.target) {
            polymorph_core.toggleMenu(false);//hide on direct taps
        }
    });
    document.querySelector(".open").addEventListener("click", () => {
        window.open(window.location.pathname);
    })
    document.querySelector("#opop").addEventListener("click", () => {
        //dont show settings - instead, copy the settings div onto the polymorph_core settings div.
        if (polymorph_core.containers[polymorph_core.currentOperator].operator.dialogDiv) {
            this.settingsOperator = polymorph_core.containers[polymorph_core.currentOperator].operator;
            this.settingsOperator.showDialog();
            this.settingsDiv = document.createElement("div");
            this.settingsDiv.innerHTML = `<h1>Settings</h1>
            <h3> General settings </h3>
            <input class="tabDisplayName" placeholder="Tab display name:"/>
            <h3>Operator settings</h3>`;
            this.settingsOperator.dialogDiv.style.maxWidth = "50vw";
            this.settingsDiv.appendChild(this.settingsOperator.dialogDiv);
            this.settingsDiv.querySelector(".tabDisplayName").value = this.tabbar.querySelector(`[data-containerid="${polymorph_core.currentOperator}"]`).children[0].innerText;
            //add remapping by the operator
            polymorph_core.containers[polymorph_core.currentOperator].readyRemappingDiv();
            this.settingsDiv.appendChild(polymorph_core.containers[polymorph_core.currentOperator].remappingDiv);

            polymorph_core.dialog.prompt(this.settingsDiv, (d) => {
                polymorph_core.containers[polymorph_core.currentOperator].settings.tabbarName = d.querySelector("input.tabDisplayName").value;
                this.tabbar.querySelector(`[data-containerid="${polymorph_core.currentOperator}"]`).children[0].innerText = polymorph_core.containers[polymorph_core.currentOperator].settings.tabbarName;
                if (this.settingsOperator.dialogUpdateSettings) this.settingsOperator.dialogUpdateSettings();
                polymorph_core.containers[polymorph_core.currentOperator].processRemappingDiv();
                polymorph_core.fire("updateItem", { id: rectID });
            })
            polymorph_core.dialog.register(polymorph_core.currentOperator);
        }
    })

});
documentReady(() => {
    document.body.appendChild(htmlwrap(`
        <style>
            #oplists button.remove{
                float: right;
                margin-right: 20%;
                font-style: normal;
                font-weight: bold;
                color: darkred;
            }
        </style>`));
    document.body.appendChild(htmlwrap(`<div id="topbar" style="flex: 0 0 2em">
            <button id="menu" style="font-size: 1.5em;width: 1.5em;height: 1.5em;text-align:center; overflow:hidden;">=</button>
            <span class="docName" contentEditable>Polymorph</span>
            <button id="opop" style="position: absolute; right:0; top: 0; z-index:5;font-size: 1.5em;width: 1.5em;height: 1.5em;text-align:center; overflow:hidden;">*</button>
        </div>`));
    document.body.appendChild(htmlwrap(`<div style="width:100%; flex: 1 1 100%; position:relative; overflow: hidden">
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
                    <div class="rectspace"></div>
                    <p id="newoperator">Add an operator...</p>
                    </div>
                </div>
            </div>
            <div id="body" style="position: absolute;top:0;bottom:0; width: 100%; background: url('assets/nightsky.jpg'); background-size: cover; background-position: center center;">
            </div>
        </div>`));
    document.body.appendChild(htmlwrap(`<div class="wall"
            style="z-index: 100;position:absolute; width:100%; height:100%; top:0; left: 0; background: rgba(0,0,0,0.5); display: none">
            <div style="height:100%; display:flex; justify-content: center; flex-direction: column">
                <h1 style="color:white; text-align:center">Hold on, we're loading your data...</h1>
        </div>`));
})
polymorph_core.on("documentCreated", (id) => {
    polymorph_core.userData.documents[id] = { saveSources: {} };
    polymorph_core.userData.documents[id].autosave = true;// by default make autosave true, so user does not have to save
})

///////////////////////////////////////////////////////////////////////////////////////
//Operator conveinence functions
//Add showOperator

polymorph_core.showOperator = function (op) {
    if (document.body.querySelector("#body").children.length) document.body.querySelector("#body").children[0].remove();
    document.body.querySelector("#body").appendChild(op.topdiv);
    if (op.operator && op.operator.refresh) op.operator.refresh();
    polymorph_core.currentOperator = op;
    polymorph_core.fire("operatorChanged");
}

///////////////////////////////////////////////////////////////////////////////////////
//UI handling


/*this.filescreen.baseDiv.querySelector("button.gstd").addEventListener("click", () => {
    // create a new workspace, then load it
    window.location.href += "?doc=" + guid(7) + "&src=lf";
})*/


polymorph_core.resetView = function () {
    if (document.body.querySelector("#body").children.length) document.body.querySelector("#body").children[0].remove();
    polymorph_core.baseRect = new _rect(polymorph_core,
        undefined, {});
    polymorph_core.baseRect.refresh();
}

polymorph_core.on("operatorChanged", function (d) {
    if (polymorph_core.userData.documents[polymorph_core.currentDocID] && polymorph_core.userData.documents[polymorph_core.currentDocID].autosave && !polymorph_core.isSaving) {
        polymorph_core.autosaveCapacitor.submit();
    }
});
