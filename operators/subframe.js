core.registerOperator("subframe", {},function (operator) {
    let me = this;
    me.container=operator;
    this.settings = {};

    this.outerDiv = document.createElement("div");
    //Add div HTML here
    this.outerDiv.innerHTML = ``;
    this.outerDiv.style.cssText=`width:100%; height: 100%; position:relative`;
    operator.div.appendChild(this.outerDiv);
    this.rect=new _rect(core,this,RECT_ORIENTATION_X,1,0);
    //////////////////Handle core item updates//////////////////

    this.refresh=function(){
        this.rect.firstOrSecond=0;
        this.rect.pos=1;
        this.rect.refresh();
    }

    //////////////////Handling local changes to push to core//////////////////
    this.passthrough = function(fname, args){
        return this.rect[fname](args);
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
    this.listOperators=function(list){
        this.rect.listOperators(list);
    }

    this.callables={
        loadRectFromData:function(data){
            this.rect.fromSaveData(data);
        }
    }
});