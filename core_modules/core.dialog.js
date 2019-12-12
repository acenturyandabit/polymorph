/*
To implement a dialog:


see reference lol


*/

scriptassert([["dialog", "genui/dialog.js"]], () => {
    polymorph_core.dialog = {};
    polymorph_core.dialog.div = document.createElement("div");
    polymorph_core.dialog.div.classList.add("dialog");
    polymorph_core.dialog.div = dialogManager.checkDialogs(polymorph_core.dialog.div)[0];
    polymorph_core.dialog.innerDialog = polymorph_core.dialog.div.querySelector(".innerDialog");
    documentReady(() => {
        document.body.appendChild(polymorph_core.dialog.div)
    });
    //polymorph_core.dialog.currentBaseOperator

    //Register a dialog to a calling rect. Rect calls this when the settings cog is clicked.
    polymorph_core.dialog.prompt = function (dialog, closeCB) {
        //instantly show a dialog with contents 'dialog'.
        //use HTMLwrap to create a dom element or otherwise.
        while (polymorph_core.dialog.innerDialog.children.length > 2) polymorph_core.dialog.innerDialog.children[2].remove();
        polymorph_core.dialog.innerDialog.appendChild(dialog);
        polymorph_core.dialog.div.style.display = "block";
        polymorph_core.dialog.closeCB = closeCB;
    }
    polymorph_core.dialog.div.querySelector(".cb").addEventListener("click", function () {
        if (polymorph_core.dialog.closeCB) {
            try {
                polymorph_core.dialog.closeCB(polymorph_core.dialog.innerDialog);
            } catch (e) {
                console.log(e);
            }
            polymorph_core.dialog.closeCB = undefined;
        }

    })
})