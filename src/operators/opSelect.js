(function() {
    polymorph_core.registerOperator("opSelect", { displayName: "New Operator", hidden: true }, function(container) {
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
    *{
        color:white;
    }
    button>*{
        color:black;
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
    <h1 style="color:white">New Operator</h1>
    <p style="color:white">Choose an operator for this space! <a href="ethos.html" target="_blank">What's going on?</a></p>
    <div class="operators" style="display:flex; flex-direction:column">
    </div>`;
        this.reloadContents = () => {
            for (let i in polymorph_core.operators) {
                if (polymorph_core.operators[i].options.hidden) continue;
                if (this.rootdiv.querySelector(`[data-under-operator-name="${i}"]`)) return;
                //create the title block under operators if it needs creating
                let sectionContainer = this.rootdiv.querySelector(`[data-section="${polymorph_core.operators[i].options.section || "other"}"]`);
                if (!sectionContainer) {
                    sectionContainer = htmlwrap(`<div data-section="${polymorph_core.operators[i].options.section || "other"}">
                        <h2>${polymorph_core.operators[i].options.section || "Other"}</h2>
                        <div style="display:flex; flex-direction: row; flex-direction: row; flex-wrap:wrap; align-content: flex-start;">
                        </div>
                    </div>`);
                    this.rootdiv.querySelector(".operators").appendChild(sectionContainer);
                }
                sectionContainer = sectionContainer.children[1];

                let b = htmlwrap(`<button data-under-operator-name="${i}" style="flex: 0 0 15em; display:flex; flex-direction:column">
                <img src="${polymorph_core.operators[i].options.imageurl || ""}" style="flex: 0 0 14em; max-width:14em" ></img>
                <h3>${polymorph_core.operators[i].options.displayName || i}</h3>
                <span>${polymorph_core.operators[i].options.description || ""}</span>
                </button>`);
                b.addEventListener("click", () => {
                    //get out of the way
                    while (container.div.children.length) container.div.children[0].remove();
                    container.settings.t = b.dataset.underOperatorName;
                    container.operator = new polymorph_core.operators[b.dataset.underOperatorName].constructor(container, true);
                    //change the operator potato.
                    //change name if user has not already modified name
                    if (container.settings.tabbarName == "New Operator") container.settings.tabbarName = polymorph_core.operators[b.dataset.underOperatorName].options.displayName || b.dataset.underOperatorName;
                    //force the parent rect to update my name
                    polymorph_core.rects[container.settings.p].tieContainer(container.id);
                    polymorph_core.rects[container.settings.p].refresh(); // kick it so the container actually loads its operator
                    polymorph_core.rects[container.settings.p].switchOperator(container.id);
                    // also make sure we focus on this container, because phone sometimes doesnt
                    container.fire("updateItem", {
                        id: this.container.id,
                        sender: this
                    });
                })
                sectionContainer.appendChild(b);
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
        this.showDialog = function() {
            // update your dialog elements with your settings
        }

        //////////////////Handling local changes to push to polymorph_core//////////////////

        //Saving and loading
        this.toSaveData = function() {
            return this.settings;
        }


        //Handle a change in settings (either from load or from the settings dialog or somewhere else)
        this.processSettings = function() {

        }


    });
})();