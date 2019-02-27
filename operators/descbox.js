core.registerOperator("descbox", function (operator) {
    let me = this;
    me.settings={property:"description"};

    me.rootdiv=document.createElement("div");
    //Add div HTML here
    me.rootdiv.innerHTML=`<textarea></textarea>`;
    me.textarea=me.rootdiv.querySelector("textarea");
    me.textarea.style.width="100%";
    me.textarea.style.height="100%";
    me.textarea.style.resize="none";
    me.currentID="";

    operator.div.appendChild(me.rootdiv);

    //Handle item updates
    me.updateItem=function(id){
        if(id==me.settings.currentID && id){
            if(core.items[id] && core.items[id][me.settings.property])me.textarea.value=core.items[id][me.settings.property];
            else me.textarea.value="";
            me.textarea.disabled=false;
        }else{
            if (!me.settings.currentID){
                me.textarea.disabled=true;
                me.textarea.value="Select an item to view its description.";
            }
        }
    }

    core.on("updateItem", function (d) {
        let id=d.id;
        let sender=d.sender;
        if (sender == me) return;
        //Check if item is shown
        //Update item if relevant
        me.updateItem(id);
    });

    //First time load
    
    me.updateItem(me.settings.currentID);

    me.updateSettings=function(){
        me.updateItem(me.settings.currentID);
    }

    //Saving and loading
    me.toSaveData = function () {
        return me.settings;
    }

    me.fromSaveData = function (d) {
        Object.assign(me.settings,d);
        //then rehash the display or sth
        me.updateItem(me.settings.currentID);
    }

    //Register changes with core
    me.somethingwaschanged=function(){
        core.items[me.settings.currentID][me.settings.property]=me.textarea.value;
        core.fire("updateItem",{id:me.settings.currentID,sender: me});
    }
    
    me.textarea.addEventListener("input",me.somethingwaschanged);

    //Create a settings dialog
    scriptassert([["dialog","genui/dialog.js"]],()=>{
        me.dialog=document.createElement("div");

        me.dialog.innerHTML=`
        <div class="dialog">
        </div>`;
        dialogManager.checkDialogs(me.dialog);
        //Restyle dialog to be a bit smaller
        me.dialog=me.dialog.querySelector(".dialog");
        me.innerDialog=me.dialog.querySelector(".innerDialog");        
        operator.div.appendChild(me.dialog);
        let d=document.createElement("div");
        d.innerHTML=`
            <input placeholder="Enter the property to display...">
        `;
        me.innerDialog.appendChild(d);
        me.innerDialog.querySelector("input").addEventListener("input",function(){
            me.settings.property=me.innerDialog.querySelector("input").value;
        })

        //When the dialog is closed, update the settings.
        me.dialog.querySelector(".cb").addEventListener("click", function(){
            me.updateSettings();
        })

        me.showSettings=function(){
            me.dialog.style.display="block";
        }
    })

    //Core will call me when an object is focused on from somewhere
    core.on("focus", function (d) {
        let id=d.id;
        let s = d.sender;
        me.settings.currentID=id;
        me.updateItem(id);
    });
    core.on("deleteItem", function (d) {
        let id=d.id;
        let s = d.sender;
        if (me.settings.currentID==id){
            me.settings.currentID=undefined;
        };
        me.updateItem(undefined);
    });
});