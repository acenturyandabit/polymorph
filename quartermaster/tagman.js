quarterMaster.addinManager.registerAddin('tagman',function(){
    //stuff to do
    let me = this;
    this.tagWorker=function(){
        //Clone the span
        this.span=me.template.cloneNode(true);
        this.span.querySelector("button").innerText="X";
        bindDOM(this, this.span.querySelector("[placeholder='Styling data']"), 'style');
        bindDOM(this, this.span.querySelector("[placeholder='Tag name']"), 'name');
        //add it to the dialog list
        me.tagList.appendChild(this.span);
        //apply function
        
        //add a style.
        this.style=document.createElement("style");
        this.style.innerHTML=
        //remove self.
        this.remove=function(){

        }

        this.apply=function(item){
            if (item.tags.includes("#"+this.name)){
                item.span.classList.add("__tagModifier__"+this.name);
            }else{
                item.span.classList.remove("__tagModifier__"+this.name);
            }
        }
        this.toSaveData=function(){
            
        }
        this.fromSaveData=function(data){

        }
    }
    this.tagWorkers=[];
    this.init=function(){
        //add the topbar item
        
        me.li=document.createElement("li");
        me.li.innerHTML=`
        <span>Open tagmanager</span>
        `
        quarterMaster.div.querySelector("ul.topbar ul.list").appendChild(this.li);
        quarterMaster.topbarManager.checkTopbars(quarterMaster.div);
        //add the dialog
        me.dialog=document.createElement("div");
        me.dialog.classList.add("dialog");
        me.dialog.classList.add("tagManager");
        me.dialog.innerHTML=`
        <div class="addinManagerTemplate">
            <span><input placeholder="Tag name"><input placeholder="Styling data"><button>&gt;</button></span> 
            <hr>
        </div>
        <div class="tagmanDialogList">
        </div>        
        `;
        quarterMaster.div.appendChild(me.dialog);
        quarterMaster.dialogManager.checkDialogs();
        me.dialog=quarterMaster.div.querySelector(".dialog.tagManager")
        me.li.addEventListener("click",()=>{me.dialog.style.display="block"});
        //adding new entries onto the dialog
        me.template=me.dialog.querySelector(".addinManagerTemplate span");
        me.tagList=me.dialog.querySelector(".tagmanDialogList");
        me.template.querySelector("button").addEventListener("click",()=>{
            me.tagWorkers.push (new me.tagWorker());
            me.template.querySelectorAll("input").forEach((v,i)=>{v.value=""});
        })

        //hook on loadFromData or change in general lol


        //hook on tagbox value changed

        //hook on saving
        //quarterMaster.on('', (d)=>{});
    }
    this.cleanup=function(){

    }

})