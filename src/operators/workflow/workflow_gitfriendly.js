// todo: on enter or defocus, create new item
// tab to indent
polymorph_core.registerOperator("workflow_gf", {
    displayName: "Workflowish",
    description: "Nested, plaintext lists. Workflowy emulation.",
    imageurl: "assets/operators/wkflow.PNG",
    section: "Standard"
}, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        titleProperty: "title",
        filter: polymorph_core.guid(),
        propAsDate: "",
        parentProperty: "from_" + container.id,
        orderProperty: "order_" + container.id,
        bracketPropertyPrefix: container.id,
        isEditable: true,
        autoSortDate: false,
        autoSortAlpha: false,
        focusExclusionMode: false,
        focusExclusionID: "",
        collapseProperty: "collapsed",
        advancedInputMode: false,
        filterHides: false,
        sortBackwards: false,
        unsortableBeforeSorted: false
    };
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);
    _workflow_focusMode_extend.apply(this);
    let itemsShouldBeEditable = this.settings.isEditable;

    //Add content-independent HTML here.
    this.rootdiv.innerHTML = `
    <style>
    span[data-id]{
        display:block;
        width:100%;
    }
    
    .toprow>:nth-child(2){
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

    .searchFocused{
        background: rgba(0,0,255,0.5);
    }

    </style>
    <label style="display: flex;"><span>Search</span><input style="flex: 1 0 auto" class="searcher"></label>
    <span class="innerRoot" style="flex: 0 1 100%; min-height:0; overflow:auto">${/* otherwise we get overflow issues*/ ""}
        <span class="cursorspan">
            <span class="toprow">
                <span class="utils">
                    <span class="arrow">*</span><span class="bullet">&#8226;</span>
                </span>
                <span ${itemsShouldBeEditable ? "contenteditable" : ""}>&nbsp;</span>
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
    this.cursorSpan = this.rootdiv.querySelector(".cursorspan");

    this.getChildrenDiv = (spanWithID) => {
        if (!spanWithID.tagName) {
            // This isn't actually a dom element, it's the root in renderitemcache
            // called in l. 901 on initial refresh
            return spanWithID.children[1];
        }
        let toExpand = spanWithID.children[1];
        if (toExpand.tagName != "DIV") toExpand = toExpand.nextElementSibling;
        return toExpand;
    }

    this.holdExpanded = {};

    // cache of item children, set by child when child is renderItem'd
    let cachedChildren = {}; // key: id of children id

    let setExpandedState = (spanWithID, toExpanded, dontFocus, temporary) => {
        let childrenDiv = this.getChildrenDiv(spanWithID);
        if (toExpanded == undefined) { // toggle
            if (childrenDiv.style.display == "none") toExpanded = true;
            else toExpanded = false;
        }
        if (!cachedChildren[spanWithID.dataset.id] || !Object.keys(cachedChildren[spanWithID.dataset.id]).length) return;
        if (!temporary) {
            delete this.holdExpanded[spanWithID.dataset.id];
            polymorph_core.items[spanWithID.dataset.id][this.settings.collapseProperty] = !toExpanded;
        }
        this.renderItem(spanWithID.dataset.id, (temporary ? "p" : "") + (dontFocus ? "d" : "") + ((temporary && toExpanded) ? "e" : ""));
        //set all immediate child spans to display: block, to account for expanding an item during search
        if (!temporary) Array.from(childrenDiv.children).map(i => {
            i.style.display = "block";
        });
    }
    this.setExpandedState = setExpandedState;

    let restoreClickFlag = false;
    this.rootdiv.addEventListener("click", (e) => {
        if (restoreClickFlag) return;
        if (e.target.classList.contains("arrow")) {
            //expand or contract
            setExpandedState(e.target.parentElement.parentElement.parentElement);
            container.fire("updateItem", { id: e.target.parentElement.parentElement.parentElement.dataset.id, sender: this });
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
            range.setStart(newP, index);
            sel.removeAllRanges();
            sel.addRange(range);
            if (this.innerRoot.querySelector(".tmpFocused")) this.innerRoot.querySelector(".tmpFocused").classList.remove("tmpFocused");
            el.classList.add("tmpFocused");
            el.focus();
            el.click(); // for phones
            restoreClickFlag = false;
            this.setShowPlaintext(el);
            el.scrollIntoViewIfNeeded();
        });
    }

    let focusOnPrev = (etarget) => {
        let toFocusOnSpan = etarget.parentElement.parentElement.previousElementSibling;
        if (!toFocusOnSpan) {
            toFocusOnSpan = etarget.parentElement.parentElement.parentElement.parentElement;
        } else {
            if (toFocusOnSpan.tagName == "STYLE" || toFocusOnSpan.matches(".cursorspan")) return false;
            let childrenDiv = this.getChildrenDiv(toFocusOnSpan);
            while (childrenDiv.children.length && childrenDiv.style.display != "none") {
                toFocusOnSpan = childrenDiv.children[childrenDiv.children.length - 1];
                childrenDiv = this.getChildrenDiv(toFocusOnSpan);
            }
        }
        focusOnElement(toFocusOnSpan.children[0].children[1], -1);
    }

    let focusOnNext = (contentEditableSpan) => {
        let toprow = contentEditableSpan.parentElement;
        // default to literally the next element 
        let toFocusOnSpan = toprow.parentElement.nextElementSibling;

        // check if we have a child to focus on
        let childrenList = this.getChildrenDiv(toprow.parentElement);
        // in advanced entry mode the div is actually a span
        if (childrenList.children.length && // div has children
            childrenList.style.display != "none") { // check if children not hidden
            toFocusOnSpan = childrenList.children[0];
        }

        // we may be at the end of our parent's list of children; so upgrade to parent
        if (!toFocusOnSpan) {
            //                     span   pspan           div?
            let tmpParentSpan = contentEditableSpan.parentElement.parentElement;
            while (tmpParentSpan && tmpParentSpan.parentElement.parentElement.parentElement && !tmpParentSpan.parentElement.parentElement.nextElementSibling) {
                tmpParentSpan = tmpParentSpan.parentElement.parentElement;
                if (!tmpParentSpan.parentElement.parentElement.parentElement) return false;
            }
            if (tmpParentSpan && tmpParentSpan.parentElement.parentElement.parentElement) toFocusOnSpan = tmpParentSpan.parentElement.parentElement.nextElementSibling;
        }
        if (!toFocusOnSpan) return;
        focusOnElement(toFocusOnSpan.children[0].children[1]);
    }

    this.focusOnPrev = focusOnPrev;
    this.focusOnNext = focusOnNext;

    //removes all parents of the item with id 'id'.
    let setParent = (id, newParent) => {
        if (cachedChildren[polymorph_core.items[id][this.settings.parentProperty]] && cachedChildren[polymorph_core.items[id][this.settings.parentProperty]][id]) {
            delete cachedChildren[polymorph_core.items[id][this.settings.parentProperty]][id];
            bumpParentReorganise(polymorph_core.items[id][this.settings.parentProperty]);
        }
        polymorph_core.items[id][this.settings.parentProperty] = newParent;
    }

    // Deal with slash properties
    let lastPhoneBeforeInput = null;
    this.rootdiv.addEventListener("beforeinput", (e) => {
        lastPhoneBeforeInput = e.data;
    })
    this.rootdiv.addEventListener("keydown", (e) => {
        if (e.target.matches(`span[data-id] span`)) {
            let id = this.resolveSpan(e.target).id;
            let lastKeyWasBackslash = e.key == '\\';
            if (e.key == 'Unidentified' && lastPhoneBeforeInput == "\\") {
                lastKeyWasBackslash = true;
            }
            if (lastKeyWasBackslash) {
                // add curly brackets to the position
                let selection = e.target.getRootNode().getSelection().getRangeAt(0);
                console.log(selection);
                result = selection.commonAncestorContainer.textContent.split("");
                result.splice(selection.startOffset, 0, "\\", "{", "}");
                result = result.join("");
                let oldStart = selection.startOffset;
                selection.commonAncestorContainer.textContent = result;
                // edge case where we start with a \ which causes commonancestor to actually be toprow
                if (selection.commonAncestorContainer.tagName == "SPAN") {
                    focusOnElement(selection.commonAncestorContainer, oldStart + 2);
                } else {
                    focusOnElement(selection.commonAncestorContainer.parentElement, oldStart + 2);
                }
                e.preventDefault();
            }
        }
    })

    let getPropertiesFromString = (str) => {
        let re = /\\\{(.+?)\}/g;
        let result = 0;
        let results = {};
        let ltrsults = {};
        while (result = re.exec(str)) {
            let parts = result[1].split(":");
            let ltrkey = parts.shift();
            key = `_${this.settings.bracketPropertyPrefix}_${ltrkey}`; // Transform the key to something we care about, otherwise you'll get a spamload of properties like d da dat data for \{dataset}
            results[key] = parts.join(":");
            ltrsults[ltrkey] = parts.join(":");
        }
        return [results, ltrsults];
    }

    this.parse = (el, idFromAdvancedEntry) => {
        // extract the ID from the element
        let id = idFromAdvancedEntry;
        if (!id) {
            let elWithID = el;
            while (elWithID && !elWithID.dataset.id) {
                elWithID = elWithID.parentElement;
            }
            if (!elWithID) return;
            id = elWithID.dataset.id;
        }

        // prevent loss of focus in wysiwyg mode
        if (!idFromAdvancedEntry) {
            this.renderedItemCache[id].renderedText = el.innerText;
        }

        // parse _props
        let text = el.innerText;
        let keyset = getPropertiesFromString(text);
        for (ltrkey in keyset[1]) {
            if (keyset[1][ltrkey]) {
                if (this.settings.propAsDate.split(",").includes(ltrkey)) {
                    let oldDateString = "";
                    let key = `_${this.settings.bracketPropertyPrefix}_${ltrkey}`; // Transform the key to something we care about, otherwise you'll get a spamload of properties like d da dat data for \{dataset}
                    try {
                        oldDateString = polymorph_core.items[id][key].datestring;
                    } catch (e) { }
                    if (oldDateString == keyset[1][ltrkey]) continue;
                    polymorph_core.items[id][key] = {
                        datestring: keyset[1][ltrkey]
                    }
                    polymorph_core.items[id][key] = dateParser.stringToEvent(polymorph_core.items[id][key].datestring);
                    container.fire("dateUpdate", { sender: this });
                } else {
                    polymorph_core.items[id][key] = keyset[1][ltrkey];
                }
            } else {
                if (!polymorph_core.items[id][key]) polymorph_core.items[id][key] = true;
            }
        }

        // delete _props that no longer exist
        for (let p in polymorph_core.items[id]) {
            if (p.startsWith(`_${this.settings.bracketPropertyPrefix}_`)) {
                if (!(p in keyset[0])) {
                    delete polymorph_core.items[id][p];
                    if (this.settings.propAsDate.split(",").map(ltrkey => `_${this.settings.bracketPropertyPrefix}_${ltrkey}`).includes(p)) {
                        container.fire("dateUpdate", { sender: this });
                    }
                }
            }
        }
    }
    let modifiers = {
        shift: false,
        ctrl: false, // also command on mac, eventually
        alt: false
    };
    let disableSortOnShuffle = false;
    let handleKeyEvent = (key, id) => {
        let spanWithID = this.renderedItemCache[id].el;
        disableSortOnShuffle = false;
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
                        this.cursorSpan.style.display = "block";
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

                // Remember which element is longer in focus mode
                let focusIsNewItemLonger = false;

                if (modifiers["alt"]) {
                    let partA, partB;
                    if (this.settings.advancedInputMode) {
                        let range = this.rootdiv.getRootNode().getSelection().getRangeAt(0);
                        partB = this.plaintextContenteditableRender.children[1].innerText.slice(range.startOffset);
                        partA = this.plaintextContenteditableRender.children[1].innerText.slice(0, range.startOffset);
                    } else {
                        let range = this.rootdiv.getRootNode().getSelection().getRangeAt(0);
                        partB = spanWithID.children[0].children[1].innerText.slice(range.startOffset);
                        partA = spanWithID.children[0].children[1].innerText.slice(0, range.startOffset);
                    }
                    if (partB.length > partA.length) {
                        focusIsNewItemLonger = true;
                    }
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
                    if (modifiers["alt"]) {
                        // likely an alt-enter
                        // Always put part B before part A since part B comes afterwards
                        // but choose which one to focus on later (the longer one)
                        shouldBefore = false;
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
                    bumpWasTriggeredByUserEvent = true;
                }
                container.fire("createItem", { id: newID, sender: this });
                container.fire("updateItem", { id: newID, sender: this });
                this.renderItem(newID, "d");

                let elementToFocusOn = newID;
                if (modifiers["alt"]) {
                    // focus on element with more text so that splitting can continue
                    if (!focusIsNewItemLonger) elementToFocusOn = id;
                }
                focusOnElement(this.rootdiv.querySelector(`span[data-id='${elementToFocusOn}']`).children[0].children[1]);
                break;
            case "ArrowUp":
                bumpWasTriggeredByUserEvent = true;
                if (modifiers["alt"]) {
                    //move item up
                    if (spanWithID.previousElementSibling) {
                        disableSortOnShuffle = true;
                        polymorph_core.items[id][this.settings.orderProperty] = polymorph_core.items[spanWithID.previousElementSibling.dataset.id][this.settings.orderProperty] - 0.5;
                        container.fire("updateItem", { id: id, sender: this }); // kick update on item so that 'to' changes
                        this.renderItem(id);
                        spanWithID.children[0].children[1].focus();
                    }
                } else if (modifiers["ctrl"]) {
                    setExpandedState(spanWithID, false);
                    container.fire("updateItem", { id: spanWithID.dataset.id, sender: this });
                } else {
                    focusOnPrev(spanWithID.children[0].children[1]);
                }
                bumpParentReorganise(polymorph_core.items[id][this.settings.parentProperty]);
                break;
            case "ArrowDown":
                bumpWasTriggeredByUserEvent = true;
                if (modifiers["alt"]) {
                    if (spanWithID.nextElementSibling) {
                        disableSortOnShuffle = true;
                        polymorph_core.items[id][this.settings.orderProperty] = polymorph_core.items[spanWithID.nextElementSibling.dataset.id][this.settings.orderProperty] + 0.5;
                        container.fire("updateItem", { id: id, sender: this }); // kick update on item so that 'to' changes // must update here, so that other instances are aware we've changed the index
                        this.renderItem(id);
                        spanWithID.children[0].children[1].focus();
                    }
                } else if (modifiers["ctrl"]) {
                    setExpandedState(spanWithID, true);
                    container.fire("updateItem", { id: spanWithID.dataset.id, sender: this });
                } else {
                    focusOnNext(spanWithID.children[0].children[1]);
                }
                bumpParentReorganise(polymorph_core.items[id][this.settings.parentProperty]);
                break;
            case "Tab":
                let cursorPos = spanWithID.children[0].children[1].getRootNode().getSelection().getRangeAt(0).startOffset;
                if (cursorPos == 0 || isPhone()) {
                    if (!modifiers["shift"]) {
                        // Indent the item to the above item

                        // if there's no item before it then we can't make it a child of the previous item 
                        if (!(spanWithID.previousElementSibling && spanWithID.previousElementSibling.dataset.id)) return;

                        //reassign the parent item
                        setParent(id, spanWithID.previousElementSibling.dataset.id);
                        //Also set the order to a *safe* last
                        polymorph_core.items[id][this.settings.orderProperty] = 10000;

                        //redraw
                        //uncollapse the parent
                        if (polymorph_core.items[spanWithID.previousElementSibling.dataset.id][this.settings.collapseProperty]) {
                            polymorph_core.items[spanWithID.previousElementSibling.dataset.id][this.settings.collapseProperty] = false;
                            container.fire("updateItem", { id: spanWithID.previousElementSibling.dataset.id, sender: this }); // force rerender in other operators
                            this.renderItem(spanWithID.previousElementSibling.dataset.id);
                        }

                        container.fire("updateItem", { id: id, sender: this }); // force rerender in other operators
                        this.renderItem(id);

                        //expand the parentElement
                        let toExpand = spanWithID.parentElement.parentElement;
                        while (toExpand.dataset.id) {
                            polymorph_core.items[toExpand.dataset.id][this.settings.collapseProperty] = false;
                            this.renderItem(toExpand.dataset.id, "pd");
                            toExpand = toExpand.parentElement.parentElement;
                        }
                        focusOnElement(spanWithID.children[0].children[1]);
                    } else {
                        // shift tab: remove the child from the parent
                        let wasme = spanWithID.children[0].children[1];
                        //   this      div/innerroot span(prnt/base)
                        if (spanWithID.parentElement.parentElement.dataset.id) {
                            // Also change the index
                            polymorph_core.items[id][this.settings.orderProperty] = polymorph_core.items[spanWithID.parentElement.parentElement.dataset.id][this.settings.orderProperty] + 0.5;
                            setParent(id, polymorph_core.items[spanWithID.parentElement.parentElement.dataset.id][this.settings.parentProperty]);
                            container.fire("updateItem", { id: id, sender: this }); // force rerender in other operators
                            this.renderItem(id, "d");
                            focusOnElement(wasme);
                        } else {
                            // already a root node, do nothing
                        }
                    }
                }
        }
    }

    // Creating items and handling special keys
    this.rootdiv.addEventListener("keydown", (e) => {
        if (e.target.matches(`span[data-id] span`)) {
            // special keys handler (delegated at span id span level)
            let id = e.target.parentElement.parentElement.dataset.id;
            modifiers["ctrl"] = e.ctrlKey;
            modifiers["alt"] = e.altKey;
            modifiers["shift"] = e.shiftKey;
            modifierButtons.forEach(i => { modifiers[i.dataset.corrkey] |= i.classList.contains("pressed") | i.classList.contains("heavyPressed") });
            modifierButtons.forEach(i => { if (i.classList.contains("pressed")) i.classList.remove("pressed") });

            // Implicit enters from phone
            let keyPressed = e.key;
            if (!phonePrevText.includes("\n") && e.target.innerText.includes("\n") && e.key == 'Unidentified') {
                keyPressed = "Enter";
            }
            handleKeyEvent(keyPressed, id);

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


    let phonePrevText = "";
    this.rootdiv.addEventListener("click", (e) => {
        if (restoreClickFlag) return;
        if (e.target.matches(`span[data-id] span.toprow span`)) {
            let id = this.resolveSpan(e.target).id;
            if (!id) return; // clicking arrow should do nothing
            if (this.innerRoot.querySelector(".tmpFocused")) this.innerRoot.querySelector(".tmpFocused").classList.remove("tmpFocused");
            this.renderedItemCache[id].el.classList.add("tmpFocused");
            this.setShowPlaintext(e.target, e);
            // focus cursor there
            lastFocusedID = id;
            restoreClickFlag = true;
            container.fire("focusItem", { id: id, sender: this });
            restoreClickFlag = false;
            phonePrevText = e.target.innerText;
        }
    });


    // Changing items
    this.rootdiv.addEventListener("input", (e) => {
        if (e.target.matches(`span[data-id] span`)) {
            let id = e.target.parentElement.parentElement.dataset.id;
            polymorph_core.items[id][this.settings.titleProperty] = e.target.innerText; // polymorph_core.RTParseElement(e.target, id, this.settings.titleProperty);
            //parse stuff
            this.parse(e.target);
            container.fire("updateItem", { id: id, sender: this });
        }
    });

    this.rootdiv.addEventListener("paste", (e) => {
        if (e.target.matches(`span[data-id] span`)) {
            // cancel paste
            e.preventDefault();

            // get text representation of clipboard
            var text = (e.originalEvent || e).clipboardData.getData('text/plain');

            // insert text manually
            document.execCommand("insertHTML", false, text);
        }
    });

    container.on("deleteItem", (d) => {
        delete polymorph_core.items[d.id][this.settings.filter];
        if (this.innerRoot.querySelector(`[data-id="${d.id}"]`)) this.innerRoot.querySelector(`[data-id="${d.id}"]`).remove();
    })

    container.on("focusItem", (d) => {
        if (restoreClickFlag) return;

        // ignore own sender because we focus when we type text and it resets the cursor on restorefocus, tripping up the editing
        if (d.sender == this) return;
        if (!this.itemRelevant(d.id)) return;
        let el;
        let p = d.id;
        // If we're focusing on something we care about, we expand down to its parent.
        // Find the parents
        if (!this.renderedItemCache[p] || !this.renderedItemCache[p].el) {
            // render the parent
            let parentTrain = [];
            while (p) {
                parentTrain.unshift(p);
                p = polymorph_core.items[p][this.settings.parentProperty];
            }
            parentTrain.forEach(i => polymorph_core.items[i][this.settings.collapseProperty] = false);
            parentTrain.forEach(i => this.renderItem(i));
        }

        el = this.renderedItemCache[d.id].el;
        if (el) {
            let p = el.parentElement.parentElement;
            while (p.dataset.id) {
                setExpandedState(p, true);
                container.fire("updateItem", { id: p.dataset.id, sender: this });
                p = p.parentElement.parentElement;
            }
            // Done in focusOnElement
            //if (container.visible()) el.scrollIntoViewIfNeeded();

            // When clicking on an item elsewhere e.g. on a calendar, focus the item (even if another item was focused before)
            focusOnElement(el, 0);
            if (this.innerRoot.querySelector(".tmpFocused")) this.innerRoot.querySelector(".tmpFocused").classList.remove("tmpFocused");
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
        if (selection.anchorNode.tagName == "LABEL") return undefined; // don't unfocus the search when rerendering
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
        root.scrollIntoViewIfNeeded();
        restoreClickFlag = false;
    }

    let bumpWasTriggeredByUserEvent = false;
    let parentReorganiseTimeout = -1;
    let parentsToReorganise = {};

    // Arrange the items under the specified parent (id string). 
    // Will also sort by date if it is configured to.
    let _sortParent = (parent, sortMethod) => {
        if (!sortMethod) {
            if (this.settings.autoSortDate) sortMethod = "DATE";
            else if (this.settings.autoSortAlpha) sortMethod = "ALPHA";
        }
        // look through my immediate children and assign them numbers
        if (this.renderedItemCache[parent]) {
            let itemsToUpdate = []; // store items to update and update them at the end because otherwise sometimes rendering will cause double-ups
            if (sortMethod == "DATE") {
                let getDate = (obj) => {
                    if (!obj) return undefined;
                    try {
                        obj = dateParser.getSortingTime(obj).date;
                    } catch (e) {
                        obj = undefined;
                    }
                    return obj;
                }
                Array.from(this.getChildrenDiv(this.renderedItemCache[parent].el).children)
                    .filter(i => !(i.classList.contains("cursorspan")))
                    .map(i => [i.dataset.id, polymorph_core.items[i.dataset.id] ? polymorph_core.items[i.dataset.id][this.settings.sortDateProp] : undefined])
                    .sort((a, b) => {
                        let a_date = getDate(a[1]);
                        let b_date = getDate(b[1]);
                        let inversionFactor = (this.settings.unsortableBeforeSorted) ? -1 : 1;
                        if (a_date && !b_date) return -1 * inversionFactor;
                        if (b_date && !a_date) return 1 * inversionFactor;
                        if (!a_date && !b_date) return 0;
                        if (this.settings.sortBackwards) return a_date - b_date;
                        else return b_date - a_date;
                    }).forEach((v, i) => {
                        if (polymorph_core.items[v[0]][this.settings.orderProperty] != i) {
                            polymorph_core.items[v[0]][this.settings.orderProperty] = i;
                            itemsToUpdate.push(v[0]);
                        }
                    });
            } else if (sortMethod == "ALPHA") {
                Array.from(this.getChildrenDiv(this.renderedItemCache[parent].el).children)
                    .filter(i => !(i.classList.contains("cursorspan")))
                    .map(i => [i.dataset.id, polymorph_core.items[i.dataset.id] ? polymorph_core.items[i.dataset.id].title : undefined])
                    .sort((a, b) => {
                        if (this.settings.sortBackwards) return a[1] < b[1] ? 1 : -1;
                        else return a[1] > b[1] ? 1 : -1;
                    }).forEach((v, i) => {
                        if (polymorph_core.items[v[0]][this.settings.orderProperty] != i) {
                            polymorph_core.items[v[0]][this.settings.orderProperty] = i;
                            itemsToUpdate.push(v[0]);
                        }
                    });
            } else {
                Array.from(this.getChildrenDiv(this.renderedItemCache[parent].el).children).filter((i) => !(i.classList.contains("cursorspan"))).forEach((v, i) => {
                    if (polymorph_core.items[v.dataset.id][this.settings.orderProperty] != i) {
                        polymorph_core.items[v.dataset.id][this.settings.orderProperty] = i;
                        itemsToUpdate.push(v.dataset.id);
                    }
                })
            }
            let fobj = saveFocus();
            itemsToUpdate.forEach(i => {
                container.fire("updateItem", { id: i, sender: this });
                this.renderItem(i, "d");
            })
            restoreFocus(fobj);
        }
    }
    let sortParentCap = new capacitor(1000, 10, (p) => {
        _sortParent(p);
    });
    let sortParent = sortParentCap.submit;
    this.sortParent = _sortParent;

    container.on("doSort", (d) => {
        sortParent(d.id);
    })


    let bumpParentReorganise = (parentID) => {
        if (!bumpWasTriggeredByUserEvent) return;
        if (disableSortOnShuffle) return;
        bumpWasTriggeredByUserEvent = false;
        parentsToReorganise[parentID] = true;
        clearTimeout(parentReorganiseTimeout);
        parentReorganiseTimeout = setTimeout(() => {
            let copyOfParentsToReorganise = Object.keys(parentsToReorganise);
            parentsToReorganise = {};
            copyOfParentsToReorganise.forEach(i => {
                sortParent(i);
            });
        });
    }

    let oldFocus = 1;
    this.renderedItemCache = {
        "": {
            el: {
                children: [0, this.innerRoot] // little hack so that unparented items automatically get added to root
            }
            // other items would also have a 'renderedText' property
        }
    }; // for deletions

    // Takes an IDstring OR an element and returns a standardized tuple.
    this.resolveSpan = (item) => {
        let baseSpan = undefined;
        if (typeof (item) == "string") {
            baseSpan = this.renderedItemCache[item].el;
        } else {
            // might be an element
            while (item.dataset) {
                if (item.dataset.id) {
                    baseSpan = item;
                    item = {};
                } else {
                    item = item.parentElement;
                }
            }
        }
        return {
            el: baseSpan,
            id: baseSpan.dataset.id
        };
    }

    this.renderItem = (id, flags = "") => {
        // Options

        let fromParent = flags.includes("p");
        // If from parent, then dont reorganise the parent, because the 
        // parent just opened up and its likely to have a bunch of people all asking to reorganize it

        dontFocus = flags.includes("d");
        tmpExpanded = flags.includes("e");
        if (!this.itemRelevant(id)) {
            if (this.renderedItemCache[id]) {
                this.renderedItemCache[id].el.remove();
                delete this.renderedItemCache[id];
            }
        } else {
            if (!oldFocus && !dontFocus) {
                oldFocus = saveFocus();
                setTimeout(() => {
                    restoreFocus(oldFocus);
                    oldFocus = undefined;
                });
            }
            //check if the item's parent exists
            let parentID = polymorph_core.items[id][this.settings.parentProperty] || "";
            let myOrder = polymorph_core.items[id][this.settings.orderProperty] || 0;
            if (!cachedChildren[parentID]) cachedChildren[parentID] = {};
            cachedChildren[parentID][id] = myOrder;
            if (!fromParent && !(this.settings.focusExclusionMode && id == this.settings.focusExclusionID)) bumpParentReorganise(parentID);

            //let my parent know it has children either when it renders or if it has already rendered, now.

            if ((!parentID && !this.settings.focusExclusionMode) || // root item, so we can render
                id == this.settings.focusExclusionID || // we're focusing on this element
                (this.renderedItemCache[parentID] && parentID != "" && !(!(parentID in this.holdExpanded) && polymorph_core.items[parentID][this.settings.collapseProperty])) || // The parent is rendered and should be expanded
                (flags.includes("f") && this.renderedItemCache[parentID]) // forced and parent exists
            ) {
                // only render if parent visible and not collapsed, or this is a root item
                if (!this.renderedItemCache[id]) {
                    this.renderedItemCache[id] = {
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
                let thisIDSpan = this.renderedItemCache[id].el;
                let thisEditableSpan = thisIDSpan.children[0].children[1]
                if (!itemsShouldBeEditable) {
                    if (thisEditableSpan.contentEditable) thisEditableSpan.contentEditable = false;
                } else {
                    if (!thisEditableSpan.contentEditable) thisEditableSpan.contentEditable = true;
                }
                //cache and update the text
                let notNullItemTitle = (polymorph_core.items[id][this.settings.titleProperty] || " ");

                // Special case for dates with 'auto'; anything with auto will be invalidated. (Icky! Might be a better way to do this.)
                if (this.renderedItemCache[id].renderedText != notNullItemTitle || notNullItemTitle.includes("auto")) {
                    this.renderedItemCache[id].renderedText = notNullItemTitle;
                    if (this.settings.advancedInputMode) {
                        // just do a replace of datestrings to actual dates
                        // find all property-like objects

                        let components = (notNullItemTitle).split(/(\\\{.+\})/g);
                        components = components.map(i => {
                            let match = /\\\{(.+?)\}/g.exec(i);
                            if (match) {
                                match = match[1];
                                let parts = match.split(":");
                                let ltrkey = parts.shift();
                                let key = `_${this.settings.bracketPropertyPrefix}_${ltrkey}`;
                                if (this.settings.propAsDate.split(",").includes(ltrkey)) {
                                    try {
                                        return `\\{${ltrkey}:${dateParser.getSortingTime(polymorph_core.items[id][key]).date.toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}}`;
                                    } catch (e) {
                                        return `\\{${ltrkey}:${"Invalid Date"}}`;
                                    }
                                } else {
                                    return i;
                                }
                            } else {
                                return i;
                            }
                        })
                        thisIDSpan.children[0].children[1].innerText = components.join("");
                        // TODO deal with multiple case
                        // check if they are dates or not
                        // if they are dates, fetch the actual date and sub it in 
                    } else {
                        thisIDSpan.children[0].children[1].innerText = notNullItemTitle; //= polymorph_core.RTRenderProperty(notNullItemTitle);
                    }
                }

                if (polymorph_core.items[id].style) {
                    thisIDSpan.style.background = polymorph_core.items[id].style.background;
                    thisIDSpan.style.color = polymorph_core.items[id].style.color;
                }

                /////
                // attach to my parent, given it exists
                /////

                if (id == this.settings.focusExclusionID && this.settings.focusExclusionMode) {
                    this.innerRoot.appendChild(thisIDSpan);
                } else {
                    // figure out where to place it among the children, to generate placeAfter
                    let placeAfter = -1;
                    let existingSiblings = Array.from(this.getChildrenDiv(this.renderedItemCache[parentID].el).children).filter((i) => !(i.classList.contains("cursorspan"))).map(i => [i, polymorph_core.items[i.dataset.id][this.settings.orderProperty]]);
                    existingSiblings.forEach((v) => {
                        if (polymorph_core.items[id][this.settings.orderProperty] >= v[1] && v[0] != thisIDSpan) {
                            // pick the last item that is larger than it for it to be put after
                            placeAfter = v[0];
                        }
                    })

                    // From here, calculate a place before because we can only use insertBefore not insertAfter
                    let placeBefore;
                    if (placeAfter != -1) placeBefore = placeAfter.nextElementSibling;
                    else if (this.renderedItemCache[parentID].el.children[1] != this.innerRoot) placeBefore = this.getChildrenDiv(this.renderedItemCache[parentID].el).children[0];
                    else placeBefore = this.innerRoot.children[1]; // special case because cursorspan exists in innerroot

                    if ((thisIDSpan.parentElement != this.getChildrenDiv(this.renderedItemCache[parentID].el) || // parent wrong
                        thisIDSpan.nextElementSibling != placeBefore) && // order wrong
                        thisIDSpan != placeBefore) { // not just a render-in-place
                        thisIDSpan.remove();
                        this.getChildrenDiv(this.renderedItemCache[parentID].el).insertBefore(thisIDSpan, placeBefore);
                    }
                }


                /////
                // rerender my children
                /////

                if (cachedChildren[id] && Object.keys(cachedChildren[id]).length) {
                    // I have children yay
                    let shouldBeCollapsedNow = !(id in this.holdExpanded) && polymorph_core.items[id][this.settings.collapseProperty];
                    let collapseDiv = this.getChildrenDiv(thisIDSpan);
                    if (collapseDiv.tagName != "DIV") collapseDiv = collapseDiv.nextElementSibling;
                    if (shouldBeCollapsedNow != this.renderedItemCache[id][this.settings.collapseProperty]) {
                        if (shouldBeCollapsedNow) {
                            collapseDiv.style.display = "none";
                            thisIDSpan.children[0].children[0].children[0].innerHTML = "&#x25B6;";
                            thisIDSpan.children[0].children[0].children[0].style.color = "white";
                        } else {
                            collapseDiv.style.display = "block";
                            thisIDSpan.children[0].children[0].children[0].innerHTML = "&#x25BC;";
                            if (id in this.holdExpanded) thisIDSpan.children[0].children[0].children[0].style.color = "orange";
                            else thisIDSpan.children[0].children[0].children[0].style.color = "white";
                        }
                        this.renderedItemCache[id][this.settings.collapseProperty] = shouldBeCollapsedNow;
                    }
                    // might be wise to rerender them if they dont exist yet
                    // for everything in cachedChildren[id], if it is still relevant but not one of my children, then render it.
                    let renderedChildren = Array.from(collapseDiv.children).filter((i) => !(i.classList.contains("cursorspan"))).map(i => i.dataset.id).reduce((p, i) => { p[i] = true; return p }, {});
                    for (let i in cachedChildren[id]) {
                        if (!renderedChildren[i] && this.itemRelevant(i)) {
                            this.renderItem(i, "pd");
                        }
                    }
                } else {
                    // maybe their child got removed
                    thisIDSpan.children[0].children[0].children[0].innerHTML = "&#x25CF;";
                }
                this.cursorSpan.style.display = "none"; // something got rendered, hide the cursorspan
            } else {
                // check that maybe my current parent is not my actual parent
                // in case an item is moved
                if (this.renderedItemCache[id] && this.renderedItemCache[id].el.parentElement.parentElement.dataset.id != polymorph_core.items[id][this.settings.parentProperty]) {
                    // We were not renderd, which means our parent is unexpanded
                    // but we shouldn't be here
                    // therefore remove self 
                    this.renderedItemCache[id].el.remove();
                    delete this.renderedItemCache[id];
                }
            }
        }
    }
    container.on("updateItem", (d) => {
        if (d.sender == this) return; // Dont handle our own updates so that the user does not lose focus.
        let id = d.id;
        let flags = d.flags || "d";

        if (this.itemRelevant(id)) {
            // Want to keep focus if we have focus
            let oldFocus = saveFocus();
            this.renderItem(id, flags); // prevent bumpparentreorganise on external updates
            // Unless we need to...
            if (this.settings.autoSortAlpha || this.settings.autoSortDate) {
                sortParent(polymorph_core.items[id][this.settings.parentProperty] || "");
            }
            restoreFocus(oldFocus);
        } else if (this.renderedItemCache[id]) {
            // items deleted externally
            this.renderedItemCache[id].el.remove();
            delete this.renderedItemCache[id];
        }
    });

    container.on("createItem", (d) => {
        if (d.sender == this) return;
        let id = d.id;
        this.createItem(id, true);
        this.renderItem(id);
    });

    //first time load: render everything WITHOUT OLDFOCUS
    this.refresh = function () {
        itemsShouldBeEditable = this.settings.isEditable && !this.settings.advancedInputMode;
        if (this.settings.focusExclusionMode) {
            this.focusModeRefresh();
        } else {
            for (let i in polymorph_core.items) {
                this.renderItem(i, "pd"); // dont reorganise parent here
            }
            // This is called when the parent container is resized.
            // needs to be here so that when item is instantialised, items will render.
        }
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    let options = {
        oneTimeImport: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: () => this.settings,
            property: "filter",
            label: "Filter property"
        }),
        parentProperty: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: () => this.settings,
            property: "parentProperty",
            label: "Property that defines the parent of the item"
        }),
        orderProperty: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: () => this.settings,
            property: "orderProperty",
            label: "Property that defines the order of the item"
        }),
        collapseProperty: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: () => this.settings,
            property: "collapseProperty",
            label: "Property to determine whether an item is collapsed"
        }),
        bracketPropertyPrefix: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: () => this.settings,
            property: "bracketPropertyPrefix",
            label: "Prefix for bracket properties"
        }),
        allowEditing: new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: () => this.settings,
            property: "isEditable",
            label: "Allow editing"
        }),
        autoSortDate: new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: () => this.settings,
            property: "autoSortDate",
            label: "Automatically sort by date property"
        }),
        autoSortAlpha: new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: () => this.settings,
            property: "autoSortAlpha",
            label: "Automatically sort by title alphabetically"
        }),
        sortDateProp: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: () => this.settings,
            property: "sortDateProp",
            label: "Property to sort by date against"
        }),
        propAsDate: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: () => this.settings,
            property: "propAsDate",
            label: "Property to be treated as date (\\{prop})"
        }),
        focusExclusionMode: new polymorph_core._option({
            div: this.dialogDiv,
            type: "bool",
            object: () => this.settings,
            property: "focusExclusionMode",
            label: "Focus exclusively on item and subitems on metaFocus"
        }),
        focusExclusionID: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: () => this.settings,
            property: "focusExclusionID",
            label: "ID to focus on in focus exclusion mode"
        }),
        advancedInputMode: new polymorph_core._option({
            div: this.dialogDiv,
            type: "boolean",
            object: () => this.settings,
            property: "advancedInputMode",
            label: "Advanced input mode (changed editing style)"
        }),
        filterHides: new polymorph_core._option({
            div: this.dialogDiv,
            type: "boolean",
            object: () => this.settings,
            property: "filterHides",
            label: "Filter should hideitems"
        }),
        sortBackwards: new polymorph_core._option({
            div: this.dialogDiv,
            type: "boolean",
            object: () => this.settings,
            property: "sortBackwards",
            label: "Reverse item sort order"
        }),
        unsortableBeforeSorted: new polymorph_core._option({
            div: this.dialogDiv,
            type: "boolean",
            object: () => this.settings,
            property: "unsortableBeforeSorted",
            label: "Place unsortable items before sortable items in order"
        })
    }

    let importFacilities = htmlwrap(`
    <div style="display:flex">
        <span>Import from old workflowish operator</span>
        <span style="flex: 1"></span>
        <input placeholder="Operator ID">
        <button>Import</button>
    </div>
    `);
    let importContainerIDInput = importFacilities.children[2];
    let importButton = importFacilities.children[3];
    this.doImport = (operatorID) => {
        let importContainer = polymorph_core.items[operatorID]._od.data;
        let rootList = [];

        if (importContainer.rootItemListItem) {
            try {
                rootList = [...polymorph_core.items[importContainer.rootItemListItem][importContainer.rootItemListItemProperty]];
            } catch (e) {
                //create the item if it doesnt exist
                //create the property if it doesnt exist
                rootList = [];
            }
        } else rootList = [...importContainer.rootItems];


        let stack = rootList.map(i => [i, ""]);
        let loopkiller = {};
        while (stack.length) {
            let topID = stack.pop();
            if (loopkiller[topID[0]]) continue;
            loopkiller[topID[0]] = true;
            if (polymorph_core.items[topID[0]][importContainer.filter]) {
                polymorph_core.items[topID[0]][this.settings.filter] = true;
                polymorph_core.items[topID[0]][this.settings.parentProperty] = topID[1];
                for (let i in polymorph_core.items[topID[0]].to) {
                    stack.push([i, topID[0]]);
                }
                container.fire("updateItem", { id: topID[0], sender: this });
                this.renderItem(topID[0], "d");
            }
        }
    }
    importButton.addEventListener("click", (e) => {
        this.doImport(importContainerIDInput.value);
    });

    this.dialogDiv.appendChild(importFacilities);

    this.showDialog = function () {
        for (let i in options) {
            options[i].load();
        }
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // This is called when your dialog is closed. Use it to update your container!

        // Sort the items alphabetically, if that option is checked
        if (this.settings.autoSortAlpha) {
            sortParent("");
        }

        this.refresh();
    }
    workflowy_gitfriendly_extend_contextMenu.apply(this);
    workflowy_gitfriendly_search.apply(this);
    workflowy_advanced_entry.apply(this);

    oldFocus = 0; // ready to go
});