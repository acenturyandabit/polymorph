function _itemcluster_rapid_entry() {
    // in the options menu, show the rapidentry checkbox
    this.dialogOptions['rapidEntryOn'] = new polymorph_core._option({
        div: this.dialogDiv,
        type: "bool",
        object: this.settings,
        property: "rapidEntryOn",
        label: "Rapid entry mode",
    });
    this.rapidEntryDiv = document.createElement("div");
    this.rapidEntryDiv.innerHTML = `
    <div class="suggestionsbox" style="position:absolute; top: -10px; width:100%; height: 0px; background: white"></div>
    <p style="background:white; margin:0">CMD: <input type="text" style="width:calc(100% - 4em)"></input></p>
    `;
    let sugbox = this.rapidEntryDiv.querySelector(".suggestionsbox");
    let tray = this.rootdiv.querySelector(".tray");
    tray.parentElement.appendChild(this.rapidEntryDiv);
    this.rapidEntryDiv.style.cssText = `
    position:absolute;
    bottom:0px;
    width: 100%;
    display:none;
    `;
    // hook to settings change, since we can't hook onto close
    this.dialogOptions['rapidEntryOn'].appendedElement.addEventListener("input", (e) => {
        if (e.target.checked) {
            //show the thing
            this.rapidEntryDiv.style.display = "block";
        } else {
            this.rapidEntryDiv.style.display = "none";
        }
    })

    if (!this.settings.rapidEntryOn) {
        this.settings.rapidEntryOn = false;//just to be super safe
    } else {
        // if rapidentry on, show the rapidentry interface
        this.rapidEntryDiv.style.display = "block";
    }

    // create the cache of all items that we care about
    let REcache = {};
    for (let i in polymorph_core.items) {
        if (this.itemRelevant(i) && polymorph_core.items[i][this.settings.textProp]) {
            //add it to the cache
            REcache[i] = polymorph_core.items[i][this.settings.textProp];
        }
    }
    // nonshift enter is exit edit mode 
    let RIE = this.rapidEntryDiv.children[1].children[0];
    // enter in general is process command
    RIE.addEventListener("keyup", (e) => {
        if (e.key == "Enter") {
            //create a new item at a random location within viewport
            let vb = this.svg.viewbox();
            id = this.createItem(
                (vb.x + vb.width / 2) / polymorph_core.items[this.settings.currentViewName].itemcluster.XZoomFactor,
                vb.y + vb.height / 2
            );
            polymorph_core.items[id][this.settings.textProp] = RIE.value;
            polymorph_core.items[id]._prg = true;
            this.container.fire("updateItem", { id: id, sender: this });
            this.arrangeItem(id);
            RIE.value = "";
        }
        else {
            //look thru the cache, and find matches (this will be v time consuming - how to speed up?)
            //also when to update the cache? container.onupdateitem? or something else, like global input listener? I'm happy with the global input listener.
            while (sugbox.children.length) sugbox.children[0].remove();
            if (e.target.value.length) {
                let tmpItems = [];
                for (let i in REcache) {
                    if (REcache[i].includes(e.target.value)) {
                        tmpItems.push(REcache[i]);
                    }
                }
                tmpItems = tmpItems.filter((v, i) => i < 10);

                tmpItems.forEach(i => {
                    let p = document.createElement('p');
                    p.style.height = "1em";
                    p.style.margin = 0;
                    p.innerText = i.replace(/\n/g, " ");
                    sugbox.appendChild(p);
                })
                sugbox.style.height = tmpItems.length + "em";
                sugbox.style.top = -tmpItems.length + "em";
            } else {
                sugbox.style.height = 0;
            }
        }
    })

    this.rootdiv.addEventListener("input", (e) => {
        for (let i = 0; i < e.path.length; i++) {
            if (!e.path[i].dataset) return;// not an item, probably the rapid entry bar
            if (e.path[i].dataset.id) {
                let id = e.path[i].dataset.id;
                if (e.target.classList.contains("tta")) REcache[i] = e.target.innerText;
            }
        }
    })

    //commands:
    /*
    type anything to navigate; up and down are select the item, enter is goto - autocomplete. 
        - default is make new. if make new is not accepted then it is goto.
    \e is edit this item. show EDIT mode.
    \E is edit this item's description
    \lf is link from - begin autocomplete 
    \lt is link to - begin autocomplete
    \org is organise - entire organisation menu. can be x, y, r, th or combination of all.
    \filt is filter - create a new view with only the selected items? split things along some axis (x,y,r,th) based on yes or no to a certain condition
    
    */

}