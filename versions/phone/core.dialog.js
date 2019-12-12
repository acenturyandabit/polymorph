/*
To implement a dialog:


see reference lol


*/


function dialogSystemManager(polymorph_core) {
    scriptassert([["dialog", "genui/dialog.js"]], () => {
        polymorph_core.dialog = {};
        polymorph_core.dialog.div = document.createElement("div");
        polymorph_core.dialog.div.classList.add("dialog");
        polymorph_core.dialog.div = dialogManager.checkDialogs(polymorph_core.dialog.div)[0];
        polymorph_core.dialog.innerDialog = polymorph_core.dialog.div.querySelector(".innerDialog");
        polymorph_core.dialog.standardOptions = document.createElement("div");
        polymorph_core.dialog.standardOptions.innerHTML = `
        <h1>Settings</h1>
        <h3> General settings </h3>
        <input class="tabDisplayName" placeholder="Tab display name:"/>
        <h3>Operator settings</h3>
        `
        polymorph_core.dialog.innerDialog.appendChild(polymorph_core.dialog.standardOptions);
        //polymorph_core.dialog.currentoperator

        //Register a dialog to a calling rect. Rect calls this when the settings cog is clicked.
        polymorph_core.dialog.register = function (operator) {
            let operator=operator.operator;
            //Fill in the tab display name
            polymorph_core.dialog.standardOptions.querySelector(".tabDisplayName").value=operator.settings.tabbarName;
            //Get it to prepare its dialog
            operator.showDialog(); 
            // remove any existing innerdialog children.
            if (polymorph_core.dialog.innerDialog.children[3]) polymorph_core.dialog.innerDialog.children[3].remove();
            // Add the dialog div.
            polymorph_core.dialog.innerDialog.appendChild(operator.dialogDiv);
            //apply styling to the dialog div.
            polymorph_core.dialog.innerDialog.children[3].style.maxWidth="50vw";
            //set the calling items.
            polymorph_core.dialog.currentoperator = operator;
            polymorph_core.dialog.currentOperator=operator;
            //now show the dialog
            polymorph_core.dialog.div.style.display="block";
        }
        polymorph_core.dialog.div.querySelector(".cb").addEventListener("click", function () {
            //also forward close event to the operator
            polymorph_core.dialog.currentoperator.dialogUpdateSettings();
            polymorph_core.dialog.currentOperator.settings.tabbarName=polymorph_core.dialog.standardOptions.querySelector(".tabDisplayName").value;
            polymorph_core.dialog.currentOperator.tab.children[0].innerText=polymorph_core.dialog.currentOperator.settings.tabbarName;
            polymorph_core.fire("updateItem", {id: polymorph_core.dialog.currentOperator.container.id,sender:polymorph_core.dialog});
        })
    })
}