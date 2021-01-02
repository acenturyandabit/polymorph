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
        filter: polymorph_core.guid()
    };

    //Can probably replace this with direct instantiation instead of a getter, if we're careful.
    Object.defineProperty(this, "existingItems", {
        get: () => {
            if (this._existingItemsCache) return this._existingItemsCache;
            else {
                this._existingItemsCache = Array.from(this.settings.rootItems).filter(i => polymorph_core.items[i]); // occasionally strange things happen
                for (let i = 0; i < this._existingItemsCache.length; i++) {
                    if (polymorph_core.items[this._existingItemsCache[i]].to) this._existingItemsCache.push.apply(this._existingItemsCache, Object.keys(polymorph_core.items[this._existingItemsCache[i]].to).filter(i => polymorph_core.items[i]));
                }
                return this._existingItemsCache;
            }
        }
    })
    this._parentOfCache = {};
    this.parentOf = (id) => {
        if (this._parentOfCache[id]) return this._parentOfCache[id];
        else {
            for (let i = 0; i < this.existingItems.length; i++) {
                if (polymorph_core.items[this.existingItems[i]].to && polymorph_core.items[this.existingItems[i]].to[id]) {
                    this._parentOfCache[id] = this.existingItems[i];
                    return this._parentOfCache[id];
                }
            }
            this._parentOfCache[id] = "";
            return this._parentOfCache[id]; //undefined = maybe root.
        }
    }

    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);
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
    span[data-id]>div{
        padding-left: 10px;
    }
    span.toprow{
        display:flex;
    }
    span.utils{
        display: flex;
    }
    span.arrow{
        display: inline-block;
        width: 20px;
    }
    </style>
    <span class="cursorspan">
        <span class="toprow">
            <span class="utils">
                <span class="arrow">*</span><span class="bullet">&#8226;</span>
            </span>
            <span contenteditable>&nbsp;</span>
        </span>
    </span>
    `;
    this.rootdiv.style.color = "white";
    this.orderedLink = (from, to, i, after) => {
        polymorph_core.link(from, to);
        if (!polymorph_core.items[from].toOrder) polymorph_core.items[from].toOrder = [];
        if (polymorph_core.items[from].toOrder.indexOf(to) != -1) {
            polymorph_core.items[from].toOrder.splice(polymorph_core.items[from].toOrder.indexOf(to), 1);
        }
        if (!i) polymorph_core.items[from].toOrder.push(to);
        else if (typeof(i) == "number") {
            polymorph_core.items[from].toOrder.splice(i, 0, to);
        } else {
            i = polymorph_core.items[from].toOrder.indexOf(i);
            if (after) i++;
            if (i != -1) polymorph_core.items[from].toOrder.splice(i, 0, to);
            else polymorph_core.items[from].toOrder.push(to);
        }
    };
    let setExpandedState = (spanWithID, toExpanded) => {
        if (toExpanded == undefined) { // toggle
            if (spanWithID.children[1].style.display == "none") toExpanded = true;
            else toExpanded = false;
        }
        if (!spanWithID.children[1].children.length) return;
        if (toExpanded) {
            spanWithID.children[1].style.display = "block";
            spanWithID.children[0].children[0].children[0].innerHTML = "&#x25BC;";
            polymorph_core.items[spanWithID.dataset.id].collapsed = false;
        } else {
            spanWithID.children[1].style.display = "none";
            spanWithID.children[0].children[0].children[0].innerHTML = "&#x25B6;";
            polymorph_core.items[spanWithID.dataset.id].collapsed = true;
        }
    }
    this.rootdiv.addEventListener("click", (e) => {
        if (e.target.classList.contains("arrow")) {
            //expand or contract
            setExpandedState(e.target.parentElement.parentElement.parentElement);
        }
    });
    //return true if we care about an item and dont want it garbage-cleaned :(
    this.itemRelevant = (id) => { return (this.existingItems.indexOf(id) != -1) }

    this.createItem = (id) => {
        if (!id) id = polymorph_core.insertItem({});
        itm = polymorph_core.items[id];
        if (!itm) itm = polymorph_core.items[id] = {};
        itm[this.settings.filter] = true;
        itm[this.settings.titleProperty] = "";
        //add any data you need
        let toDirectAdopt = true;
        for (let i = 0; i < this.existingItems.length; i++) {
            if (polymorph_core.items[this.existingItems[i]].to && polymorph_core.items[this.existingItems[i]].to[id]) {
                toDirectAdopt = false;
                if (!polymorph_core.items[this.existingItems[i]].toOrder) polymorph_core.items[this.existingItems[i]].toOrder = [];
                if (polymorph_core.items[this.existingItems[i]].toOrder.indexOf(id) == -1) {
                    polymorph_core.items[this.existingItems[i]].toOrder.push(id);
                }
                break;
            }
        }
        if (toDirectAdopt) {
            if (this.settings.rootItems.indexOf(id) == -1) this.settings.rootItems.push(id);
        }
        this._existingItemsCache.push(id);
        return id;
    }

    let focusOnElement = (el, index) => {
        let range = document.createRange();
        let newP = el;
        if (!newP.childNodes.length) {
            newP.focus();
            return;
        }
        if (!index) index = 0;
        if (index < 0) index = newP.childNodes[0].textContent.length;
        range.setStart(newP.childNodes[0], index);
        range.collapse(true);
        let sel = this.rootdiv.getRootNode().getSelection();
        setTimeout(() => {
            sel.removeAllRanges();
            sel.addRange(range);
        });
        //newP.focus();
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
            while (tmpParentSpan && tmpParentSpan.parentElement.parentElement && !tmpParentSpan.parentElement.parentElement.nextElementSibling) {
                tmpParentSpan = tmpParentSpan.parentElement.parentElement;
                if (!tmpParentSpan.parentElement.parentElement) return false;
            }
            if (tmpParentSpan && tmpParentSpan.parentElement.parentElement) toFocusOnSpan = tmpParentSpan.parentElement.parentElement.nextElementSibling;
        }
        if (!toFocusOnSpan) return;
        focusOnElement(toFocusOnSpan.children[0].children[1]);
    }

    let unparent = (id) => {
        if (this.parentOf(id)) {
            delete polymorph_core.items[this.parentOf(id)].to[id];
            polymorph_core.items[this.parentOf(id)].toOrder.splice(polymorph_core.items[this.parentOf(id)].toOrder.indexOf(id), 1);
        }
        delete this._parentOfCache[id];
    }

    this.regenerateToOrder = (root) => {
        if (root && root.dataset.id) {
            polymorph_core.items[root.dataset.id].toOrder = Array.from(root.children[1].children).map(i => i.dataset.id);
        } else if (!root) {
            this.settings.rootItems = Array.from(this.rootdiv.children).map(i => i.dataset.id).filter(i => i);
        }
        if (!root) root = this.rootdiv;
        else if (root.matches(".cursorspan")) return;
        else root = root.children[1];
        Array.from(root.children).filter(i => i.tagName == "SPAN").forEach(i => this.regenerateToOrder(i));
    };
    // called when debugging, ideally call before save...

    this.rootdiv.addEventListener("keyup", (e) => {
        if (e.target.matches(`span[data-id] span`)) {
            let id = e.target.parentElement.dataset.id;
            if (e.key == '\\') {
                // add curly brackets to the position
                let selection = e.target.getRootNode().getSelection().getRangeAt(0);
                console.log(selection);
                result = selection.commonAncestorContainer.textContent.split("");
                result.splice(selection.startOffset, 0, "{", "}");
                result = result.join("");
                let oldStart = selection.startOffset;
                selection.commonAncestorContainer.textContent = result;
                focusOnElement(selection.commonAncestorContainer.parentElement, oldStart + 1);
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
            if (p.startsWith("_" + this.container.id)) {
                //remove it? v inefficient but ok
                delete polymorph_core.items[el][p];
            }
        };
        let text = el.children[0].children[1].innerText;
        let re = /\\\{(.+?)\}/g;
        let result = 0;
        while (result = re.exec(text)) {
            polymorph_core.items[id]["_" + this.container.id + "_" + result[1]] = true;
        }
    }

    this.rootdiv.addEventListener("keydown", (e) => {
        if (e.target.matches(`span[data-id] span`)) {
            let id = e.target.parentElement.parentElement.dataset.id;
            if (e.key == "Backspace") {
                if (e.target.innerText.length == 0 || e.target.innerText == "\n") { // odd newline issue
                    //delete the item
                    unparent(id);
                    let theI = this.settings.rootItems.indexOf(id);
                    if (theI != -1) this.settings.rootItems.splice(theI, 1);
                    if (focusOnPrev(e.target) == false) focusOnNext(e.target);
                    if (e.target.parentElement.parentElement.parentElement.children.length == 1) {
                        // remove the arrow
                        e.target.parentElement.parentElement.parentElement.parentElement.children[0].children[0].children[0].innerHTML = "";
                    }
                    if (!e.target.parentElement.parentElement.parentElement.parentElement && e.target.parentElement.parentElement.parentElement.children.length == 3) {
                        this.rootdiv.querySelector(".cursorspan").style.display = "block";
                    }
                    e.target.parentElement.parentElement.remove();
                    delete polymorph_core.items[e.target.parentElement.parentElement.dataset.id][this.settings.filter];
                    container.fire("updateItem", {
                        id: e.target.parentElement.parentElement.dataset.id,
                        sender: this
                    });
                    //focus on the previous item if exists, otherwise on next element
                }
            } else if (e.key == "Enter") {
                let newID = this.createItem();
                if (e.shiftKey) {
                    this.orderedLink(id, newID);
                } else {
                    //     span     span          span           div        span or null
                    if (e.target.parentElement.parentElement.parentElement.parentElement) {
                        this.orderedLink(e.target.parentElement.parentElement.parentElement.parentElement.dataset.id, newID, polymorph_core.items[this.parentOf(id)].toOrder.indexOf(id) + 1);
                    } else {
                        this.settings.rootItems.splice(this.settings.rootItems.indexOf(id) + 1, 0, newID);
                        polymorph_core.fire("updateItem", { id: container.id, sender: this });
                    }
                }
                container.fire("createItem", { id: newID, sender: this });
                e.preventDefault();

                this.renderItem(newID);
                focusOnElement(this.rootdiv.querySelector(`span[data-id='${newID}']`).children[0].children[1]);

            } else if (e.key == "ArrowUp") {
                if (e.altKey) {
                    //move item up
                    if (e.target.parentElement.parentElement.parentElement.parentElement) {
                        // not a root item
                        if (e.target.parentElement.parentElement.previousElementSibling) {
                            this.orderedLink(e.target.parentElement.parentElement.parentElement.parentElement.dataset.id, e.target.parentElement.parentElement.dataset.id, e.target.parentElement.parentElement.previousElementSibling.dataset.id);
                            this.renderItem(e.target.parentElement.parentElement.dataset.id);
                            e.target.focus();
                        }
                    } else {
                        //could be a root item
                        if (e.target.parentElement.parentElement.previousElementSibling.tagName != "STYLE") {
                            let previ = this.settings.rootItems.indexOf(id);
                            this.settings.rootItems.splice(previ, 1);
                            this.settings.rootItems.splice(previ - 1, 0, id);
                            this.renderItem(id);
                            e.target.focus();
                        }
                    }
                } else if (e.ctrlKey) {
                    setExpandedState(e.target.parentElement.parentElement, false);
                } else {
                    focusOnPrev(e.target);
                }
            } else if (e.key == "ArrowDown") {
                if (e.altKey) {
                    if (e.target.parentElement.parentElement.parentElement.parentElement) {
                        if (e.target.parentElement.parentElement.nextElementSibling) {
                            this.orderedLink(e.target.parentElement.parentElement.parentElement.parentElement.dataset.id, e.target.parentElement.parentElement.dataset.id, e.target.parentElement.parentElement.nextElementSibling.dataset.id, true);
                            this.renderItem(e.target.parentElement.parentElement.dataset.id);
                            e.target.focus();
                        }
                    } else {
                        if (e.target.parentElement.parentElement.nextElementSibling) {
                            let previ = this.settings.rootItems.indexOf(id);
                            this.settings.rootItems.splice(previ, 1);
                            this.settings.rootItems.splice(previ + 1, 0, id);
                            this.renderItem(id);
                            e.target.focus();
                        }
                    }
                } else if (e.ctrlKey) {
                    setExpandedState(e.target.parentElement.parentElement, true);
                } else {
                    focusOnNext(e.target);
                }
            } else if (e.key == "Tab") {
                let cursorPos = e.target.getRootNode().getSelection().getRangeAt(0).startOffset;
                if (cursorPos == 0) {
                    e.preventDefault();
                    if (e.shiftKey == false) {
                        if (!e.target.parentElement.parentElement.previousElementSibling) return;
                        //clear the parentof cache
                        unparent(id);
                        let wasme = e.target;
                        //kick the thing up four spaces
                        if (e.target.parentElement.parentElement.previousElementSibling.dataset.id) {
                            this.orderedLink(e.target.parentElement.parentElement.previousElementSibling.dataset.id, id);
                            if (this.settings.rootItems.indexOf(id) != -1) this.settings.rootItems.splice(this.settings.rootItems.indexOf(id), 1);
                            this.renderItem(id);
                            wasme.focus();
                        }
                    } else {
                        //clear the parentof cache
                        unparent(id);
                        if (this.parentOf(id)) delete polymorph_core.items[this.parentOf(id)].to[id];
                        delete this._parentOfCache[id];
                        let wasme = e.target;
                        if (e.target.parentElement.parentElement.parentElement) {
                            if (e.target.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement) {
                                let prev = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.id;
                                this.orderedLink(prev, id);
                                this.renderItem(id);
                                wasme.focus();
                            } else {
                                //make root
                                this.settings.rootItems.push(id);
                                this.renderItem(id);
                                wasme.focus();
                            }
                        } else {
                            // it is already a root node, do nothing

                        }
                    }
                }

            }
        } else if (e.target.matches("span.cursorspan span[contenteditable]")) {
            //create a new span right above it, and copy over the text, and create a new item
            let newID = this.createItem();
            this.settings.rootItems.push(newID);
            polymorph_core.items[newID][this.settings.titleProperty] = e.target.innerText;
            e.target.innerHTML = "&nbsp;";
            container.fire("createItem", { id: newID, sender: this });
            e.preventDefault();
            this.renderItem(newID);
            focusOnElement(this.rootdiv.querySelector(`span[data-id='${newID}']`).children[0].children[1]);
        }
    })

    this.rootdiv.addEventListener("focusin", (e) => {
        if (e.target.matches(`span[data-id] span`)) {
            let id = e.target.parentElement.dataset.id;
            container.fire("focusItem", { id: id, sender: this });
        }
    });
    this.rootdiv.addEventListener("input", (e) => {
        if (e.target.matches(`span[data-id] span`)) {
            let id = e.target.parentElement.parentElement.dataset.id;
            polymorph_core.items[id][this.settings.titleProperty] = e.target.innerText;
            //parse stuff
            this.parse(e.target);
            container.fire("updateItem", { id: id, sender: this });
        }
    });

    this.deleteItem = (id) => {
        //Find its parent and nerf it - if it doesnt have a parent, take it off the rootitems.
        container.fire("updateItem", { id: id, sender: this });
    }

    //this is called when an item is updated (e.g. by another container)

    let saveFocus = () => {
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
        selection.removeAllRanges();
        selection.addRange(range);
    }

    var oldFocus;
    let missingChildrenCache = {};
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
                        <span class="arrow"></span><span class="bullet">&#8226;</span>
                    </span>
                    <span contenteditable></span>
                </span>
                <div></div>
            </span>`);
            }
            span.children[0].children[1].innerText = polymorph_core.items[id][this.settings.titleProperty] || " ";
            if (polymorph_core.items[id].collapsed) {
                span.children[1].style.display = "none";
                span.children[0].children[0].children[0].innerHTML = "&#x25B6;";
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
            } else if (this.settings.rootItems.indexOf(id) != -1) {
                nxtid = this.settings.rootItems[this.settings.rootItems.indexOf(id) + 1];
                parent = this.rootdiv;
            } else {
                // parent doesnt exist yet maybe
                // do nothing
                return;
            }
            if (nxtid && this.rootdiv.querySelector(`span[data-id="${nxtid}"]`)) {
                if (this.rootdiv.querySelector(`span[data-id="${nxtid}"]`) && this.rootdiv.querySelector(`span[data-id="${nxtid}"]`).parentElement == parent) {
                    parent.insertBefore(span, this.rootdiv.querySelector(`span[data-id="${nxtid}"]`))
                } else {
                    this.regenerateToOrder();
                    this.renderItem(id, true);
                }
            } else {
                parent.insertBefore(span, this.rootdiv.querySelector(`span[data-id="${nxtid}"]`));
            }
            this.rootdiv.querySelector(".cursorspan").style.display = "none";
            if (!polymorph_core.items[id].collapsed) {
                for (let i in polymorph_core.items[id].to) {
                    this.renderItem(i, true);
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
        if (polymorph_core.items[d.id][this.settings.filter] && !this.itemRelevant(d.id)) {
            this._existingItemsCache.push(d.id);
        }
        if ((polymorph_core.items[d.id][this.settings.filter] || this.itemRelevant(d.id))) this.renderItem(id);
        //do stuff with the item.
    });

    container.on("createItem", (d) => {
        if (d.sender == this) return;
        let id = d.id;
        this.createItem(id);
        this.renderItem(id);
    });

    this.refresh = function() {
        // This is called when the parent container is resized.
        // needs to be here so that when item is instantialised, items will render.
        if (this.container.visible()) {
            this.settings.rootItems.forEach((i) => {
                if (polymorph_core.items[i]) this.renderItem(i, true); // lie that the rendering is recursive, because the anti-collision system wont hurt
            });
        }
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
                        this.settings.rootItems.push(i);
                        this.renderItem(i);
                    }
                }
            },
            label: "Import now"
        })
    }
    this.showDialog = function() {
        for (let i in options) {
            options[i].load();
        }
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function() {
        // This is called when your dialog is closed. Use it to update your container!
    }

});