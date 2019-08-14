core.registerOperator("4dub", {
    displayName: "4dub",
    description: "Make some music!"
}, function (container) {
    let me = this;
    me.container = container;//not strictly compulsory bc this is expected and automatically enforced - just dont touch it pls.
    this.settings = {rows: 20, cols:20};

    this.rootdiv = document.createElement("div");
    //Create table
    let psih=`<table>`;
    let row=``;
    for (let i=0;i<this.settings.rows;i++){
        row+=`<tr><input></input><br><p>EMPTY</p></tr>`;
    }
    for (let i=0;i<this.settings.rows;i++){
        psih+=row;
    }
    psih+=`</table>`;
    this.rootdiv.innerHTML=psih;
    //get audio player!
    
    // X is time, Y is pitch.

    //button to RNG

    //slider to set BPM
    /*scriptassert([["svg", "3pt/svg.min.js"]],()=>{
        me.svg=new SVG(this.rootdiv.svg);
        

        //when square in pad is clicked, play that note. 
        // X is time, Y is pitch.

    })*/
    //Add content-independent HTML here.
    this.rootdiv.innerHTML = ``;

    container.div.appendChild(this.rootdiv);

    //////////////////Handle core item updates//////////////////

    //this is called when an item is updated (e.g. by another operator)
    core.on("updateItem", function (d) {
        let id = d.id;
        //do stuff with the item.

        //return true or false based on whether we can or cannot edit the item from this operator.
        //otherwise your items _may_ be deleted by the core garbage collector :/
        return false;
    });

    this.refresh = function () {
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