///////////////////////////////////////////////////////////////////////////////////////
//View level functions

polymorph_core.switchView = function (view) {
    polymorph_core.items._meta.currentView = view;
    while (document.body.querySelector(".rectspace").children.length) document.body.querySelector(".rectspace").children[0].remove();
    document.body.querySelector(".rectspace").appendChild(polymorph_core.rects[polymorph_core.items._meta.currentView].outerDiv);
    //reset and present a view
    polymorph_core.rects[polymorph_core.items._meta.currentView].refresh();
};


polymorph_core.resetView = function () {
    //this should reallly be more formalised
    document.body.querySelector(".rectspace").innerHTML = "";
    polymorph_core.baseRect = new _rect(polymorph_core,
        undefined,
        RECT_ORIENTATION_X,
        0,
        1);
    document.body.querySelector(".rectspace").appendChild(polymorph_core.baseRect.outerDiv);
    polymorph_core.baseRect.refresh();
}


polymorph_core.on("UIstart", () => {
    let viewDialog = document.createElement('div');
    viewDialog.classList.add("dialog");
    viewDialog = dialogManager.checkDialogs(viewDialog)[0];
    innerDialog = viewDialog.querySelector(".innerDialog");
    document.body.appendChild(viewDialog); // where root is the document
    let d = document.createElement("div");
    d.innerHTML = `
<h2>View management</h2>
<select class="views">
</select>
<button class="acvu">Activate view</button>
<button class="nvu">New view</button>
<button class="clnvu">Clone view</button>
`;
    d.querySelector(".acvu").addEventListener("click", () => {
        polymorph_core.presentView(d.querySelector(".views").value);
        polymorph_core.isSaving = true;//prevent autosave from firing repeatedly
        for (let i in polymorph_core.items) {
            polymorph_core.fire("updateItem", {
                id: i
            });
        }
        polymorph_core.isSaving = false;
        polymorph_core.baseRect.refresh();
    })
    d.querySelector(".nvu").addEventListener("click", () => {
        let newViewName = guid();
        while (polymorph_core.currentDoc.views[newViewName]) newViewName = guid();
        polymorph_core.currentDoc.views[newViewName] = {};
        d.querySelector(".views").appendChild(htmlwrap(`<option>${newViewName}</option>`));
    })
    d.querySelector(".clnvu").addEventListener("click", () => {
        let newViewName = guid();
        while (polymorph_core.currentDoc.views[newViewName]) newViewName = guid();
        polymorph_core.currentDoc.views[newViewName] = JSON.parse(JSON.stringify(polymorph_core.currentDoc.views[polymorph_core.userData.documents[polymorph_core.currentDocID].currentView]));
        d.querySelector(".views").appendChild(htmlwrap(`<option>${newViewName}</option>`));
    })
    innerDialog.appendChild(d);

    /*document.querySelector(".viewdialog").addEventListener("click", () => {
        //save the current view
        polymorph_core.currentDoc.views[polymorph_core.userData.documents[polymorph_core.currentDocID].currentView] = polymorph_core.baseRect.toSaveData();
        //update the entries in baserects
        polymorph_core.baseRects[polymorph_core.userData.documents[polymorph_core.currentDocID].currentView] = polymorph_core.baseRect;
        //open the view dialog
        let dcd = d.querySelector(".views").children;
        while (dcd.length) dcd[0].remove();
        for (let i in polymorph_core.currentDoc.views) {
            d.querySelector(".views").appendChild(htmlwrap(`<option>${polymorph_core.currentDoc.views[i].prettyName || i}</option>`));
        }
        viewDialog.style.display = "block";
    })*/
});
