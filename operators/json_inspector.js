//todo: putter mode for inspector
(() => {
    polymorph_core.registerOperator("json-inspector", {
        displayName: "JSON inspector",
        description: "Outputs the element as JSON.",
        section: "Advanced",
        imageurl: "assets/operators/inspector.png"
    }, function(container) {

        let defaultSettings = {
            operationMode: "focus",
            currentItem: "",
            // manualSave: false
        };
        let blankText = "Focus on an item to show it here.";
        polymorph_core.operatorTemplate.call(this, container, defaultSettings);
        this.rootdiv.innerHTML = `
        <span>${blankText}</span>
        <textarea style="width:100%; height: 100%"></textarea>`;
        this.textarea = this.rootdiv.children[1];
        this.idLabel = this.rootdiv.children[0];
        /*
                let commitbtn = htmlwrap(`
            <button>Commit changes</button>`);
                this.rootdiv.appendChild(commitbtn);
                commitbtn.style.display = "none";
                commitbtn.addEventListener("click", () => {
                        //commit changes
                        if (this.settings.currentItem) {
                            let item = polymorph_core.items[this.settings.currentItem];
                            for (let i = 0; i < this.internal.children.length; i++) {
                                item[this.internal.children[i].dataset.role] = this.internal.children[i].querySelector("input").value;
                            }
                            container.fire("updateItem", { id: this.settings.currentItem });
                            //clear modified class on item
                            for (let i = 0; i < this.internal.children.length; i++) {
                                this.internal.children[i].classList.remove("modified");
                            }
                        }
                    })
        */
        /*let clearBtn=htmlwrap(`
        <button>Clear fields</button>`);
        this.rootdiv.appendChild(clearBtn);
        insertbtn.addEventListener("click",()=>{
            //create a new element with the stated specs
        })*/

        ///////////////////////////////////////////////////////////////////////////////////////
        //Actual editing the item

        this.textarea.addEventListener("input", (e) => {
            //change this to invalidate instead of directly edit?
            /*if (this.settings.commitChanges) {
                e.target.parentElement.classList.add("modified");
            } else if (this.settings.currentItem) {
                let it = polymorph_core.items[this.settings.currentItem];
                let i = e.target.parentElement.dataset.role;
                if (datatypes[e.target.parentElement.dataset.type]) {
                    datatypes[e.target.parentElement.dataset.type].onInput(e, it, i);
                    upc.submit(this.settings.currentItem);
                }
            }*/
        })
        let renderCapacitor = new capacitor(400, 100, (id) => {
            if (id) {
                this.idLabel.innerText = id;
                this.textarea.value = JSON.stringify(polymorph_core.items[id], undefined, 1);
            } else {
                this.idLabel.innerText = blankText;
                this.textarea.value = "";
            }
        })
        this.renderItem = function(id, soft = false) {
            renderCapacitor.submit(id);
        };
        ///////////////////////////////////////////////////////////////////////////////////////
        //First time load
        this.renderItem(this.settings.currentItem);

        container.on("updateItem", (d) => {
            let id = d.id;
            let sender = d.sender;
            if (sender == this) return;
            //Check if item is shown
            //Update item if relevant
            if (id == this.settings.currentItem) {
                this.renderItem(id, true); //update for any new properties.
                return true;
            } else return false;
        });


        //loading and saving
        this.updateSettings = () => {
            /*
            if (this.settings.dataEntry) {
                insertbtn.style.display = "block";
            } else {
                insertbtn.style.display = "none";
            }
            if (this.settings.commitChanges) {
                commitbtn.style.display = "block";
            } else {
                commitbtn.style.display = "none";
            }
            //render the item
            this.renderItem(this.settings.currentItem);
            */
        }
        this.updateSettings();

        //Handle the settings dialog click!
        this.dialogDiv = document.createElement("div");
        this.optionsDiv = document.createElement("div");
        this.dialogDiv.appendChild(this.optionsDiv);
        this.optionsDiv.style.width = "30vw";
        let options = {
            operationMode: new polymorph_core._option({
                div: this.optionsDiv,
                type: "select",
                object: this.settings,
                property: "operationMode",
                source: {
                    static: "Display static item",
                    focus: "Display focused element"
                },
                label: "Select operation mode:"
            }),
            currentItem: new polymorph_core._option({
                div: this.optionsDiv,
                type: "text",
                object: this.settings,
                property: "currentItem",
                label: "Set item to display:"
            }),
            commitChanges: new polymorph_core._option({
                div: this.optionsDiv,
                type: "bool",
                object: this.settings,
                property: "commitChanges",
                label: "Manually commit changes",
            }),
            dataEntry: new polymorph_core._option({
                div: this.optionsDiv,
                type: "bool",
                object: this.settings,
                property: "dataEntry",
                label: "Enable data entry",
                afterInput: (e) => {
                    let i = e.currentTarget;
                    if (i.checked) {
                        this.settings.showNonexistent = true;
                        options.showNonexistent.load();
                        this.settings.commitChanges = true;
                        options.commitChanges.load();
                    }
                }
            }),
            globalEnabled: new polymorph_core._option({
                div: this.optionsDiv,
                type: "bool",
                object: this.settings,
                property: "globalEnabled",
                label: "Focus: listen for every container (regardless of origin)",
            })
        }
        this.showDialog = () => {
            // update your dialog elements with your settings
            //get all available properties.
            //fill out some details
            for (i in options) {
                options[i].load();
            }
        }
        this.dialogUpdateSettings = () => {
            // pull settings and update when your dialog is closed.
            let its = this.dialogDiv.querySelectorAll("[data-role]");
            for (let i = 0; i < its.length; i++) {
                this.settings[its[i].dataset.role] = its[i].value;
            }
            //also update all properties
            this.updateSettings();
            this.renderItem(this.settings.currentItem);
        }
        this.dialogDiv.addEventListener("input", (e) => {
            if (e.target.dataset.role) {
                this.settings[e.target.dataset.role] = e.target.value;
            }
        })

        //polymorph_core will call this when an object is focused on from somewhere
        container.on("focusItem", (d) => {
            let id = d.id;
            let sender = d.sender;
            if (this.settings.operationMode == "focus") {
                this.settings.currentItem = id;
                polymorph_core.fire("updateItem", { id: container.id, sender: this }); // kick the _lu_
                this.renderItem(id);
            }
        });
        container.on("deleteItem", (d) => {
            let id = d.id;
            let s = d.sender;
            if (this.settings.currentItem == id) {
                this.settings.currentItem = undefined;
            };
            this.updateItem(undefined);
        });
    });

})();