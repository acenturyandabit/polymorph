polymorph_core.registerOperator("subframe", {}, function (container) {
    polymorph_core.operatorTemplate.call(this, container, {});
    this.rootdiv.remove();//nerf the standard rootdiv because of differring naming conventions between rects and operators.
    this.outerDiv = document.createElement("div");
    //Add div HTML here
    this.outerDiv.innerHTML = ``;
    this.outerDiv.style.cssText = `width:100%; height: 100%; position:relative`;
    container.div.appendChild(this.outerDiv);

    //////////////////Handle polymorph_core item updates//////////////////

    this.refresh = function () {
        polymorph_core.rects[this.rectID].refresh();
    }

    //////////////////Handling local changes to push to polymorph_core//////////////////
    Object.defineProperty(this, "rect", {
        get: () => {
            return polymorph_core.rects[this.rectID];
        }
    })

    this.tieRect = function (rectID) {
        this.rectID = rectID;
        this.outerDiv.appendChild(polymorph_core.rects[rectID].outerDiv);
        polymorph_core.rects[rectID].refresh();
    }

    //Check if i have any rects waiting for pickup
    if (polymorph_core.rectLoadCallbacks[container.id]) {
        this.tieRect(polymorph_core.rectLoadCallbacks[container.id][0]);
        delete polymorph_core.rectLoadCallbacks[container.id];
    } else if (!this.settings.operatorClonedFrom) {
        let rectID = polymorph_core.newRect(container.id);
        this.tieRect(rectID);
    }

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