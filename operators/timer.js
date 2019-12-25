polymorph_core.registerOperator("timer", {
    displayName: "Timer",
    description: "A timer."
}, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        mode: "standalone",
        focusedItem: undefined,
        started: false,
        startLock: true,
        timerTotalProp: "timer"
    };

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `
        <h1></h1>
        <button>Start</button>
    `;
    this.rootdiv.children[1].addEventListener("click", () => {
        this.settings.started = !this.settings.started;
        if (this.settings.started)this.rootdiv.children[1].innerHTML="Stop";
        else this.rootdiv.children[1].innerHTML="Start";
    })
    container.on("focus,updateItem", (d) => {
        if (this.settings.mode == "focus" && !(this.settings.startLock && this.settings.started)) {
            this.settings.focusedItem = d.id;
            this.settings.remainingTime = polymorph_core.items[this.settings.focusedItem][this.settings.timerTotalProp];
            this.settings.started = false;
        }
    })

    setInterval(() => {
        if (this.settings.started) this.settings.remainingTime -= 100;
        let remainingTimeDate = new Date(Number(this.settings.remainingTime) + (new Date(Number(this.settings.remainingTime))).getTimezoneOffset() * 60 * 1000);
        this.rootdiv.children[0].innerHTML = remainingTimeDate.toTimeString().split(" ")[0];
    }, 100);

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    //select
    let opts = [
        new _option({
            div: this.dialogDiv,
            type: "select",
            object: this.settings,
            property: "mode",
            source: ["focus", "standalone"],
            label: "Operation mode"
        }),
        new _option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "timerTotalProp",
            label: "Focus property"
        }),
        new _option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "startLock",
            label: "Lock focus on start"
        })
    ];

    this.showDialog = function () {
        // update your dialog elements with your settings
        opts.forEach(i => i.load());
    }
    this.dialogUpdateSettings = function () {
        // This is called when your dialog is closed. Use it to update your container!
    }

});