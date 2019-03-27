core.registerOperator("subframe", {targetForward:true},function (operator) {
    let me = this;
    me.operator=operator;
    this.settings = {};

    this.rootdiv = document.createElement("div");
    //Add div HTML here
    this.rootdiv.innerHTML = ``;
    this.rootdiv.style.cssText=`width:100%; height: 100%; position:relative`;
    operator.div.appendChild(this.rootdiv);
    this.rect=new _rect(core,this.rootdiv,RECT_ORIENTATION_X,1,0);
    //////////////////Handle core item updates//////////////////

    this.resize=function(){
        this.rect.pos=1;
        this.rect.resize();
        core.fire("viewUpdate",{});
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
        this.rect.resize();
        this.processSettings();
    }


    //Handle the settings dialog click!
    this.dialogDiv=document.createElement("div");
    this.dialogDiv.innerHTML=`Some html`;
    this.showDialog=function(){
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings=function(){
        // pull settings and update when your dialog is closed.
    }

    this.getOperator=function(id){
        return this.rect.getOperator(id);
    }
    this.listOperators=function(list){
        this.rect.listOperators(list);
    }

});