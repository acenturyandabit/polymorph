polymorph_core.registerOperator("textflow", {
    displayName: "TextFlow",
    description: "An operator designed for pretty-printed documents."
}, function (container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        itemRootProperty: "textflow_irp_" + guid(5),
        titleProperty: "title",
        richtextProperty: "description",
        renderMode: "templateStrings",
        filter: polymorph_core.insertItem({}),
    };
    let newStorageItem = {};
    newStorageItem[defaultSettings.itemRootProperty] = [polymorph_core.insertItem({})];
    defaultSettings.filter = polymorph_core.insertItem(newStorageItem);
    //this.rootdiv, this.settings, this.container instantiated here.
    polymorph_core.operatorTemplate.call(this, container, defaultSettings);

    Object.defineProperty(this, "rootItems", {
        get: () => {
            return polymorph_core.items[this.settings.filter][this.settings.itemRootProperty];
        }
    })
    if (this.settings.rootItems) {
        if (this.settings.rootItems.length) {
            //its an array, so old version
            let newStorageItem = {};
            newStorageItem[this.settings.itemRootProperty] = this.settings.rootItems;
            this.settings.filter = polymorph_core.insertItem(newStorageItem);
        } else {
            for (let i in this.settings.rootItems) {
                let newStorageItem = {};
                newStorageItem[this.settings.itemRootProperty] = this.settings.rootItems[i];
                this.settings.filter = polymorph_core.insertItem(newStorageItem);
            }
        }
        delete this.settings.rootItems;
    }

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

    this.itemRelevant = (id) => {
        for (let i in polymorph_core.items) {
            if (polymorph_core.items[i][this.settings.itemRootProperty] && polymorph_core.items[i][this.settings.itemRootProperty].includes) {
                if (i == id) return true;
                if (polymorph_core.items[i][this.settings.itemRootProperty].includes(id)) return true;
            }
        }
        return false;
    }

    this.itemRelevantNow = (id) => {
        if (this.rootItems) return (this.rootItems.indexOf(id) != -1);
        else return false;
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
        if (e.key == "Tab") e.preventDefault();
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
                            this.rootItems.push(newID);
                            container.fire("createItem", { id: newID, sender: this });
                            this.richRenderItem(newID);
                            focusOnElement(this.rootdiv.querySelector(`span[data-id='${newID}'] p`));
                        }
                    } else {
                        if (ctarget.parentElement.previousElementSibling) {
                            let toFocusOnSpan = ctarget.parentElement.previousElementSibling.children[0];
                            if (toFocusOnSpan) focusOnElement(toFocusOnSpan);
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
                    let idindex = this.rootItems.indexOf(id);
                    if (idindex > -1) {
                        this.rootItems.splice(idindex, 1);
                    }
                    e.target.parentElement.remove();
                    container.fire("deleteItem", { id: id, sender: this });
                    focusOnElement(toFocusOnSpan);
                }
            }
        } else if (e.key == "Enter") {
            if (e.getModifierState("Shift") == true) return;
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
                let oldID = e.target.parentElement.dataset.id;
                this.rootItems.splice(this.rootItems.indexOf(oldID) + 1, 0, newID);
                container.fire("createItem", { id: newID, sender: this });
                this.richRenderItem(newID);
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

    this.richRenderItem = (id) => {
        if (this.itemRelevantNow(id)) {
            //render the item, if we care about it.
            let span = this.rootdiv.querySelector(`span[data-id='${id}']`);
            if (!span) {
                span = htmlwrap(`
            <span data-id="${id}">
            <p class="code" contenteditable></p>
            <div class="rendered"></div>
            </span>`);
            }
            if (!span.classList.contains("focused")) span.children[0].innerText = polymorph_core.items[id][this.settings.titleProperty] || " ";
            let innerText = polymorph_core.items[id][this.settings.titleProperty];
            if (!innerText) innerText = " ";//on metafocus, this property may not be set
            span.children[1].innerHTML = eval(`\`${innerText}\``);
            if (span.parentElement != this.rootdiv) {
                if (this.rootItems.indexOf(id) - 1 >= 0) {
                    let prevID = this.rootItems[this.rootItems.indexOf(id) - 1];
                    //not first item
                    if (this.rootdiv.querySelector(`span[data-id="${prevID}"]`)) {
                        this.rootdiv.insertBefore(span, this.rootdiv.querySelector(`span[data-id="${prevID}"]`).nextElementSibling);
                    }else{
                        //on first run, some items may not exist yet. so recurse up.
                        this.richRenderItem(prevID);
                        this.rootdiv.insertBefore(span, this.rootdiv.querySelector(`span[data-id="${prevID}"]`).nextElementSibling);
                    }
                } else {
                    //first item
                    this.rootdiv.insertBefore(span, this.rootdiv.children[1]);//style
                }
            }
        }
    }
    container.on("updateItem", (d) => {
        let id = d.id;
        this.richRenderItem(id);
        //do stuff with the item.
    });

    container.on("metaFocus", (data) => {
        if (data.sender == this) return;
        this.settings.filter = data.id;
        if (!this.rootItems) polymorph_core.items[this.settings.filter][this.settings.itemRootProperty] = [polymorph_core.insertItem({})];
        //clear out everything
        while (this.rootdiv.children.length > 1) {
            this.rootdiv.children[1].remove();
        }
        for (let i in polymorph_core.items) {
            this.richRenderItem(i);
        }
        this.rootdiv.children[1].classList.add("focused");
    })
    if (this.rootItems) {
        if (!this.rootItems.length) {
            this.rootItems.push(polymorph_core.insertItem({}))
        };
        this.rootItems.forEach((i) => container.fire("updateItem", { id: i }));
    } else {
        let newStorageItem = {};
        let newTextItem = polymorph_core.insertItem({});
        newStorageItem[this.settings.itemRootProperty] = [newTextItem];
        this.settings.filter = polymorph_core.insertItem(newStorageItem);
        this.richRenderItem(newTextItem);
    }
    this.rootdiv.children[1].classList.add("focused");

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
                        this.rootItems.push(i);
                        this.richRenderItem(i);
                        this.rootdiv.children[1].classList.add("focused")
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
        }),
        renderMode: new _option({
            div: this.dialogDiv,
            type: "select",
            object: this.settings,
            property: "renderMode",
            source: ["templateString", "Markdown [todo]", "Textflow custom shortcuts [todo]"],
            label: "Rendering mode"
        })
    }
    this.showDialog = function () {
        for (let i in options) options[i].load();
        // update your dialog elements with your settings
    }
    this.dialogUpdateSettings = function () {
        // This is called when your dialog is closed. Use it to update your container!
    }

});