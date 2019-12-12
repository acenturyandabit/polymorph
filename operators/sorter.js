polymorph_core.registerOperator("sorter", {
    displayName: "Sorter",
    description: "Sort and categorise items, and see statistics about them."
}, function (container) {
    let me = this;
    me.container = container;//not strictly compulsory bc this is expected and automatically enforced - just dont touch it pls.
    this.settings = {};

    this.rootdiv = document.createElement("div");
    this.rootdiv.style.cssText=`overflow: scroll;
    height: 100%;`;
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.rootdiv.innerHTML = `
    <p>Only show items with property:</p>
    <input data-role='showProp' placeholder = 'Property name'></input>
    <p>Filter based on this property:</p>
    <input data-role='filterProp' placeholder = 'Property name'></input>
    <!--<p>Show filterset:</p>
    <input data-role='filterSet' placeholder = 'Filter set name'></input>-->
    <hr>
    <p>Regex</p>
    <input data-role='regex' placeholder = 'Regex'></input>
    <button>Run</button>
    <div>
        <h1>Percentage matched:<span class="pct"></span></h1>
        <div>
            <h1>Matched</h1>
            <div class="matched results">
            </div>
        </div>
        <div>
            <h1>Not matched</h1>
            <div class="notmatched results">
            </div>
        </div>
    </div>
    `;

    container.div.appendChild(this.rootdiv);

    this.rootdiv.addEventListener("input",(e)=>{
        if (e.target.matches("[data-role]"))this.settings[e.target.dataset.role]=e.target.value;
    });

    //run buttton clicked
    this.rootdiv.querySelector("button").addEventListener("click",(e)=>{
        //reset everything
        let old=this.rootdiv.querySelectorAll(".results>*");
        for (let i=0;i<old.length;i++){
            old[i].remove();
        }
        //create a regex object
        
        let re=eval(this.settings.regex);
        if (re.lastIndex!=0){
            re=new RegExp(this.settings.regex);
        }
        let trucount=0;
        let total=0;
        for (let i in polymorph_core.items){
            if (this.settings.showProp){
                if (polymorph_core.items[i][this.settings.showProp]==undefined){
                    continue;
                }
            }
            let propval=polymorph_core.items[i][this.settings.filterProp]||"";
            let obj=document.createElement("p");
            obj.innerHTML=propval;
            re.lastIndex=0;
            total++;
            if (re.exec(propval)){
                this.rootdiv.querySelector(".matched").appendChild(obj);
                trucount++;
            }else{
                this.rootdiv.querySelector(".notmatched").appendChild(obj);
            }
        }
        this.rootdiv.querySelector(".pct").innerHTML=trucount+"/"+total+":"+(trucount/total*100)+"%";
    });

    //////////////////Handle polymorph_core item updates//////////////////

    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    this.fromSaveData = function (d) {
        //this is called when your container is started OR your container loads for the first time
        Object.assign(this.settings, d);
    }

    //Handle the settings dialog click!
    this.dialogDiv=document.createElement("div");
    this.dialogDiv.innerHTML=``;
    this.showDialog=function(){
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings=function(){
        // pull settings and update when your dialog is closed.
    }

});