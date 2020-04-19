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
        timerTotalProp: "timer",
        timeString: "10:00"
    };

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `
        <p><input></p>
        <p id="remaining_time">00:00</p>
        <button>Start</button>
    `;
    this.rootdiv.children[2].addEventListener("click", () => {
        this.settings.started = !this.settings.started;
        if (this.settings.started) this.rootdiv.children[2].innerHTML = "Stop";
        else this.rootdiv.children[2].innerHTML = "Start";
        let timeString = this.rootdiv.querySelector("input").value;
        this.startTimer(timeString);
    })

    this.rootdiv.querySelector("input").addEventListener("input", () => {
        this.settings.timeString = this.rootdiv.querySelector("input").value;
    });
    this.rootdiv.querySelector("input").value = this.settings.timeString;

    scriptassert([["intervalParser", "genui/intervalParser.js"]], () => {
        container.on("focusItem,updateItem", (d) => {
            if (this.settings.mode == "focus" && !(this.settings.startLock && this.settings.started)) {
                this.settings.focusedItem = d.id;
                let timeString = polymorph_core.items[this.settings.focusedItem][this.settings.timerTotalProp];
                this.rootdiv.querySelector("input").value = timeString;
            }
        })
        this.startTimer = (timeString) => {
            let ctimeLeft = intervalParser.extractTime(timeString);
            if (ctimeLeft) this.settings.remainingTime = ctimeLeft.t;
        }
    })

    waitForFn.apply(this, ["notify"]);
    scriptassert([["quickNotify", "genui/quickNotify.js"]], () => {
        this.notify = (txt, ask) => {
            quickNotify(txt, ask, () => {
                this.settings.pushnotifs = false;
            })
        }
    })

    let doTimer = () => {
        if (this.settings.started) {
            if (this.settings.remainingTime > 100) {
                this.settings.remainingTime -= 100;
            } else if (this.settings.remainingTime > 1) {
                this.settings.remainingTime = 1;
            } else if (this.settings.remainingTime == 1) {
                //park at 0 so we don't end up with the time showing as :59
                this.settings.remainingTime = 0;
                this.notify("Time's up!");
                this.settings.started = false;
                if (this.settings.loop) {
                    let timeString = this.rootdiv.querySelector("input").value;
                    this.startTimer(timeString);
                }
            }
        }
        let remainingTimeDate = new Date(Number(this.settings.remainingTime) + (new Date(Number(this.settings.remainingTime))).getTimezoneOffset() * 60 * 1000);
        this.rootdiv.children[1].innerText = remainingTimeDate.toTimeString().split(" ")[0];
        setTimeout(doTimer, 100);//this rather than setInterval because then it'll nerf itself if you delete the operator
    }
    doTimer();

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    //select
    let opts = [
        new polymorph_core._option({
            div: this.dialogDiv,
            type: "select",
            object: this.settings,
            property: "mode",
            source: ["focus", "standalone"],
            label: "Operation mode"
        }),
        new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "timerTotalProp",
            label: "Focus property"
        }),
        new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "startLock",
            label: "Lock focus on start"
        }),
        new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "pushnotifs",
            label: "Show notifications?"
        }),
        new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: this.settings,
            property: "loop",
            label: "Loop timer indefinitely?"
        })
    ];

    this.showDialog = function () {
        // update your dialog elements with your settings
        opts.forEach(i => i.load());
    }
    this.dialogUpdateSettings = function () {
        if (this.settings.pushnotifs) {
            this.notify("Notifications enabled!", true);
        }
        if (this.settings.started) this.rootdiv.children[2].innerHTML = "Stop";
        else this.rootdiv.children[2].innerHTML = "Start";
    }
    this.dialogUpdateSettings();

});