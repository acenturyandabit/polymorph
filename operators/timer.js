polymorph_core.registerOperator("timer", {
    displayName: "Timer",
    description: "A timer.",
    section: "Utilities"
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
        <style>
        p#remaining_time{
            color:white;
        }
        </style>
    `;
    this.rootdiv.children[2].addEventListener("click", () => {
        this.settings.started = !this.settings.started;
        if (this.settings.started) {
            this.rootdiv.children[2].innerHTML = "Stop";
            let timeString = this.rootdiv.querySelector("input").value;
            this.startTimer(timeString);
        }
        else this.rootdiv.children[2].innerHTML = "Start";

    })

    this.rootdiv.querySelector("input").addEventListener("input", () => {
        this.settings.timeString = this.rootdiv.querySelector("input").value;
    });
    this.rootdiv.querySelector("input").value = this.settings.timeString;

    container.on("focusItem,updateItem", (d) => {
        if (this.settings.mode == "focus" && !(this.settings.startLock && this.settings.started)) {
            this.settings.focusedItem = d.id;
            let timeString = polymorph_core.items[this.settings.focusedItem][this.settings.timerTotalProp];
            this.rootdiv.querySelector("input").value = timeString;
        }
    })
    this.startTimer = (timeString) => {
        let ctimeLeft = intervalParser.extractTime(timeString);
        if (ctimeLeft) {
            this.settings.endTime = Date.now() + ctimeLeft.t;
            this.settings.started = true;
        }
    }

    this.notify = (txt, ask) => {
        quickNotify(txt, ask, () => {
            this.settings.pushnotifs = false;
        })
    }

    let doTimer = () => {
        let remaining_time;
        if (this.settings.started) {
            remaining_time = this.settings.endTime - Date.now();
            if (remaining_time <= 0) {
                //park at 0 so we don't end up with the time showing as :59
                remaining_time = 0;
                this.notify("Time's up!");
                this.settings.started = false;
                if (this.settings.loop) {
                    let timeString = this.rootdiv.querySelector("input").value;
                    this.startTimer(timeString);
                }
            }
        } else {
            remaining_time = 0;
        }
        let remainingTimeDate = new Date(Number(remaining_time) + (new Date(Number(remaining_time))).getTimezoneOffset() * 60 * 1000);
        let remainingTimeS = remainingTimeDate.toTimeString().split(" ")[0];
        if (remainingTimeS != this.rootdiv.children[1].innerText) this.rootdiv.children[1].innerText = remainingTimeS;
        setTimeout(doTimer, 100);//this rather than setInterval because then it'll nerf itself if you delete the operator ... well actually it wont but eh
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
            label: "Maintain focused item if timer started"
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
    if (this.settings.started) this.rootdiv.children[2].innerHTML = "Stop";
    else this.rootdiv.children[2].innerHTML = "Start";

});