polymorph_core.registerOperator("textflow", {
    displayName: "TextFlow",
    description: "An operator designed for pretty-printed documents."
}, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        titleProperty: "title",
        richtextProperty: "description",
        rootItems: [polymorph_core.insertItem({})]
    };

    //Can probably replace this with direct instantiation instead of a getter, if we're careful.
    Object.defineProperty(this, "existingItems", {
        get: () => {
            if (this._existingItemsCache) return this._existingItemsCache;
            else {
                this._existingItemsCache = Array.from(this.settings.rootItems);
                for (let i = 0; i < this._existingItemsCache.length; i++) {
                    if (polymorph_core.items[this._existingItemsCache[i]].to) this._existingItemsCache = this._existingItemsCache.concat(Object.keys(polymorph_core.items[this._existingItemsCache[i]].to));
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
            return this._parentOfCache[id];//undefined = root.
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
    p[contenteditable]{
        display:none;
        font-family:monospace;
    }
    span.focused p[contenteditable]{
        display:block;
    }
    </style>
    `;
    this.rootdiv.style.color = "white";
    this.rootdiv.style.overflowY = "auto";
    this.rootdiv.style.height = "100%";

    //return true if we care about an item and dont want it garbage-cleaned :(
    this.itemRelevant = (id) => { return (this.existingItems.indexOf(id) != -1) }

    this.createItem = (id, data) => {
        itm = polymorph_core.items[id];

        //add any data you need
        let toDirectAdopt = true;
        for (let i = 0; i < this.existingItems.length; i++) {
            if (polymorph_core.items[i].to && polymorph_core.items[i].to[id]) {
                toDirectAdopt = false;
            }
        }
        if (toDirectAdopt) {
            this.settings.rootItems.push(id);
        }
        this._existingItemsCache.push(id);
    }

    let focusOnElement = (el, index) => {
        let range = document.createRange();
        let newP = el;
        range.setStart(newP, index);
        range.collapse(true);
        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        //on deletion, focus is lost, so check focus exists
        if (this.rootdiv.querySelector(".focused")) this.rootdiv.querySelector(".focused").classList.remove("focused");
        el.parentElement.classList.add("focused");
        newP.focus();
        newP.scrollIntoViewIfNeeded();
    }


    this.rootdiv.addEventListener("keydown", (e) => {
        if (e.key == "ArrowDown" || e.key == "ArrowUp") {
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
                            toFocusOnSpan = ctarget.parentElement.nextElementSibling.children[0];
                            focusOnElement(toFocusOnSpan);
                        } else if (ctarget.innerText) {
                            let newItem = {};
                            newItem[this.settings.titleProperty] = "";
                            let newID = polymorph_core.insertItem(newItem);
                            this.settings.rootItems.push(newID);
                            this._existingItemsCache.push(newID);
                            container.fire("createItem", { id: newID, sender: this });
                            this.renderItem(newID);
                            focusOnElement(this.rootdiv.querySelector(`span[data-id='${newID}'] p`));
                        }
                    } else {
                        if (ctarget.parentElement.previousElementSibling) {
                            let toFocusOnSpan = ctarget.parentElement.previousElementSibling.children[0];
                            focusOnElement(toFocusOnSpan);
                        }
                    }
                }
            }, 100);
        } else if (e.key == "Backspace") {
            if (e.target.innerText == "" || e.target.innerText == "\n") { //occasionally you get a single <br> and it refuses to delete
                let toFocusOnSpan;
                if (e.target.parentElement.previousElementSibling) {
                    toFocusOnSpan = e.target.parentElement.previousElementSibling.children[0];
                } else if (e.target.parentElement.nextElementSibling) {
                    toFocusOnSpan = e.target.parentElement.nextElementSibling.children[0];
                }
                if (toFocusOnSpan) { // if this is the last element, don't delete it!
                    let id = e.target.parentElement.dataset.id;
                    let idindex = this.settings.rootItems.indexOf(id);
                    if (idindex > -1) {
                        this.settings.rootItems.splice(idindex, 1);
                    }
                    idindex = this._existingItemsCache.indexOf(id);
                    this._existingItemsCache.splice(idindex, 1);
                    e.target.parentElement.remove();
                    container.fire("deleteItem", { id: id, sender: this });
                    focusOnElement(toFocusOnSpan);
                }
            }
        } else if (e.key == "Enter") {
            if (e.getModifierState("Shift") == true) return;
            let ctarget = e.target;
            let baseElement = e.target.getRootNode();
            range = baseElement.getSelection().getRangeAt(0);
            let preRange = range.startOffset;
            if (preRange == range.startContainer.length &&
                Array.from(range.startContainer.parentElement.childNodes).indexOf(range.startContainer) == range.startContainer.parentElement.childNodes.length - 1
            ) {
                //make a new node
                e.preventDefault();
                let newItem = {};
                newItem[this.settings.titleProperty] = "";
                let newID = polymorph_core.insertItem(newItem);
                this.settings.rootItems.push(newID);
                this._existingItemsCache.push(newID);
                container.fire("createItem", { id: newID, sender: this });
                this.renderItem(newID);
                focusOnElement(this.rootdiv.querySelector(`span[data-id='${newID}'] p`));
            }
        }
    });

    this.rootdiv.addEventListener("click", (e) => {
        for (let i = 0; i < e.path.length; i++) {
            if (e.path[i].host) return;//exist after shadow root
            if (e.path[i].matches(`span[data-id]>div`)) {
                focusOnElement(e.path[i].previousElementSibling);
                break;
            }
        }
    });

    this.rootdiv.addEventListener("input", (e) => {
        if (e.target.matches(`span[data-id] p`)) {
            let id = e.target.parentElement.dataset.id;
            polymorph_core.items[id][this.settings.titleProperty] = e.target.innerText;
            container.fire("updateItem", { id: id, sender: this });
        }
    });

    this.deleteItem = (id) => {
        //Find its parent and nerf it - if it doesnt have a parent, take it off the rootitems.
        container.fire("updateItem", { id: id });
    }

    //this is called when an item is updated (e.g. by another container)
    this.renderItem = (id) => {
        if (this.itemRelevant(id)) {
            //render the item, if we care about it.
            let span = this.rootdiv.querySelector(`span[data-id='${id}']`);
            if (!span) {
                span = htmlwrap(`
            <span data-id="${id}">
            <p class="code" contenteditable></p>
            <div class="rendered"></div>
            <span>`);
            }
            span.children[0].innerText = polymorph_core.items[id][this.settings.titleProperty] || " ";
            if (span.parentElement != this.rootdiv) this.rootdiv.appendChild(span);
            if (this.rootdiv.children.length == 2) span.classList.add("focused");
        }
    }

    this.richRenderItem = (id) => {
        if (this.itemRelevant(id)) {
            //render the item, if we care about it.
            let span = this.rootdiv.querySelector(`span[data-id='${id}']`);
            if (!span) {
                span = htmlwrap(`
            <span data-id="${id}">
            <p class="code" contenteditable></p>
            <div class="rendered"></div>
            </span>`);
            }
            let innerText = polymorph_core.items[id][this.settings.titleProperty];
            innerText = innerText.replace("\\", "\\\\");
            innerText = eval(`\`${innerText}\``);
            let components = innerText.split(" ");
            let settings = {
                el: "p",
            }
            components = components.map(i => {
                if (i[0] == "\\") switch (i[1]) {
                    case 's':
                        settings.el = i.split(":")[1];
                        break;
                    case 'h':
                        settings.justHTML = true;
                        break;
                }
                return i;
            })
            let coldComponents = components.filter(i => i[0] != "\\");
            if (!settings.justHTML) {
                span.children[1].innerHTML = `<${settings.el}>${coldComponents.join(" ")}</${settings.el}>`;
            } else {
                span.children[1].innerHTML = coldComponents.join(" ");
            }
            if (span.parentElement != this.rootdiv) this.rootdiv.appendChild(span);
        }
    }
    container.on("updateItem", (d) => {
        let id = d.id;
        // Dont handle our own updates so that the user does not lose focus.
        if (d.sender != this) this.renderItem(id);
        //but still rich render!
        this.richRenderItem(id);
        //do stuff with the item.
    });

    this.settings.rootItems.forEach((i) => container.fire("updateItem", { id: i }));

    this.refresh = function () {
        // This is called when the parent container is resized.
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    let options = {
        oneTimeImport: new _option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "oneTimeImport",
            label: "Filter for one time import"
        }),
        implicitOrder: new _option({
            div: this.dialogDiv,
            type: "button",
            fn: () => {
                for (let i in polymorph_core.items) {
                    if (polymorph_core.items[i][this.settings.oneTimeImport]) {
                        //check if they are children of any of the existing items occurs on render.
                        this.settings.rootItems.push(i);
                        this.renderItem(i);
                    }
                }
            },
            label: "Import now"
        }),
        print: new _option({
            div: this.dialogDiv,
            type: "button",
            fn: () => {
                let preFocused = this.rootdiv.querySelector(".focused");
                if (preFocused) this.rootdiv.querySelector(".focused").classList.remove("focused");
                let nw = window.open("", "_blank");
                let generatedHTML = this.rootdiv.innerHTML;
                nw.document.body.innerHTML = generatedHTML;
                preFocused.classList.add("focused");
            },
            label: "Print this document"
        })
    }
    this.showDialog = function () {
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // This is called when your dialog is closed. Use it to update your container!
    }

});