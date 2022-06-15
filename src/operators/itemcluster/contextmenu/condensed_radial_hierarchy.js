function _itemcluster_extend_contextmenu_condensed_radial_hierarchy() {
    let condensedBtn = htmlwrap(`<li class="orbit">Arrange in condensed radial hierarchy</li>`);
    this.rootContextMenu.querySelector(".hierarchy_ctr ul").appendChild(condensedBtn);
    condensedBtn.addEventListener("click", (e) => {
        let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
        let visibleItems = this.contextmenuUtils.generateHierarchy();

        /*
        [{
            children: ["sxtrqa6_NtEIRq_324"]
            id: "sxtrqa6_NtSW+0/_634"
            level: 3
            parent: "sxtrqa6_NtSdSvO_635"
            parents: [4]
            x: 1089
            y: 724.828125
        }] // no sort guarantee :/
        */

        let itemsDict = visibleItems.reduce((p, i) => { p[i.id] = i; return p }, {});
        // nuke children that dont consider me as parent...
        visibleItems.forEach(itm => {
            itm.children = itm.children.filter(i => itemsDict[i].parent == itm.id);
        });

        // sort by level, and also clump by parents
        visibleItems.sort((a, b) => {
            if (a.level != b.level) return b.level - a.level;
            else if (a.parent != b.parent) return a.parent > b.parent ? 1 : -1;
            else return 0;
        });


        let common_parent_aggregate_right_tree = [];
        // only holds right side from centre offsets at each level
        let prevNode = { parent: "" };
        let baseItemWidth = 200;
        visibleItems.forEach(itm => {
            // step: aggregate the item's profile tree
            if (itm.children.length) {
                let totalChildrenWidth = itm.children.reduce((p, i) => p + (itemsDict[i].spacingFromPrevNode || 0), 0) + baseItemWidth;
                let aggregate_spacing_from_prev_node = (-totalChildrenWidth + baseItemWidth) / 2;
                // profile tree is: for each level, [leftmost from centre, rightmost from centre]
                itm.profileTree = [
                    [aggregate_spacing_from_prev_node, (totalChildrenWidth + baseItemWidth) / 2]
                ]; // 0th index is level below current level
                itm.children.sort((a, b) =>
                    visibleItems.indexOf(itemsDict[a]) - visibleItems.indexOf(itemsDict[b])
                );
                itm.children.map(i => itemsDict[i]).forEach(child_itm => {
                    // skew its profile tree by its offset, if it has any
                    if (child_itm.spacingFromPrevNode) {
                        aggregate_spacing_from_prev_node += child_itm.spacingFromPrevNode;
                    }
                    let skewed_profile_tree = child_itm.profileTree.map(i => [i[0] + aggregate_spacing_from_prev_node, i[1] + aggregate_spacing_from_prev_node]);
                    skewed_profile_tree.forEach((i, ii) => {
                        while (itm.profileTree.length < ii + 2) {
                            itm.profileTree.push([0, 0])
                        }
                        itm.profileTree[ii + 1] = [Math.min(itm.profileTree[ii + 1][0], i[0]), Math.max(itm.profileTree[ii + 1][1], i[1])];
                    });
                });
                // used in rendering
                // adjust for self width so it seems a little nicer
                itm.children_left_offset = -(totalChildrenWidth - baseItemWidth) / 2;
            } else {
                itm.profileTree = []; // no children, no profileTree
            }

            // calculate the spacing from the previous node, if prev node has same parent
            if (prevNode.parent == itm.parent) {
                let levelSums = common_parent_aggregate_right_tree.map((i, ii) => {
                    if (itm.profileTree.length <= ii) {
                        return 0;
                    }
                    return i - itm.profileTree[ii][0];
                });
                itm.spacingFromPrevNode = Math.max(baseItemWidth, ...levelSums);
                itm.prevNode = prevNode.id;

                // merge to create a new aggregate right tree
                let new_common_parent_aggregate_right_tree = [];
                for (let lvl = 0; lvl < Math.max(common_parent_aggregate_right_tree.length, itm.profileTree.length); lvl++) {
                    let a = undefined;
                    if (lvl < common_parent_aggregate_right_tree.length) a = common_parent_aggregate_right_tree[lvl] - itm.spacingFromPrevNode;
                    let b = undefined;
                    if (lvl < itm.profileTree.length) {
                        b = itm.profileTree[lvl][1];
                    }
                    let result;
                    if (a == undefined) result = b;
                    else if (b == undefined) result = a;
                    else result = Math.max(a, b);
                    new_common_parent_aggregate_right_tree.push(result);
                }
                common_parent_aggregate_right_tree = new_common_parent_aggregate_right_tree;
            } else {
                common_parent_aggregate_right_tree = itm.profileTree.map(i => i[1]);
            }
            prevNode = itm;
        });

        // render from top down
        visibleItems.sort((a, b) => a.level - b.level);

        //todo: make this work for multi-root graphs
        visibleItems.forEach(i => {
            i.y = i.level * 250;
            if (!i.parent) {
                i.x = 0;
            } else if (i.prevNode) {
                i.x = itemsDict[i.prevNode].x + (i.spacingFromPrevNode || 0);
            } else {
                i.x = itemsDict[i.parent].x + itemsDict[i.parent].children_left_offset;
            }
        })

        /*
        // wrap xy coords to r-t coords
        // heavy skewing for uneven graphs
        let levelBounds = {}; // level: [max,min]
        visibleItems.forEach(i => {
            // special case where the item is the only item on the level, so +1
            if (!levelBounds[i.level]) levelBounds[i.level] = [i.x, i.x + 1];

            if (levelBounds[i.level][0] > i.x) levelBounds[i.level][0] = i.x;
            if (levelBounds[i.level][1] < i.x) levelBounds[i.level][1] = i.x;
        });

        visibleItems.forEach(i => {
            let r = i.y;
            let th = (i.x - levelBounds[i.level][0]) / (levelBounds[i.level][1] - levelBounds[i.level][0]) * 2 * Math.PI;
            i.x = r * Math.cos(th);
            i.y = r * Math.sin(th);
        });
        */


        // wrap xy coords to r-t coords
        let levelBounds = {}; // level: [max,min]
        visibleItems.forEach(i => {
            // special case where the item is the only item on the level, so +1
            if (!levelBounds[i.level]) levelBounds[i.level] = [i.x, i.x + 1];

            if (levelBounds[i.level][0] > i.x) levelBounds[i.level][0] = i.x;
            if (levelBounds[i.level][1] < i.x) levelBounds[i.level][1] = i.x;
        });

        visibleItems.forEach(i => {
            let r = i.y;
            let th = (i.x - levelBounds[i.level][0]) / (levelBounds[i.level][1] - levelBounds[i.level][0]) * Math.PI;
            i.x = r * Math.cos(th + Math.PI);
            i.y = -r * Math.sin(th + Math.PI);
        });

        // TODO: apply a bit of thermal to it


        visibleItems.map((i, ii) => {
            polymorph_core.items[i.id].itemcluster.viewData[this.settings.currentViewName].x = i.x;
            polymorph_core.items[i.id].itemcluster.viewData[this.settings.currentViewName].y = i.y;
            //polymorph_core.items[i.id].title = ii; // useful for debugging
            this.container.fire("updateItem", { id: i.id, sender: this });
            this.arrangeItem(i.id);
        });

        this.rootContextMenu.style.display = "none";
    });

}