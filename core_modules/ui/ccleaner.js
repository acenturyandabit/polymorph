polymorph_core.on("UIstart", () => {
    //garbage collection
    polymorph_core.tryGarbageCollect = (id) => {
        if (polymorph_core.items[id]._od || polymorph_core.items[id]._rd) return; //never delete rects and operators? this wont end well
        if (id == "_meta") return; //dont delete the metaitem
        let toDelete = true;
        for (let i in this.containers) {
            if (this.containers[i].operator && this.containers[i].operator.itemRelevant && this.containers[i].operator.itemRelevant(id)) {
                toDelete = false;
            }
        }
        if (toDelete) {
            delete polymorph_core.items[id];
        }
    }
    polymorph_core.runGarbageCollector = () => {
        for (let i in polymorph_core.items) {
            polymorph_core.tryGarbageCollect(i);
        }
    }

    let loadDialog = document.createElement("div");
    loadDialog.classList.add("dialog");
    loadDialog = dialogManager.checkDialogs(loadDialog)[0];
    let loadInnerDialog = htmlwrap(`<div>
    <h1>Data cleaner</h1>
    <button class="repop">Repopulate lists</button>

    <div data-cluster="orphop">
        <h2>Orphaned operators</h2>
        <p>Operators that can't be accessed because they've been deleted or their parents have been deleted.</p>
        <select multiple>
        </select>
        <button class="remove">Remove from list</button>
        <button class="cln1">Clean selected</button>
        <button class="clean">Clean all on list</button>
    </div>

    <div data-cluster="orphrect">
        <h2>Orphaned Rects</h2>
        <p>Rects that can't be accessed because they've been deleted or their parents have been deleted.</p>
        <select multiple>
        </select>
        <button class="remove">Remove from list</button>
        <button class="cln1">Clean selected</button>
        <button class="clean">Clean up</button>
    </div>

    <div data-cluster="orphit">
        <h2>Orphaned Items</h2>
        <p>Items that aren't claimed as relevant by any active operators.</p>
        <select multiple>
        </select>
        <button class="remove">Remove from list</button>
        <button class="cln1">Clean selected</button>
        <button class="clean">Clean up</button>
    </div>

    <div data-cluster="singProp">
        <h2>Singular Properties</h2>
        <p>Properties that belong to less than 10 items</p>
        <select multiple>
        </select>
        <button class="remove">Remove from list</button>
        <button class="cln1">Clean selected</button>
        <button class="clean">Delete from items</button>
    </div>

    </div>`); // TODO: split up and make it programmatic
    loadDialog.querySelector(".innerDialog>div:first-child").appendChild(loadInnerDialog);
    document.body.appendChild(loadDialog);

    let checkIfRootedAtParent = (p) => {
        //chase up the parent
        let toInsert = true;
        if (p == polymorph_core.items._meta.currentView) toInsert = false;
        while (polymorph_core.items[p] && (polymorph_core.items[p]._od || polymorph_core.items[p]._rd)) {
            let new_p = -1;
            p = polymorph_core.items[p]._rd || polymorph_core.items[p]._od;
            // prevent cycles when an _rd points to itself as _od (as in when a subframe creates itself as a rect on startup)
            if (p == p.p) {
                if (polymorph_core.items[p]._od) {
                    if (p != polymorph_core.items[p]._od.p) {
                        new_p = polymorph_core.items[p]._od.p;
                    }
                }
            } else {
                new_p = p.p;
            }
            if (new_p == -1) break;
            p = new_p;
            if (p == polymorph_core.items._meta.currentView) toInsert = false;
        }
        return toInsert;
    }

    let cleaners = {
        orphop: {
            populate: () => {
                let junklist = [];
                for (let i in polymorph_core.items) {
                    if (polymorph_core.items[i]._od) {
                        let toInsert = checkIfRootedAtParent(i);
                        if (toInsert) {
                            junklist.push(i);
                        }
                    }
                }
                return junklist;
            },
            clean: (toClean) => {
                delete polymorph_core.items[toClean]._od;
                polymorph_core.fire("updateItem", { id: toClean });
                // don't actually delete the item cos that causes trouble with savesources and things
                /*if ((Object.keys(polymorph_core.items[toClean]).length == 1 && polymorph_core.items[toClean]._lu_) || (Object.keys(polymorph_core.items[toClean]).length == 0)) {
                    delete polymorph_core.items[toClean];
                }*/
            }
        },
        orphrect: {
            populate: () => {
                let junklist = [];
                for (let i in polymorph_core.items) {
                    if (polymorph_core.items[i]._rd) {
                        let toInsert = checkIfRootedAtParent(i);
                        if (toInsert) {
                            junklist.push(i);
                        }
                    }
                }
                return junklist;
            },
            clean: (toClean) => {
                delete polymorph_core.items[toClean]._rd;
                polymorph_core.fire("updateItem", { id: toClean });
                // don't actually delete the item cos that causes trouble with savesources and things
                /*
                if ((Object.keys(polymorph_core.items[toClean]).length == 1 && polymorph_core.items[toClean]._lu_) || (Object.keys(polymorph_core.items[toClean]).length == 0)) {
                    delete polymorph_core.items[toClean];
                }*/
            }
        },
        orphit: {
            populate: () => {
                let junklist = [];
                let operators = Object.values(polymorph_core.containers);
                operators.forEach(i => i.refresh());
                operators = operators.map(i => i.operator).filter(i => i.itemRelevant); // hot refresh all operators so everyone can have a say.
                for (let i in polymorph_core.items) {
                    if (!polymorph_core.items[i]._rd && !polymorph_core.items[i]._od && i != "_meta") {
                        let isrelevant = operators.reduce((p, op) => p || op.itemRelevant(i), false);
                        if (!isrelevant) {
                            junklist.push(i);
                        }
                    }
                }
                return junklist;
            },
            clean: (toClean) => {
                delete polymorph_core.items[toClean];
            }
        },
        singProp: {
            populate: () => {
                let propertycounts = {};
                for (let i in polymorph_core.items) {
                    if (i == "_meta" || i == "_od" || i == "_rd") continue;
                    for (let p in polymorph_core.items[i]) {
                        if (!propertycounts[p]) propertycounts[p] = 1;
                        else propertycounts[p]++;
                    }
                }
                return Object.entries(propertycounts).filter(i => i[1] < 5).map(i => i[0]);
            },
            clean: (toClean) => {
                for (let i in polymorph_core.items) {
                    if (polymorph_core.items[i][toClean]) {
                        delete polymorph_core.items[i][toClean];
                    }
                }
            }
        }
    }

    let populateOne = (i) => {
        let list = cleaners[i].populate();
        if (list.length) {
            loadInnerDialog.querySelector(`[data-cluster="${i}"]>select`).innerHTML = "<option>" + list.join("</option><option>") + "</option>";
        } else {
            loadInnerDialog.querySelector(`[data-cluster="${i}"]>select`).innerHTML = "Nothing to see here!";
            loadInnerDialog.querySelector(`[data-cluster="${i}"]>select`).disabled = true;
        }
        loadInnerDialog.querySelector(`[data-cluster="${i}"]>select`);
    }
    let populateAll = () => {
        for (let i in cleaners) {
            populateOne(i);
        }
    }

    loadInnerDialog.addEventListener("click", (e) => {
        if (e.target.tagName == "BUTTON") {
            let select = e.target.parentElement.querySelector("select");
            if (e.target.classList.contains("remove")) {
                Array.from(select.selectedOptions).map(i => i.remove());
            }
            if (e.target.classList.contains("cln1")) {
                let cleaner = cleaners[e.target.parentElement.dataset.cluster];
                Array.from(select.selectedOptions).map(i => cleaner.clean(i.innerHTML));
                populateOne(e.target.parentElement.dataset.cluster);
            }
            if (e.target.classList.contains("clean")) {
                let cleaner = cleaners[e.target.parentElement.dataset.cluster];
                Array.from(select.children).map(i => cleaner.clean(i.innerHTML));
                populateOne(e.target.parentElement.dataset.cluster);
            }

        }
    })
    if (!polymorph_core.isStaticMode()) {
        polymorph_core.topbar.add("File/Clean up").addEventListener("click", () => {
            populateAll();
            loadDialog.style.display = "block";
        })
    }
});