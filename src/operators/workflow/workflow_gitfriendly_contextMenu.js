let workflowy_gitfriendly_extend_contextMenu = function () {
    this.contextTarget = undefined; // A HTML element with a dataset-id.
    let contextmenu;
    let recordContexted = (e) => {
        this.contextTarget = e.target;

        while (!this.contextTarget.matches("[data-id]")) this.contextTarget = this.contextTarget.parentElement;
        if (polymorph_core.items[this.contextTarget.dataset.id].style) {
            contextmenu.querySelector("[data-action='background']").value = polymorph_core.items[this.contextTarget.dataset.id].style.background || "";
            contextmenu.querySelector("[data-action='color']").value = polymorph_core.items[this.contextTarget.dataset.id].style.color || "";
        } else {
            contextmenu.querySelector("[data-action='background']").value = "";
            contextmenu.querySelector("[data-action='color']").value = "";
        }
        return true;
    }
    let contextMenuManager = new _contextMenuManager(this.rootdiv);
    contextmenu = contextMenuManager.registerContextMenu(
        `
    <li>Sort items
        <ul class="submenu">
        <li data-action="sortbydate">Sort by Date</li>
        <li data-action="sortbyalpha">Sort Alphabetically</li>
        </ul>
    </li>
    <li data-action="copytxt">Copy text</li>
    <li data-action="delitm">Delete item</li>
        <li>Copy items
        <ul class="submenu">
        <li data-action="copylist">Copy item tree for pasting</li>
        <li data-action="copylistinternal">Copy item tree internally</li>
        <li data-action="copylistexternal">Copy for workflowy externally</li>
        </ul>
    </li>
    <li data-action="pasteInternal">Paste items</li>
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
            if (this.contextMenuActions[e.target.dataset.action](e)) {
                contextmenu.style.display = "none";
            };

        }
    });
    contextmenu.addEventListener("input", (e) => {
        if (this.contextMenuActions[e.target.dataset.action]) this.contextMenuActions[e.target.dataset.action](e);
    });
    this.contextmenu = contextmenu;
    //<li data-action="sortbydate">Copy subitems recursively as list</li>
    this.contextMenuActions = {};

    let savedStyle = undefined;
    this.contextMenuActions["cstyl"] = (e) => {
        let id = this.contextTarget.dataset.id;
        savedStyle = polymorph_core.items[id].style;
        return true;
    }

    this.contextMenuActions["pstyl"] = (e) => {
        if (savedStyle) {
            let id = this.contextTarget.dataset.id;
            polymorph_core.items[id].style = savedStyle;
            this.contextTarget.style.background = savedStyle.background;
            this.contextTarget.style.color = savedStyle.color;
        }
        return true;
    }

    this.contextMenuActions["copytxt"] = (e) => {
        try {
            return document.execCommand("copy"); // Security exception may be thrown by some browsers.
        } catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            return false;
        }
    }

    this.contextMenuActions["color"] = (e) => {
        let id = this.contextTarget.dataset.id;
        if (!polymorph_core.items[id].style) polymorph_core.items[id].style = {
            color: "white",
            background: "rgba(0,0,0,0)"
        }
        polymorph_core.items[id].style.color = e.target.value;

        this.contextTarget.style.background = polymorph_core.items[id].style.background;
        this.contextTarget.style.color = polymorph_core.items[id].style.color;
        polymorph_core.fire("updateItem", { d: id, sender: this });
    }

    this.contextMenuActions["background"] = (e) => {
        let id = this.contextTarget.dataset.id;
        if (!polymorph_core.items[id].style) polymorph_core.items[id].style = {
            color: "white",
            background: "rgba(0,0,0,0)"
        }
        polymorph_core.items[id].style.background = e.target.value;

        this.contextTarget.style.background = polymorph_core.items[id].style.background;
        this.contextTarget.style.color = polymorph_core.items[id].style.color;
        polymorph_core.fire("updateItem", { d: id, sender: this });
    }

    this.contextMenuActions["copylistinternal"] = (e) => {
        let itmID = this.resolveSpan(this.contextTarget).id;
        let itemsStack = [itmID];
        let itemsSeen = {};
        itemsSeen[itmID] = true;
        let itemsAll = [itmID];
        let itemsWithParents = Object.entries(polymorph_core.items)
            .filter(i => this.itemRelevant(i[0]))
            .map(i => [i[0], i[1][this.settings.parentProperty]])
            .reduce((p, i) => {
                p[i[0]] = i[1];
                return p;
            }, {});
        while (itemsStack.length) {
            for (let i in itemsWithParents) {
                if (itemsWithParents[i] == itemsStack[0] && !itemsSeen[i]) {
                    itemsSeen[i] = true;
                    itemsAll.push(i);
                    itemsStack.push(i);
                }
            }
            itemsStack.shift();
        }
        polymorph_core.toClip({
            type: "itemListParent",
            linkType: "parent",
            linkProp: this.settings.parentProperty,
            orderProp: this.settings.orderProperty,
            items: itemsAll
        });
        return true;
    }

    this.contextMenuActions["pasteInternal"] = (e) => {
        if (polymorph_core.clipboard.length) {
            let clip0 = polymorph_core.clipboard[0];
            switch (clip0.type) {
                case "itemListParent":
                    for (let i of clip0.items) {
                        polymorph_core.items[i][this.settings.filter] = true;
                        polymorph_core.items[i][this.settings.parentProperty] = polymorph_core.items[i][clip0.linkProp];
                        polymorph_core.items[i][this.settings.orderProperty] = polymorph_core.items[i][clip0.orderProp];
                        polymorph_core.fire("updateItem", { id: i });
                    }
                    polymorph_core.items[clip0.items[0]][this.settings.parentProperty] = this.resolveSpan(this.contextTarget).id;
                    polymorph_core.fire("updateItem", { id: clip0.items[0] });
            }
        }
        return true;
    }

    this.copyToClipboard = (text) => {
        // Copies a string to the clipboard. 
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
        return true;
    }


    this.contextMenuActions["copylist"] = (e) => {
        console.log(this.contextTarget);
        let rootElementPair = [this.contextTarget, 0];
        let runStack = [rootElementPair];
        let resultStack = [];
        while (runStack.length) {
            let top = runStack.pop();
            resultStack.push([top[0].children[0].children[1].innerText, top[1]])
            let childItemDiv = top[0].children[top[0].children.length - 1]; // not just 1, becuase of the rich edit mode. but always last
            for (let i = childItemDiv.children.length - 1; i >= 0; i--) {
                runStack.push([
                    childItemDiv.children[i],
                    top[1] + 1
                ]);
            }
        }
        //convert to indented list
        let text = resultStack.map(pair => Array(pair[1] * 4).fill(" ").join("") + "- " + pair[0]).join("\n");


        /* old method
            let text = this.contextTarget.parentElement.parentElement.innerText;
            // Format the text for a bit
            text = text.replace("▼", "-").replace("●", "-");
            // Replace extra newlines
            text = text.replace("-\n", "-");
        */
        this.copyToClipboard(text);
    }

    this.contextMenuActions["copylistexternal"] = this.copylistExternal

    this.contextMenuActions["delitm"] = (e) => {
        let id = this.contextTarget.dataset.id;
        delete polymorph_core.items[id][this.settings.filter];
        if (this.focusOnPrev(this.contextTarget.children[0].children[1]) == false) this.focusOnNext(this.contextTarget.children[0].children[1]);
        if (!this.contextTarget.parentElement.parentElement.dataset.id && this.contextTarget.parentElement.children.length == 2) {
            // if this is a root item and it is about to be deleted so that the root would only have the cursorspan, show the cursorspan
            this.cursorSpan.style.display = "block";
        }
        this.renderItem(id); // remove the span
        container.fire("updateItem", { id: id, sender: this });
        container.fire("deleteItem", { id: id, sender: this });
        return true;
    }

    let doContextSortFactory = (sortType)=>{
        return ()=>{
            let id = this.contextTarget.dataset.id;
            let parentID = polymorph_core.items[id][this.settings.parentProperty];
            // if root item, parent may be undefined; set to ""
            if (!parentID)parentID="";
            this.sortParent(parentID, sortType);
        }
    }

    this.contextMenuActions["sortbydate"] = doContextSortFactory("DATE");
    this.contextMenuActions["sortbyalpha"] = doContextSortFactory("ALPHA");
}