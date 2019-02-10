function _taskDescriptionManager(quarterMaster){
    let me=this;
    this.quarterMaster=quarterMaster;
    this.descriptionHandlers={};
    this.addDescriptionHandler=function(name,_constructor){
        this.descriptionHandlers[name]=function(quarterMaster,data){
            let taskDescription=new _constructor(quarterMaster,data);
            taskDescription.type=name;
            return taskDescription;
        }
    }
    //Add a default one

    this.addDescriptionHandler("textbox",function (quarterMaster,data){
        //Standard things: this.div.
        this.div=document.createElement("div");
        this.div.style="display:none;";
        this.textarea=document.createElement("textarea");
        bindDOM(this,this.textarea,"value");
        this.textarea.style=`
            width:100%;
            resize:none;
            height: 50vh;
        `;
        this.div.appendChild(this.textarea);
        me.quarterMaster.descbox.appendChild(this.div);
        this.remove=function(){
            this.div.remove();
        }
        if(data){
            this.value=data;
        }
        this.toSaveData=function(){
            return this.value;
        }
    });
    

};


