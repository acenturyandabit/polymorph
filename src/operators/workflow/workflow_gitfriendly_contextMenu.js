let workflowy_gitfriendly_extend_contextMenu = function () {
    this.contextTarget = undefined;
    let contextmenu;
    let recordContexted = (e) => {
        this.contextTarget = e.target;
        /*
        while (!this.contextTarget.matches(".floatingItem")) this.contextTarget = this.contextTarget.parentElement;
        if (polymorph_core.items[this.contextTarget.dataset.id].style) {
            contextmenu.querySelector(".background").value = polymorph_core.items[this.contextTarget.dataset.id].style.background || "";
            contextmenu.querySelector(".color").value = polymorph_core.items[this.contextTarget.dataset.id].style.color || "";
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
    <li>Copy items
    <ul class="submenu">
        <li data-action="copylist">Copy item tree for pasting</li>
        <li data-action="copylistinternal">Copy item tree internally</li>
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
            this.contextMenuActions[e.target.dataset.action](e);
            contextmenu.style.display = "none";
        }
    });
    contextmenu.addEventListener("input", (e) => {
        if (this.contextMenuActions[e.target.dataset.action]) this.contextMenuActions[e.target.dataset.action](e);
    });
    this.contextmenu = contextmenu;
    //<li data-action="sortbydate">Copy subitems recursively as list</li>
    this.contextMenuActions = {};
    /*let savedStyle = undefined;
    this.contextMenuActions["cstyl"] = (e) => {
        let spanWithID = this.contextTarget.parentElement.parentElement;
        let id = spanWithID.dataset.id;
        savedStyle = polymorph_core.items[id].style;
    }

    this.contextMenuActions["pstyl"] = (e) => {
        if (savedStyle) {
            let spanWithID = this.contextTarget.parentElement.parentElement;
            let id = spanWithID.dataset.id;
            polymorph_core.items[id].style = savedStyle;
            this.contextTarget.style.background = savedStyle.background;
            this.contextTarget.style.color = savedStyle.color;
        }
    }

    this.contextMenuActions["color"] = (e) => {
        spanWithID = e.target.value;
        let spanWithID = this.contextTarget.parentElement.parentElement;
        let id = spanWithID.dataset.id;
        savedStyle = polymorph_core.items[id].style;
    }

    this.contextMenuActions["background"] = (e) => {
        let spanWithID = this.contextTarget.parentElement.parentElement;
        let id = spanWithID.dataset.id;
        savedStyle = polymorph_core.items[id].style;
    }*/

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
    }


    this.contextMenuActions["copylist"] = (e) => {
        console.log(this.contextTarget);
        let rootElementPair = [this.contextTarget.parentElement.parentElement,0];
        let runStack = [rootElementPair];
        let resultStack = [];
        while (runStack.length){
            let top = runStack.pop();
            resultStack.push([top[0].children[0].children[1].innerText, top[1]])
            let childItemDiv = top[0].children[top[0].children.length-1]; // not just 1, becuase of the rich edit mode. but always last
            for (let i=childItemDiv.children.length-1;i>=0;i--){
                runStack.push([
                    childItemDiv.children[i],
                    top[1]+1
                ]);
            }
        }
        //convert to indented list
        let text = resultStack.map(pair=>Array(pair[1]*4).fill(" ").join("") + "- " + pair[0]).join("\n");


        /* old method
            let text = this.contextTarget.parentElement.parentElement.innerText;
            // Format the text for a bit
            text = text.replace("▼", "-").replace("●", "-");
            // Replace extra newlines
            text = text.replace("-\n", "-");
        */
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
    }
    this.contextMenuActions["delitm"] = (e) => {
        let spanWithID = this.contextTarget.parentElement.parentElement;
        let id = spanWithID.dataset.id;
        delete polymorph_core.items[id][this.settings.filter];
        if (this.focusOnPrev(spanWithID.children[0].children[1]) == false) this.focusOnNext(spanWithID.children[0].children[1]);
        if (!spanWithID.parentElement.parentElement.dataset.id && spanWithID.parentElement.children.length == 2) {
            // if this is a root item and it is about to be deleted so that the root would only have the cursorspan, show the cursorspan
            this.cursorSpan.style.display = "block";
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
    //             result = dateParser.getSortingTime(polymorph_core.items[a][property].datestring, new Date(polymorph_core.items[a][property].date[0].refdate))
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
}