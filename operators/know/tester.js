core.registerOperator("tester", {
    displayName: "Testser",
    description: "Entry and examination for Polymorph's knowledge base use-case."
}, function (container) {
    let me = this;
    me.container = container;//not strictly compulsory bc this is expected and automatically enforced - just dont touch it pls.

    this.settings = {
        filter: guid(),
        testing: true,
        validateTestInput: true,
        inputParent: "",
        testingParent: "",
        cardAProp: "title",
        cardBProp: "description"
    };


    this.rootdiv = document.createElement("div");
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.rootdiv.innerHTML = `
    <style>
    .buttonContainer{
        display:flex;
        flex-direction:row;
    }
    .buttonContainer>*{
        flex: 1 1 auto;
    }
    </style>

    <button data-role="toggleMode">Toggle mode</button>
    <h1>Enter a new item</h1>
    <h2 class="uparent"><span class="l2">Currently under topic:</span><span class="parentName"></span></h2>
    <textarea class="above" placeholder="Card A" style="width:100%; height: 30%; resize:none"></textarea>
    <textarea class="below" placeholder="Card B" style="width:100%; height: 30%; resize:none"></textarea>
    <div class="buttonContainer"><button class="submit">Add</button><button class="wrong">Wrong</button></div>
    `;

    container.div.appendChild(this.rootdiv);

    ////////////////////////////////////////////////
    ///internal updating

    this.rootdiv.querySelector("[data-role='toggleMode']").addEventListener("click", () => {
        this.toggleMode();
    })

    this.updateUI = () => {
        if (this.settings.testing) {// True means test testing
            this.rootdiv.querySelector("h1").innerText = "Test mode";
            this.rootdiv.querySelector(".l2").innerText = "Currently testing topic:";
            this.rootdiv.querySelector(".parentName").innerText = this.settings.testingParent;
            this.rootdiv.querySelector("textarea.above").disabled = true;
            this.rootdiv.querySelector(".submit").innerText = "Correct";
            this.rootdiv.querySelector(".wrong").style.display = "block";
            this.generateQuestion();
        } else {
            this.rootdiv.querySelector("h1").innerText = "Enter a new item";
            this.rootdiv.querySelector(".l2").innerText = "Currently under topic:";
            this.rootdiv.querySelector(".parentName").innerText = this.settings.inputParent;
            this.rootdiv.querySelector("textarea.above").disabled = false;
            this.rootdiv.querySelector("textarea.above").value = "";
            this.rootdiv.querySelector("textarea.below").value = "";
            this.rootdiv.querySelector(".submit").innerText = "Add";
            this.rootdiv.querySelector(".wrong").style.display = "none";
        }
    }

    this.toggleMode = function (testing) {
        if (testing != undefined) this.settings.testing = testing;
        else this.settings.testing = !this.settings.testing;
        this.updateUI();
    }





    ////////////////Testing

    this.rootdiv.querySelector(".submit").addEventListener("click", () => {
        let action = this.rootdiv.querySelector(".submit").innerText;
        switch (action) {
            case "Correct":
                this.controller.update(true);
                this.revealAnswer();
                break;
            case "Next":
                this.generateQuestion();
                break;
        }
    })

    this.rootdiv.querySelector(".wrong").addEventListener("click", () => {
        this.controller.update(false);
        this.revealAnswer();
    })

    this.generateQuestion = function () {
        //generate a question
        //pick out every item I care about - for now. later cache a list of things
        //only add children, so that our recursive confidence update makes sense
        this.activeList = [];
        if (this.settings.testingParent) {
            let stack = [this.settings.testingParent];
            for (let i = 0; i < stack.length; i++) {
                let ci = stack[i];
                for (let i in core.items[ci].to) {
                    if (!(core.items[i].to) || (core.items[i].to == {})) this.activeList.push(i);
                    else {
                        if (!stack.includes(i)) stack.push(i);
                    }
                }
            }
        } else {
            for (let i in core.items) {
                //();
                if ((!this.filter) || core.items[i][this.settings.filter]) {
                    if (!(core.items[i].to) || (core.items[i].to == {})) this.activeList.push(i);
                }
            }
        }

        //pick a node
        let toTest = this.activeList[Math.floor(Math.random() * this.activeList.length)];
        if (!toTest) {
            this.rootdiv.querySelector("textarea.above").value = "No items to test!"
            this.rootdiv.querySelector(".submit").innerText = "Add Items";
            this.rootdiv.querySelector(".wrong").style.display = "none";

        } else {
            this.currentTested = toTest;
            this.rootdiv.querySelector("textarea.above").value = core.items[toTest][this.settings.cardAProp];
            this.rootdiv.querySelector("textarea.below").value = "";
            this.rootdiv.querySelector(".submit").innerText = "Correct";
            this.rootdiv.querySelector(".wrong").style.display = "block";
        }
        container.fire("focus", { id: toTest, sender: this });
    }

    this.revealAnswer = function () {
        this.rootdiv.querySelector("textarea.below").value = core.items[this.currentTested][this.settings.cardBProp];
        this.rootdiv.querySelector(".submit").innerText = "Next";
        this.rootdiv.querySelector(".wrong").style.display = "none";
    }
    //////////////////////////////
    // The controller...
    this.controller = {
        update: (correct) => {
            let seenbunch = [];
            let calculateConfidence = (id) => {
                if (!seenbunch.includes(id)) {
                    seenbunch.push(id);
                    let totalScore = 0;
                    let nItems = Object.keys(core.items[id]).length;
                    for (let i in core.items[id].to) {
                        totalScore += (core.items[i].confidence || 0) / nItems;
                    }
                    core.items[id].confidence = totalScore;
                    container.fire("updateItem", { id: id });
                    for (let i in core.items) {
                        if (core.items[i].to && core.items[i].to[id]) {
                            calculateConfidence(i);
                        }
                    }
                }
            }
            if (!core.items[this.currentTested].confidence) {
                if (correct) core.items[this.currentTested].confidence = 0.5;
                else core.items[this.currentTested].confidence = 0;
            }
            core.items[this.currentTested].confidence = (core.items[this.currentTested].confidence) * 0.5 + (correct * 0.5);
            for (let i in core.items) {
                if (core.items[i].to && core.items[i].to[this.currentTested]) {
                    calculateConfidence(i);
                }
            }
            //do nothing for nowwww
        }
    }

    ///////////////Adding items
    this.rootdiv.querySelector(".submit").addEventListener("click", () => {
        let action = this.rootdiv.querySelector(".submit").innerText;
        switch (action) {
            case "Add":
                let itm = {
                    title: this.rootdiv.querySelector("textarea.above").value,
                    B: this.rootdiv.querySelector("textarea.below").value
                };
                itm[this.settings.filter] = true;
                let id = core.insertItem(itm);
                if (this.settings.inputParent) core.link(this.settings.inputParent, id);
                container.fire("updateItem", { id: id, sender: this });
                //clear it all for the next insertion
                this.rootdiv.querySelector("textarea.above").value = "";
                this.rootdiv.querySelector("textarea.below").value = "";
                break;
            case "Add Items":
                this.toggleMode(false);
                break;
        }
    })


    //////////////////Handle core item updates//////////////////

    //this is called when an item is updated (e.g. by another container)
    container.on("updateItem", function (d) {
        // Don't need to do anything... just return true for garbage collector if relevant to me
        let id = d.id;
        //do stuff with the item.
        if (core.items[id][me.settings.filter]) {
            return true;
        }
        //return true or false based on whether we can or cannot edit the item from this container.
        //otherwise your items _may_ be deleted by the core garbage collector :/
        return false;
    });

    //Core will call me when an object is focused on from somewhere
    container.on("focus", (d) => {
        let id = d.id;
        if (d.sender == this) return;
        if (this.settings.testing) {
            me.settings.testingParent = id;
            this.generateQuestion();
            //alt focus testing for editing
        } else {
            me.settings.inputParent = id;
            //update the current parent as well.
        }
        this.updateUI();
    });


    this.refresh = function () {
        // This is called when my parent rect is resized.
    }

    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    this.fromSaveData = function (d) {
        //this is called when your container is started OR your container loads for the first time
        Object.assign(this.settings, d);
        this.updateUI();
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    let ops = [new _option({
        div: this.dialogDiv,
        type: "text",
        object: this.settings,
        property: "filter",
        label: "Filter items by:"
    }),
    new _option({
        div: this.dialogDiv,
        type: "bool",
        object: this.settings,
        property: "testing",
        label: "Testing or Entry"
    }),
    new _option({
        div: this.dialogDiv,
        type: "bool",
        object: this.settings,
        property: "validateTestInput",
        label: "Validate input? (vs manual validation)"
    }),
    new _option({
        div: this.dialogDiv,
        type: "text",
        object: this.settings,
        property: "parentItem",
        label: "Parent item to test from"
    }),
    new _option({
        div: this.dialogDiv,
        type: "text",
        object: this.settings,
        property: "cardAProp",
        label: "Card A Property"
    }),
    new _option({
        div: this.dialogDiv,
        type: "text",
        object: this.settings,
        property: "cardBProp",
        label: "Card B property"
    })
    ];
    this.showDialog = function () {
        // update your dialog elements with your settings
        ops.forEach((i) => i.load());
    }
    this.dialogUpdateSettings = function () {
        // pull settings and update when your dialog is closed.
    }

});