//Instantiate filemanager
polymorph_core.filescreen = new _filescreen({
    headprompt: htmlwrap(`
    <h1>Polymorph: Effective Organisation</h1>
    <p style="margin:0">v 1.1</p>
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

polymorph_core.on("UIstart", () => {
    polymorph_core.filescreen.baseDiv.querySelector(".tmplt").appendChild(htmlwrap(`<option value="none">None</option>`));
    for (let i in polymorph_core.templates) {
        polymorph_core.filescreen.baseDiv.querySelector(".tmplt").appendChild(htmlwrap(`<option value="${i}">${i}</option>`));
    }
    for (let i in polymorph_core.saveSources) {
        if (polymorph_core.saveSources[i].createable) {
            polymorph_core.filescreen.baseDiv.querySelector(".source").appendChild(htmlwrap(`<option value="${i}">${polymorph_core.saveSources[i].prettyName || i}</option>`));
        }
    }
})

polymorph_core.filescreen.baseDiv.querySelector(".mknu").addEventListener("click", () => {
    let template = polymorph_core.filescreen.baseDiv.querySelector(".tmplt").value;
    let source = polymorph_core.filescreen.baseDiv.querySelector(".source").value;
    let nm = polymorph_core.filescreen.baseDiv.querySelector("[data-role='nm']").value || "New Workspace";
    let id = polymorph_core.guid(5);
    //redirect to a creation URL, thats all
    let newURL=window.location.href.split("?")[0];
    newURL+=`?doc=${id}&src=${source}`;
    if (nm)newURL+=`&nm=${nm}`
    if (template!="none")newURL+=`&tmp=${template}`;
    window.location.href=newURL;
})
