polymorph_core.registerOperator("stack", {
    displayName: "Stack",
    description: "Stack operators and scroll through them like a browseable webpage.",
    targetForward:true
}, function (container) {
    let me = this;
    me.container = container;
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
    container.div.appendChild(this.style);
    
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
    container.div.appendChild(this.rootdiv);
    this.rects = [];
    this.addStack = function (r) {
        let obj = {};
        obj.outerDiv = document.createElement("div");
        if (r && r.size)obj.outerDiv.style.height = r.size+"px";
        else obj.outerDiv.style.height = "20em";
        obj.outerDiv.style.width = "100%";
        obj.outerDiv.style.borderBottom="5px solid black";
        obj.outerDiv.style.cursor="ns-resize";
        obj.outerDiv.style.boxSizing="border-box";
        obj.outerDiv.classList.add("stack_Container");
        me.rootdiv.insertBefore(obj.outerDiv,me.more);
        obj.rect = new _rect(polymorph_core, obj, RECT_ORIENTATION_X, 1, 0);
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
            me.rects[resizingN].rect.refresh();
            me.rects[resizingN].size=originalSize+(e.clientY-mouseY);
        }
    })

    this.rootdiv.addEventListener("mouseup",function(e){
        resizingDiv=undefined;
        // if in correct direction, resize.
        container.fire("updateView");
    })

    this._remove=function(burn,obj){
        for (let i in me.rects){
            if (me.rects[i].rect==obj){
                //remove this!
                me.rects[i].div.remove();
                me.rects.splice(i,1);
            }
        }
        container.fire("updateView",{sender:this});
    }
    this.more.addEventListener("click", this.addStack);
    //////////////////Handle polymorph_core item updates//////////////////
    //Saving and loading
    this.toSaveData = function () {
        let obj = {};
        obj.settings = this.settings;
        obj.rects = [];
        let scons=me.rootdiv.querySelectorAll(".stack_Container");
        for (let i = 0; i < this.rects.length; i++) {
            obj.rects.push({
                rect: this.rects[i].rect.toSaveData(),
                size: scons[i].clientHeight
            });
        }
        return obj;
    }

    this.refresh=function(){
        for (let i=0;i<this.rects.length;i++){
            this.rects[i].rect.refresh();
        }
        this.parent=this.container.rect;//enable forwarding for elements in the stack.
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