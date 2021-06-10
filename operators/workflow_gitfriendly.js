// todo: on enter or defocus, create new item
// tab to indent
polymorph_core.registerOperator("workflow_gf", {
    displayName: "Git-friendly workflowish",
    description: "Nested, plaintext lists. Workflowy emulation. Happily works with the gitlite system.",
    section: "Standard"
}, function(container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        titleProperty: "title",
        filter: polymorph_core.guid(),
        propsAsDate: "",
        parentProperty: "from_" + container.id,
        orderProperty: "order_" + container.id,
        bracketPropertyPrefix: container.id
    };
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
    let cachedChildren = {}; // dict of id of children id
    let setExpandedState = (spanWithID, toExpanded) => {
        if (toExpanded == undefined) { // toggle
            if (spanWithID.children[1].style.display == "none") toExpanded = true;
            else toExpanded = false;
        }
        if (!cachedChildren[spanWithID.dataset.id] || !Object.keys(cachedChildren[spanWithID.dataset.id]).length) return;
        polymorph_core.items[spanWithID.dataset.id].collapsed = !toExpanded;
        this.renderItem(spanWithID.dataset.id);
        //set all immediate child spans to display: block, to account for expanding an item during search
        Array.from(spanWithID.children[1].children).map(i => i.style.display = "block");
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
    this.itemRelevant = (id) => { return polymorph_core.items[id] && polymorph_core.items[id][this.settings.filter] }

    this.createItem = (id) => {
        //account for adoptions from fire('createitem')
        if (!id) id = polymorph_core.insertItem({});
        itm = polymorph_core.items[id];
        if (!itm) itm = polymorph_core.items[id] = {};
        itm[this.settings.filter] = true;
        itm[this.settings.titleProperty] = itm[this.settings.titleProperty] || ""; // in case title already exists from another operator
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

    //removes all parents of the item with id 'id'.
    let setParent = (id, newParent) => {
        if (cachedChildren[polymorph_core.items[id][this.settings.parentProperty]] && cachedChildren[polymorph_core.items[id][this.settings.parentProperty]][id]) {
            delete cachedChildren[polymorph_core.items[id][this.settings.parentProperty]][id];
            bumpParentReorganise(polymorph_core.items[id][this.settings.parentProperty]);
        }
        polymorph_core.items[id][this.settings.parentProperty] = newParent;
    }

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
                    // delete the item
                    this.deleteItem(id);

                    // save the text in case of an alt-backspace
                    let remainingText = spanWithID.children[0].children[1].innerText;
                    //Find the previous item's parent so we can do the alt-backspace
                    let preParent = spanWithID.previousElementSibling;
                    if (!(preParent && preParent.dataset.id)) preParent = spanWithID.parentElement.parentElement;

                    //Focus on the next item
                    if (focusOnPrev(spanWithID.children[0].children[1]) == false) focusOnNext(spanWithID.children[0].children[1]);
                    if (spanWithID.parentElement.children.length == 1) {
                        // remove the arrow
                        spanWithID.parentElement.parentElement.children[0].children[0].children[0].innerHTML = "&#8226;";
                    }
                    if (!spanWithID.parentElement.parentElement.dataset.id && spanWithID.parentElement.children.length == 2) {
                        // if this is a root item and it is about to be deleted, show the cursor span
                        this.rootdiv.querySelector(".cursorspan").style.display = "block";
                    }

                    //remove the span and delete it
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
                        polymorph_core.items[newID][this.settings.titleProperty] = partB;
                    }
                } //else just make a new item
                if (modifiers["shift"]) {
                    // Make the item a child of the current item
                    setParent(newID, id);
                    polymorph_core.items[newID][this.settings.orderProperty] = -1;
                } else {
                    // check if the item should go before or after the current item based on where the cursor is
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

                    // place the item near the current item
                    setParent(newID, polymorph_core.items[id][this.settings.parentProperty]);
                    if (shouldBefore) {
                        polymorph_core.items[newID][this.settings.orderProperty] = polymorph_core.items[id][this.settings.orderProperty] - 0.5;
                    } else {
                        polymorph_core.items[newID][this.settings.orderProperty] = polymorph_core.items[id][this.settings.orderProperty] + 0.5;
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
                    if (spanWithID.previousElementSibling) {
                        polymorph_core.items[id][this.settings.orderProperty] = polymorph_core.items[spanWithID.previousElementSibling.dataset.id][this.settings.orderProperty] - 0.5;
                        polymorph_core.fire("updateItem", { id: id, sender: this }); // kick update on item so that 'to' changes
                        this.renderItem(id);
                        spanWithID.children[0].children[1].focus();
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
                    if (spanWithID.nextElementSibling) {
                        polymorph_core.items[id][this.settings.orderProperty] = polymorph_core.items[spanWithID.nextElementSibling.dataset.id][this.settings.orderProperty] + 0.5;
                        polymorph_core.fire("updateItem", { id: id, sender: this }); // kick update on item so that 'to' changes
                        this.renderItem(id);
                        spanWithID.children[0].children[1].focus();
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

                        // if there's no item before it then we can't make it a child of the previous item 
                        if (!(spanWithID.previousElementSibling && spanWithID.previousElementSibling.dataset.id)) return;

                        //reassign the parent item
                        setParent(id, spanWithID.previousElementSibling.dataset.id);
                        //Also set the order to a *safe* last
                        polymorph_core.items[id][this.settings.orderProperty] = 10000;

                        //redraw
                        polymorph_core.fire("updateItem", { id: id, sender: this }); // force rerender in other operators
                        this.renderItem(id);

                        //expand the parentElement
                        let toExpand = spanWithID.parentElement.parentElement;
                        while (toExpand.dataset.id) {
                            polymorph_core.items[toExpand.dataset.id].collapsed = false;
                            this.renderItem(toExpand.dataset.id);
                            toExpand = toExpand.parentElement.parentElement;
                        }
                        spanWithID.children[0].children[1].focus();
                    } else {
                        // shift tab: remove the child from the parent
                        let wasme = spanWithID.children[0].children[1];
                        //   this      div/innerroot span(prnt/base)
                        if (spanWithID.parentElement.parentElement.dataset.id) {
                            setParent(id, polymorph_core.items[spanWithID.parentElement.parentElement.dataset.id][this.settings.parentProperty]);
                            polymorph_core.fire("updateItem", { id: id, sender: this }); // force rerender in other operators
                            this.renderItem(id);
                            wasme.focus();
                        } else {
                            // already a root node, do nothing
                        }
                    }
                }
        }
    }

    this.rootdiv.addEventListener("keydown", (e) => {
        if (e.target.matches(`span[data-id] span`)) {
            // special keys handler (delegated at span id span level)
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
            //completely unrelated handler for same event for the cursorspan when empty doc

            //create a new span right above it, and copy over the text, and create a new item
            let newID = this.createItem();
            polymorph_core.items[newID][this.settings.titleProperty] = e.target.innerText;
            setParent(newID, "");
            polymorph_core.items[newID][this.settings.orderProperty] = 0;

            e.target.innerHTML = "&nbsp;"; // hide the cursorspan (???)
            container.fire("createItem", { id: newID, sender: this });

            e.preventDefault();
            this.renderItem(newID);
            focusOnElement(this.rootdiv.querySelector(`span[data-id='${newID}']`).children[0].children[1]);
        }
    })

    // Bottom control panel for phone
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
    });

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
        let ccid = cachedChildren[polymorph_core.items[id][this.settings.parentProperty]];
        if (ccid && ccid[id]) delete ccid[id];
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

    let parentReorganiseTimeout = -1;
    let parentsToReorganise = {};
    let bumpParentReorganise = (parentID) => {
        parentsToReorganise[parentID] = true;
        clearTimeout(parentReorganiseTimeout);
        parentReorganiseTimeout = setTimeout(() => {
            let copyOfParentsToReorganise = Object.keys(parentsToReorganise);
            parentsToReorganise = {};
            copyOfParentsToReorganise.forEach(i => {
                // look through my immediate children and assign them numbers
                Array.from(renderedItemCache[i].el.children[1].children).filter((i) => !(i.classList.contains("cursorspan"))).forEach((v, i) => {
                    polymorph_core.items[v.dataset.id][this.settings.orderProperty] = i;
                    polymorph_core.fire("updateItem", { id: v.dataset.id, sender: this });
                })

                if (i) this.renderItem(i); // don't render the root which is nothing
            }); // verry lazy, should check whether or not the parent actually needs rerendering first
        });
    }

    var oldFocus;
    let renderedItemCache = {
        "": {
            el: {
                children: [0, this.innerRoot] // little hack so that unparented items automatically get added to root
            }
            // other items would also have a 'renderedText' property
        }
    }; // for deletions
    this.renderItem = (id) => {
        oldFocus = saveFocus();
        if (!this.itemRelevant(id)) {
            if (renderedItemCache[id]) {
                renderedItemCache[id].el.remove();
                delete renderedItemCache[id];
            }
        } else {
            //check if the item's parent exists and is expanded
            let parentID = polymorph_core.items[id][this.settings.parentProperty] || "";
            let myOrder = polymorph_core.items[id][this.settings.orderProperty] || 0;
            if (!cachedChildren[parentID]) cachedChildren[parentID] = {};
            cachedChildren[parentID][id] = myOrder;
            bumpParentReorganise(parentID);

            //let my parent know it has children either when it renders or if it has already rendered, now.

            if (!parentID || (renderedItemCache[parentID] && !polymorph_core.items[parentID].collapsed)) {
                // only render if parent visible and not collapsed, or this is a root item
                if (!renderedItemCache[id]) {
                    renderedItemCache[id] = {
                        el: htmlwrap(`
                        <span data-id="${id}">
                            <span class="toprow">
                                <span class="utils">
                                    <span class="arrow"></span>
                                </span>
                                <span contenteditable></span>
                            </span>
                            <div class="inset-container"></div>
                        </span>`)
                    }
                }
                let thisIDSpan = renderedItemCache[id].el;
                //cache and update the text
                let notNullItemTitle = (polymorph_core.items[id][this.settings.titleProperty] || " ");
                if (renderedItemCache[id].renderedText != notNullItemTitle) {
                    renderedItemCache[id].renderedText = notNullItemTitle;
                    thisIDSpan.children[0].children[1].innerHTML = polymorph_core.RTRenderProperty(notNullItemTitle);
                }

                // attach to my parent, given it exists
                // figure out where to place it among the children
                let placeBefore = -1;
                // just in case, remove the span from its current parent
                thisIDSpan.remove();
                let existingSiblings = Array.from(renderedItemCache[parentID].el.children[1].children).filter((i) => !(i.classList.contains("cursorspan"))).map(i => [i, polymorph_core.items[i.dataset.id][this.settings.orderProperty]]);
                existingSiblings.forEach((v) => {
                    if (polymorph_core.items[id][this.settings.orderProperty] >= v[1]) {
                        placeBefore = v[0];
                    }
                })
                if (placeBefore != -1) placeBefore = placeBefore.nextElementSibling;
                else placeBefore = renderedItemCache[parentID].el.children[1].children[0];
                renderedItemCache[parentID].el.children[1].insertBefore(thisIDSpan, placeBefore);
                if (cachedChildren[id] && Object.keys(cachedChildren[id]).length) {
                    // I have children yay
                    if (polymorph_core.items[id].collapsed) {
                        thisIDSpan.children[1].style.display = "none";
                        thisIDSpan.children[0].children[0].children[0].innerHTML = "&#x25B6;";
                    } else {
                        thisIDSpan.children[1].style.display = "block";
                        thisIDSpan.children[0].children[0].children[0].innerHTML = "&#x25BC;";
                    }
                    // might be wise to rerender them if they dont exist yet
                    // for everything in cachedChildren[id], if it is still relevant but not one of my children, then render it.
                    let renderedChildren = Array.from(renderedItemCache[i].el.children[1].children).filter((i) => !(i.classList.contains("cursorspan"))).map(i => i.dataset.id).reduce((p, i) => { p[i] = true; return p }, {});
                    for (let i in cachedChildren[id]) {
                        if (!renderedChildren[i] && this.itemRelevant(i)) {
                            this.renderItem(i);
                        }
                    }
                } else {
                    // maybe their child got removed
                    thisIDSpan.children[0].children[0].children[0].innerHTML = "&#x25CF;";
                }
                this.rootdiv.querySelector(".cursorspan").style.display = "none"; // something got rendered, hide the cursorspan
            } else {

                // check that maybe my current parent is not my actual parent? ... todo
            }
        }
        restoreFocus(oldFocus);
    }
    container.on("updateItem", (d) => {
        if (d.sender == this) return; // Dont handle our own updates so that the user does not lose focus.
        let id = d.id;
        this.renderItem(id);
    });

    container.on("createItem", (d) => {
        if (d.sender == this) return;
        let id = d.id;
        this.createItem(id, true);
        this.renderItem(id);
    });

    //first time load: render everything
    for (let i in polymorph_core.items) {
        this.renderItem(i);
    }
    this.refresh = function() {
        // This is called when the parent container is resized.
        // needs to be here so that when item is instantialised, items will render.
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
        parentProperty: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "parentProperty",
            label: "Property that defines the parent of the item"
        }),
        orderProperty: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "parentProperty",
            label: "Property that defines the order of the item"
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
        delete polymorph_core.items[id][this.settings.filter];
        if (focusOnPrev(spanWithID.children[0].children[1]) == false) focusOnNext(spanWithID.children[0].children[1]);
        if (!spanWithID.parentElement.parentElement.dataset.id && spanWithID.parentElement.children.length == 2) {
            // if this is a root item and it is about to be deleted so that the root would only have the cursorspan, show the cursorspan
            this.rootdiv.querySelector(".cursorspan").style.display = "block";
        }
        this.renderItem(id); // remove the span
        container.fire("updateItem", { id: id, sender: this });
        container.fire("deleteItem", { id: id, sender: this });
    }

    // this.contextMenuActions["sortbydate"] = (root, property, recursive = false) => {
    //     // clarify the toOrder first
    //     if (root.target) root = undefined;
    //     // for now, just assume property is a date
    //     if (!property) {
    //         property = this.settings.propAsDate.split(",")[0]
    //     }
    //     if (!property) {
    //         return;
    //     }

    //     let itemMapper = (a) => {
    //         let result;
    //         if (polymorph_core.items[a][property] && polymorph_core.items[a][property].date && polymorph_core.items[a][property].date.length) {
    //             result = dateParser.getSortingTimes(polymorph_core.items[a][property].datestring, new Date(polymorph_core.items[a][property].date[0].refdate))
    //             if (result) result = result[0];
    //             if (result) result = result.date;
    //         }
    //         if (!result) result = Date.now() * 10000;
    //         return [a, result];
    //     }
    //     property = `_${this.settings.bracketPropertyPrefix}_${property}`;
    //     if (root && root.dataset.id) {
    //         let objs = polymorph_core.items[root.dataset.id].toOrder.map(itemMapper);
    //         objs.sort((a, b) => a[1] - b[1]);
    //         polymorph_core.items[root.dataset.id].toOrder = objs.map(i => i[0]);
    //         polymorph_core.fire("updateItem", { id: root.dataset.id, sender: this });
    //     } else if (!root) {
    //         let objs = this.rootItems.map(itemMapper);
    //         objs.sort((a, b) => a[1] - b[1]);
    //         this.rootItems = objs.map(i => i[0]);
    //         polymorph_core.fire("updateItem", { id: this.rootItemId, sender: this });
    //     }
    //     if (!root) root = this.innerRoot;
    //     else if (root.matches(".cursorspan")) return;
    //     else root = root.children[1];
    //     Array.from(root.children).filter(i => i.tagName == "SPAN").forEach(i => this.contextMenuActions["sortbydate"](i, property, true));
    //     if (!recursive) {
    //         if (root != this.innerRoot) {
    //             this.renderItem(root.dataset.id);
    //         } else {
    //             let rcopy = this.rootItems.map(i => i).reverse();
    //             let prevSpan = this.innerRoot.querySelector(`span[data-id="${rcopy[0]}"]`);
    //             for (let i of rcopy) {
    //                 let nextSpan = this.innerRoot.querySelector(`span[data-id="${i}"]`);
    //                 this.innerRoot.insertBefore(nextSpan, prevSpan);
    //                 prevSpan = nextSpan;
    //             }
    //         }
    //     }
    // }

});