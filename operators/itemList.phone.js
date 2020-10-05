if (isPhone()) {
    polymorph_core.registerOperator("itemList", {
        section: "Standard",
        description: "View a list of items.",
        displayName: "List",
        imageurl: "assets/operators/list.png"
    }, function(container) {
        //initialisation
        let defaultSettings = {
            properties: {
                title: "text"
            },
            propertyWidths: {},
            filter: polymorph_core.guid(),
            enableEntry: true,
            implicitOrder: true,
            linkProperty: "to",
            entrySearch: false,
            propOrder: [],
            phoneProperties: {
                title: "text",
                description: "text"
            },
            phonePrimeProperty: "title" // properties for phone
        };
        polymorph_core.operatorTemplate.call(this, container, defaultSettings);
        //copy default settings properties to phone
        Object.assign(this.settings.phoneProperties, this.settings.properties);
        // render items as blobs

        //Add content-independent HTML here.
        this.rootdiv.innerHTML = `
            <style>
                *{
                    color:white;
                }

                .taskList{
                    display: block;
                    width: 100%;
                }
                .taskList p{
                    margin: 10px;
                    background: purple;
                    padding: 10px;
                }
                
                .taskList .plusButton{
                    background: purple;
                    color:white;
                    width: 50px;
                    height: 50px;
                    position:absolute;
                    bottom: 25px;
                    right: 25px;
                    line-height:50px;
                    text-align:center;
                    font-size: 2em;
                    border-radius:50%;
                }
                .backDiv{
                    position:relative;
                    padding: 10px;
                }
                .backDiv .doneButton{
                    text-align:center;
                    width: 100%;
                    padding: 20px 0;
                    background: purple;
                    position:sticky;
                    top:0;
                }
            </style>
            <div class="taskList">
                <div class="plusButton"> + </div>
                <div class="itemsContainer">
                    <!--
                    <p data-id="item_id">some property</p>
                    -->
                </div>
            </div>
            <div class="backDiv" style="display:none">
            <div class="donebutton">Done</div>
                <!--
                    <div data-prop="property">
                        <p>property_title</p>
                        <input></input> or <textarea></textarea>
                    </div>
                -->
            </div>
            `;
        this.taskList = this.rootdiv.querySelector(".taskList");
        let backDiv = this.rootdiv.querySelector(".backDiv");
        this.rootdiv.querySelector(".donebutton").addEventListener("click", () => {
            this.taskList.style.display = "block";
            backDiv.style.display = "none";
        });
        //this is called when an item is updated (e.g. by another container)
        container.on("updateItem", (d) => {
            let id = d.id;
            if (this.itemRelevant(id)) {
                let obj = this.taskList.querySelector(`[data-id='${id}']`);
                if (!obj) {
                    obj = htmlwrap(`<p data-id="${id}"></p>`);
                    this.taskList.appendChild(obj);
                }
                obj.innerText = polymorph_core.items[id][this.settings.phonePrimeProperty];
                //render the item, if we care about it.
            }
        });
        let editingID = undefined;
        let showBackDiv = (id) => {
            editingID = id;
            this.taskList.style.display = "none";
            let props = Array.from(backDiv.querySelectorAll("[data-prop]")).reduce((p, i) => { p[i.dataset.prop] = { div: i }; return p }, {});
            for (let i in this.settings.phoneProperties) {
                if (props[i]) {
                    props[i].keep = true;
                } else {
                    props[i] = {
                        div: htmlwrap(`<p>${i}</p><p contenteditable></p>`),
                        keep: true
                    }
                    props[i].div.dataset.prop = i;
                    backDiv.appendChild(props[i].div);
                }
                props[i].div.children[1].innerText = polymorph_core.items[id][i] || "";
            }
            for (let i in props) {
                if (!props[i].keep) {
                    props[i].div.remove();
                }
            }
            backDiv.style.display = "block";
        }

        backDiv.addEventListener("input", (e) => {
            polymorph_core.items[editingID][e.target.parentElement.dataset.prop] = e.target.innerText;
            container.fire("updateItem", { id: editingID });
        })

        this.taskList.querySelector(".plusButton").addEventListener("click", () => {
            //pseudo create a new item
            let pseudoItem = {};
            pseudoItem[this.settings.filter] = true;
            let show_id = polymorph_core.insertItem(pseudoItem);
            showBackDiv(show_id);
            container.fire("updateItem", { id: show_id });
        })

        this.taskList.addEventListener("click", (e) => {
            if (e.target.dataset.id) {
                showBackDiv(e.target.dataset.id);
            }
        })

        let stillHoldingTimer = 0;
        this.taskList.addEventListener("touchstart", (e) => {
            if (e.target.dataset.id) {
                let targ = e.target;
                stillHoldingTimer = setTimeout(() => {
                    if (confirm(`Delete item ${targ.dataset.id}?`)) {
                        delete polymorph_core.items[targ.dataset.id][this.settings.filter];
                        targ.remove();
                        container.fire("updateItem", { id: targ.dataset.id });
                    }
                }, 1000);
            }
        })

        this.taskList.addEventListener("touchend", (e) => {
            clearTimeout(stillHoldingTimer);
        })

        __itemlist_searchsort.apply(this);
        this.refresh = function() {
            this.sortItems();
            // This is called when the parent container is resized.
        }



        //Handle the settings dialog click!
        this.dialogDiv = document.createElement("div");
        this.dialogDiv.innerHTML = ``;

        let options = {
            filter: new polymorph_core._option({
                div: this.dialogDiv,
                type: "text",
                object: this.settings,
                property: "filter",
                label: "Filter for items to be shown"
            })
        }
        this.showDialog = () => {
            //enable adding new items checkbox
            for (i in options) {
                options[i].load();
            }
        }

        this.dialogUpdateSettings = function() {
            // This is called when your dialog is closed. Use it to update your container!
        }
    });
}