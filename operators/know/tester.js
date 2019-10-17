core.registerOperator("tester", {
    displayName: "Testser",
    description: "Entry and examination for Polymorph's knowledge base use-case."
}, function (container) {
    let me = this;
    me.container = container;//not strictly compulsory bc this is expected and automatically enforced - just dont touch it pls.
    this.settings = {
        filter: guid(),
        mode: true
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
    <h2 class="uparent">Currently under topic:<span class="l2"></span></h2>
    <textarea class="above" placeholder="Card A" style="width:100%; height: 30%; resize:none"></textarea>
    <textarea class="below" placeholder="Card B" style="width:100%; height: 30%; resize:none"></textarea>
    <div class="buttonContainer"><button class="submit">Add</button><button class="wrong">Wrong</button></div>
    `;

    container.div.appendChild(this.rootdiv);

    this.rootdiv.querySelector("[data-role='toggleMode']").addEventListener("click", () => {
        this.toggleMode();
    })
    this.rootdiv.querySelector(".submit").addEventListener("click", () => {
        let action = this.rootdiv.querySelector(".submit").innerText;
        switch (action) {
            case "Correct":
                this.controller.update(true);
                this.revealAnswer();
                break;
            case "Add":
                let itm = {
                    title:this.rootdiv.querySelector("textarea.above").value,
                    B:this.rootdiv.querySelector("textarea.below").value
                };
                itm[this.settings.filter] = true;
                let id = core.insertItem(itm);
                if (this.settings.currentParent)core.link(this.settings.currentParent,id);
                core.fire("updateItem", { id: id, sender: this });
                //clear it all for the next insertion
                this.rootdiv.querySelector("textarea.above").value = "";
                this.rootdiv.querySelector("textarea.below").value = "";
                break;
            case "Next":
                this.generateQuestion();
                break;
            case "Add Items":
                this.toggleMode(false);
                break;
        }
    })
    this.rootdiv.querySelector(".wrong").addEventListener("click", () => {
        this.controller.update(false);
        this.revealAnswer();
    })
    ////////////////////////////////////////////////
    ///internal updating
    this.toggleMode = function (mode) {
        if (mode != undefined) this.settings.mode = mode;
        else this.settings.mode = !this.settings.mode;
        if (this.settings.mode) {// True means test mode
            this.rootdiv.querySelector("h1").innerText = "Testing mode";
            this.rootdiv.querySelector(".l2").innerText = "Currently testing topic:";
            this.rootdiv.querySelector("textarea.above").disabled = true;
            this.rootdiv.querySelector(".submit").innerText = "Correct";
            this.rootdiv.querySelector(".wrong").style.display = "block";
            this.generateQuestion();
        } else {
            this.rootdiv.querySelector("h1").innerText = "Enter a new item";
            this.rootdiv.querySelector(".l2").innerText = "Currently under topic:";
            this.rootdiv.querySelector("textarea.above").disabled = false;
            this.rootdiv.querySelector("textarea.above").value = "";
            this.rootdiv.querySelector("textarea.below").value = "";
            this.rootdiv.querySelector(".submit").innerText = "Add";
            this.rootdiv.querySelector(".wrong").style.display = "none";
        }
    }

    this.generateQuestion = function () {
        //generate a question
        //pick out every item I care about - for now. later cache a list of things
        this.activeList = [];
        for (let i in core.items) {
            if (core.items[i][this.settings.filter] && (!(core.items[i].to)||(core.items[i].to=={}))){
                this.activeList.push(i);
            }
        }
        //pick a leaf node
        let toTest = this.activeList[Math.floor(Math.random() * this.activeList.length)];
        if (!toTest) {
            this.rootdiv.querySelector("textarea.above").value = "No items to test!"
            this.rootdiv.querySelector(".submit").innerText = "Add Items";
            this.rootdiv.querySelector(".wrong").style.display = "none";

        } else {
            this.test(toTest);
        }
    }
    this.test = function (item) {
        this.currentTested = item;
        this.rootdiv.querySelector("textarea.above").value = core.items[item].title;
        this.rootdiv.querySelector("textarea.below").value = "";
        this.rootdiv.querySelector(".submit").innerText = "Correct";
        this.rootdiv.querySelector(".wrong").style.display = "block";
    }

    this.revealAnswer = function () {
        this.rootdiv.querySelector("textarea.below").value = core.items[this.currentTested].B;
        this.rootdiv.querySelector(".submit").innerText = "Next";
        this.rootdiv.querySelector(".wrong").style.display = "none";
    }
    //////////////////////////////
    // The controller...
    this.controller = {
        update: function () {
            //do nothing for nowwww
        }
    }


    //////////////////Handle core item updates//////////////////

    //this is called when an item is updated (e.g. by another operator)
    core.on("updateItem", function (d) {
        // Don't need to do anything... just return true for garbage collector if relevant to me
        let id = d.id;
        //do stuff with the item.
        if (core.items[id][me.settings.filter]) {
            return true;
        }
        //return true or false based on whether we can or cannot edit the item from this operator.
        //otherwise your items _may_ be deleted by the core garbage collector :/
        return false;
    });

    //Core will call me when an object is focused on from somewhere
    core.on("focus", function (d) {
        let id = d.id;
        let sender = d.sender;
        if (d.focusMode){
            //alt focus mode for editing
        }else{
            //update the current parent as well.
            me.setParent(id);
        }
    });

    this.setParent=function(id){
        this.settings.currentParent=id;
        if (!id){
            this.rootdiv.querySelector(".uparent").style.display='none';
        }else{
            this.rootdiv.querySelector(".uparent").style.display='block';
            this.rootdiv.querySelector(".l2").innerHTML=core.items[id].title;
        }

    }


    this.refresh = function () {
        // This is called when my parent rect is resized.
    }

    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    this.fromSaveData = function (d) {
        //this is called when your operator is started OR your operator loads for the first time
        Object.assign(this.settings, d);
        this.toggleMode(this.settings.mode);
        this.setParent(this.settings.currentParent);
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    let op = new _option({
        div: this.dialogDiv,
        type: "text",
        object: this.settings,
        property: "filter",
        label: "Filter items by:"
    });
    this.showDialog = function () {
        // update your dialog elements with your settings
        op.load();
    }
    this.dialogUpdateSettings = function () {
        // pull settings and update when your dialog is closed.
    }

});