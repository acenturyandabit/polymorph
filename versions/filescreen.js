//Instantiate filemanager
core.filescreen = new _filescreen({
    headprompt: htmlwrap(`
    <h1>Polymorph: Effective Organisation</h1>
    <div id="__fsnew">
        <h2>Creat a new document</h2>
        <label>Template<select class="tmplt"></select></label><br>
        <label>Source<select class="source"></select></label><br>
        <label>Name<input data-role="nm"></input></label>
        <button class="mknu">Create</button>
    </div>
    `),
    formats: false,
    tutorialEnabled: false,
    savePrefix: "polymorph"
});

core.on("UIstart", () => {
    core.filescreen.baseDiv.querySelector(".tmplt").appendChild(htmlwrap(`<option value="none">None</option>`));
    for (let i in polymorphTemplates) {
        core.filescreen.baseDiv.querySelector(".tmplt").appendChild(htmlwrap(`<option value="${i}">${i}</option>`));
    }
    for (let i in core.saveSources) {
        if (core.saveSources[i].createable) {
            core.filescreen.baseDiv.querySelector(".source" ).appendChild(htmlwrap(`<option value="${i}">${core.saveSources[i].prettyName || i}</option>`));
        }
    }
})

core.filescreen.baseDiv.querySelector(".mknu").addEventListener("click", () => {
    //don't reload the page, directly load a new document, so we can handle the case appropriately
    //some parameters
    let template = core.filescreen.baseDiv.querySelector(".tmplt").value;
    let source = core.filescreen.baseDiv.querySelector(".source").value;
    let nm = core.filescreen.baseDiv.querySelector("[data-role='nm']").value || guid(5);
    let id = guid(5);
    //generate the URL
    window.history.pushState("", "", window.location + `?doc=${nm}&src=${source}`);
    let d = {
        displayName: nm,
        currentView: "default",
        id: core.currentDocID,
        views: {},
        items: {}
    }
    d.id = core.currentDocID = id;
    if (template!="none") {
        Object.assign(d, polymorphTemplates[template]);
    }
    if (!core.userData.documents[core.currentDocID]) {
        core.userData.documents[core.currentDocID] = {};
    }
    if (!core.userData.documents[core.currentDocID].saveSources) {
        core.userData.documents[core.currentDocID].saveSources = {};
    }
    if (!core.userData.documents[core.currentDocID].saveSources[source]) {
        //this is a new document.... do stuff
        //Create a new profile for this save source and document
        core.userData.documents[core.currentDocID].saveSources[source] = core.currentDocID;
    }
    core.fire("documentCreated", id);
    core.fromSaveData(d);
    core.filescreen.saveRecentDocument(core.currentDocID, undefined, core.currentDoc.displayName);
    core.filescreen.baseDiv.style.display="none";
})
