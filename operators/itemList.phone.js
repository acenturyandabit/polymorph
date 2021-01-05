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
            showAllProperties: true,
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
                }
                .taskList p span{
                    padding: 10px;
                    display: inline-block;
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
                .closebtn{
                    float: right;
                    background: #cf0000;
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
        let itemCache = {};
        this.renderItem = (id) => {
            if (this.itemRelevant(id)) {
                if (!itemCache[id]) {
                    itemCache[id] = htmlwrap(`<p data-id="${id}"><span></span><span class="closebtn">&#xd7;</span></p>`);
                    this.taskList.appendChild(itemCache[id]);
                }
                itemCache[id].children[0].innerText = this.settings.phonePrimeProperty.split(",").map(i => {
                        if (!polymorph_core.items[id][i]) return "";
                        if (polymorph_core.items[id][i].datestring) {
                            try {
                                return dateParser.humanReadableRelativeDate(polymorph_core.items[id][i].date[0].date);
                            } catch (e) {
                                return polymorph_core.items[id][i].datestring;
                            }
                        } else return polymorph_core.items[id][i];
                    }).join("  |  ")
                    //render the item, if we care about it.
            } else {
                if (itemCache[id]) {
                    itemCache[id].remove();
                }
            }
        }
        container.on("updateItem", (d) => {
            let id = d.id;
            this.renderItem(id);
        });
        let editingID = undefined;
        let showBackDiv = (id) => {
            editingID = id;
            this.taskList.style.display = "none";
            let props = Array.from(backDiv.querySelectorAll("[data-prop]")).reduce((p, i) => { p[i.dataset.prop] = { div: i }; return p }, {});

            let renderProp = (i) => {
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
                if (this.settings.phoneProperties[i] == 'date') {
                    // special treatment of dates
                    if (polymorph_core.items[id][i]) props[i].div.children[1].innerText = polymorph_core.items[id][i].datestring || "";
                    else props[i].div.children[1].innerText = "";
                } else {
                    props[i].div.children[1].innerText = polymorph_core.items[id][i] || "";
                }
            }

            for (let i in this.settings.phoneProperties) {
                renderProp(i);
            }
            if (this.settings.showAllProperties) {
                for (let i in polymorph_core.items[id]) {
                    renderProp(i);
                }
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
            let currentProp = e.target.parentElement.dataset.prop;
            if (this.settings.phoneProperties[currentProp] == 'date') {
                if (!currentItem[currentProp] || typeof(currentItem[currentProp]) == "string") currentItem[currentProp] = {};
                currentItem[currentProp].datestring = e.target.innerText;
                currentItem[currentProp].date = dateParser.richExtractTime(currentItem[currentProp].datestring);
            } else {
                currentItem[currentProp] = e.target.innerText;
            }
            container.fire("updateItem", { id: editingID });
        })

        backDiv.addEventListener("focusout", (e) => {
            let currentItem = polymorph_core.items[editingID];
            let currentProp = e.target.parentElement.dataset.prop;
            if (this.settings.phoneProperties[currentProp] == 'date') {
                let toDisplay = "";
                if (currentItem[currentProp]) {
                    try {
                        toDisplay = dateParser.humanReadableRelativeDate(currentItem[currentProp].date[0].date);
                    } catch (e) {
                        toDisplay = currentItem[currentProp].datestring;
                    }
                    e.target.innerText = toDisplay;
                }
            }
        })

        backDiv.addEventListener("focusin", (e) => {
            let currentItem = polymorph_core.items[editingID];
            let currentProp = e.target.parentElement.dataset.prop;
            if (this.settings.phoneProperties[currentProp] == 'date') {
                if (!currentItem[currentProp]) currentItem[currentProp] = {};
                e.target.innerText = currentItem[currentProp].datestring || "";
            }
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
            if (e.target.dataset.id || e.target.matches("[data-id]>span:first-child")) {
                showBackDiv(e.target.dataset.id || e.target.parentElement.dataset.id);
            }
        })

        this.taskList.addEventListener("touchstart", (e) => {
            if (e.target.matches(".closebtn")) {
                if (confirm(`Delete item ${e.target.parentElement.dataset.id}?`)) {
                    delete polymorph_core.items[e.target.parentElement.dataset.id][this.settings.filter];
                    e.target.parentElement.remove();
                    container.fire("updateItem", { id: e.target.parentElement.dataset.id });
                }
            }
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


        this.dialogUpdateSettings = () => {
            // pull settings and update when your dialog is closed.
            this.sortItems();
            for (let i in this.itemCache) {
                this.renderItem(i);
            }
            container.fire("updateItem", { id: this.container.id });
            this.sortItems();
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
        });
        this.proplist.addEventListener('click', (e) => {
            if (e.target.matches("[data-krole]")) {
                delete this.settings.phoneProperties[e.target.dataset.krole];
                this.showDialog();
            }
        });

        this.opList = this.dialogDiv.querySelector("select._prop");

        let options = {
            filter: new polymorph_core._option({
                div: this.dialogDiv,
                type: "text",
                object: this.settings,
                property: "filter",
                label: "Filter for items to be shown"
            }),
            phonePrimeProperty: new polymorph_core._option({
                div: this.dialogDiv,
                type: "text",
                object: this.settings,
                property: "phonePrimeProperty",
                label: "Propert(ies) to display in front (include as csv)"
            }),
            sortProperty: new polymorph_core._option({
                div: this.dialogDiv,
                type: "text",
                object: this.settings,
                property: "sortby",
                label: "Property to sort by (leave blank for sort by creation time)",
                afterInput: (e) => {
                    if (e.target.value) {
                        this.settings.implicitOrder = false;
                    } else {
                        this.settings.implicitOrder = true;
                    }
                }
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
            </select>` + `<button data-krole="` + prop + `">X</button>`
                pspan.querySelector("select").value = this.settings.phoneProperties[prop];
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
            this.reRenderEverything();
            // This is called when your dialog is closed. Use it to update your container!
        }
    });
}