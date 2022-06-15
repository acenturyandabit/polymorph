//check if phone
if (isPhone()) {
    //// PHONE VERSION HERE
    polymorph_core.registerOperator("subframe", {
        displayName: "Subframe",
        description: "Place a new frame, with its own tabs, in this current frame.",
        section: "Layout",
        mustColdLoad: true
    }, function(container) {
        let defaultSettings = {
            expanded: false
        };
        polymorph_core.operatorTemplate.call(this, container, defaultSettings);
        this.rootdiv.remove(); //nerf the standard rootdiv because of differring naming conventions between rects and operators.
        this.outerDiv = document.createElement("div");
        this.outerDiv.style.cssText = `width:100%; position:relative`;

        //////////////////Handle polymorph_core item updates//////////////////

        let checkExpanded = () => {
            if (this.settings.expanded) {
                this.outerDiv.style.display = "none";
            } else {
                this.outerDiv.style.display = "block";
            }
        }
        checkExpanded();
        this.refresh = function() {
            //Replace the parent container label
            let myRectContainerParent = container.rect.listContainer.querySelector(`[data-containerid='${container.id}']`);
            myRectContainerParent.innerHTML = `
            <p>${container.settings.tabbarName} V </p>`;
            myRectContainerParent.children[0].style.marginTop = 0;
            myRectContainerParent.children[0].addEventListener("click", (e) => {
                this.settings.expanded = !this.settings.expanded;
                checkExpanded();
                e.stopPropagation();
            })
            myRectContainerParent.appendChild(this.outerDiv);
            polymorph_core.rects[this.rectID].refresh();
        }

        //////////////////Handling local changes to push to polymorph_core//////////////////
        Object.defineProperty(this, "rect", {
            get: () => {
                return polymorph_core.rects[this.rectID];
            }
        })

        this.tieRect = function(rectID) {
            this.rectID = rectID;
            this.outerDiv.appendChild(polymorph_core.rects[rectID].listContainer);
            //polymorph_core.rects[rectID].refresh(); // we'll be told to refresh later anyways
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
            delete this.settings.operatorClonedFrom;
        }

        //Handle the settings dialog click!
        this.dialogDiv = document.createElement("div");
        this.dialogDiv.innerHTML = `Nothing to show yet :3`;
        this.showDialog = function() {
            // update your dialog elements with your settings
        }
        this.dialogUpdateSettings = function() {
            // pull settings and update when your dialog is closed.
        }

        this.remove = () => {
            polymorph_core.rects[this.rectID].remove();
        }
    });
} else {
    polymorph_core.registerOperator("subframe", {
        displayName: "Subframe",
        description: "Place a new frame, with its own tabs, in this current frame.",
        section: "Layout",
        mustColdLoad: true
    }, function(container, isCreating = false) {
        polymorph_core.operatorTemplate.call(this, container, {});
        this.rootdiv.remove(); //nerf the standard rootdiv because of differring naming conventions between rects and operators.
        this.outerDiv = document.createElement("div");
        //Add div HTML here
        this.outerDiv.innerHTML = `
        <div>
            <button>Create Rect Here</button>
        </div>`;
        let createRectButton = this.outerDiv.children[0].children[0];
        this.createAndAssignNewRect = () => {
            let rectID = polymorph_core.newRect(container.id);
            this.tieRect(rectID);
        }
        createRectButton.addEventListener("click", () => {
            this.createAndAssignNewRect();
        })
        this.outerDiv.style.cssText = `width:100%; height: 100%; position:relative`;
        container.div.appendChild(this.outerDiv);

        //////////////////Handle polymorph_core item updates//////////////////

        this.refresh = function() {
            if (this.rectID) {
                polymorph_core.rects[this.rectID].refresh();
            }
        }

        //////////////////Handling local changes to push to polymorph_core//////////////////
        Object.defineProperty(this, "rect", {
            get: () => {
                return polymorph_core.rects[this.rectID];
            }
        })

        this.tieRect = function(rectID) {
            this.rectID = rectID;
            while (this.outerDiv.children.length) {
                this.outerDiv.children[0].remove();
            }
            this.outerDiv.appendChild(polymorph_core.rects[rectID].outerDiv);
            //polymorph_core.rects[rectID].refresh();
        }

        //Check if i have any rects waiting for pickup

        if (polymorph_core.rectLoadCallbacks[container.id]) {
            this.tieRect(polymorph_core.rectLoadCallbacks[container.id][0]);
            delete polymorph_core.rectLoadCallbacks[container.id];
        } else if (!this.settings.operatorClonedFrom && isCreating) {
            this.createAndAssignNewRect();
        }

        if (this.settings.operatorClonedFrom) {
            let rectsToClone = [];
            for (let ri in polymorph_core.rects) {
                if (polymorph_core.rects[ri].settings.p == this.settings.operatorClonedFrom) {
                    rectsToClone.push([ri, container.id])
                }
            }
            // recursively clone all rects, so that subframe divisions work
            while (rectsToClone.length) {
                let rectAndParent = rectsToClone.shift();
                let rectToCloneID = rectAndParent[0];
                //make a clone of it
                let copyRect = JSON.parse(JSON.stringify(polymorph_core.items[rectToCloneID]));
                copyRect._rd.p = rectAndParent[1];
                let newRectID = polymorph_core.insertItem(copyRect);
                polymorph_core.rects[newRectID] = new polymorph_core.rect(newRectID);

                let tie_er;
                if (rectAndParent[1] == container.id) {
                    tie_er = this;
                } else {
                    tie_er = polymorph_core.rects[rectAndParent[1]];
                }
                tie_er.tieRect(newRectID);

                //also make a clone of all its operators
                for (let i in polymorph_core.containers) {
                    if (polymorph_core.containers[i].settings.p == rectToCloneID) {
                        //clone it
                        let copyOp = JSON.parse(JSON.stringify(polymorph_core.items[i]));
                        copyOp._od.p = newRectID;
                        copyOp._od.data.operatorClonedFrom = i;
                        let newContainerID = polymorph_core.insertItem(copyOp);
                        polymorph_core.containers[newContainerID] = new polymorph_core.container(newContainerID);
                    }
                }
                // if it has child rects, clone those too
                for (let i in polymorph_core.rects) {
                    if (polymorph_core.rects[i].settings.p == rectToCloneID) {
                        //clone it
                        rectsToClone.push([i, newRectID]);
                    }
                }
            }
            delete this.settings.operatorClonedFrom;
        }

        //Handle the settings dialog click!
        this.dialogDiv = document.createElement("div");
        this.dialogDiv.innerHTML = `Nothing to show yet :3`;
        this.showDialog = function() {
            // update your dialog elements with your settings
        }
        this.dialogUpdateSettings = function() {
            // pull settings and update when your dialog is closed.
        }

        this.remove = () => {
            if (polymorph_core.rects[this.rectID]) polymorph_core.rects[this.rectID].remove();
        }
    });
}