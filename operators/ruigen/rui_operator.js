function randomRuiEl(element){
    let baseurl="ruigen/";
    
    let toLoadList=[];
    let toRandomElements=document.getElementsByClassName("selectRandom");
    for (let i=0;i<toRandomElements.length;i++){
        r=toRandomElements[i];
        r.classList.remove("selectRandom");
        let chosen=ruiList[Math.floor(Math.random()*ruiList.length)];
        if (!toLoadList.includes(chosen))toLoadList.push(chosen);
        r.classList.add(chosen);
    }
    for (let counter=0;counter<toLoadList.length;counter++){
        let element=toLoadList[counter];
        let script=document.createElement("script");
        script.src=baseurl+element+".js";
        document.head.appendChild(script);    
    }
}
if (document.readyState != "loading") randomRuiEl(); else document.addEventListener("DOMContentLoaded", randomRuiEl);
var rui_op={};
core.registerOperator("ruigen", {
    displayName: "Ruigen",
    description: "Random user interface thing. Fun to watch."
}, function (container) {
    let ruiList=['annipairs'];
    let me = this;
    me.container = container;//not strictly compulsory bc this is expected and automatically enforced - just dont touch it pls.
    this.settings = {display:ruiList[Math.floor(Math.random()*ruiList.length)]};

    this.rootdiv = document.createElement("div");
    //Add content-independent HTML here.
    this.rootdiv.innerHTML = ``;
    this.rootdiv.style.width="100%";
    this.rootdiv.style.height="100%";
    container.div.appendChild(this.rootdiv);

    this.loadDisplay=function(name){
        scriptassert([['ruigen-'+me.settings.display,"operators/ruigen/"+me.settings.display+".js"]],()=>{
            this.rootdiv.innerHTML = ``;
            rui_op[me.settings.display](this.rootdiv);
        })
    }
    
    //////////////////Handle core item updates//////////////////
    this.refresh=function(){me.loadDisplay(me.settings.display)};
    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    this.fromSaveData = function (d) {
        //this is called when your container is started OR your container loads for the first time
        Object.assign(this.settings, d);
        this.loadDisplay(this.settings.display);
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