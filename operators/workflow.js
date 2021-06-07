// todo: on enter or defocus, create new item
// tab to indent
polymorph_core.registerOperator("workflow", {
    displayName: "Workflowish",
    description: "Nested, plaintext lists. Workflowy emulation.",
    section: "Standard"
}, function(container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        titleProperty: "title",
        richtextProperty: "description",
        rootItems: [],
        filter: polymorph_core.guid(),
        propsAsDate: "",
        rootItemListItem: "",
        rootItemListItemProperty: "",
        linkProp: "to",
        bracketPropertyPrefix: container.id
    };
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);
    //Can probably replace this with direct instantiation instead of a getter, if we're careful.
    Object.defineProperty(this, "existingItems", {
        get: () => {
            if (this._existingItemsCache) return this._existingItemsCache;
            else {
                this._existingItemsCache = Array.from(this.rootItems).filter(i => polymorph_core.items[i]); // occasionally strange things happen
                for (let i = 0; i < this._existingItemsCache.length; i++) {
                    if (polymorph_core.items[this._existingItemsCache[i]][this.settings.linkProp]) this._existingItemsCache.push.apply(this._existingItemsCache, Object.keys(polymorph_core.items[this._existingItemsCache[i]][this.settings.linkProp]).filter(i => polymorph_core.items[i]));
                }
                return this._existingItemsCache;
            }
        }
    });
    //force update existingitemscache
    Object.defineProperty(this, "rootItems", {
        get: () => {
            if (this.settings.rootItemListItem) {
                try {
                    return polymorph_core.items[this.settings.rootItemListItem][this.settings.rootItemListItemProperty];
                } catch (e) {
                    //create the item if it doesnt exist
                    //create the property if it doesnt exist
                    return [];
                }
            } else return this.settings.rootItems;
        },
        set: (v) => {
            if (this.settings.rootItemListItem) {
                try {
                    polymorph_core.items[this.settings.rootItemListItem][this.settings.rootItemListItemProperty] = v;
                } catch (e) {
                    //create the item if it doesnt exist
                    //create the property if it doesnt exist
                }
            } else this.settings.rootItems = v;
            return v;
        }
    });
    Object.defineProperty(this, "rootItemId", {
        get: () => {
            return (this.settings.rootItemListItem) ? this.settings.rootItemListItem : container.id;
        }
    });
    this.existingItems.length;
    this._parentOfCache = {};
    this.parentOf = (id) => {
        if (this._parentOfCache[id] && polymorph_core.items[this._parentOfCache[id]][this.settings.linkProp][id]) return this._parentOfCache[id];
        if (this.rootItems.indexOf(id) != -1) return ""; // make rootitems default to top level because why not...?
        else {
            for (let i in polymorph_core.items) {
                if (polymorph_core.items[i][this.settings.linkProp] && polymorph_core.items[i][this.settings.linkProp][id]) {
                    this._parentOfCache[id] = i;
                    return this._parentOfCache[id];
                }
            }
            this._parentOfCache[id] = "";
            return this._parentOfCache[id]; //undefined = maybe root.
        }
    }

    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `
    <style>
    span[data-id]{
        display:block;
        width:100%;
    }
    
    span[contenteditable]{
        /*display: inline-block;
        float: right;*/ 
        width: calc(100% - 30px);
    }
    /*span[data-id]>div{
        padding-left: 10px;
    }*/
    span.toprow{
        display:flex;
    }
    span.utils{
        display: flex;
    }
    span.arrow{
        display: inline-block;
        width: 15px;
        text-align: center;
    }
    span[data-id] span[data-id]{
        margin-left: 5px;
    }
    span[data-id] div.inset-container{
        border-left: 1px solid white;
        margin-left: 7px;
        padding-left: 8px;
    }
    span.bottomControlPanel{
        flex: 0 0 5%
        width: 100%;
        display: ${isPhone() ? "flex" : "none"};
    }

    span.bottomControlPanel button{
        flex: 1 1 auto;
        height: 40px;
    }

    span.bottomControlPanel button.pressed{
        background:lightblue;
    }
    span.bottomControlPanel button.heavyPressed{
        color:white;
        background:darkblue;
    }

    .tmpFocused{
        background: rgba(255,255,0,0.5);
    }

    </style>
    <label style="display: flex;"><span>Search</span><input style="flex: 1 0 auto" class="searcher"></label>
    <span class="innerRoot" style="flex: 0 1 100%; min-height:0; overflow:auto">${/* otherwise we get overflow issues*/ ""}
        <span class="cursorspan">
            <span class="toprow">
                <span class="utils">
                    <span class="arrow">*</span><span class="bullet">&#8226;</span>
                </span>
                <span contenteditable>&nbsp;</span>
            </span>
        </span>
    </span>
    <span class="bottomControlPanel">
        <button data-corrkey="shift" class="modifier">Shift</button>
        <button data-corrkey="alt" class="modifier">Alt</button>
        <button data-corrkey="ctrl" class="modifier">Ctrl</button>
        <button data-corrkey="ArrowUp">Up</button>
        <button data-corrkey="ArrowDown">Down</button>
        <button data-corrkey="Enter">Enter</button>
        <button data-corrkey="Tab">Tab</button>
    </span>
    `;
    this.rootdiv.style.color = "white";
    this.rootdiv.style.display = "flex";
    this.rootdiv.style.flexDirection = "column";
    this.innerRoot = this.rootdiv.querySelector(".innerRoot");

    this.orderedLink = (from, to, i, after) => {
        polymorph_core.link(from, to);
        if (!polymorph_core.items[from].toOrder) polymorph_core.items[from].toOrder = [];
        if (polymorph_core.items[from].toOrder.indexOf(to) != -1) {
            polymorph_core.items[from].toOrder.splice(polymorph_core.items[from].toOrder.indexOf(to), 1);
        }
        if (i == undefined) polymorph_core.items[from].toOrder.push(to);
        else if (typeof(i) == "number") {
            polymorph_core.items[from].toOrder.splice(i, 0, to);
        } else {
            i = polymorph_core.items[from].toOrder.indexOf(i);
            if (after) i++;
            if (i != -1) polymorph_core.items[from].toOrder.splice(i, 0, to);
            else polymorph_core.items[from].toOrder.push(to);
        }
    };

    this.rootdiv.querySelector(".searcher").addEventListener("keyup", (e) => {

        //hide all items
        for (let i in renderedItemCache) {
            renderedItemCache[i].el.style.display = "none";
        }
        for (let i in renderedItemCache) {
            if (polymorph_core.items[i][this.settings.titleProperty].toLowerCase().includes(e.target.value.toLowerCase())) {
                let e = renderedItemCache[i].el;
                while (e && e != this.innerRoot) { // somehow deleted items hang around
                    if (e.tagName == "SPAN") e.style.display = "block";
                    e = e.parentElement;
                }
                // also show all parents (but don't expand?)
            }
        }
        //show selected items 
        //v comp expense! use cache if too hard  
    })
    let setExpandedState = (spanWithID, toExpanded) => {
        if (toExpanded == undefined) { // toggle
            if (spanWithID.children[1].style.display == "none") toExpanded = true;
            else toExpanded = false;
        }
        if (!polymorph_core.items[spanWithID.dataset.id][this.settings.linkProp] || !Object.keys(polymorph_core.items[spanWithID.dataset.id][this.settings.linkProp]).length) return;
        polymorph_core.items[spanWithID.dataset.id].collapsed = !toExpanded;
        this.renderItem(spanWithID.dataset.id);
        //set all immediate child spans to display: block, to account for search case
        Array.from(spanWithID.children[1].children).map(i => i.style.display = "block");
        /*if (toExpanded) {
            spanWithID.children[1].style.display = "block";
            spanWithID.children[0].children[0].children[0].innerHTML = "&#x25BC;";
            polymorph_core.items[spanWithID.dataset.id].collapsed = false;
        } else {
            spanWithID.children[1].style.display = "none";
            spanWithID.children[0].children[0].children[0].innerHTML = "&#x25B6;";
            polymorph_core.items[spanWithID.dataset.id].collapsed = true;
        }*/
    }
    let restoreClickFlag = false;
    this.rootdiv.addEventListener("click", (e) => {
        if (restoreClickFlag) return;
        if (e.target.classList.contains("arrow")) {
            //expand or contract
            setExpandedState(e.target.parentElement.parentElement.parentElement);
            polymorph_core.fire("updateItem", { id: e.target.parentElement.parentElement.parentElement.dataset.id, sender: this });
        }
        if (this.innerRoot.querySelector(".tmpFocused")) this.innerRoot.querySelector(".tmpFocused").classList.remove("tmpFocused");
    });
    //return true if we care about an item and dont want it garbage-cleaned :(
    //ideally somehow automatically know whether or not it is on our tree
    //temporary solution: use the filter property...
    //this.itemRelevant = (id) => { return (this.existingItems.indexOf(id) != -1) }
    this.itemRelevant = (id) => { return polymorph_core.items[id] && polymorph_core.items[id][this.settings.filter] }

    this.createItem = (id, toDirectAdopt) => {
        if (!id) id = polymorph_core.insertItem({});
        itm = polymorph_core.items[id];
        if (!itm) itm = polymorph_core.items[id] = {};
        itm[this.settings.filter] = true;
        itm[this.settings.titleProperty] = itm[this.settings.titleProperty] || ""; // in case title already exists from another operator
        //add any data you need
        if (toDirectAdopt) {
            for (let i = 0; i < this.existingItems.length; i++) {
                if (polymorph_core.items[this.existingItems[i]][this.settings.linkProp] && polymorph_core.items[this.existingItems[i]][this.settings.linkProp][id]) {
                    toDirectAdopt = false;
                    if (!polymorph_core.items[this.existingItems[i]].toOrder) polymorph_core.items[this.existingItems[i]].toOrder = [];
                    if (polymorph_core.items[this.existingItems[i]].toOrder.indexOf(id) == -1) {
                        polymorph_core.items[this.existingItems[i]].toOrder.push(id);
                    }
                    break;
                }
            }
        }
        if (toDirectAdopt) {
            if (this.rootItems.indexOf(id) == -1) this.rootItems.push(id);
        }
        this._existingItemsCache.push(id);
        return id;
    }

    let focusOnElement = (el, index, doClick) => {
        let range = document.createRange();
        let newP = el;
        if (!newP.childNodes.length) {
            newP.focus();
            return;
        }
        if (!index) index = 0;
        while (newP.childNodes[0]) newP = newP.childNodes[0];
        if (index < 0) {
            index = newP.textContent.length;
        }
        range.setStart(newP, index);
        range.collapse(true);
        let sel = this.rootdiv.getRootNode().getSelection();
        restoreClickFlag = true;
        setTimeout(() => {
            sel.removeAllRanges();
            sel.addRange(range);
            el.focus();
            el.click(); // for phones
            restoreClickFlag = false;
        });
    }

    let focusOnPrev = (etarget) => {
        let toFocusOnSpan = etarget.parentElement.parentElement.previousElementSibling;
        if (!toFocusOnSpan) {
            toFocusOnSpan = etarget.parentElement.parentElement.parentElement.parentElement;
        } else {
            if (toFocusOnSpan.tagName == "STYLE" || toFocusOnSpan.matches(".cursorspan")) return false;
            while (toFocusOnSpan.children[1].children.length && toFocusOnSpan.children[1].style.display != "none") {
                toFocusOnSpan = toFocusOnSpan.children[1].children[toFocusOnSpan.children[1].children.length - 1];
            }
        }
        focusOnElement(toFocusOnSpan.children[0].children[1], -1);
    }
    let focusOnNext = (etarget) => {
        let toFocusOnSpan = etarget.parentElement.parentElement.nextElementSibling;
        if (etarget.parentElement.nextElementSibling.children.length && etarget.parentElement.parentElement.children[1].style.display != "none") {
            toFocusOnSpan = etarget.parentElement.nextElementSibling.children[0];
        }
        if (!toFocusOnSpan) {
            //                     span   pspan           div?
            let tmpParentSpan = etarget.parentElement.parentElement;
            while (tmpParentSpan && tmpParentSpan.parentElement.parentElement.parentElement && !tmpParentSpan.parentElement.parentElement.nextElementSibling) {
                tmpParentSpan = tmpParentSpan.parentElement.parentElement;
                if (!tmpParentSpan.parentElement.parentElement.parentElement) return false;
            }
            if (tmpParentSpan && tmpParentSpan.parentElement.parentElement.parentElement) toFocusOnSpan = tmpParentSpan.parentElement.parentElement.nextElementSibling;
        }
        if (!toFocusOnSpan) return;
        focusOnElement(toFocusOnSpan.children[0].children[1]);
    }

    let unparent = (id) => {
        if (this.parentOf(id)) {
            polymorph_core.items[this.parentOf(id)].toOrder.splice(polymorph_core.items[this.parentOf(id)].toOrder.indexOf(id), 1);
            delete polymorph_core.items[this.parentOf(id)][this.settings.linkProp][id];
        } else {
            if (this.rootItems.indexOf(id) != -1) {
                this.rootItems.splice(this.rootItems.indexOf(id), 1);
            }
        }
        delete this._parentOfCache[id];
    }

    this.getLiveToOrder = (root) => {
        if (root && root.dataset.id) {
            return Array.from(root.children[1].children).map(i => i.dataset.id)
        } else if (!root) {
            return Array.from(this.innerRoot.children).map(i => i.dataset.id).filter(i => i);
        }
    }

    this.regenerateToOrder = (root) => {
        if (root && root.dataset.id) {
            polymorph_core.items[root.dataset.id].toOrder = this.getLiveToOrder(root);
            polymorph_core.fire("updateItem", { id: root.dataset.id, sender: this });
        } else if (!root) {
            this.rootItems = this.getLiveToOrder(root);
            polymorph_core.fire("updateItem", { id: this.container.id, sender: this });
        }
        if (!root) root = this.innerRoot;
        else if (root.matches(".cursorspan")) return;
        else root = root.children[1];
        Array.from(root.children).filter(i => i.tagName == "SPAN").forEach(i => this.regenerateToOrder(i));
    };

    this.rootdiv.addEventListener("keydown", (e) => {
        if (e.target.matches(`span[data-id] span`)) {
            let id = e.target.parentElement.dataset.id;
            if (e.key == '\\') {
                // add curly brackets to the position
                let selection = e.target.getRootNode().getSelection().getRangeAt(0);
                console.log(selection);
                result = selection.commonAncestorContainer.textContent.split("");
                result.splice(selection.startOffset, 0, "\\", "{", "}");
                result = result.join("");
                let oldStart = selection.startOffset;
                selection.commonAncestorContainer.textContent = result;
                focusOnElement(selection.commonAncestorContainer.parentElement, oldStart + 2);
                e.preventDefault();
            }
        }
    })

    this.parse = (el) => {

        while (el && !el.dataset.id) {
            el = el.parentElement;
        }
        if (!el) return;
        let id = el.dataset.id;
        for (let p in polymorph_core.items[el]) {
            if (p.startsWith("_" + this.settings.bracketPropertyPrefix)) {
                //remove it? v inefficient but ok
                delete polymorph_core.items[el][p];
            }
        };
        let text = el.children[0].children[1].innerText;
        let re = /\\\{(.+?)\}/g;
        let result = 0;
        let validKeys = {};
        while (result = re.exec(text)) {
            let parts = result[1].split(":");
            let ltrkey = parts.shift();
            key = `_${this.settings.bracketPropertyPrefix}_${ltrkey}`; // Transform the key to something we care about, otherwise you'll get a spamload of properties like d da dat data for \{dataset}
            validKeys[key] = true;
            let value = parts.join(":");
            if (value) {
                if (this.settings.propAsDate.split(",").includes(ltrkey)) {
                    let oldDateString = "";
                    try {
                        oldDateString = polymorph_core.items[id][key].datestring;
                    } catch (e) {}
                    polymorph_core.items[id][key] = {
                        datestring: value
                    }
                    if (oldDateString == value) continue;
                    polymorph_core.items[id][key].date = dateParser.richExtractTime(polymorph_core.items[id][key].datestring);
                    if (!polymorph_core.items[id][key].date.length) polymorph_core.items[id][key].date = undefined;
                    container.fire("dateUpdate", { sender: this });
                } else {
                    polymorph_core.items[id][key] = value;
                }
            } else {
                if (!polymorph_core.items[id][key]) polymorph_core.items[id][key] = true;
            }
        }
        for (let p in polymorph_core.items[id]) {
            if (p.startsWith(`_${this.settings.bracketPropertyPrefix}_`)) {
                if (!validKeys[p]) {
                    delete polymorph_core.items[id][p];
                }
            }
        }
    }
    let modifiers = {
        shift: false,
        ctrl: false, // also command on mac, eventually
        alt: false
    };
    let handleKeyEvent = (key, id) => {
        let spanWithID = this.rootdiv.querySelector(`[data-id="${id}"]`);
        switch (key) {
            case "Backspace":
                let bcursorPos = spanWithID.children[0].children[1].getRootNode().getSelection().getRangeAt(0).startOffset;
                if (spanWithID.children[0].children[1].getRootNode().getSelection().getRangeAt(0).endOffset != bcursorPos) bcursorPos = 1; // not 0
                if ((bcursorPos == 0 && (spanWithID.parentElement.parentElement.dataset.id || spanWithID.previousElementSibling.dataset.id) && modifiers["alt"]) || (spanWithID.children[0].children[1].innerText.length == 0 || spanWithID.children[0].children[1].innerText == "\n")) { // sometimes ghost <br>s hang around preventing deletion
                    let remainingText = spanWithID.children[0].children[1].innerText;
                    let preParent = spanWithID.previousElementSibling;
                    if (!(preParent && preParent.dataset.id)) preParent = spanWithID.parentElement.parentElement;
                    //delete the item
                    let theI = this.rootItems.indexOf(id);
                    unparent(id);
                    if (theI != -1) {
                        container.fire("updateItem", { id: this.container.id, sender: this });
                    }
                    if (focusOnPrev(spanWithID.children[0].children[1]) == false) focusOnNext(spanWithID.children[0].children[1]);
                    if (spanWithID.parentElement.children.length == 1) {
                        // remove the arrow
                        spanWithID.parentElement.parentElement.children[0].children[0].children[0].innerHTML = "&#8226;";
                    }
                    if (!spanWithID.parentElement.parentElement.dataset.id && spanWithID.parentElement.children.length == 4) {
                        // if this is a root item and it is about to be deleted, show the cursor span
                        this.rootdiv.querySelector(".cursorspan").style.display = "block";
                    }
                    spanWithID.remove();
                    delete polymorph_core.items[id][this.settings.filter];
                    container.fire("updateItem", { id: id, sender: this });
                    container.fire("deleteItem", { id: id, sender: this });
                    if (preParent && preParent.dataset.id) {
                        // attach the remaining text to the upper parent
                        polymorph_core.items[preParent.dataset.id][this.settings.titleProperty] += remainingText;
                        this.renderItem(preParent.dataset.id);
                        focusOnElement(preParent.children[0].children[1], -1);
                        container.fire("updateItem", { id: preParent.dataset.id, sender: this });
                    }
                    //focus on the previous item if exists, otherwise on next element
                }
                break;
            case "Enter":
                let newID = this.createItem();
                // console.log the two parts
                if (modifiers["alt"]) {
                    let range = this.rootdiv.getRootNode().getSelection().getRangeAt(0);
                    let partB = spanWithID.children[0].children[1].innerText.slice(range.startOffset);
                    let partA = spanWithID.children[0].children[1].innerText.slice(0, range.startOffset);
                    if (partB.length) {
                        polymorph_core.items[id][this.settings.titleProperty] = partA;
                        this.renderItem(id);
                        polymorph_core.fire("updateItem", { id: id, sender: this }); // kick update on item so that 'to' changes
                        polymorph_core.items[newID][this.settings.titleProperty] = partB;
                    }
                } //else just make a new item
                if (modifiers["shift"]) {
                    this.orderedLink(id, newID);
                    polymorph_core.fire("updateItem", { id: id, sender: this }); // kick update on item so that 'to' changes
                } else {
                    let shouldBefore = this.rootdiv.getRootNode().getSelection();
                    if (shouldBefore.rangeCount == 0) {
                        shouldBefore = false; // likely an alt-enter
                    } else {
                        shouldBefore = shouldBefore.getRangeAt(0).startOffset;
                        if (shouldBefore < polymorph_core.items[id][this.settings.titleProperty].length / 2) {
                            shouldBefore = true;
                        } else {
                            shouldBefore = false;
                        }
                    }
                    if (spanWithID.parentElement.parentElement.dataset.id) {
                        // Not a root item
                        this.orderedLink(spanWithID.parentElement.parentElement.dataset.id, newID, polymorph_core.items[this.parentOf(id)].toOrder.indexOf(id) + (shouldBefore ? 0 : 1));
                        polymorph_core.fire("updateItem", { id: spanWithID.parentElement.parentElement.dataset.id, sender: this }); // kick update on item so that 'to' changes
                    } else {
                        this.rootItems.splice(this.rootItems.indexOf(id) + (shouldBefore ? 0 : 1), 0, newID);
                        polymorph_core.fire("updateItem", { id: container.id, sender: this });
                    }
                }
                container.fire("createItem", { id: newID, sender: this });
                container.fire("updateItem", { id: newID, sender: this });
                this.renderItem(newID);
                focusOnElement(this.rootdiv.querySelector(`span[data-id='${newID}']`).children[0].children[1]);
                break;
            case "ArrowUp":
                if (modifiers["alt"]) {
                    //move item up
                    if (spanWithID.parentElement.parentElement.dataset.id) {
                        // not a root item
                        if (spanWithID.previousElementSibling) {
                            this.orderedLink(spanWithID.parentElement.parentElement.dataset.id, id, spanWithID.previousElementSibling.dataset.id);
                            polymorph_core.fire("updateItem", { id: spanWithID.parentElement.parentElement.dataset.id, sender: this }); // kick update on item so that 'to' changes
                            this.renderItem(id);
                            spanWithID.children[0].children[1].focus();
                        }
                    } else {
                        //could be a root item
                        if (spanWithID.previousElementSibling.dataset.id) { // this needs to be looked at
                            let previ = this.rootItems.indexOf(id);
                            this.rootItems.splice(previ, 1);
                            this.rootItems.splice(previ - 1, 0, id);
                            this.renderItem(id);
                            spanWithID.children[0].children[1].focus();
                        }
                    }
                } else if (modifiers["ctrl"]) {
                    setExpandedState(spanWithID, false);
                    polymorph_core.fire("updateItem", { id: spanWithID.dataset.id, sender: this });
                } else {
                    focusOnPrev(spanWithID.children[0].children[1]);
                }
                break;
            case "ArrowDown":
                if (modifiers["alt"]) {
                    if (spanWithID.parentElement.parentElement.dataset.id) {
                        if (spanWithID.nextElementSibling) {
                            this.orderedLink(spanWithID.parentElement.parentElement.dataset.id, id, spanWithID.nextElementSibling.dataset.id, true);
                            polymorph_core.fire("updateItem", { id: spanWithID.parentElement.parentElement.dataset.id, sender: this }); // kick update on item so that 'to' changes
                            this.renderItem(id);
                            spanWithID.children[0].children[1].focus();
                        }
                    } else {
                        if (spanWithID.nextElementSibling) {
                            let previ = this.rootItems.indexOf(id);
                            this.rootItems.splice(previ, 1);
                            this.rootItems.splice(previ + 1, 0, id);
                            this.renderItem(id);
                            spanWithID.children[0].children[1].focus();
                        }
                    }
                } else if (modifiers["ctrl"]) {
                    setExpandedState(spanWithID, true);
                    polymorph_core.fire("updateItem", { id: spanWithID.dataset.id, sender: this });
                } else {
                    focusOnNext(spanWithID.children[0].children[1]);
                }
                break;
            case "Tab":
                let cursorPos = spanWithID.children[0].children[1].getRootNode().getSelection().getRangeAt(0).startOffset;
                if (cursorPos == 0 || isPhone()) {
                    if (!modifiers["shift"]) {
                        if (!spanWithID.previousElementSibling) return;
                        //clear the parentof cache
                        let oldParent = this.parentOf(id);
                        unparent(id);
                        if (!oldParent) {
                            polymorph_core.fire("updateItem", { id: this.rootItemId, sender: this }); // kick update on item so that 'to' changes
                        } else {
                            polymorph_core.fire("updateItem", { id: oldParent, sender: this }); // kick update on item so that 'to' changes
                        }
                        //kick the thing up four spaces
                        if (spanWithID.previousElementSibling.dataset.id) {
                            this.orderedLink(spanWithID.previousElementSibling.dataset.id, id);
                            polymorph_core.fire("updateItem", { id: spanWithID.previousElementSibling.dataset.id, sender: this }); // kick update on item so that 'to' changes
                            polymorph_core.fire("updateItem", { id: id, sender: this }); // force rerender in other operators
                            if (this.rootItems.indexOf(id) != -1) this.rootItems.splice(this.rootItems.indexOf(id), 1);
                            this.renderItem(id);
                            // expand all parent elements
                            let toExpand = spanWithID.parentElement.parentElement;
                            while (toExpand.dataset.id) {
                                polymorph_core.items[toExpand.dataset.id].collapsed = false;
                                this.renderItem(toExpand.dataset.id);
                                toExpand = toExpand.parentElement.parentElement;
                            }
                            spanWithID.children[0].children[1].focus();
                        }
                    } else {
                        //clear the parentof cache
                        let oldParent = this.parentOf(id);
                        unparent(id);
                        let stillOldParent = this.parentOf(id);
                        if (stillOldParent) { //huge amounts of duplication here. what's going on.
                            delete polymorph_core.items[stillOldParent][this.settings.linkProp][id];
                            polymorph_core.fire("updateItem", { id: stillOldParent, sender: this }); // kick update on item so that 'to' changes
                        }
                        polymorph_core.fire("updateItem", { id: oldParent, sender: this }); // kick update on item so that 'to' changes

                        delete this._parentOfCache[id];
                        let wasme = spanWithID.children[0].children[1];
                        if (spanWithID.parentElement.parentElement.dataset.id) {
                            if (spanWithID.parentElement.parentElement.parentElement.parentElement.parentElement) {
                                let prev = spanWithID.parentElement.parentElement.parentElement.parentElement.dataset.id;
                                this.orderedLink(prev, id, oldParent);
                                polymorph_core.fire("updateItem", { id: prev, sender: this }); // kick update on item so that 'to' changes
                                polymorph_core.fire("updateItem", { id: id, sender: this }); // force rerender in other operators
                                this.renderItem(id);
                                wasme.focus();
                            } else {
                                //make root
                                let prev = spanWithID.parentElement.parentElement.dataset.id;
                                this.rootItems.splice(this.rootItems.indexOf(prev) + 1, 0, id);
                                this.renderItem(id);
                                polymorph_core.fire("updateItem", { id: id, sender: this }); // force rerender in other operators
                                polymorph_core.fire("updateItem", { id: this.rootItemId, sender: this }); // force rerender of updateItem
                                wasme.focus();
                            }
                            this.renderItem(oldParent); // remove arrow from parent if it was an only child
                        } else {
                            // it is already a root node, do nothing
                        }

                    }
                }
        }
        if (JSON.stringify(this.rootItems) != JSON.stringify(this.getLiveToOrder())) {
            alert("ORDER MISMATCH!");
        }
    }

    this.rootdiv.addEventListener("keydown", (e) => {
        if (e.target.matches(`span[data-id] span`)) {
            let id = e.target.parentElement.parentElement.dataset.id;
            modifiers["ctrl"] = e.ctrlKey;
            modifiers["alt"] = e.altKey;
            modifiers["shift"] = e.shiftKey;
            modifierButtons.forEach(i => { modifiers[i.dataset.corrkey] |= i.classList.contains("pressed") | i.classList.contains("heavyPressed") });
            modifierButtons.forEach(i => { if (i.classList.contains("pressed")) i.classList.remove("pressed") });
            handleKeyEvent(e.key, id);
            // if enter or tab: 
            if (e.key == "Enter" || e.key == "Tab") {
                e.preventDefault();
            }
        } else if (e.target.matches("span.cursorspan span[contenteditable]")) {
            //create a new span right above it, and copy over the text, and create a new item
            let newID = this.createItem();
            this.rootItems.push(newID);
            polymorph_core.items[newID][this.settings.titleProperty] = e.target.innerText;
            e.target.innerHTML = "&nbsp;";
            container.fire("createItem", { id: newID, sender: this });
            e.preventDefault();
            this.renderItem(newID);
            focusOnElement(this.rootdiv.querySelector(`span[data-id='${newID}']`).children[0].children[1]);
        }
    })

    let lastFocusedID = undefined;
    let modifierButtons = Array.from(this.rootdiv.querySelector(".bottomControlPanel").children).filter(i => i.classList.contains("modifier"));
    this.rootdiv.querySelector(".bottomControlPanel").addEventListener("click", (e) => {
        if (e.target.matches("button")) {
            let oldFocus = saveFocus();
            if (e.target.classList.contains("modifier")) {
                if (e.target.classList.contains("pressed")) {
                    e.target.classList.remove("pressed");
                    e.target.classList.add("heavyPressed");
                } else if (e.target.classList.contains("heavyPressed")) {
                    e.target.classList.remove("heavyPressed");
                } else {
                    e.target.classList.add("pressed");
                }
                restoreFocus(oldFocus);
            } else {
                if (lastFocusedID) {
                    modifierButtons.forEach(i => { modifiers[i.dataset.corrkey] = i.classList.contains("pressed") | i.classList.contains("heavyPressed") });
                    handleKeyEvent(e.target.dataset.corrkey, lastFocusedID);
                }
                modifierButtons.forEach(i => { if (i.classList.contains("pressed")) i.classList.remove("pressed") });
            }
        }
    })
    this.rootdiv.addEventListener("focusin", (e) => {
        if (restoreClickFlag) return;
        if (e.target.matches(`span[data-id] span`)) {
            let id = e.target.parentElement.parentElement.dataset.id;
            lastFocusedID = id;
            restoreClickFlag = true;
            container.fire("focusItem", { id: id, sender: this });
            restoreClickFlag = false;
        }
    });
    this.rootdiv.addEventListener("input", (e) => {
        if (e.target.matches(`span[data-id] span`)) {
            let id = e.target.parentElement.parentElement.dataset.id;
            polymorph_core.items[id][this.settings.titleProperty] = polymorph_core.RTParseElement(e.target, id, this.settings.titleProperty);
            //parse stuff
            this.parse(e.target);
            container.fire("updateItem", { id: id, sender: this });
        }
    });

    container.on("deleteItem", (d) => {
        delete polymorph_core.items[d.id][this.settings.filter];
        if (this.innerRoot.querySelector(`[data-id="${d.id}"]`)) this.innerRoot.querySelector(`[data-id="${d.id}"]`).remove();
        if (this.rootItems.indexOf(d.id) != -1) {
            this.rootItems.splice(this.rootItems.indexOf(d.id), 1);
        }
    })

    container.on("focusItem", (d) => {
        if (restoreClickFlag) return;
        if (d.sender == this) return;
        if (!this.itemRelevant(d.id)) return;
        let el = this.innerRoot.querySelector(`[data-id="${d.id}"]`);
        if (!el) {
            // render the parent
            let parentTrain = [];
            let p = d.id;
            while (p) {
                parentTrain.unshift(p);
                p = this.parentOf(p);
            }
            parentTrain.forEach(i => this.renderItem(i));
            el = this.innerRoot.querySelector(`[data-id="${d.id}"]`);
        }
        if (el) {
            if (this.innerRoot.querySelector(".tmpFocused")) this.innerRoot.querySelector(".tmpFocused").classList.remove("tmpFocused");
            let p = el.parentElement.parentElement;
            while (p.dataset.id) {
                setExpandedState(p, true);
                polymorph_core.fire("updateItem", { id: p.dataset.id, sender: this });
                p = p.parentElement.parentElement;
            }
            if (container.visible()) el.scrollIntoViewIfNeeded();
            //focusOnElement(el, 0);
            el.classList.add("tmpFocused");
        }
    })

    this.deleteItem = (id) => {
        //Find its parent and nerf it - if it doesnt have a parent, take it off the rootitems.
        container.fire("updateItem", { id: id, sender: this });
    }

    //this is called when an item is updated (e.g. by another container)

    let saveFocus = () => {
        if (!this.container.visible()) return undefined;
        var selection = this.rootdiv.getRootNode().getSelection();
        if (!selection.rangeCount) return undefined;
        let oldRange = selection.getRangeAt(0);
        let oldso = oldRange.startOffset;
        let oldctn = oldRange.startContainer; // all this convoluted machinery to get both backspace delete refocus and also normal text edit refocus to both work
        if (oldctn.nodeName == "#text") oldctn = oldctn.parentElement;
        return {
            root: oldctn,
            offset: oldso,
        };
    }

    let restoreFocus = (focusObj) => {
        if (!focusObj) return;
        if (!container.visible()) return;
        if (restoreClickFlag) return;
        let root = focusObj.root;
        let offset = focusObj.offset;
        let range = document.createRange();
        if (root.firstChild) {
            if (offset > root.firstChild.length) offset = root.firstChild.length;
            range.setStart(root.firstChild, offset);
        } else {
            range.setStart(root, 0);
        }
        var selection = this.rootdiv.getRootNode().getSelection();
        restoreClickFlag = true;
        selection.removeAllRanges();
        selection.addRange(range);
        if (root.firstChild) root.click(); // refocus on phone as well
        restoreClickFlag = false;
    }

    var oldFocus;
    let renderedItemCache = {}; // for deletions
    let renderTrain = {};
    this.renderItem = (id, recursive) => {
        if (!recursive) {
            oldFocus = saveFocus();
            renderTrain = {};
        }
        if (renderTrain[id]) return;
        if (this.itemRelevant(id)) {
            //render the item, if we care about it.
            let span = this.rootdiv.querySelector(`span[data-id='${id}']`);
            if (!polymorph_core.items[id][this.settings.filter] && span) {
                //item should be deleted
                span.remove();
                return;
            }
            if (!span) {
                span = htmlwrap(`
            <span data-id="${id}">
                <span class="toprow">
                    <span class="utils">
                        <span class="arrow"></span>
                    </span>
                    <span contenteditable></span>
                </span>
                <div class="inset-container"></div>
            </span>`);
                renderedItemCache[id] = {
                    el: span,
                };
            }
            if (renderedItemCache[id].rendered != (polymorph_core.items[id][this.settings.titleProperty] || " ")) {
                span.children[0].children[1].innerHTML = polymorph_core.RTRenderProperty(polymorph_core.items[id][this.settings.titleProperty] || " ");
                renderedItemCache[id].rendered = polymorph_core.items[id][this.settings.titleProperty] || " ";
            }
            if (polymorph_core.items[id][this.settings.linkProp] && Object.keys(polymorph_core.items[id][this.settings.linkProp]).length) {

                if (polymorph_core.items[id].collapsed) {
                    span.children[1].style.display = "none";
                    span.children[0].children[0].children[0].innerHTML = "&#x25B6;";
                } else {
                    span.children[1].style.display = "block";
                    span.children[0].children[0].children[0].innerHTML = "&#x25BC;";
                }
            } else {
                // maybe their child got removed
                span.children[0].children[0].children[0].innerHTML = "&#x25CF;";
            }
            let nxtid;
            let parent;
            if (this.parentOf(id)) {
                if (!polymorph_core.items[this.parentOf(id)].toOrder) this.orderedLink(this.parentOf(id), id);
                nxtid = polymorph_core.items[this.parentOf(id)].toOrder.indexOf(id) + 1;
                nxtid = polymorph_core.items[this.parentOf(id)].toOrder[nxtid];
                if (!this.rootdiv.querySelector(`span[data-id="${this.parentOf(id)}"]`)) {
                    //this is a multi-parent item and its primary parent hasnt appeared
                    //just ignore for the time being? we'll get another chance later
                    restoreFocus(oldFocus);
                    return;
                }
                parent = this.rootdiv.querySelector(`span[data-id="${this.parentOf(id)}"]`).children[1];
                parent.parentElement.children[0].children[0].children[0].innerHTML = "&#x25BC;";
            } else if (this.rootItems.indexOf(id) != -1) {
                nxtid = this.rootItems[this.rootItems.indexOf(id) + 1];
                parent = this.innerRoot;
            } else {
                // parent doesnt exist yet maybe
                // do nothing
                return;
            }
            if (nxtid && this.rootdiv.querySelector(`span[data-id="${nxtid}"]`)) {
                if (this.rootdiv.querySelector(`span[data-id="${nxtid}"]`) && this.rootdiv.querySelector(`span[data-id="${nxtid}"]`).parentElement == parent) {
                    parent.insertBefore(span, this.rootdiv.querySelector(`span[data-id="${nxtid}"]`))
                } else {
                    // for some reason, the next item of this item didn't share a common parent
                    //so ask the parent to figure out what's going on 
                    parent.appendChild(span);
                    // its possible that an external update didn't actually register yet
                    // so let's not jump the gun and treat the displayed info as the source of truth
                    /*if (parent == this.innerRoot) this.regenerateToOrder();
                    else this.regenerateToOrder(parent.parentElement);
                    */
                }
            } else {
                parent.insertBefore(span, this.rootdiv.querySelector(`span[data-id="${nxtid}"]`));
            }
            this.rootdiv.querySelector(".cursorspan").style.display = "none";
            if (!polymorph_core.items[id].collapsed) {
                if (!polymorph_core.items[id].toOrder) {
                    polymorph_core.items[id].toOrder = [];
                }
                // Don't regenerate toorder on here because if externally item is deleted then that undeletes it
                /*
                for (let i in polymorph_core.items[id][this.settings.linkProp]) {
                    if (polymorph_core.items[id].toOrder.indexOf(i) == -1) {
                        polymorph_core.items[id].toOrder.push(i);
                    }
                }
                */
                polymorph_core.items[id].toOrder.forEach((i) => {
                    this._parentOfCache[i] = id;
                    this.renderItem(i, true);
                });
                // also clear out the old parentCache
                for (let i in this._parentOfCache) {
                    if (polymorph_core.items[id].toOrder.indexOf(i) == -1) {
                        delete this._parentOfCache[i];
                    }
                }
            }
        }
        if (!recursive) {
            restoreFocus(oldFocus);
        }
    }
    container.on("updateItem", (d) => {
        /*
        if dealing with remote updates, we have a number of issues: 
        parent arrives first: nonexistent child to render ??
            add a queue of items we expect to exist and their prospective parents.
        child arrives first: no parent to attach to
            assuming parent actually arrives, thats fine
        rootitems updated: update rootitems.
        */
        if (d.sender == this) return; // Dont handle our own updates so that the user does not lose focus.
        let id = d.id;
        if (id == container.id) this.refresh();
        if (d.id == this.settings.rootItemListItem) {
            this.refresh();
        }
        if (polymorph_core.items[d.id][this.settings.filter] && !this.itemRelevant(d.id)) {
            this._existingItemsCache.push(d.id);
        }
        if ((polymorph_core.items[d.id][this.settings.filter] || this.itemRelevant(d.id))) this.renderItem(id);
        else if (renderedItemCache[d.id]) {
            renderedItemCache[d.id].el.remove();
            delete renderedItemCache[d.id];
        }
        //do stuff with the item.
    });

    container.on("createItem", (d) => {
        if (d.sender == this) return;
        let id = d.id;
        this.createItem(id, true);
        this.renderItem(id);
    });

    this.refresh = function() {
        // This is called when the parent container is resized.
        // needs to be here so that when item is instantialised, items will render.
        //if (this.container.visible()) { // dont check visiblity because we need to update items in background anyway when refresh called from other client
        this.rootItems.forEach((i) => {
            if (polymorph_core.items[i]) this.renderItem(i, true); // lie that the rendering is recursive, because the anti-collision system wont hurt
        });
        //}
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    let options = {
        oneTimeImport: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "filter",
            label: "Filter property"
        }),
        importnow: new polymorph_core._option({
            div: this.dialogDiv,
            type: "button",
            fn: () => {
                for (let i in polymorph_core.items) {
                    if (polymorph_core.items[i][this.settings.filter]) {
                        //check if they are children of any of the existing items occurs on render.
                        this.rootItems.push(i);
                        this.renderItem(i);
                    }
                }
            },
            label: "Import now"
        }),
        propsAsDate: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "propAsDate",
            label: "Properties to be treated as dates (csv)"
        }),
        rootItemListItem: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "rootItemListItem",
            label: "Root index item to use: (Leave blank for no root item)"
        }),
        rootItemListItemProperty: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "rootItemListItemProperty",
            label: "Property of root index item"
        }),
        rootItemCopyOver: new polymorph_core._option({
            div: this.dialogDiv,
            type: "button",
            fn: () => {
                if (!polymorph_core.items[this.settings.rootItemListItem]) polymorph_core.items[this.settings.rootItemListItem] = {};
                polymorph_core.items[this.settings.rootItemListItem][this.settings.rootItemListItemProperty] = this.settings.rootItems;
                container.fire("updateItem", { id: this.settings.rootItemListItem, sender: this });
            },
            label: "Copy root items to auxillary item"
        }),
        linkProp: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "linkProp",
            label: "Property that defines links"
        }),
        bracketPropertyPrefix: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "bracketPropertyPrefix",
            label: "Prefix for bracket properties"
        })
    }
    this.showDialog = function() {
        for (let i in options) {
            options[i].load();
        }
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function() {
        this.refresh();
        // This is called when your dialog is closed. Use it to update your container!
    }

    let contextTarget;
    let contextmenu;
    let recordContexted = (e) => {
        contextTarget = e.target;
        /*
        while (!contextTarget.matches(".floatingItem")) contextTarget = contextTarget.parentElement;
        if (polymorph_core.items[contextTarget.dataset.id].style) {
            contextmenu.querySelector(".background").value = polymorph_core.items[contextTarget.dataset.id].style.background || "";
            contextmenu.querySelector(".color").value = polymorph_core.items[contextTarget.dataset.id].style.color || "";
        } else {
            contextmenu.querySelector(".background").value = "";
            contextmenu.querySelector(".color").value = "";
        }
        */
        return true;
    }
    let contextMenuManager = new _contextMenuManager(this.rootdiv);
    contextmenu = contextMenuManager.registerContextMenu(
        `
    <li data-action="cleanup">Clean up ordering</li>
    <li data-action="sortbydate">Sort by date</li>
    <li data-action="delitm">Delete item</li>
    <li data-action="copylist">Copy subitems as list</li>
    <li>Edit style
    <ul class="submenu">
        <li data-action="cstyl">Copy style</li>
        <li data-action="pstyl">Paste style</li>
        <li><input data-action="background" placeholder="Background"></li>
        <li><input data-action="color" placeholder="Color"></li>
    </ul>
    </li>
    `, this.rootdiv, null, recordContexted);

    contextmenu.addEventListener("click", (e) => {
        if (this.contextMenuActions[e.target.dataset.action]) {
            this.contextMenuActions[e.target.dataset.action](e);
            contextmenu.style.display = "none";
        }
    });
    contextmenu.addEventListener("input", (e) => {
        if (this.contextMenuActions[e.target.dataset.action]) this.contextMenuActions[e.target.dataset.action](e);
    });
    //<li data-action="sortbydate">Copy subitems recursively as list</li>
    this.contextMenuActions = {};
    /*let savedStyle = undefined;
    this.contextMenuActions["cstyl"] = (e) => {
        let spanWithID = contextTarget.parentElement.parentElement;
        let id = spanWithID.dataset.id;
        savedStyle = polymorph_core.items[id].style;
    }

    this.contextMenuActions["pstyl"] = (e) => {
        if (savedStyle) {
            let spanWithID = contextTarget.parentElement.parentElement;
            let id = spanWithID.dataset.id;
            polymorph_core.items[id].style = savedStyle;
            contextTarget.style.background = savedStyle.background;
            contextTarget.style.color = savedStyle.color;
        }
    }

    this.contextMenuActions["color"] = (e) => {
        spanWithID = e.target.value;
        let spanWithID = contextTarget.parentElement.parentElement;
        let id = spanWithID.dataset.id;
        savedStyle = polymorph_core.items[id].style;
    }

    this.contextMenuActions["background"] = (e) => {
        let spanWithID = contextTarget.parentElement.parentElement;
        let id = spanWithID.dataset.id;
        savedStyle = polymorph_core.items[id].style;
    }*/

    this.contextMenuActions["copylist"] = function(e) {
        console.log(contextTarget);
        let text = contextTarget.parentElement.parentElement.innerText;
        // cry();// Copies a string to the clipboard. Must be called from within an
        if (window.clipboardData && window.clipboardData.setData) {
            // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
            return window.clipboardData.setData("Text", text);
        } else
        if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
            let textarea = document.createElement("textarea");
            textarea.textContent = text;
            textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in Microsoft Edge.
            document.body.appendChild(textarea);
            textarea.select();
            try {
                return document.execCommand("copy"); // Security exception may be thrown by some browsers.
            } catch (ex) {
                console.warn("Copy to clipboard failed.", ex);
                return false;
            } finally {
                document.body.removeChild(textarea);
            }
        }
    }
    this.contextMenuActions["delitm"] = (e) => {
        let spanWithID = contextTarget.parentElement.parentElement;
        let id = spanWithID.dataset.id;
        let theI = this.rootItems.indexOf(id);
        unparent(id);
        if (theI != -1) {
            container.fire("updateItem", { id: this.container.id, sender: this });
        }
        if (focusOnPrev(spanWithID.children[0].children[1]) == false) focusOnNext(spanWithID.children[0].children[1]);
        if (spanWithID.parentElement.children.length == 1) {
            // remove the arrow
            spanWithID.parentElement.parentElement.children[0].children[0].children[0].innerHTML = "";
        }
        if (!spanWithID.parentElement.parentElement.dataset.id && spanWithID.parentElement.children.length == 4) {
            // if this is a root item and it is about to be deleted, show the cursor span
            this.rootdiv.querySelector(".cursorspan").style.display = "block";
        }
        spanWithID.remove();
        delete polymorph_core.items[id][this.settings.filter];
        container.fire("updateItem", { id: id, sender: this });
        container.fire("deleteItem", { id: id, sender: this });
    }
    this.contextMenuActions["cleanup"] = () => this.regenerateToOrder();
    this.contextMenuActions["sortbydate"] = (root, property, recursive = false) => {
        // clarify the toOrder first
        if (root.target) root = undefined;
        if (!recursive) {
            this.regenerateToOrder(root);
        }
        // for now, just assume property is a date
        if (!property) {
            property = this.settings.propAsDate.split(",")[0]
        }
        if (!property) {
            return;
        }

        let itemMapper = (a) => {
            let result;
            if (polymorph_core.items[a][property] && polymorph_core.items[a][property].date && polymorph_core.items[a][property].date.length) {
                result = dateParser.getSortingTimes(polymorph_core.items[a][property].datestring, new Date(polymorph_core.items[a][property].date[0].refdate))
                if (result) result = result[0];
                if (result) result = result.date;
            }
            if (!result) result = Date.now() * 10000;
            return [a, result];
        }
        property = `_${this.settings.bracketPropertyPrefix}_${property}`;
        if (root && root.dataset.id) {
            let objs = polymorph_core.items[root.dataset.id].toOrder.map(itemMapper);
            objs.sort((a, b) => a[1] - b[1]);
            polymorph_core.items[root.dataset.id].toOrder = objs.map(i => i[0]);
            polymorph_core.fire("updateItem", { id: root.dataset.id, sender: this });
        } else if (!root) {
            let objs = this.rootItems.map(itemMapper);
            objs.sort((a, b) => a[1] - b[1]);
            this.rootItems = objs.map(i => i[0]);
            polymorph_core.fire("updateItem", { id: this.container.id, sender: this });
        }
        if (!root) root = this.innerRoot;
        else if (root.matches(".cursorspan")) return;
        else root = root.children[1];
        Array.from(root.children).filter(i => i.tagName == "SPAN").forEach(i => this.contextMenuActions["sortbydate"](i, property, true));
        if (!recursive) {
            if (root != this.innerRoot) {
                this.renderItem(root.dataset.id);
            } else {
                let rcopy = this.rootItems.map(i => i).reverse();
                let prevSpan = this.innerRoot.querySelector(`span[data-id="${rcopy[0]}"]`);
                for (let i of rcopy) {
                    let nextSpan = this.innerRoot.querySelector(`span[data-id="${i}"]`);
                    this.innerRoot.insertBefore(nextSpan, prevSpan);
                    prevSpan = nextSpan;
                }
            }
        }
    }

});