/*
To implement a dialog:


see reference lol


*/


function dialogSystemManager(core) {
    scriptassert([["dialog", "genui/dialog.js"]], () => {
        core.dialog = {};
        core.dialog.div = document.createElement("div");
        core.dialog.div.classList.add("dialog");
        core.dialog.div = dialogManager.checkDialogs(core.dialog.div)[0];
        core.dialog.innerDialog = core.dialog.div.querySelector(".innerDialog");
        documentReady(() => {
            document.body.appendChild(core.dialog.div)
        });
        //core.dialog.currentBaseOperator

        //Register a dialog to a calling rect. Rect calls this when the settings cog is clicked.
        core.dialog.register = function (rect, baseOperator) {
            //Get it to prepare its dialog
            baseOperator.showDialog();
            // remove any existing innerdialog children.
            while(core.dialog.innerDialog.children.length>2) core.dialog.innerDialog.children[2].remove();

            //Add the title 
            core.dialog.standardOptions = document.createElement("div");
            core.dialog.standardOptions.innerHTML = `
            <h1>Settings</h1>
            <h3> General settings </h3>
            <input class="tabDisplayName" placeholder="Tab display name:"/>
            <h3>Operator settings</h3>
            `
            core.dialog.innerDialog.appendChild(core.dialog.standardOptions);

            //Fill in the tab display name
            for (let i = 0; i < rect.operators.length; i++) {
                if (baseOperator == rect.operators[i].baseOperator) {
                    core.dialog.standardOptions.querySelector(".tabDisplayName").value = rect.tabspans[i].children[0].innerText;
                }
            }

            // Add the dialog div.
            core.dialog.innerDialog.appendChild(baseOperator.dialogDiv);
            //apply styling to the dialog div.
            core.dialog.innerDialog.children[3].style.maxWidth = "50vw";
            //set the calling items.
            core.dialog.currentBaseOperator = baseOperator;
            core.dialog.callingRect = rect;
            //now show the dialog
            core.dialog.div.style.display = "block";
        }
        core.dialog.prompt = function (dialog,closeCB) {
            //instantly show a dialog with contents 'dialog'.
            //use HTMLwrap to create a dom element or otherwise.
            while(core.dialog.innerDialog.children.length>2) core.dialog.innerDialog.children[2].remove();
            core.dialog.innerDialog.appendChild(dialog);
            core.dialog.div.style.display = "block";
            core.dialog.closeCB=closeCB;
        }
        core.dialog.div.querySelector(".cb").addEventListener("click", function () {
            //process the default settings, sending it down to the calling rect
            if (core.dialog.callingRect) {
                core.dialog.callingRect.submitDialog(core.dialog.innerDialog);
                core.dialog.callingRect = undefined;
                //also forward close event to the baseOperator
                core.dialog.currentBaseOperator.dialogUpdateSettings();
                core.fire("updateView")
            }else if (core.dialog.closeCB){
                try{
                    core.dialog.closeCB();
                }catch (e){
                    console.log(e);
                }
                core.dialog.closeCB=undefined;
            }

        })
    })
}