(function () {
    let viewsets;
    core.registerOperator("opSelect", { displayName: "New Operator", hidden: true }, function (container) {
        let me = this;
        me.container = container;
        this.settings = {};
        this.style = document.createElement("style");
        this.style.innerHTML = `
    div.views>div{
        background:lightgrey;
        border: black 3px solid;
    }
    div.views>div:hover{
        background:white;
    }
    `;
        container.div.appendChild(this.style);

        this.rootdiv = document.createElement("div");
        this.rootdiv.style.height = "100%";
        this.rootdiv.style.overflowY = "auto";
        //Add div HTML here
        this.rootdiv.innerHTML = `
    <div class="views">
    </div>
    <h1 style="color:white">Operators</h1>
    <p style="color:white">Choose an container for this space!</p>
    <div class="operators">
    <div class="buttons"></div>
    <div class="descriptions" style="height:5em;"></div>
    </div>`;
        this.buttondiv = this.rootdiv.querySelector("div.operators>div.buttons");
        this.descInnerDiv = this.rootdiv.querySelector("div.descriptions");
        this.viewInnerDiv = this.rootdiv.querySelector("div.views");
        this.reloadContents = function () {
            for (let i in core.operators) {
                if (core.operators[i].options.hidden) continue;
                if (me.buttondiv.querySelector(`[data-under-operator-name="${i}"]`)) return;
                let b = document.createElement("button");
                let displayText = i;
                if (core.operators[i].options.displayName) displayText = core.operators[i].options.displayName;
                b.innerHTML = displayText;
                b.dataset.underOperatorName = i;
                b.addEventListener("click", () => {
                    //get out of the way
                    while (container.div.children.length) container.div.children[0].remove();
                    container.settings.type = b.dataset.underOperatorName;
                    container.operator = new core.operators[b.dataset.underOperatorName].constructor(container);
                    //change the operator potato.
                    //change name if user has not already modified name
                    if (container.settings.tabbarName == "New Operator") container.settings.tabbarName = core.operators[b.dataset.underOperatorName].options.displayName || me.type;
                    container.fire("updateView", {
                        sender: this
                    });
                })
                me.buttondiv.appendChild(b);
                //generate the description
                let descDiv = document.createElement("div");
                if (core.operators[i].options.description) {
                    descDiv.innerHTML = `<p>` + core.operators[i].options.description + `</p>`;
                } else {
                    descDiv.innerHTML = `<p>No description provided :/</p>`;
                }
                descDiv.style.display = "none";
                me.descInnerDiv.appendChild(descDiv);
                b.addEventListener("mouseover", () => {
                    for (let i = 0; i < me.descInnerDiv.children.length; i++) {
                        me.descInnerDiv.children[i].style.display = "none";
                    }
                    descDiv.style.display = "block";
                })
                b.addEventListener("mouseleave", () => {
                    descDiv.style.display = "none";
                });
            }
        }
        this.reloadContents();
        container.div.appendChild(this.rootdiv);
        container.on("operatorAdded", me.reloadContents);
        this.refresh = this.reloadContents;
        //////////////////Handle core item updates//////////////////

        //these are optional but can be used as a reference.

        //Handle the settings dialog click!
        this.dialogDiv = document.createElement("div");
        this.dialogDiv.innerHTML = ``;
        this.showDialog = function () {
            // update your dialog elements with your settings
        }

        //////////////////Handling local changes to push to core//////////////////

        //Saving and loading
        this.toSaveData = function () {
            return this.settings;
        }

        this.fromSaveData = function (d) {
            Object.assign(this.settings, d);
            this.processSettings();
        }



        //Handle a change in settings (either from load or from the settings dialog or somewhere else)
        this.processSettings = function () {

        }


    });
})();