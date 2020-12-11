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

                .propertyLabel{
                    border-top: 1px solid white;
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
        this.renderItem = (id) => {
            if (this.itemRelevant(id)) {
                let obj = this.taskList.querySelector(`[data-id='${id}']`);
                if (!obj) {
                    obj = htmlwrap(`<p data-id="${id}"></p>`);
                    this.taskList.appendChild(obj);
                }
                obj.innerText = polymorph_core.items[id][this.settings.phonePrimeProperty];
                //render the item, if we care about it.
            }
        }
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
                        div: htmlwrap(`<p class="propertyLabel">${i}</p><p contenteditable></p>`),
                        keep: true
                    }
                    props[i].div.dataset.prop = i;
                    backDiv.appendChild(props[i].div);
                }
                //if () // special treatment of dates
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
            let currentItem = polymorph_core.items[editingID];
            if (this.settings.phoneProperties[i] == 'date') {
                if (!currentItem[e.target.dataset.role]) currentItem[e.target.dataset.role] = {};
                if (!currentItem[e.target.dataset.role].datestring) currentItem[e.target.dataset.role] = {
                    "datestring": ""
                };
                currentItem[e.target.dataset.role].datestring = e.target.value;
                currentItem[e.target.dataset.role].date = dateParser.richExtractTime(currentItem[e.target.dataset.role].datestring);
            } else {
                currentItem[e.target.parentElement.dataset.prop] = e.target.innerText;
            }
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
        this.dialogDiv.innerHTML = `
        <p>Columns to show</p>
        <div class="proplist"></div>
        <p>You can pick more from the list below, or add a new property! </p>
        <span>Choose existing property:</span><select class="_prop">
        </select><br>
        <input class="adpt" placeholder="Or type a new property..."><br>
        <button class="adbt">Add</button>
        `;

        this.proplist = this.dialogDiv.querySelector(".proplist");
        this.proplist.addEventListener("input", (e) => {
            if (e.target.matches("[name='sortie']")) {
                this.settings.implicitOrder = false;
                options.implicitOrder.load();
            }
        })

        this.dialogUpdateSettings = () => {
            // pull settings and update when your dialog is closed.
            this.sortItems();
            container.fire("updateItem", { id: this.container.id });
        };
        //adding new buttons
        this.dialogDiv.querySelector(".adbt").addEventListener("click",
            () => {
                if (this.dialogDiv.querySelector(".adpt").value != "") {
                    this.settings.phoneProperties[this.dialogDiv.querySelector(".adpt").value] = 'text';
                    this.dialogDiv.querySelector(".adpt").value = "";
                } else {
                    this.settings.phoneProperties[this.dialogDiv.querySelector("select._prop").value] = 'text';
                }
                this.showDialog();
            }
        )

        //Handle select's in proplist
        this.proplist.addEventListener('change', (e) => {
            if (e.target.matches("select")) this.settings.phoneProperties[e.target.dataset.role] = e.target.value;
        })
        this.proplist.addEventListener('click', (e) => {
            if (e.target.matches("[data-krole]")) {
                delete this.settings.phoneProperties[e.target.dataset.krole];
                this.showDialog();
            }
        })
        this.proplist.addEventListener("input", (e) => {
            if (e.target.matches("input[type='radio']")) {
                this.settings.sortby = e.target.dataset.ssrole;
            }
        })

        this.opList = this.dialogDiv.querySelector("select._prop");

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

            //Get all available properties, by looping through all elements (?)
            this.opList.innerHTML = "";
            let props = {};
            for (let i in polymorph_core.items) {
                for (let j in polymorph_core.items[i]) {
                    if (typeof polymorph_core.items[i][j] != "function") props[j] = true;
                }
            }
            for (let prop in props) {
                if (!this.settings.phoneProperties[prop]) {
                    let opt = document.createElement("option");
                    opt.innerText = prop;
                    opt.value = prop;
                    this.opList.appendChild(opt);
                }
            }

            //enable adding new items checkbox
            for (i in options) {
                options[i].load();
            }

            // Now fill in the ones which we're currently monitoring.
            this.proplist.innerHTML = "";
            for (let prop in this.settings.phoneProperties) {
                let pspan = document.createElement("p");
                pspan.innerHTML = `<span>` + prop + `</span>
            <select data-role=` + prop + `>
                <option value="text">Text</option>
                <option value="date">Date</option>
                <option value="object">Object</option>
                <option value="number">Number</option>
            </select><label>Sort <input type="radio" name="sortie" data-ssrole=${prop}></label>` + `<button data-krole="` + prop + `">X</button>`
                pspan.querySelector("select").value = this.settings.phoneProperties[prop];
                pspan.querySelector("input[type='radio']").checked = (this.settings.sortby == prop);
                this.proplist.appendChild(pspan);
            }
        }

        //passive load means we need this
        this.reRenderEverything = () => {
            while (this.taskList.children.length > 1) {
                this.taskList.children[1].remove();
            }
            this.renderedItems = [];
            for (let i in polymorph_core.items) {
                this.renderItem(i, true);
            }
            //and again for links
            for (let i in polymorph_core.items) {
                this.renderItem(i);
            }
        }
        this.reRenderEverything();

        this.dialogUpdateSettings = function() {
            // This is called when your dialog is closed. Use it to update your container!
        }
    });
}