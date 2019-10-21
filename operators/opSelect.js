(function () {
    let viewsets;
    core.registerOperator("opSelect",{displayName: "New Operator",hidden:true}, function (operator) {
        let me = this;
        me.container = operator;
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
        operator.div.appendChild(this.style);

        this.rootdiv = document.createElement("div");
        this.rootdiv.style.height = "100%";
        this.rootdiv.style.overflowY = "auto";
        //Add div HTML here
        this.rootdiv.innerHTML = `
    <div class="views">
    </div>
    <h1 style="color:white">Operators</h1>
    <p style="color:white">Choose an operator for this space!</p>
    <div class="operators">
    <div class="buttons"></div>
    <div class="descriptions" style="height:5em;"></div>
    </div>`;
        this.buttondiv = this.rootdiv.querySelector("div.operators>div.buttons");
        this.descInnerDiv = this.rootdiv.querySelector("div.descriptions");
        this.viewInnerDiv = this.rootdiv.querySelector("div.views");
        this.reloadContents = function () {
            for (let i in core.operators) {
                if (core.operators[i].options.hidden)continue;
                if (me.buttondiv.querySelector(`[data-under-operator-name="${i}"]`))return;
                let b = document.createElement("button");
                let displayText = i;
                if (core.operators[i].options.displayName) displayText = core.operators[i].options.displayName;
                b.innerHTML = displayText;
                b.dataset.underOperatorName = i;
                b.addEventListener("click", () => {
                    operator.reload(b.dataset.underOperatorName);
                    //change name if user has not already modified name
                    if (operator.tabbarName=="New Operator") operator.tabbarName=core.operators[b.dataset.underOperatorName].options.displayName || me.type;
                    core.fire("updateView", {
                        sender: this
                    });
                    operator.rect.tieOperator(operator);
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
        operator.div.appendChild(this.rootdiv);
        core.on("operatorAdded", me.reloadContents);
        this.refresh=this.reloadContents;
        //////////////////Handle core item updates//////////////////

        //these are optional but can be used as a reference.

        //Handle the settings dialog click!
        this.dialogDiv=document.createElement("div");
        this.dialogDiv.innerHTML=``;
        this.showDialog=function(){
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