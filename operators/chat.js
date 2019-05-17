core.registerOperator("chat", {
    displayName: "Chat",
    description: "A chat interface. Perfect for maintaining conversational style communications."
}, function (container) {
    let me = this;
    me.container = container; //not strictly compulsory bc this is expected and automatically enforced - just dont touch it pls.
    this.settings = {};

    this.rootdiv = document.createElement("div");
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.rootdiv.innerHTML = `
    <div style="display:flex; flex-direction:column; height: 100%">
    <div class="conversation" style="flex: 1 1 100%">
    </div>
    <div class="entry" style="flex: 0 0; display: flex; flex-direction:row;">
    <input style="flex: 1 1 100%;"><button style="flex: 0 0 80px;">Send</button>
    </div>
    </div>
    `;
    container.div.appendChild(this.rootdiv);

    //////////////////Handle core item updates//////////////////

    //this is called when an item is updated (e.g. by another operator)
    core.on("updateItem", function (d) {
        let id = d.id;
        //filter by property
        //then:
        if (core.items[id].chat && core.items[id].chat.intime) {
            if (this.rootdiv.querySelector(`[data-id==${id}]`)) {
                this.rootdiv.querySelector(`[data-id==${id}]`).innerText = core.items[id].title;
            } else {
                //load up the new item at the specified index.
                let newmsg=document.createElement("p");
                newmsg.dataset.time=core.items[id].chat.intime;
                newmsg.dataset.id=id;
                newmsg.dataset.innerText=core.items[id].title;
                //Place it in the appropriate place
                let premsgs = this.rootdiv.querySelector(".conversation>div");
                if (!premsgs.length){
                    //first message, just insert
                    
                    this.rootdiv.querySelector(".conversation").appendChild()
                }else{
                    for (let i=0;i<premsgs.length;i++){
                        //if (premsgs[i].index>)
                    }
                }
                
                //idealllly do a search of the items in the chat thread; for now we're just going to iterate through them all.    
            }
        }
        //do stuff with the item.

        //return true or false based on whether we can or cannot edit the item from this operator.
        //otherwise your items _may_ be deleted by the core garbage collector :/
        return false;
    });

    this.resize = function () {
        // This is called when my parent rect is resized.
    }

    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    this.fromSaveData = function (d) {
        //this is called when your operator is started OR your operator loads for the first time
        Object.assign(this.settings, d);
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    this.showDialog = function () {
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // pull settings and update when your dialog is closed.
    }

});