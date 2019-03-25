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
        core.dialog.standardOptions = document.createElement("div");
        core.dialog.standardOptions.innerHTML = `
        <input class="tabDisplayName" placeholder="Tab display name:"/>
        `
        core.dialog.innerDialog.appendChild(core.dialog.standardOptions);
        //core.dialog.currentBaseOperator
        core.dialog.register = function (rect, baseOperator) {
            for (let i=0;i<rect.operators.length;i++){
                if (baseOperator==rect.operators[i].baseOperator){
                    core.dialog.standardOptions.querySelector(".tabDisplayName").value=rect.tabspans[i].children[0].innerText;
                }
            }
            baseOperator.showDialog(); //get it to prepare its dialog
            if (core.dialog.innerDialog.children[3]) core.dialog.innerDialog.children[3].remove();
            core.dialog.innerDialog.appendChild(baseOperator.dialogDiv);
            core.dialog.currentBaseOperator = baseOperator;
            core.dialog.callingRect = rect;
            //now show the dialog
            core.dialog.div.style.display="block";
        }
        core.dialog.div.querySelector(".cb").addEventListener("click", function () {
            //process the default settings, sending it down to the calling rect
            core.dialog.callingRect.submitDialog(core.dialog.innerDialog);
            //also forward close event to the baseOperator
            core.dialog.currentBaseOperator.dialogUpdateSettings();
            core.fire("viewUpdate")
        })
    })
}