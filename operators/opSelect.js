core.registerOperator("opSelect", function (operator) {
    let me = this;
    me.operator = operator;
    this.settings = {};


    this.viewsets = {
        kappa: {
            options:{
                displayName:"Calendar",
                description: "Steven's todolist conflagration.",
            },
            rect: {"operators":[{"type":"subframe","data":{"rectUnderData":{"XorY":0,"firstOrSecond":0,"pos":1,"children":[{"XorY":0,"firstOrSecond":0,"pos":0.6221052631578947,"children":[{"operators":[{"type":"itemList","data":{"properties":{"title":"text","tags":"tag","datestring":"date"},"filterProp":"tasklist","currentID":"w09d3q"}}],"selectedOperator":0,"XorY":1,"firstOrSecond":0,"pos":0.5271317829457365},{"operators":[{"type":"calendar","data":{"dateproperty":"datestring","dateRetrieval":"rDate","titleproperty":"title"}}],"selectedOperator":0,"XorY":1,"firstOrSecond":1,"pos":0.5271317829457365}]},{"operators":[{"type":"descbox","data":{"property":"description","operationMode":"focus","staticItem":"","currentID":"rplmsr"}}],"selectedOperator":0,"XorY":0,"firstOrSecond":1,"pos":0.6221052631578947}]}}},{"type":"subframe","data":{"rectUnderData":{"operators":[{"type":"httree","data":{}}],"selectedOperator":0,"XorY":0,"firstOrSecond":0,"pos":1}}},{"type":"subframe","data":{"rectUnderData":{"XorY":0,"firstOrSecond":0,"pos":1,"children":[{"operators":[{"type":"descbox","data":{"property":"description","operationMode":"focus","staticItem":"","currentID":"ugybai"}}],"selectedOperator":0,"XorY":0,"firstOrSecond":0,"pos":0.13210526315789473},{"operators":[{"type":"itemCluster","data":{"currentViewName":"ike7","maxZ":2}},{"type":"itemCluster","data":{"currentViewName":"pd8u","maxZ":66}}],"selectedOperator":0,"XorY":0,"firstOrSecond":1,"pos":0.13210526315789473}]}}},{"type":"subframe","data":{"rectUnderData":{"XorY":0,"firstOrSecond":0,"pos":1,"children":[{"operators":[{"type":"itemList","data":{"properties":{"title":"text","diaryDate":"date"},"filterProp":"diary","currentID":"w09d3q"}}],"selectedOperator":0,"XorY":0,"firstOrSecond":0,"pos":0.2563157894736842},{"operators":[{"type":"descbox","data":{"property":"description","operationMode":"focus","staticItem":""}},{"type":"itemCluster","data":{"currentViewName":"jmjs8f","maxZ":2}}],"selectedOperator":1,"XorY":0,"firstOrSecond":1,"pos":0.2563157894736842}]}}}],"selectedOperator":0,"XorY":0,"firstOrSecond":1,"pos":0}
        }
    }

    this.style=document.createElement("style");
    this.style.innerHTML=`
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
    //Add div HTML here
    this.rootdiv.innerHTML = `
    <h1>Quick start</h1>
    <p>Choose a setup below to get started quickly - or pick an operator below to design your own interface!</p>
    <div class="views">
    </div>
    <h1>Operators</h1>
    <p>Choose an operator for this space!</p>
    <div class="operators">
    <div class="buttons"></div>
    <div class="descriptions"></div>
    </div>`;
    this.buttondiv = this.rootdiv.querySelector("div.operators>div.buttons");
    this.descInnerDiv = this.rootdiv.querySelector("div.descriptions");
    this.viewInnerDiv=this.rootdiv.querySelector("div.views");
    core.on("operatorAdded", me.reloadContents);
    this.reloadContents = function () {
        for (let i in core.operators) {
            let b = document.createElement("button");
            let displayText = i;
            if (core.operators[i].options.displayName) displayText = core.operators[i].options.displayName;
            b.innerHTML = displayText;
            b.dataset.underOperatorName = i;
            b.addEventListener("click", () => {
                operator.reload(b.dataset.underOperatorName);
                core.fire("viewUpdate", {
                    sender: this
                });
                operator.rect.tieOperator(operator);
            })
            this.buttondiv.appendChild(b);
            //generate the description
            let descDiv = document.createElement("div");
            if (core.operators[i].options.description) {
                descDiv.innerHTML = `<p>` + core.operators[i].options.description + `</p>`;
            } else {
                descDiv.innerHTML = `<p>No description provided :/</p>`;
            }
            descDiv.style.display = "none";
            this.descInnerDiv.appendChild(descDiv);
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
        //viewsets. load from some JSON file remotely eventually but for now its in this file.
        let v=  this.viewsets;
        for (let i in v) {
            let b = document.createElement("div");
            let displayText = i;
            if (v[i].options.displayName) displayText = v[i].options.displayName;
            b.innerHTML = `<div>
            <h1>`+displayText+`</h1>
            <p>`+(v[i].options.description || "No description provided :/")+`</p>
            </div>`;
            b.dataset.id = i;
            b.addEventListener("click", () => {
                operator.rect.fromSaveData(v[b.dataset.id].rect);
                core.fire("viewUpdate", {
                    sender: this
                });
                //operator.rect.tieOperator(operator);
            })
            this.viewInnerDiv.appendChild(b);
        }
    }
    this.reloadContents();
    operator.div.appendChild(this.rootdiv);

    //////////////////Handle core item updates//////////////////

    //these are optional but can be used as a reference.


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

    //Create a settings dialog
    scriptassert([
        ["dialog", "genui/dialog.js"]
    ], () => {
        me.dialog = document.createElement("div");

        me.dialog.innerHTML = `
        <div class="dialog">
        </div>`;
        dialogManager.checkDialogs(me.dialog);
        //Restyle dialog to be a bit smaller
        me.dialog = me.dialog.querySelector(".dialog");
        me.innerDialog = me.dialog.querySelector(".innerDialog");
        operator.div.appendChild(me.dialog);
        let d = document.createElement("div");
        d.innerHTML = `
        `; //WHAT YOU WANT TO PUT IN YOUR DIALOG
        me.innerDialog.appendChild(d);

        //When the dialog is closed, update the settings.
        me.dialog.querySelector(".cb").addEventListener("click", function () {
            me.updateSettings();
            me.fire("viewUpdate");
        })

        me.showSettings = function () {
            me.dialog.style.display = "block";
        }
    })



});