function _itemcluster_extend_contextmenu_entropic_hierarchy() {
    let entHierBtn = htmlwrap(`<li>Arrange in Entropic Hierarchy (100)</li>`);
    let entHierBtn1 = htmlwrap(`<li>Arrange in Entropic Hierarchy (1)</li>`);
    this.rootContextMenu.querySelector(".hierarchy_ctr ul").appendChild(entHierBtn);
    this.rootContextMenu.querySelector(".hierarchy_ctr ul").appendChild(entHierBtn1);

    let doEntropicHierarchyIterations = (nIters) => {
        let visibleItems = this.contextmenuUtils.generateHierarchy();
        //this.rootContextMenu.style.display = "none";
        // end result:
        // -> no items are in each others' personal radii.
        // --> two items repel each other if within personal radii
        // -> if an item is not in another item's subtree, it is not in its level-radius.
        // --> two items repel each other if one is not part of another's subtree but within each others' level-radius. 
        // --> if both not part of each others subtree, strong repulsion. if parent/child; only one sided repulsion.
        // -> level-radii are minimised.
        // --> if an item is part of another item's subtree, there is an attraction

        // cache: is item in another item's subtree (idx0 to idx0)
        let inSubtreeQuery = visibleItems.map(i => []); // start with empty storage
        visibleItems.forEach((v, i) => v.idx0 = i);

        // children are in id-space, transpose to idx-space
        let ididxmap = {};
        visibleItems.forEach(i => ididxmap[i.id] = i.idx0);
        visibleItems.forEach(i => i.children = i.children.map(c => ididxmap[c]));

        visibleItems.sort((a, b) => b.level - a.level);

        let idxMap = visibleItems.map(i => 0);
        visibleItems.forEach((v, i) => idxMap[v.idx0] = i);


        visibleItems.forEach(v => {
            inSubtreeQuery[v.idx0].push(...v.children);
            v.children.forEach(c => inSubtreeQuery[v.idx0].push(...inSubtreeQuery[c]));
        })
        let dist = (i1, i2) => {
            return Math.sqrt(
                (visibleItems[i1].x - visibleItems[i2].x) ** 2 + (visibleItems[i1].y - visibleItems[i2].y) ** 2
            )
        }
        let personalRadius = 200;
        let tempFactor = 3;
        for (let iteration = 0; iteration < nIters; iteration++) {
            console.log("===== it =====");
            // calculate proto-(level-radii) for all items
            visibleItems.forEach((v, i) => {
                let distances_to_subtree = inSubtreeQuery[v.idx0].map(other => dist(i, idxMap[other]));
                v.level_radius = Math.max(...distances_to_subtree, personalRadius);
            });
            // jiggle things by the temperature
            let currentTemp = tempFactor * (nIters - iteration - 1);
            visibleItems.forEach((i, ii) => {
                if (ii == visibleItems.length - 1) return;
                i.x += Math.random() * currentTemp - currentTemp / 2;
                i.y += Math.random() * currentTemp - currentTemp / 2;
            });
            for (let i1 = 0; i1 < visibleItems.length; i1++) {
                for (let i2 = 0; i2 < visibleItems.length; i2++) {
                    if (i1 == i2) continue;
                    let pairDist = dist(i1, i2);
                    let dPairDist = 0;
                    // repel if in personal radius
                    if (pairDist < personalRadius) {
                        dPairDist += (personalRadius - pairDist) / 20; // repel a bit
                        //console.log(`too close, repelling ${i1} and ${i2} by ${personalRadius} - ${pairDist} = ${personalRadius - pairDist} `);
                    }
                    // repel if not in subtree and in subtree radis
                    if (inSubtreeQuery[visibleItems[i1].idx0].indexOf(visibleItems[i2].idx0) == -1) {
                        if (inSubtreeQuery[visibleItems[i2].idx0].indexOf(visibleItems[i1].idx0) == -1) {
                            if (visibleItems[i1].level_radius - pairDist > 0) {
                                //console.log(`Repelling ${i1} and ${i2} by ${visibleItems[i1].level_radius} - ${pairDist} = ${visibleItems[i1].level_radius - pairDist} `);
                                dPairDist += (visibleItems[i1].level_radius - pairDist) / 200; // repel a bit
                            }
                        }
                    } else {
                        // attract if in subtree, weaker if further tier away
                        dPairDist -= 40 / (visibleItems[i2].level - visibleItems[i1].level); // arbitrary number umm hope it works
                        // todo: attract _whole_ subtree!??
                    }
                    dPairDist /= 100;
                    // move both i2 relative to i1, but dont move last (root) item
                    let dt = Math.atan2((visibleItems[i2].y - visibleItems[i1].y), (visibleItems[i2].x - visibleItems[i1].x));
                    if (i2 != visibleItems.length - 1) {
                        visibleItems[i2].x = visibleItems[i1].x + (pairDist + dPairDist) * Math.cos(dt);
                        visibleItems[i2].y = visibleItems[i1].y + (pairDist + dPairDist) * Math.sin(dt);
                    }
                    dt = Math.atan2((visibleItems[i1].y - visibleItems[i2].y), (visibleItems[i1].x - visibleItems[i2].x));
                    if (i1 != visibleItems.length - 1) {
                        visibleItems[i1].x = visibleItems[i2].x + (pairDist + dPairDist) * Math.cos(dt);
                        visibleItems[i1].y = visibleItems[i2].y + (pairDist + dPairDist) * Math.sin(dt);
                    }
                }
            }
        }
        visibleItems.map((i, ii) => {
            polymorph_core.items[i.id].itemcluster.viewData[this.settings.currentViewName].x = i.x;
            polymorph_core.items[i.id].itemcluster.viewData[this.settings.currentViewName].y = i.y;
            //polymorph_core.items[i.id].title = ii; // useful for debugging
            this.container.fire("updateItem", { id: i.id, sender: this });
            this.arrangeItem(i.id);
        });
    }
    entHierBtn.addEventListener("click", (e) => {
        doEntropicHierarchyIterations(100);
    });
    entHierBtn1.addEventListener("click", (e) => {
        doEntropicHierarchyIterations(1);
    });


}