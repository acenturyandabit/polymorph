polymorph_core.registerOperator("textflow", {
    displayName: "TextFlow",
    description: "An operator designed for streams of text.",
    section: "Standard"
}, function(container) {
    //default settings - as if you instantiated from scratch. This will merge with your existing settings from previous instatiations, facilitated by operatorTemplate.
    let defaultSettings = {
        itemRootProperty: "textflow_irp_" + polymorph_core.guid(5),
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

    //load SoC extension
    this.parsers = {};
    /*scriptassert([["textflow_socparser", "operators/textflow/socParser.js"]], () => {
        __textflow_soc_parser(this);
    });*/

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
    this.rootdiv.appendChild(htmlwrap(`<div style="color:white;overflow-y:auto;height:100%"></div>`))
    this.itemListDiv = this.rootdiv.children[0]

    let focusOnElement = (el, index) => {
        let range = document.createRange();
        let newP = el;
        range.setStart(newP, index);
        range.collapse(true);
        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        //on deletion, focus is lost, so check focus exists
        if (this.itemListDiv.querySelector(".focused")) this.itemListDiv.querySelector(".focused").classList.remove("focused");
        el.parentElement.classList.add("focused");
        newP.focus();
        newP.scrollIntoViewIfNeeded();
        container.fire("focusItem", { id: el.parentElement.dataset.id, sender: this });
    }

    this.createItem = (oldID) => {
        if (this.settings.renderMode == "SoC") {
            //it's a stream of consciousness
            //poll the plugin for what to do
            try {
                this.parsers["soc"](oldID);
            } catch (e) {
                console.log(e);
            }
        }

        let newItem = {};
        newItem[this.settings.titleProperty] = "";
        let newID = polymorph_core.insertItem(newItem);
        if (oldID) this.rootItems.splice(this.rootItems.indexOf(oldID) + 1, 0, newID);
        else this.rootItems.push(newID);
        container.fire("createItem", { id: newID, sender: this });
        this.richRenderItem(newID);
        focusOnElement(this.itemListDiv.querySelector(`span[data-id='${newID}'] p`));
    }

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

    this.itemListDiv.addEventListener("keydown", (e) => {
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
                            let oldID = ctarget.parentElement.dataset.id;
                            this.createItem(oldID);
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
                let oldID = e.target.parentElement.dataset.id;
                this.createItem(oldID);
            }
        }
    });

    this.itemListDiv.addEventListener("click", (e) => {
        for (let i = 0; i < e.path.length; i++) {
            if (e.path[i].host) return; //exist after shadow root
            if (e.path[i].matches(`span[data-id]>div`)) {
                focusOnElement(e.path[i].previousElementSibling);
                break;
            } else if (e.path[i].matches(`span[data-id]:not(.focused)>p`)) {
                focusOnElement(e.path[i]);
                break;
            }
        }
    });

    this.itemListDiv.addEventListener("input", (e) => {
        if (e.target.matches(`span[data-id]>p`)) {
            let id = e.target.parentElement.dataset.id;
            polymorph_core.items[id][this.settings.titleProperty] = e.target.innerText;
            container.fire("updateItem", { id: id, sender: this });
        }
    });

    this.richRenderItem = (id) => {
        if (this.itemRelevantNow(id)) {
            //render the item, if we care about it.
            let span = this.itemListDiv.querySelector(`span[data-id='${id}']`);
            if (!span) {
                span = htmlwrap(`
            <span data-id="${id}">
            <p class="code" contenteditable></p>
            <div class="rendered"></div>
            </span>`);
            }
            if (!span.classList.contains("focused")) span.children[0].innerText = polymorph_core.items[id][this.settings.titleProperty] || " ";
            let innerText = polymorph_core.items[id][this.settings.titleProperty];
            if (!innerText) innerText = " "; //on metafocus, this property may not be set
            if (this.settings.renderMode == "templateString") span.children[1].innerHTML = eval(`\`${innerText}\``);
            if (span.parentElement != this.itemListDiv) {
                if (this.rootItems.indexOf(id) - 1 >= 0) {
                    let prevID = this.rootItems[this.rootItems.indexOf(id) - 1];
                    //not first item
                    if (this.itemListDiv.querySelector(`span[data-id="${prevID}"]`)) {
                        this.itemListDiv.insertBefore(span, this.itemListDiv.querySelector(`span[data-id="${prevID}"]`).nextElementSibling);
                    } else {
                        //on first run, some items may not exist yet. so recurse up.
                        this.richRenderItem(prevID);
                        this.itemListDiv.insertBefore(span, this.itemListDiv.querySelector(`span[data-id="${prevID}"]`).nextElementSibling);
                    }
                } else {
                    //first item
                    this.itemListDiv.insertBefore(span, this.itemListDiv.children[0]); //style
                }
            }
            if (polymorph_core.items[id].isSoCQuery && span.children[1].style.display != "block") {
                setTimeout(() => this.parsers["soc"](id), 200);
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
        while (this.itemListDiv.children.length > 0) {
            this.itemListDiv.children[0].remove();
        }
        for (let i in polymorph_core.items) {
            this.richRenderItem(i);
        }
        this.itemListDiv.children[0].classList.add("focused");
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
    this.itemListDiv.children[0].classList.add("focused");

    this.refresh = function() {
        // This is called when the parent container is resized.
    }

    //Handle the settings dialog click!
    this.dialogDiv = document.createElement("div");
    this.dialogDiv.innerHTML = ``;
    let options = {
        oneTimeImport: new polymorph_core._option({
            div: this.dialogDiv,
            type: "text",
            object: this.settings,
            property: "oneTimeImport",
            label: "Filter for one time import"
        }),
        importNow: new polymorph_core._option({
            div: this.dialogDiv,
            type: "button",
            fn: () => {
                for (let i in polymorph_core.items) {
                    if (polymorph_core.items[i][this.settings.oneTimeImport]) {
                        //check if they are children of any of the existing items occurs on render.
                        this.rootItems.push(i);
                        this.richRenderItem(i);
                        this.itemListDiv.children[0].classList.add("focused")
                    }
                }
            },
            label: "Import now"
        }),
        print: new polymorph_core._option({
            div: this.dialogDiv,
            type: "button",
            fn: () => {
                let preFocused = this.itemListDiv.querySelector(".focused");
                if (preFocused) this.itemListDiv.querySelector(".focused").classList.remove("focused");
                let nw = window.open("", "_blank");
                let generatedHTML = this.itemListDiv.innerHTML;
                nw.document.body.innerHTML = generatedHTML;
                preFocused.classList.add("focused");
            },
            label: "Print this document"
        }),
        renderMode: new polymorph_core._option({
            div: this.dialogDiv,
            type: "select",
            object: this.settings,
            property: "renderMode",
            source: ["templateString", "Markdown [todo]", "Textflow custom shortcuts [todo]", "SoC"],
            label: "Rendering mode"
        })
    }
    this.showDialog = function() {
        for (let i in options) options[i].load();
    }
    this.baseStyle = htmlwrap(`<style>`);
    this.rootdiv.appendChild(this.baseStyle);
    this.dialogUpdateSettings = function() {
        // This is called when your dialog is closed. Use it to update your container!
        //Add content-independent HTML here.
        switch (this.settings.renderMode) {
            case "SoC":
                this.baseStyle.innerHTML = `
                span[data-id]{
                    display:block;
                    width:100%;
                }
                span[data-id]>p{
                    display:block;
                    font-family:monospace;
                    margin:0;
                }
                span[data-id]>div.rendered{
                    display:none;
                }`
                break;
            default:
                this.baseStyle.innerHTML = `
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
                `
                break;

        }
        this.baseStyle = htmlwrap(`<style>
  
    </style>`);
        this.rootdiv.appendChild(this.baseStyle);
    }

    this.dialogUpdateSettings();
});