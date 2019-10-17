///////////////////////////////////////////////////////////////////////////////////////
//View level functions

core.presentView = function (view) {
    //reset and present a view
    core.resetView();
    if (view == undefined || core.baseRects[view] == undefined) {
        //create a new view
        if (!view) view = "default";
        core.baseRect = new _rect(core,
            undefined,
            0,
            0,
            1);
        core.baseRects[view] = core.baseRect;
    }
    core.baseRects[view].pos = 0;
    core.baseRects[view].firstOrSecond = 1;
    document.body.querySelector(".rectspace").innerHTML = "";
    document.body.querySelector(".rectspace").appendChild(core.baseRects[view].outerDiv);
    core.baseRect = core.baseRects[view];//set the ref so everyone can access it as before
    //set user's current view
    core.baseRect.refresh();
    core.fire("viewReady");
    core.userData.documents[core.currentDocID].currentView = view;
    core.saveUserData();
    core.unsaved = false;
};


core.resetView = function () {
    //this should reallly be more formalised
    document.body.querySelector(".rectspace").innerHTML = "";
    core.baseRect = new _rect(core,
        undefined,
        RECT_ORIENTATION_X,
        0,
        1);
    document.body.querySelector(".rectspace").appendChild(core.baseRect.outerDiv);
    core.baseRect.refresh();
}


core.on("UIstart", () => {
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
        core.presentView(d.querySelector(".views").value);
        core.isSaving=true;//prevent autosave from firing repeatedly
        for (let i in core.items) {
            core.fire("updateItem", {
                id: i
            });
        }
        core.isSaving=false;
        core.baseRect.refresh();
    })
    d.querySelector(".nvu").addEventListener("click", () => {
        let newViewName = guid();
        while (core.currentDoc.views[newViewName]) newViewName = guid();
        core.currentDoc.views[newViewName] = {};
        d.querySelector(".views").appendChild(htmlwrap(`<option>${newViewName}</option>`));
    })
    d.querySelector(".clnvu").addEventListener("click", () => {
        let newViewName = guid();
        while (core.currentDoc.views[newViewName]) newViewName = guid();
        core.currentDoc.views[newViewName] = JSON.parse(JSON.stringify(core.currentDoc.views[core.userData.documents[core.currentDocID].currentView]));
        d.querySelector(".views").appendChild(htmlwrap(`<option>${newViewName}</option>`));
    })
    innerDialog.appendChild(d);

    document.querySelector(".viewdialog").addEventListener("click", () => {
        //save the current view
        core.currentDoc.views[core.userData.documents[core.currentDocID].currentView] = core.baseRect.toSaveData();
        //update the entries in baserects
        core.baseRects[core.userData.documents[core.currentDocID].currentView] = core.baseRect;
        //open the view dialog
        let dcd = d.querySelector(".views").children;
        while (dcd.length) dcd[0].remove();
        for (let i in core.currentDoc.views) {
            d.querySelector(".views").appendChild(htmlwrap(`<option>${core.currentDoc.views[i].prettyName || i}</option>`));
        }
        viewDialog.style.display = "block";
    })
});
