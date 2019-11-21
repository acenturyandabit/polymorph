core.registerOperator("canvas", {
    displayName: "Canvas",
    description: "A canvas you can draw on."
}, function (container) {
    let me = this;
    me.container = container; //not strictly compulsory bc this is expected and automatically enforced - just dont touch it pls.
    this.settings = {};

    this.rootdiv = document.createElement("div");
    //Add content-independent HTML here. fromSaveData will be called if there are any items to load.
    this.rootdiv.innerHTML = `<canvas style="width:100%;height:100%;"></canvas>`;
    this.canvas = this.rootdiv.querySelector("canvas");
    this.ctx = this.canvas.getContext('2d');
    let prex,prey;
    this.canvas.addEventListener("mousemove", (e) => {
        if (e.buttons == 1) {
            if (prex != undefined) {
                this.ctx.beginPath();
                this.ctx.moveTo(prex, prey);
                this.ctx.lineTo(e.layerX, e.layerY);
                this.ctx.stroke();
                this.ctx.closePath();
            }
            
        }
        prex=e.layerX;
        prey=e.layerY;
    })
    container.div.appendChild(this.rootdiv);

    //////////////////Handle core item updates//////////////////

    //this is called when an item is updated (e.g. by another container)
    container.on("updateItem", function (d) {
        let id = d.id;
        //do stuff with the item.
        return false;
    });

    this.rrefreshesize = function () {
        // This is called when my parent rect is resized.
        this.canvas.width=this.rootdiv.clientWidth;
        this.canvas.height=this.rootdiv.clientHeight;
    }

    //Saving and loading
    this.toSaveData = function () {
        return this.settings;
    }

    this.fromSaveData = function (d) {
        //this is called when your container is started OR your container loads for the first time
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