function workflowy_gitfriendly_search() {
    this.holdExpanded = {};
    this.rootdiv.querySelector(".searcher").addEventListener("keyup", (e) => {
        //hide all items
        this.holdExpanded = {};
        if (e.target.value.length > 0) {
            // Hide everything
            for (let i in this.renderedItemCache) {
                if (i) {
                    if (this.settings.filterHides) this.resolveSpan(i).el.style.display = "none";
                    this.resolveSpan(i).el.classList.remove("searchFocused");
                    //rerender to hide the ones we dont want
                    this.renderItem(i, "pdf");
                }
            }
            for (let i in polymorph_core.items) {
                // If the node has the text we want
                if (this.itemRelevant(i) && polymorph_core.items[i][this.settings.titleProperty].toLowerCase().includes(e.target.value.toLowerCase())) {
                    // Gather its parents
                    let ptree = [i];
                    let p = i;
                    while (polymorph_core.items[p][this.settings.parentProperty]) {
                        p = polymorph_core.items[p][this.settings.parentProperty];
                        ptree.unshift(p);
                        if (!this.itemRelevant(p)) {
                            ptree = [];
                            break;
                        };
                    }
                    // Force render all its parents
                    ptree.forEach((v, i) => {
                        // force render it
                        this.renderItem(v, "pdf");
                        let el = this.renderedItemCache[v].el;
                        el.style.display = "block";
                        if (i == ptree.length - 1) {
                            el.classList.add("searchFocused");
                        }
                        if (i != ptree.length - 1 || this.holdExpanded[v]) {
                            this.holdExpanded[v] = true;
                            this.setExpandedState(el, true, true, true);
                        }
                        // set it to expanded
                        // unless it's the last one
                    });
                    // also show all parents (but don't expand?)
                }
            }
        } else {
            for (let i in this.renderedItemCache) {
                if (i) {
                    this.renderItem(i, "d");
                    this.renderedItemCache[i].el.style.display = "block";
                    this.renderedItemCache[i].el.classList.remove("searchFocused");
                }
            }
        }
        //show selected items 
        //v comp expense! use cache if too hard  
    })
}