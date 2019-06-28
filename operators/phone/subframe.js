core.registerOperator("subframe", {targetForward:true, hidden:true},function (operator) {
    let me = this;
    me.container=operator;
    this.settings = {};
    this.rdv= document.createElement("div");
    this.rdv.innerHTML=`
    <div style="margin-left: 10px">
    
        <p>Add an operator...</p>
    </div>
    
    `
    //issue: operator may not be tied yet-- in which case, wait.
    setTimeout(()=>{this.container.tab.appendChild(this.rdv)});
    //Add div HTML here
    this.rect=new _rect(core,this.rdv.querySelector("div"));
    //////////////////Handle core item updates//////////////////

    this.refresh=function(){
        this.rect.refresh();
    }
    //For interoperability between views you may fire() and on() your own events. You may only pass one object to the fire() function; use the properties of that object for additional detail.
    this.processSettings=function(){
    }

    //////////////////Handling local changes to push to core//////////////////

    this.forwardTarget=function(){
        this.rect.activateTargets();
    }

    this.forwardUntarget=function(){
        this.rect.deactivateTargets();
    }

    //Saving and loading
    this.toSaveData = function () {
        this.settings.rectUnderData=this.rect.toSaveData();
        return this.settings;
    }

    this.fromSaveData = function (d) {
        Object.assign(this.settings, d);
        this.rect.fromSaveData(this.settings.rectUnderData);
        this.rect.refresh();
        this.processSettings();
    }

    //Handle the settings dialog click!
    this.dialogDiv=document.createElement("div");
    this.dialogDiv.innerHTML=`Nothing to show yet :3`;
    this.showDialog=function(){
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings=function(){
        // pull settings and update when your dialog is closed.
    }

    this.getOperator=function(id){
        return this.rect.getOperator(id);
    }
    this.getOperatorPath=function(id){
        return this.rect.getOperatorPath(id);
    }
    this.listOperators=function(list){
        this.rect.listOperators(list);
    }
});