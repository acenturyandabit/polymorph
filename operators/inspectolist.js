//todo: putter mode for inspector
polymorph_core.registerOperator("inspectolist", {
    displayName: "Inspectolist",
    description: "Combination between inspector and list. Gives detailed information about specific items."
}, function (container) {
    let defaultSettings = {
        dumpProp: "description",
        headerCopyProp: "title",
        currentItem: guid(4),
        filter: guid(4),
        permafilter: "",
        tagColors: {},
        scomCommands: []
    };
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);
    this.rootdiv.style.color = "white";
    this.rootdiv.appendChild(htmlwrap(`
    <style>
        h3{
            margin:0;
        }
        h2{
            margin:0;
        }
        [data-role="topbar"]{
            padding: 3px;
            margin: 1px;
            background: black;
            border-radius: 3px;
        }
        [data-role='subItemBox']{
            padding-left: 10px;
        }
    </style>
    `));
    this.rootdiv.style.overflow = "auto";
    this.rootdiv.style.height = "100%";
    // Add the search/entry box
    let searchEntryBox = document.createElement("div");
    searchEntryBox.contentEditable = true;
    this.rootdiv.appendChild(searchEntryBox);

    this.matchbox = htmlwrap(`
    <div>
        <h2>Matched items</h2>
        <div>
    </div>
    `);
    this.rootdiv.appendChild(this.matchbox);
    this.matchbox = this.matchbox.querySelector("div");

    this.unmatchbox = htmlwrap(`
    <div>
        <h2>Unmatched items</h2>
        <div>
    </div>
    `);
    this.rootdiv.appendChild(this.unmatchbox);
    this.unmatchbox = this.unmatchbox.querySelector("div");

    this.currentFilters = {};
    let similarish = (filterA, filterB) => {
        let indexA = indexB = 0;
        let simscore = 0;
        while (indexA < filterA.words.length && indexB < filterB.words.length) {
            if (filterA.words[indexA][0] > filterB.words[indexB][0]) {
                indexB++;
            } else if (filterA.words[indexA][0] < filterB.words[indexB][0]) {
                indexA++;
            } else {
                //they are the same
                return true;
            }
        }
        return false;
    }
    let generateFilter = (currentText) => {
        let currentFilter = {
            words: undefined,
            parent: undefined
        };
        let wrds = {};
        let re = /[#\w]+/g;
        let wrd = undefined;
        while (wrd = re.exec(currentText)) {
            let cwd = wrd[0].toLowerCase();
            wrds[cwd] = wrds[cwd] | 0;
            wrds[cwd]++;
        }
        currentFilter.words = Object.entries(wrds);
        currentFilter.words = currentFilter.words.sort((a, b) => a[0] > b[0] ? 1 : -1);

        //find parent
        if (wrd = />p:([\d\w]+)/.exec(currentText)) {
            currentFilter.parent = wrd[1];
        }
        return currentFilter;
    }
    let scombox = document.createElement("div");
    this.rootdiv.insertBefore(scombox, searchEntryBox);

    //slash command processing
    let scomprocess = (command) => {
        command = command.split(":");
        switch (command[0]) {
            case "filter":
                //apply a global filter: change settings filter and fire update on all items.
                for (let i in polymorph_core.items) {
                    container.fire("updateItem", { id: i, unedit: true });
                }
                //add the command to the command list.
                scombox.appendChild(htmlwrap(`<span>${command.join(":")}&nbsp;</span>`));
                this.settings.scomCommands.push(command);
                break;
        }
    }

    let scommod = (item) => {
        for (let i of this.settings.scomCommands) {
            switch (i[0]) {
                case "filter":
                    if (!item[this.settings.dumpProp].includes(i[1])) {
                        item[this.settings.dumpProp] += i[1];
                    }
            }
        }
    }

    searchEntryBox.addEventListener("keyup", (e) => {
        if (e.key == "Enter" && e.getModifierState("Shift") == false) {
            //create a new item
            let it = {};
            it[this.settings.dumpProp] = e.target.innerText;
            // perform scom modifications
            scommod(it);
            it[this.settings.filter] = true;
            let id = polymorph_core.insertItem(it);
            container.fire("createItem", { id: id, sender: this });
            updateRenderedItem(id, true);
            e.target.innerHTML = "";
            expand(id);
            this.rootdiv.querySelector(`[data-item="${id}"] [data-role="richtext"]`).focus();
            e.preventDefault();
        } else {
            //check slash commands
            let it = e.target.innerText;
            let slashcomm = /\\(.+?)\\/g.exec(e.target.innerText);
            if (slashcomm) {
                scomprocess(slashcomm[1]);
                it = it.replace(slashcomm[0], "");
                e.target.innerText = it;
            }
            //perform searchfilter
            currentFilter = generateFilter(it);
            for (let i in this.currentFilters) {
                if (similarish(this.currentFilters[i], currentFilter)) {
                    updateRenderedItem(i, true);
                } else {
                    updateRenderedItem(i, false);
                }
            }
        }
    })

    /*updateRenderedItem called when:
    updateItem: dont care about matched or not (persist)
    key press: dont care about matched or not (persist)
    */
    let updateRenderedItem = (id, matched) => {
        let addIfNotAdded = (p, c) => {
            if (!Array.from(p.children).includes(c)) p.appendChild(c);
        }


        this.currentFilters[id] = generateFilter(polymorph_core.items[id][this.settings.dumpProp]);
        renderTopbar(id);
        let cnt = getContainer(id);
        let userFocused = cnt.contains(this.rootdiv.getRootNode().getSelection().anchorNode);
        if (!userFocused) renderRichText(id);
        //figure out where it is
        if (matched == undefined) {//dont relocate
            matched = this.matchbox.contains(cnt);
        }
        if (matched) {
            addIfNotAdded(this.matchbox, cnt);
        } else {
            if (this.currentFilters[id].parent) {
                if (this.rootdiv.querySelector(`[data-item="${this.currentFilters[id].parent}"]`)) {
                    //append it to that div
                    addIfNotAdded(this.rootdiv.querySelector(`[data-item="${this.currentFilters[id].parent}"]>[data-role='subItemBox']`), cnt);
                } else {
                    addIfNotAdded(this.unmatchbox, cnt);
                }
            } else {
                addIfNotAdded(this.unmatchbox, cnt);
            }
        }
    }

    let getContainer = (id) => {
        let thisItemContainer = this.rootdiv.querySelector(`[data-item="${id}"]`);
        if (!thisItemContainer) {
            thisItemContainer = document.createElement('div');
            thisItemContainer.dataset.item = id;
            thisItemContainer.appendChild(htmlwrap('<div data-role="subItemBox"></div>'));
            this.matchbox.appendChild(thisItemContainer);
        }
        //also put it in the right place
        return thisItemContainer;
    }

    let renderTopbar = (id) => {
        let itemContainer = getContainer(id);
        let topbar = itemContainer.querySelector(`[data-role='topbar']`);
        if (!topbar) {
            topbar = htmlwrap(`<h3 data-role="topbar"></h3>`);
            itemContainer.insertBefore(topbar, itemContainer.children[0]);
        }
        if (polymorph_core.items[id][this.settings.dumpProp]) {
            let innerText = polymorph_core.items[id][this.settings.dumpProp];
            let toptext = `<span style="color:pink">#id:${id}; </span>`;
            toptext += innerText.split("\n")[0];
            
            polymorph_core.items[id][this.settings.headerCopyProp] = innerText.split("\n")[0];
            container.fire('updateItem', { sender: this, id: id });

            let tagfilter = /#(\w+)(:[\w\d]+)?/g;
            let seenTags = {};
            while (result = tagfilter.exec(innerText)) {
                if (!seenTags[result[0]]) {
                    toptext = toptext.replaceAll(result[0], "");
                    if (!this.settings.tagColors[result[1]]) {
                        this.settings.tagColors[result[1]] = randBriteCol();
                    }
                    toptext += `<span style="color:${this.settings.tagColors[result[1]]}">${result[0]}</span>`;
                    seenTags[result[0]] = true;
                }
            }
            //add the ID property
            topbar.innerHTML = toptext;
        }
    }
    let renderRichText = (id) => {
        let itemContainer = getContainer(id);
        let richtext = itemContainer.querySelector(`[data-role='richtext']`);
        if (!richtext) {
            richtext = htmlwrap(`<div data-role="richtext" contenteditable></div>`);
            itemContainer.insertBefore(richtext, itemContainer.children[1]);
            richtext.style.display = "none";
        }
        richtext.innerText = polymorph_core.items[id][this.settings.dumpProp];
    }

    container.on("updateItem", (d) => {
        if (d.sender == this) return;
        if (this.itemRelevant(d.id)) {
            updateRenderedItem(d.id);
        }
    })

    let expand = (id, focus = true) => {
        //hide all others
        Array.from(this.rootdiv.querySelectorAll("[data-role='richtext']")).forEach(i => {
            //i.style.height = "0px";
            i.style.display = "none";
        });
        let richtext = this.rootdiv.querySelector(`[data-item='${id}'] [data-role='richtext']`);
        richtext.style.display = "block";
        if (focus) richtext.focus();
    }

    this.rootdiv.addEventListener("click", (e) => {
        if (e.target.matches("[data-role='topbar']")) {
            let cid = e.target.parentElement.dataset.item;
            container.fire('focusItem', { id: cid, sender: this });
            expand(cid);
        }
    })

    let upc = new capacitor(300, 40, (id) => {
        container.fire("updateItem", {
            id: id,
            sender: this
        });
    })

    let deleteItem = (id) => {
        delete polymorph_core.items[id][this.settings.filter];
        delete this.currentFilters[id];
        if (this.rootdiv.querySelector(`[data-item='${id}']`)) this.rootdiv.querySelector(`[data-item='${id}']`).remove();
    }

    this.rootdiv.addEventListener("keydown", (e) => {
        if (e.target.matches("[data-role='richtext']")) {
            if ((e.key == "ArrowDown" || e.key == "ArrowUp") && !e.getModifierState("Shift")) {
                let ckey = e.key;
                let ctarget = e.target;
                let baseElement = e.target.getRootNode();
                range = baseElement.getSelection().getRangeAt(0);
                let preRange = range.startOffset;
                let preEl = range.startContainer;
                setTimeout(() => {
                    range = baseElement.getSelection().getRangeAt(0);
                    if (preRange == range.startOffset && preEl == range.startContainer) {
                        if (ckey == "ArrowDown") {
                            if (ctarget.parentElement.nextElementSibling) {
                                expand(ctarget.parentElement.nextElementSibling.dataset.item);
                            } else if (ctarget.parentElement.parentElement.dataset.role == 'subItemBox') {
                                if (ctarget.parentElement.parentElement.parentElement.nextElementSibling) {
                                    expand(ctarget.parentElement.parentElement.parentElement.nextElementSibling.dataset.item);
                                }
                            }
                        } else {
                            if (ctarget.parentElement.previousElementSibling) {
                                expand(ctarget.parentElement.previousElementSibling.dataset.item);
                            } else if (ctarget.parentElement.parentElement.dataset.role == 'subItemBox') {
                                expand(ctarget.parentElement.parentElement.parentElement.dataset.item);
                            }
                        }
                    }
                }, 100);
            }
        }
    });

    this.rootdiv.addEventListener("keyup", (e) => {
        if (e.target.matches("[data-role='richtext']")) {
            if (e.key == "Tab") e.preventDefault();
            else {
                let cid = e.target.parentElement.dataset.item;
                upc.submit(cid);
                if (e.target.innerText == "") {
                    //delete the item
                    deleteItem(cid);
                    container.fire("deleteItem", { id: cid, sender: this });
                } else {
                    polymorph_core.items[cid][this.settings.dumpProp] = e.target.innerText;
                    container.fire("updateItem", { id: cid, sender: this });
                    updateRenderedItem(cid);
                }
            }
        }
    })

    container.on("deleteItem", (d) => {
        if (d.sender == this) return;
        deleteItem(d.id);
    });

    container.on("createItem", (d) => {
        if (d.sender == this) return;
        polymorph_core.items[d.id][this.settings.filter] = true;
    });

    //polymorph_core will call this when an object is focused on from somewhere
    container.on("focusItem", (d) => {
        let id = d.id;
        if (d.sender == this) return;
        if (this.rootdiv.querySelector(`[data-item='${id}'] [data-role='richtext']`)) {
            expand(id, false);
        }
    });

    this.dialogDiv = document.createElement("div");
    this.importSys = {
        importTitle: "title",
        importDesc: "description",
        importFilter: "",
        import: () => {
            for (let i in polymorph_core.items) {
                if (this.importSys.importFilter && !polymorph_core.items[i][this.importSys.importFilter]) continue;
                if (polymorph_core.items[i][this.importSys.importTitle]) {
                    let data = polymorph_core.items[i][this.importSys.importTitle];
                    let importDescs = this.importSys.importDesc.split(",");
                    for (let d of importDescs) {
                        if (polymorph_core.items[i][d]) {
                            data += "\n";
                            data += polymorph_core.items[i][d];
                        }
                    }
                    polymorph_core.items[i][this.settings.dumpProp] = data;
                    polymorph_core.items[i][this.settings.filter] = true;
                    container.fire('updateItem', { id: i });
                }
            }
        }
    }
    let options = {
        filter: new _option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "filter",
            label: "Filter:"
        }),
        dumpProp: new _option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "dumpProp",
            label: "Property:"
        }),
        permafilter: new _option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "permafilter",
            label: "Additional filter string:"
        }),
        importTitle: new _option({
            div: this.dialogDiv,
            type: "text",
            object: this.importSys,
            property: "importTitle",
            label: "Import title property:"
        }),
        importDesc: new _option({
            div: this.dialogDiv,
            type: "text",
            object: this.importSys,
            property: "importDesc",
            label: "Import description properties (csv):"
        }),
        importFilter: new _option({
            div: this.dialogDiv,
            type: "text",
            object: this.importSys,
            property: "importFilter",
            label: "Import filter property:"
        }),
        importNow: new _option({
            div: this.dialogDiv,
            type: "button",
            label: "Import now",
            fn: this.importSys.import
        }),
    }
    this.showDialog = () => {
        for (i in options) options[i].load();
    }
    this.dialogUpdateSettings = () => {
        for (let i in polymorph_core.items) {
            if (this.itemRelevant(i)) updateRenderedItem(i);
        }
        container.fire("updateItem", { id: this.container.id });
        // pull settings and update when your dialog is closed.
    }
    this.dialogUpdateSettings();
});