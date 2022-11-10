function isPhone() {
    var mobiles = [
        "Android",
        "iPhone",
        "Linux armv8l",
        "Linux armv7l",
        "Linux aarch64"
    ];
    if (mobiles.includes(navigator.platform) || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true;
    }
    return false;
}
if (isPhone()) {
    polymorph_core.newRect = function(parent) {
        let ID = polymorph_core.insertItem({
            _rd: {
                p: parent,
                f: RECT_FIRST_SIBLING,
                x: RECT_ORIENTATION_X,
                ps: 1
            }
        });
        polymorph_core.rects[ID] = new polymorph_core.rect(ID);
        return ID;
    }

    polymorph_core.rect = function(rectID) {
        this.id = rectID; //might be helpful
        polymorph_core.rects[rectID] = this;

        Object.defineProperty(this, "outerDiv", {
            get: () => {
                return this.listContainer; // this is required for resetDocument to work
            }
        })

        Object.defineProperty(this, "settings", {
            get: () => {
                return polymorph_core.items[rectID]._rd;
            }
        })


        Object.defineProperty(this, "childrenIDs", {
            get: () => {
                if (!this._childrenIDs) {
                    this._childrenIDs = [];
                }
                //if i dont have two good children, return none
                if (this._childrenIDs.length == 2 &&
                    polymorph_core.items[this._childrenIDs[0]] && polymorph_core.items[this._childrenIDs[0]]._rd &&
                    polymorph_core.items[this._childrenIDs[1]] && polymorph_core.items[this._childrenIDs[1]]._rd) {
                    return this._childrenIDs;
                } else {
                    this._childrenIDs = [];
                    for (let i in polymorph_core.items) {
                        if (polymorph_core.items[i]._rd && polymorph_core.items[i]._rd.p == rectID) {
                            this._childrenIDs.push(i);
                        }
                    }
                    if (this._childrenIDs.length == 2) return this._childrenIDs;
                }
                return undefined;
            }
        })

        Object.defineProperty(this, "children", {
            get: () => {
                if (this.childrenIDs) {
                    if (polymorph_core.rects[this.childrenIDs[0]] && polymorph_core.rects[this.childrenIDs[1]])
                        return [polymorph_core.rects[this.childrenIDs[0]], polymorph_core.rects[this.childrenIDs[1]]];
                }
                return undefined;
            }
        })

        Object.defineProperty(this, "containerids", {
            get: () => {
                this._containerids = [];
                for (let i in polymorph_core.items) {
                    if (polymorph_core.items[i]._od && polymorph_core.items[i]._od.p == rectID) {
                        this._containerids.push(i);
                    }
                }
                return this._containerids;
            }
        })

        Object.defineProperty(this, "containers", {
            get: () => {
                if (this.containerids) {
                    return this.containerids.map((v) => polymorph_core.containers[v]);
                }
                return undefined;
            }
        })

        Object.defineProperty(this, "parent", {
            get: () => {
                if (this.settings.p) return polymorph_core.rects[this.settings.p];
                else return polymorph_core;
            }
        })
        this.listContainer = htmlwrap(`<div><div class="newcontainer">New container...</div></div>`);
        //when resetting document it expects an outerdiv. remove this instead.
        this.newContainerBtn = this.listContainer.querySelector("div.newcontainer");
        this.tiedToMe = [];
        this.tieRect = function(id) { //tie a child rect.
            while (polymorph_core.rects[id].listContainer.children.length > 1) {
                this.listContainer.appendChild(polymorph_core.rects[id].listContainer.children[0]);
            }
            polymorph_core.rects[id].listContainer = this.listContainer;
            this.tiedToMe.push(id);
            polymorph_core.rects[id].adjustTies();
        }
        this.adjustTies = () => {
            this.tiedToMe.forEach(i => this.tieRect(i));
        }
        this.containerVisible = (containerID) => polymorph_core.currentOperator == containerID;

        this.switchOperator = (id) => {
            // Hide the sidebar menu for mobile. 
            polymorph_core.toggleMenu(false);

            // Hide all other containers
            Array.from(document.querySelectorAll("#body>*")).forEach(e => e.style.display = "none");

            // Show the correct container
            document.querySelector(`#body>[data-container='${id}']`).style.display = "block";
            
            // Update _meta item to remember which container is focused
            polymorph_core.currentOperator = id;
            polymorph_core.items._meta.focusedContainer = id;
            polymorph_core.fire("updateItem", { id: "_meta", sender: this });

            // Change the operator name at the top of the screen
            document.querySelector(".operatorName").parentElement.style.display = "inline";
            document.querySelector(".operatorName").innerText = polymorph_core.items[id]._od.tabbarName;

            if (polymorph_core.lastFocusedMobileOperator){
                if (polymorph_core.lastFocusedMobileOperator.clearMobileFocused){
                    polymorph_core.lastFocusedMobileOperator.clearMobileFocused();
                }
            }
            if (polymorph_core.containers[id].operator.setMobileFocused){
                polymorph_core.containers[id].operator.setMobileFocused();
            }
            polymorph_core.containers[id].refresh();
        }

        this.tieContainer = (id) => {
            if (this.listContainer.querySelector(`[data-containerid='${id}']`)) {
                this.listContainer.querySelector(`[data-containerid='${id}']`).innerText = polymorph_core.containers[id].settings.tabbarName;
            } else {
                let ts = document.createElement('div');
                ts.innerText = polymorph_core.containers[id].settings.tabbarName;
                this.listContainer.insertBefore(ts, this.listContainer.children[0]);
                ts.dataset.containerid = id;
                ts.addEventListener("click", (e) => {
                    this.switchOperator(id);
                    e.stopPropagation(); //so that the lower level divs dont get triggered
                })
                polymorph_core.containers[id].outerDiv.dataset.container = id;
                polymorph_core.containers[id].outerDiv.style.display = "none";
                document.querySelector("#body").appendChild(polymorph_core.containers[id].outerDiv);
            }
        }
        this.attach = () => {
            //connect to my parent
            if (this.settings.p && polymorph_core.items[this.settings.p]) {
                //there is or will be a rect / subframe for it.
                if (polymorph_core.rects[this.settings.p]) {
                    polymorph_core.rects[this.settings.p].tieRect(rectID);
                } else {
                    if (!polymorph_core.rectLoadCallbacks[this.settings.p]) polymorph_core.rectLoadCallbacks[this.settings.p] = [];
                    polymorph_core.rectLoadCallbacks[this.settings.p].push(rectID);
                }
            }
            if (polymorph_core.items._meta.currentView == rectID) {
                //attach myself to the rectlist
                document.querySelector("#rectList").appendChild(this.listContainer);
            }
            //Signal all children waiting for this that they can connect to this now.
            if (polymorph_core.rectLoadCallbacks[rectID]) polymorph_core.rectLoadCallbacks[rectID].forEach((v) => {
                if (polymorph_core.items[v]._od) {
                    //v is container
                    this.tieContainer(v);
                } else {
                    //v is rect
                    this.tieRect(v);
                }
            })
        }


        this.refresh = () => {
            let oneToFocus = Object.keys(polymorph_core.containers)[0];
            if (oneToFocus) {
                //if refresh called before container load, this happens :(
                polymorph_core.containers[oneToFocus].outerDiv.style.display = "block";
                polymorph_core.currentOperator = oneToFocus;
            }
            if (this.children) this.children.forEach(i => i.refresh());
            if (this.containers) this.containers.forEach(i => i.refresh());
        };


        //operator creation
        this.newContainerBtn.addEventListener("click", (e) => {
            let newContainer = { _od: { t: "opSelect", p: rectID } };
            let newContainerID = polymorph_core.insertItem(newContainer);
            polymorph_core.containers[newContainerID] = new polymorph_core.container(newContainerID);
            //containers tie themselves.
            //this.tieContainer(newContainerID);
            this.switchOperator(newContainerID);
        })

        this.toSaveData = () => {};
    };

    // For switching views. A view is a set of rects and oeprators. Having multiple views never really took off. This is now just a loading function for the main view.
    polymorph_core.switchView = (id) => {
        polymorph_core.currentDoc.currentView = id;
        document.querySelector("#rectList").children[0].remove();
        document.querySelector("#rectList").appendChild(polymorph_core.rects[id].listContainer);
        polymorph_core.rects[id].refresh();
        if (polymorph_core.items._meta.focusedContainer) {
            polymorph_core.containers[polymorph_core.items._meta.focusedContainer].rect.switchOperator(polymorph_core.items._meta.focusedContainer);
        }
        return;
    }
    polymorph_core.rects = {};
}