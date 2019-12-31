polymorph_core.registerOperator("tester", {
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
        cardBProp: "description",
        leafNodesOnly: true
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
    .below{
        display:flex;
        flex-wrap:wrap;
        align-content:flex-start;
    }
    .below input{
        display:block;
        flex: 1 0 50%;
    }
    </style>

    <button data-role="toggleMode">Toggle mode</button><button data-role="resetMode">Reset mode</button>
    <h1>Enter a new item</h1>
    <h2 class="uparent"><span class="l2">Currently under topic:</span><span class="parentName"></span></h2>
    <textarea class="above" placeholder="Card A" style="width:100%; height: 30%; resize:none"></textarea>
    <div class="below" style="width:100%; height: 30%; resize:none">
        <input>
        <input>
        <input>
        <input>
        <input>
        <input>
        <input>
        <input>
    </div>
    <div class="buttonContainer"><button class="buttonA">Add</button><button class="buttonB">Wrong</button></div>
    `;

    container.div.appendChild(this.rootdiv);

    ////////////////////////////////////////////////
    ///internal updating

    this.rootdiv.querySelector("[data-role='toggleMode']").addEventListener("click", () => {
        if (testing != undefined) this.settings.testing = testing;
        else this.settings.testing = !this.settings.testing;
        this.updateUI();
    })

    this.rootdiv.querySelector("[data-role='resetMode']").addEventListener("click", () => {
        this.state = "readyState";
        this.updateUI();
    })

    this.updateUI = () => {
        if (this.settings.testing) {
            this.rootdiv.querySelector("h1").innerText = "Test mode";
            this.rootdiv.querySelector(".l2").innerText = "Currently testing topic:";
            this.rootdiv.querySelector(".parentName").innerText = polymorph_core.items[this.settings.testingParent].title;
            this.rootdiv.querySelector("textarea.above").disabled = true;
            switch (this.state) {
                case "showingQuestion":
                    this.rootdiv.querySelector(".buttonA").innerText = "Show answer";
                    this.rootdiv.querySelector(".buttonB").style.display = "none";
                    this.generateQuestion();
                    break;
                case "waitCorrect":
                    this.rootdiv.querySelector(".buttonA").innerText = "Correct";
                    this.rootdiv.querySelector(".buttonB").style.display = "block";
                    break;
                case "readyState":
                    this.rootdiv.querySelector(".buttonA").innerText = "Start";
                    this.rootdiv.querySelector(".buttonB").style.display = "none";
            }
        } else {
            this.rootdiv.querySelector("h1").innerText = "Enter a new item";
            this.rootdiv.querySelector(".l2").innerText = "Currently under topic:";
            this.rootdiv.querySelector(".parentName").innerText = this.settings.inputParent;
            this.rootdiv.querySelector("textarea.above").disabled = false;
            this.rootdiv.querySelector("textarea.above").value = "";
            //this.rootdiv.querySelector("textarea.below").value = "";
            this.rootdiv.querySelector(".buttonA").innerText = "Add";
            this.rootdiv.querySelector(".buttonB").style.display = "none";
        }
    }


    ////////////////Testing
    let clearBottomBoxes = () => {
        let below = this.rootdiv.querySelector("div.below");
        for (let i = 0; i < below.children.length; i++) {
            below.children[i].style.backgroundColor = "white";
            below.children[i].dataset.used = false;
            below.children[i].value = "";
        }
    }
    function removeIf(arr, f) {
        for (let i = 0; i < arr.length; i++) {
            if (f(arr[i])) {
                arr.splice(i, 1);
                i--;
            }
        }
    }
    function isSimilar(sentA, sentB) {
        let splitA = sentA.split(/\W+/ig);
        let splitB = sentB.split(/\W+/ig);
        removeIf(splitA, (i) => { return i.length <= 3; })
        removeIf(splitB, (i) => { return i.length <= 3; })
        splitA = splitA.map((i => i.toLowerCase()));
        splitB = splitB.map((i => i.toLowerCase()));
        for (let i in splitA) {
            for (let j in splitB) {
                if (splitA[i] == splitB[j]) {
                    splitB.splice(j, 1);
                    break;
                }
            }
        }
        return (splitB.length == 0);
    }
    this.rootdiv.querySelector(".buttonA").addEventListener("click", () => {
        let action = this.rootdiv.querySelector(".buttonA").innerText;
        switch (action) {
            case "Show answer":
                let below = this.rootdiv.querySelector("div.below");
                //record the bottom box answers
                let trueAnswers;
                if (polymorph_core.items[this.currentTested][this.settings.cardBProp]) {
                    trueAnswers = polymorph_core.items[this.currentTested][this.settings.cardBProp].split(/\n/ig);
                    removeIf(trueAnswers, (i) => i == "");
                    for (let i = 0; i < trueAnswers.length; i++) {
                        for (let j = 0; j < below.children.length; j++) {
                            if (isSimilar(below.children[j].value, trueAnswers[i])) {
                                //green the box
                                below.children[j].style.backgroundColor = "lightgreen";
                                below.children[j].dataset.used = true;
                                trueAnswers.splice(i, 1);
                                i--;
                                break;
                            }
                        }
                    }
                }
                //yellow all user answers
                for (let j = 0; j < below.children.length; j++) {
                    if (below.children[j].dataset.used != "true" && below.children[j].value.length) {
                        below.children[j].style.backgroundColor = "orange";
                        below.children[j].dataset.used = true;

                    }
                }
                if (polymorph_core.items[this.currentTested][this.settings.cardBProp]) {
                    //add the remaining
                    for (let i = 0; i < trueAnswers.length; i++) {
                        let existingBox = false;
                        for (let j = 0; j < below.children.length; j++) {
                            if (below.children[j].dataset.used != "true") {
                                below.children[j].value = trueAnswers[i];
                                below.children[j].dataset.used = true;
                                existingBox = true;
                                break;
                            }
                        }
                        if (!existingBox) {
                            let newInput = htmlwrap(`<input>`);
                            newInput.value = trueAnswers[i];
                            below.appendChild(newInput);
                        }
                    }
                }
                this.state = "waitCorrect";
                break;
            case "Correct":
                this.controller.update(true);
                this.state = "showingQuestion";
                break;
            case "Start":
                this.state = "showingQuestion";
                break;
        }
        this.updateUI();
    })

    this.rootdiv.querySelector(".buttonB").addEventListener("click", () => {
        this.controller.update(false);
        this.state = "showingQuestion";
        this.updateUI();
    })


    function toProabilityArray(arr, freqname = "frequency", startName = "start") {
        let newArray = [];
        let totalFrequency = 0;
        for (let j = 0; j < arr.length; j++) {
            let newObj = {};
            Object.assign(newObj, arr[j]);
            newObj[startName] = totalFrequency;
            newArray.push(newObj);
            totalFrequency += arr[j][freqname];
        }
        for (let j = 0; j < newArray.length; j++) {
            newArray[j][startName] /= totalFrequency;
        }
        return newArray;
    }

    function sampleProbabilityArray(arr, startName = "start") {
        let findex = Math.random();
        for (let i = 0; i < arr.length; i++) {
            if (arr[i][startName] > findex) {
                return arr[i - 1];
            }
        }
        return arr[arr.length - 1];
    }

    this.generateQuestion = () => {
        //generate a question
        //pick out every item I care about - for now. later cache a list of things
        //only add children, so that our recursive confidence update makes sense
        this.activeList = [];
        if (this.settings.testingParent) {
            let stack = [this.settings.testingParent];
            for (let i = 0; i < stack.length; i++) {
                let ci = stack[i];
                for (let it in polymorph_core.items[ci].to) {
                    if (!this.settings.leafNodesOnly || (!(polymorph_core.items[it].to) || (Object.keys(polymorph_core.items[it].to).length == 0))) this.activeList.push(it);
                    if (!stack.includes(it)) stack.push(it);
                }
            }
        } else {
            for (let i in polymorph_core.items) {
                //();
                if ((!this.filter) || polymorph_core.items[i][this.settings.filter]) {
                    if (!(polymorph_core.items[i].to) || (Object.keys(polymorph_core.items[i].to).length == 0)) this.activeList.push(i);
                }
            }
        }
        this.activeList = this.activeList.map((i) => {
            return { id: i, chance: 1 - (polymorph_core.items[i].selfConfidence || 0), cv: polymorph_core.items[i].selfConfidence };
        })
        this.activeList = toProabilityArray(this.activeList, "chance");


        //pick a node
        let toTest = sampleProbabilityArray(this.activeList).id;
        if (!toTest) {
            this.rootdiv.querySelector("textarea.above").value = "No items to test!"
            this.rootdiv.querySelector(".buttonA").innerText = "Add Items";
            this.rootdiv.querySelector(".buttonB").style.display = "none";

        } else {
            this.currentTested = toTest;
            this.rootdiv.querySelector("textarea.above").value = polymorph_core.items[toTest][this.settings.cardAProp];
            clearBottomBoxes();
        }
        container.fire("focusItem", { id: toTest, sender: this });
    }

    //////////////////////////////
    // The controller...
    this.controller = {
        update: (correct) => {
            let seenbunch = [];
            let calculateConfidence = (id) => {
                if (!seenbunch.includes(id)) {
                    seenbunch.push(id);
                    let totalSpolymorph_core = 0;
                    let nItems;
                    if (polymorph_core.items[id].to) {
                        nItems = Object.keys(polymorph_core.items[id].to).length;
                    } else {
                        nItems = 0;
                    }
                    if (nItems > 0) {
                        let isTestable = (!me.settings.leafNodesOnly && polymorph_core.items[id][me.settings.cardAProp].includes("?"));
                        if (isTestable) nItems++;
                        for (let i in polymorph_core.items[id].to) {
                            totalSpolymorph_core += (polymorph_core.items[i].confidence || 0) / nItems;
                        }
                        if (isTestable) {
                            totalSpolymorph_core += (polymorph_core.items[id].selfConfidence || 0) / nItems;
                        }
                        polymorph_core.items[id].confidence = totalSpolymorph_core;
                    } else {
                        polymorph_core.items[this.currentTested].confidence = polymorph_core.items[this.currentTested].selfConfidence;
                    }
                    container.fire("updateItem", { id: id });
                    for (let i in polymorph_core.items) {
                        if (polymorph_core.items[i].to && polymorph_core.items[i].to[id]) {
                            calculateConfidence(i);
                        }
                    }
                }
            }
            if (!polymorph_core.items[this.currentTested].selfConfidence) {
                if (correct) polymorph_core.items[this.currentTested].selfConfidence = 0.5;
                else polymorph_core.items[this.currentTested].selfConfidence = 0;
            } else {
                polymorph_core.items[this.currentTested].selfConfidence = (polymorph_core.items[this.currentTested].selfConfidence) * 0.5 + (correct * 0.5);
            }
            calculateConfidence(this.currentTested);
            //do nothing for nowwww
        }
    }

    ///////////////Adding items
    this.rootdiv.querySelector(".buttonA").addEventListener("click", () => {
        let action = this.rootdiv.querySelector(".buttonA").innerText;
        switch (action) {
            case "Add":
                let itm = {
                    title: this.rootdiv.querySelector("textarea.above").value,
                    B: this.rootdiv.querySelector("textarea.below").value
                };
                itm[this.settings.filter] = true;
                let id = polymorph_core.insertItem(itm);
                if (this.settings.inputParent) polymorph_core.link(this.settings.inputParent, id);
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


    //////////////////Handle polymorph_core item updates//////////////////

    //this is called when an item is updated (e.g. by another container)
    container.on("updateItem", function (d) {
        // Don't need to do anything... just return true for garbage collector if relevant to me
        let id = d.id;
        //do stuff with the item.
        if (polymorph_core.items[id][me.settings.filter]) {
            return true;
        }
        //return true or false based on whether we can or cannot edit the item from this container.
        //otherwise your items _may_ be deleted by the polymorph_core garbage collector :/
        return false;
    });

    //polymorph_core will call me when an object is focused on from somewhere
    container.on("focus", (d) => {
        let id = d.id;
        if (d.sender == this) return;
        if (this.settings.testing) {
            me.settings.testingParent = id;
            this.state = 'showingQuestion';
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
        this.state = "readyState";
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
    }),
    new _option({
        div: this.dialogDiv,
        type: "bool",
        object: this.settings,
        property: "leafNodesOnly",
        label: "Only show leaf nodes"
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