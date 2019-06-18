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
    <style>
    .conversation>p{
        padding: 10px;
        background: lightblue;
        display: block;
        border-radius: 10px;
        width: fit-content;
        position:relative;
    }
    .conversation>p>span.rspn{
        display:none;
        position: absolute;
        left: 100%;
        top: 50%;
        transform: translate(0,-50%);
    }
    .conversation>p:hover>span.rspn{
        display:block;
    }
    </style>
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

    function update(id){
//filter by property
        //then:
        if (core.items[id].chat && core.items[id].chat.intime) {
            let msg = me.rootdiv.querySelector(`[data-id='${id}']`);
            if (!msg) {
                msg = document.createElement("p");
                let mspn=document.createElement("span");
                mspn.classList.add("mspn");
                let rspn = document.createElement("span");
                rspn.classList.add("rspn");
                rspn.innerText="Reply";
                msg.appendChild(mspn);
                msg.appendChild(rspn);
            }
            //load up the new item at the specified index.
            msg.dataset.time = core.items[id].chat.intime;
            msg.dataset.id = id;
            msg.querySelector(".mspn").innerText = core.items[id].title;
            //Place it in the appropriate place
            let premsgs = me.rootdiv.querySelectorAll(".conversation>p");
            if (!premsgs.length) {
                //first message, just insert
                me.rootdiv.querySelector(".conversation").appendChild(msg);
            } else {
                let inserted=false;
                for (let i = 0; i < premsgs.length; i++) {
                    if (premsgs[i].dataset.time>msg.dataset.time){
                        me.rootdiv.querySelector(".conversation").insertBefore(premsgs[i],msg);
                        inserted=true;
                        break;
                    }
                }
                if (!inserted)me.rootdiv.querySelector(".conversation").appendChild(msg);
            }
            return true;
            //idealllly do a search of the items in the chat thread; for now we're just going to iterate through them all.    
        }
        //do stuff with the item.
        return false;
    }

    //this is called when an item is updated (e.g. by another operator)
    core.on("updateItem", function (d) {
        let id = d.id;
        //return true or false based on whether we can or cannot edit the item from this operator.
        //otherwise your items _may_ be deleted by the core garbage collector :/
        return update(id);
    });

    for (let i in core.items){
        update(i);    
    }

    this.refresh = function () {
        // This is called when my parent rect is resized.
    }

    //entering a new item
    this.rootdiv.querySelector(".entry>button").addEventListener("click", (e) => {
        let itm = {
            title: this.rootdiv.querySelector(".entry>input").value,
            chat: {
                intime: Date.now(),
                sender:core.userData.id
            }
        }
        let id = core.insertItem(itm);
        this.rootdiv.querySelector(".entry>input").value = "";
        core.fire("updateItem", {
            sender: this,
            id: id
        })
    })

    this.rootdiv.querySelector(".entry>input").addEventListener("keyup", (e) => { if (e.key == "Enter") this.rootdiv.querySelector(".entry>button").click(); })

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