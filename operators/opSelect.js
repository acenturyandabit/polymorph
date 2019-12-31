(function () {
    let viewsets;
    polymorph_core.registerOperator("opSelect", { displayName: "New Operator", hidden: true }, function (container) {
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
            for (let i in polymorph_core.operators) {
                if (polymorph_core.operators[i].options.hidden) continue;
                if (me.buttondiv.querySelector(`[data-under-operator-name="${i}"]`)) return;
                let b = document.createElement("button");
                let displayText = i;
                if (polymorph_core.operators[i].options.displayName) displayText = polymorph_core.operators[i].options.displayName;
                b.innerHTML = displayText;
                b.dataset.underOperatorName = i;
                b.addEventListener("click", () => {
                    //get out of the way
                    while (container.div.children.length) container.div.children[0].remove();
                    container.settings.t = b.dataset.underOperatorName;
                    container.operator = new polymorph_core.operators[b.dataset.underOperatorName].constructor(container);
                    //change the operator potato.
                    //change name if user has not already modified name
                    if (container.settings.tabbarName == "New Operator") container.settings.tabbarName = polymorph_core.operators[b.dataset.underOperatorName].options.displayName || b.dataset.underOperatorName;
                    //force the parent rect to update my name
                    polymorph_core.rects[container.settings.p].tieContainer(container.id);
                    container.fire("updateItem", {
                        id: this.container.id,
                        sender: this
                    });
                })
                me.buttondiv.appendChild(b);
                //generate the description
                let descDiv = document.createElement("div");
                if (polymorph_core.operators[i].options.description) {
                    descDiv.innerHTML = `<p>` + polymorph_core.operators[i].options.description + `</p>`;
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
        //////////////////Handle polymorph_core item updates//////////////////

        //these are optional but can be used as a reference.

        //Handle the settings dialog click!
        this.dialogDiv = document.createElement("div");
        this.dialogDiv.innerHTML = ``;
        this.showDialog = function () {
            // update your dialog elements with your settings
        }

        //////////////////Handling local changes to push to polymorph_core//////////////////

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