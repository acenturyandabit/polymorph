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
    <p style="background:white; margin:0"><span class="cmd">CMD</span>: <input type="text" style="width:calc(100% - 4em)"></input></p>
    `;
    let cmdspan = this.rapidEntryDiv.querySelector("span.cmd");
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
    //update the REcache in... keydown? yikes... strapping a capacitor to it stat

    let recacheCapacitor = new capacitor(500, 100, (id, tt) => {
        REcache[id] = tt; // there's one more case which is external updates but we'll get to it .....
    });

    this.rootdiv.addEventListener("input", (e) => {
        for (let i = 0; i < e.path.length; i++) {
            if (!e.path[i].dataset) return;// not an item, probably the rapid entry bar
            if (e.path[i].dataset.id) {
                let id = e.path[i].dataset.id;
                recacheCapacitor.submit(id,e.target.innerText);
            }
        }
    })
    // nonshift enter is exit edit mode 
    let specialOptions=["NEW","CNT","CNF","DIS"];
    let RIE = this.rapidEntryDiv.querySelector("input");
    let rIndex = 0;
    let tmpItems = [];
    let opmode = "NEW";
    let updateCMDText = () => {
        switch (opmode) {
            case 'NEW':
                cmdspan.innerText = "CMD";
                break;
            case 'CNT':
                cmdspan.innerText = "CNT";
                break;
            case 'CNF':
                cmdspan.innerText = "CNF";
                break;
            case 'DIS':
                cmdspan.innerText = "DIS";
                break;
        }
    }

    let RIESRadical = undefined;
    this.focusOnRIES = () => {
        if (!RIESRadical) RIESRadical = this.svg.rect(30, 30).fill('transparent').stroke('blue').back();
        RIESRadical.cx(polymorph_core.items[this.rapidEntrySelection].itemcluster.viewData[this.settings.currentViewName].x
            * polymorph_core.items[this.settings.currentViewName].itemcluster.XZoomFactor).cy(polymorph_core.items[this.rapidEntrySelection].itemcluster.viewData[this.settings.currentViewName].y);
    }

    let tryFocusOnEvent = (e) => {
        if (e.target.matches(".floatingItem") || e.target.matches(".floatingItem *")) {
            let it = e.target;
            while (!it.matches(".floatingItem")) it = it.parentElement;
            this.rapidEntrySelection = it.dataset.id;
            this.focusOnRIES();
        }
    }

    this.itemSpace.addEventListener("mousedown", (e) => {
        tryFocusOnEvent(e);
    });

    this.itemSpace.addEventListener("mouseup", (e) => {
        //not mousemove bc then hovering over items activates, and bc x y only updated after move complete
        tryFocusOnEvent(e);
    });

    // enter in general is process command
    RIE.addEventListener("keyup", (e) => {
        if (e.key == "Enter") {
            //create a new item at a random location within viewport
            if (e.target.value[0] == '\\' && specialOptions.includes(e.target.value.slice(1))) {
                opmode = e.target.value.slice(1);
                updateCMDText();
            } else {
                if (opmode == "NEW") {
                    if (rIndex == tmpItems.length - 1) {
                        let vb = this.svg.viewbox();
                        id = this.createItem(
                            (vb.x + vb.width / 2) / polymorph_core.items[this.settings.currentViewName].itemcluster.XZoomFactor,
                            vb.y + vb.height / 2
                        );
                        polymorph_core.items[id][this.settings.textProp] = RIE.value;
                        polymorph_core.items[id]._prg = true;
                        this.container.fire("updateItem", { id: id, sender: this });
                        this.arrangeItem(id);
                        this.rapidEntrySelection = id;
                        this.focusOnRIES();
                    } else {
                        //find and focus the selected item
                        this.centreAndFocus(tmpItems[rIndex].id);
                        this.rapidEntrySelection = tmpItems[rIndex].id;
                        this.focusOnRIES();
                    }
                } else if (opmode == "CNT" || opmode == "CNF") {
                    if (this.rapidEntrySelection) {
                        if (this.opmode == "CNT") {
                            polymorph_core.link(this.rapidEntrySelection, tmpItems[rIndex].id);
                            this.container.fire("updateItem", { id: this.rapidEntrySelection, sender: this });
                            this.arrangeItem(this.rapidEntrySelection);
                        } else {
                            polymorph_core.link(tmpItems[rIndex].id, this.rapidEntrySelection);
                            this.container.fire("updateItem", { id: tmpItems[rIndex].id, sender: this });
                            this.arrangeItem(tmpItems[rIndex].id);
                        }
                    } else {
                        this.rapidEntrySelection = tmpItems[rIndex].id;
                        this.focusOnRIES();
                    }
                    console.log(this.rapidEntrySelection);
                }
            }
            while (sugbox.children.length) sugbox.children[0].remove();
            sugbox.style.height = 0;
            RIE.value = "";
        }
        else {
            if (e.key == "ArrowUp") {
                if (rIndex > 0) rIndex--;
                e.preventDefault();
            } else if (e.key == "ArrowDown") {
                rIndex++;
                e.preventDefault();
            }
            //look thru the cache, and find matches (this will be v time consuming - how to speed up?)
            //also when to update the cache? container.onupdateitem? or something else, like global input listener? I'm happy with the global input listener.
            while (sugbox.children.length) sugbox.children[0].remove();
            tmpItems = [];
            if (e.target.value=="\\HELP"){
                tmpItems = specialOptions;

                tmpItems.forEach((i, ind) => {
                    let p = document.createElement('p');
                    p.style.height = "1em";
                    p.style.margin = 0;
                    if (ind == rIndex) p.style.background = "lavender";
                    p.innerText = i;
                    sugbox.appendChild(p);
                })
                sugbox.style.height = tmpItems.length + "em";
                sugbox.style.top = -tmpItems.length + "em";                
            }
            if (e.target.value.length) {
                for (let i in REcache) {
                    if (REcache[i].toLocaleLowerCase().includes(e.target.value.toLocaleLowerCase())) {
                        tmpItems.push({ id: i, txt: REcache[i] });
                    }
                }
                tmpItems = tmpItems.filter((v, i) => i < 10);
                if (opmode == "NEW") tmpItems.push({ txt: "Create new..." });

                tmpItems.forEach((i, ind) => {
                    let p = document.createElement('p');
                    p.style.height = "1em";
                    p.style.margin = 0;
                    if (ind == rIndex) p.style.background = "lavender";
                    p.innerText = i.txt.replace(/\n/g, " ").slice(0, 100);
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