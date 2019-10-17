//Instantiate filemanager
core.filescreen = new _filescreen({
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
    core.instantNewDoc();
})
