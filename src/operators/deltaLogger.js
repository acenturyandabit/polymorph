polymorph_core.registerOperator("deltaLogger", {
    displayName: "Delta Logger",
    section: "Advanced",
    description: "A system for logging a document's changes."
}, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        submissionTransmitter: "(changes)=>console.log(changes);"
    };

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `
    <style>*{color:white;}</style>
    <h2>Changelog</h2>
    <div class="changelog">
        <p class="nochanges">No changes made so far...</p>
    </div>
    <button style="color:black">Submit changes</button>
    `;

    container.on("updateItem", (d) => {
        //add a change
        let id = d.id;
        if (d.loadProcess) return;
        if (this.rootdiv.querySelector(".nochanges")) this.rootdiv.querySelector(".nochanges").remove();
        if (!this.rootdiv.querySelector(`[data-id="${id}"]`)) {
            this.rootdiv.querySelector(".changelog").appendChild(htmlwrap(`
            <p data-id="${id}">"${id}":${JSON.stringify(polymorph_core.items[id])}</p>`))
        } else {
            this.rootdiv.querySelector(`[data-id="${id}"]`).innerText = `"${id}":${JSON.stringify(polymorph_core.items[id])}`;
        }
    })

    container.on("deleteItem", (d) => {
        let id = d.id;
        //something was deleted. we are logging this deletion with just the word "DELETE"
        if (this.rootdiv.querySelector(".nochanges")) this.rootdiv.querySelector(".nochanges").remove();
        if (!this.rootdiv.querySelector(`[data-id="${id}"]`)) {
            this.rootdiv.querySelector(".changelog").appendChild(htmlwrap(`
            <p>"${id}":{}</p>`))
        } else {
            this.rootdiv.querySelector(`[data-id="${id}"]`).innerText = `"${id}":{}`;
        }
    })
    this.rootdiv.querySelector("button").addEventListener("click", (e) => {
        eval(this.settings.submissionTransmitter)(`{${Array.from(this.rootdiv.querySelector(".changelog").children).map(i => i.innerText).join(",")}}`);
    })

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    let options = {
        submissionTransmitter: new polymorph_core._option({
            div: this.dialogDiv,
            type: "textarea",
            object: this.settings,
            property: "submissionTransmitter",
            label: "Submission function"
        })
    }
    this.showDialog = function () {
        // update your dialog elements with your settings
        for (let i in options) options[i].load();
    }
    this.dialogUpdateSettings = function () {
        // This is called when your dialog is closed. Use it to update your container!
    }

});