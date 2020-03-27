polymorph_core.registerOperator("richbox", {
    displayName: "RichBox",
    description: "A richer text box. Suitable for phone and pc use."
}, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        rowIDs:[''],
        filter: guid(4)
    };

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    //Add content-independent HTML here.
    this.rootdiv.innerHTML = ``;
    //fixed width so we can implement our own cursor
    this.rootdiv.style.fontFamily='monospace';
    this.rootdiv.style.color="white";

    let invisibleMan=htmlwrap('<div>a</div>');
    invisibleMan.style.position="absolute";
    document.body.appendChild(invisibleMan);
    let lineHeight=invisibleMan.offsetHeight-4;
    let charWidth=invisibleMan.offsetWidth;
    invisibleMan.remove();

    this.baseTextDiv=document.createElement("div");
    this.rootdiv.appendChild(this.baseTextDiv);
    this.rootdiv.style.position="relative";
    this.baseTextDiv.style.fontSize=`${lineHeight}px`;
    this.baseTextDiv.style.lineHeight=`${lineHeight+4}px`;
    this.baseTextDiv.style.position='relative';

    // remember where cursor is
    // cursor blink when inactive
    // place cursor in blank line
    let cursor={
        currentRow:0,
        currentCol:0,
        div:htmlwrap(`<div style="position:absolute; width:2px;height:${lineHeight}px; background-color:white;"></div>`),
        redraw:()=>{
            cursor.div.style.top=cursor.currentRow*lineHeight+4;
            cursor.div.style.left=cursor.currentCol*charWidth;
        }
    };
    
    this.rootdiv.appendChild(cursor.div);

    let updateRow=(rownum)=>{
        let rowID=this.settings.rowIDs[rownum];
        let rowEl=this.baseTextDiv.children[rownum];
        let rowIt=polymorph_core.items[rowID];
        if (!rowEl){
            rowEl = htmlwrap("<div>");
            this.baseTextDiv.appendChild(rowEl);
        }
        rowEl.innerText=rowIt.description;
    }

    let redrawCursor=()=>{

    }
    // internal storage: ['id','id','id','id','',''] // blank for new lines
    this.focused=true;
    document.body.addEventListener("keydown",(e)=>{
        //add something to the currently selected item
        let cid=this.settings.rowIDs[cursor.currentRow];
        if (!cid){
            let it={};
            it[this.settings.filter]=true;
            cid=polymorph_core.insertItem(it);
            it.description="";
            this.settings.rowIDs[cursor.currentRow]=cid;
        }
        switch (e.key){
            case "Backspace":
                cursor.currentCol--;
                break;
            default:
                if (e.key.length==1){
                    polymorph_core.items[cid].description+=e.key;
                }
        }
        updateRow(cursor.currentRow);
        cursor.currentCol++;
        cursor.redraw();
        // up down left right keys for desktop
    })

    // click to refocus cursor (so that phone works)


    // have to make my own cursor. curses! 
    // fixed width font would really be helpful here.

    //lines are items. Lines can be reshuffled.
    // in which case, on enter, add a line
    // the cool part is contextual awareness? 

    //every time a key is pressed, recheck the locality around the key.    





    //return true if we care about an item and dont want it garbage-cleaned :(
    container.on("createItem", (id) => {

    })

    container.on("deleteItem", (id) => {
        
    })

    //this is called when an item is updated (e.g. by another container)
    container.on("updateItem", (d) => {
        let id = d.id;
        if (this.itemRelevant(id)) {
            //render the item, if we care about it.
        }
        //do stuff with the item.
    });

    this.refresh = function () {
        // This is called when the parent container is resized.
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    this.showDialog = function () {
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // This is called when your dialog is closed. Use it to update your container!
    }

});