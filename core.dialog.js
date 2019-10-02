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
        core.dialog.prompt = function (dialog, closeCB) {
            //instantly show a dialog with contents 'dialog'.
            //use HTMLwrap to create a dom element or otherwise.
            while (core.dialog.innerDialog.children.length > 2) core.dialog.innerDialog.children[2].remove();
            core.dialog.innerDialog.appendChild(dialog);
            core.dialog.div.style.display = "block";
            core.dialog.closeCB = closeCB;
        }
        core.dialog.div.querySelector(".cb").addEventListener("click", function () {
            if (core.dialog.closeCB) {
                try {
                    core.dialog.closeCB(core.dialog.innerDialog);
                } catch (e) {
                    console.log(e);
                }
                core.dialog.closeCB = undefined;
            }

        })
    })
}