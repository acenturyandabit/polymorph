core.registerOperator("stack", {
    displayName: "Stack",
    description: "Stack operators and scroll through them like a browseable webpage.",
    targetForward:true
}, function (operator) {
    let me = this;
    me.container = operator;
    this.settings = {};
    this.style = document.createElement("style");
    this.style.innerHTML = `
        .addMore{
            padding: 70px 0;
            border: 3px gray dashed;
            text-align: center;
        }
        .root>div{
            position:relative;
        }
        .root{
            overflow-y: scroll;
            overflow-x: hidden;
        }
    `
    operator.div.appendChild(this.style);
    
    this.forwardTarget=function(){
        for (let i=0;i<this.rects.length;i++){
            this.rects[i].rect.activateTargets();
        }
    }

    this.forwardUntarget=function(){
        for (let i=0;i<this.rects.length;i++){
            this.rects[i].rect.deactivateTargets();
        }
    }


    this.rootdiv = document.createElement("div");
    this.rootdiv.style.cssText=`width:100%; height: 100%; position:relative`;
    this.rootdiv.classList.add("root")
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.rootdiv.innerHTML = `<div class="addMore"><div>+</div><div>`;
    this.more = this.rootdiv.querySelector(".addMore");
    operator.div.appendChild(this.rootdiv);
    this.rects = [];
    this.addStack = function (r) {
        let obj = {};
        obj.div = document.createElement("div");
        if (r && r.size)obj.div.style.height = r.size+"px";
        else obj.div.style.height = "20em";
        obj.div.style.width = "100%";
        obj.div.style.borderBottom="5px solid black";
        obj.div.style.cursor="ns-resize";
        obj.div.style.boxSizing="border-box";
        obj.div.classList.add("stack_Container");
        me.rootdiv.insertBefore(obj.div,me.more);
        obj.rect = new _rect(core, obj.div, RECT_ORIENTATION_X, 1, 0);
        obj.rect.parentRect=me;
        if (r) obj.rect.fromSaveData(r.rect);
        me.rects.push(obj);
    }

    //delegated vertical resize handler
    let resizingDiv=undefined;
    let mouseY=0;
    let originalSize=0;
    let resizingN=0;
    this.rootdiv.addEventListener("mousedown",function(e){
        if (e.target.classList.contains("stack_Container")){
            //its my child
            resizingDiv=e.target;
            //start the resize
            mouseY=e.clientY;
            originalSize=resizingDiv.clientHeight;
            for (let i=0;i<me.rects.length;i++){
                if (me.rects[i].div==resizingDiv)resizingN=i;
            }
        }
    })

    this.rootdiv.addEventListener("mousemove",function(e){
        if (resizingDiv){
            resizingDiv.style.height=originalSize+(e.clientY-mouseY)+"px";
            me.rects[resizingN].rect.resize();
            me.rects[resizingN].size=originalSize+(e.clientY-mouseY);
        }
    })

    this.rootdiv.addEventListener("mouseup",function(e){
        resizingDiv=undefined;
        // if in correct direction, resize.
    })

    this._remove=function(burn,obj){
        for (let i in me.rects){
            if (me.rects[i].rect==obj){
                //remove this!
                me.rects[i].div.remove();
                me.rects.splice(i,1);
            }
        }
        core.fire("updateView",{sender:this});
    }
    this.more.addEventListener("click", this.addStack);
    //////////////////Handle core item updates//////////////////
    //Saving and loading
    this.toSaveData = function () {
        let obj = {};
        obj.settings = this.settings;
        obj.rects = [];
        for (let i = 0; i < this.rects.length; i++) {
            obj.rects.push({
                rect: this.rects[i].rect.toSaveData(),
                size:this.rects[i].size
            });
        }
        return obj;
    }

    this.resize=function(){
        for (let i=0;i<this.rects.length;i++){
            this.rects[i].rect.resize();
        }
        this.parentRect=this.container.rect;//enable forwarding for elements in the stack.
    }

    this.fromSaveData = function (d) {
        if (!d) return;
        Object.assign(this.settings, d.settings);
        this.rects = [];
        if (d.rects)for (let i = 0; i < d.rects.length; i++) {
            this.addStack(d.rects[i]);
        }
    }
    this.getOperator=function(id){
        let result=undefined;
        for (let i=0;i<this.rects.length;i++){
            result=result||this.rects[i].rect.getOperator(id);
        }
        return result;
    }
    this.listOperators=function(list){
        for (let i=0;i<this.rects.length;i++){
            this.rects[i].rect.listOperators(list);
        }
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