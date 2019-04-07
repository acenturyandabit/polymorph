core.registerOperator("template", {
    displayName: "Recursor",
    description: "Recursively store information, like how your brain does."
}, function (container) {
    let me = this;
    me.container = container;//not strictly compulsory bc this is expected and automatically enforced - just dont touch it pls.
    this.settings = {corel:guid(7)};
    core.items[this.settings.corel]=new _item();
    this.rootdiv = document.createElement("div");
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.rootdiv.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column">
        <button class="rootbutton">Up a level (<span></span>)</button>
        <div style="flex: 1 0 auto">

        </div>
    </div>
    `;

    container.div.appendChild(this.rootdiv);

    //////////////////Handle core item updates//////////////////

    //this is called when an item is updated (e.g. by another operator)
    core.on("updateItem", function (d) {
        let id = d.id;
        //do stuff with the item.
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
    this.dialogDiv=document.createElement("div");
    this.dialogDiv.innerHTML=``;
    this.showDialog=function(){
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings=function(){
        // pull settings and update when your dialog is closed.
    }

});