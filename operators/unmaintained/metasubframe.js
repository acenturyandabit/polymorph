polymorph_core.registerOperator("metasubframe", {

    
}, function (container) {
    polymorph_core.operatorTemplate.call(this, container, {
        currentRectID: undefined
    });
    this.rootdiv.style.cssText = `width:100%; height: 100%; position:relative`;

    //////////////////Handle polymorph_core item updates//////////////////

    this.refresh = function () {
        if (this.settings.currentRectID) polymorph_core.rects[this.settings.currentRectID].refresh();
    }

    //////////////////Handling local changes to push to polymorph_core//////////////////
    Object.defineProperty(this, "rect", {
        get: () => {
            if (this.settings.currentRectID) return polymorph_core.rects[this.settings.currentRectID];
        }
    })

    this.tieRect = function (rectID) {
        this.settings.currentRectID = rectID;
        //check if the rect actually exists 
        if (!polymorph_core.items[this.settings.currentRectID]._rd) {
            //create it 
            polymorph_core.newRect(container.id,rectID);
            polymorph_core.newContainer(rectID, rectID);
        }
        if (this.rootdiv.children[0]) this.rootdiv.children[0].remove();
        this.rootdiv.appendChild(polymorph_core.rects[this.settings.currentRectID].outerDiv);
        polymorph_core.rects[rectID].refresh();
    }

    //on startup, just tie the current rect ID, if it exists.
    if (this.settings.currentRectID) {
        this.tieRect(this.settings.currentRectID);
    }

    container.on("focusItem", (d) => {
        this.tieRect(d.id);
    })

    //legacy code that's pretty meaningless here
    if (this.settings.operatorClonedFrom) {
        for (let ri in polymorph_core.rects) {
            if (polymorph_core.rects[ri].settings.p == this.settings.operatorClonedFrom) {
                //make a clone of it
                let copyRect = JSON.parse(JSON.stringify(polymorph_core.items[ri]));
                copyRect._rd.p = container.id;
                let newRectID = polymorph_core.insertItem(copyRect);
                polymorph_core.rects[newRectID] = new polymorph_core.rect(newRectID);
                this.tieRect(newRectID);
                //also make a clone of all its operators
                for (let i in polymorph_core.containers) {
                    if (polymorph_core.containers[i].settings.p == ri) {
                        //clone it
                        let copyOp = JSON.parse(JSON.stringify(polymorph_core.items[i]));
                        copyOp._od.p = newRectID;
                        copyOp._od.data.operatorClonedFrom = i;
                        let newContainerID = polymorph_core.insertItem(copyOp);
                        polymorph_core.containers[newContainerID] = new polymorph_core.container(newContainerID);
                    }
                }
            }
        }
        polymorph_core.items[this.settings.operatorClonedFrom]
        delete this.settings.operatorClonedFrom;
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = `Nothing to show yet :3`;
    this.showDialog = function () {
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // pull settings and update when your dialog is closed.
    }

});