function _itemcluster_extend_contextmenu() {
    ///////////////////////////////////////////////////////////////////////////////////////
    //Various context menus
    let contextMenuManager = new _contextMenuManager(this.rootdiv);
    let centreXY = {};
    let chk = (e) => {
        if (!e.target.matches("g[data-id] *")) {
            //if (e.target.tagNathis.toLowerCase() == "svg" || e.target == this.tempTR.node) {
            centerXY = this.mapPageToSvgCoords(e.pageX, e.pageY);
            return true; //only activate on clicks to the background.  
        }
    }
    this.rootcontextMenu = contextMenuManager.registerContextMenu(`
        <li class="pastebtn">Paste</li>
        <li class="collect">Collect items here</li>
        <li class="hierarchy">Arrange in hierarchy</li>
        <li class="hierarchy squashed">Arrange in squashed hierarchy</li>
        <li class="hierarchy horizontal">Arrange in horizontal hierarchy</li>
        <li class="hierarchy radial">Arrange in radial hierarchy</li>
        <li class="hierarchy biradial">Arrange in biradial hierarchy</li>
        <li class="search">Search
        <ul class="submenu">
        <li><input class="searchbox"></li>
        <li class="searchNextResult">Next result</li>
        </ul>
        </li>
        <!--<li class="hierarchy radial stepped">Stepped radial hierarchy</li>-->
        `, this.rootdiv, undefined, chk);
    this.rootcontextMenu.querySelector(".pastebtn").addEventListener("click", (e) => {
        if (polymorph_core.shared.itemclusterCopyElement) {
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            polymorph_core.shared.itemclusterCopyElement.forEach((v) => {
                polymorph_core.items[v.id].itemcluster.viewData[this.settings.currentViewName] = {
                    x: coords.x + v.x,
                    y: coords.y + v.y,
                }
                if (this.settings.filter) polymorph_core.items[v.id][this.settings.filter] = true;
                this.arrangeItem(v.id);
                this.container.fire("updateItem", {
                    id: v.id,
                    sender: this
                });
            });
            //arrange everything again for new links to show up
            for (let i in polymorph_core.items) {
                this.arrangeItem(i);
            }
            this.rootcontextMenu.style.display = "none";
        }
    })
    this.rootcontextMenu.querySelector(".collect").addEventListener("click", (e) => {
        let rect = this.itemSpace.getBoundingClientRect();
        for (let i in polymorph_core.items) {
            if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData && polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName]) {
                polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName].x = e.clientX - rect.left;
                polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName].y = e.clientY - rect.top;
                this.arrangeItem(i);
            }
        }
        for (let i in polymorph_core.items) {
            //second update to fix lines; also alert everyone of changes.
            if (this.itemRelevant(i)) this.container.fire("updateItem", {
                id: i
            });
        }
    });

    //hierarchy buttons
    let generateHierarchy = () => {
        //get position of items, and the links to other items
        let visibleItems = [];
        for (let i in polymorph_core.items) {
            if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData && polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName]) {
                visibleItems.push({
                    id: i,
                    x: polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName].x,
                    y: polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName].y,
                    children: Object.keys(polymorph_core.items[i].to || {}),
                    parents: []
                });
            }
        }

        let visibleItemIds = visibleItems.map((v) => v.id);

        //make sure links are relevant (point to items we care about) and directed (not bidirectional)
        visibleItems.forEach((v, _i) => {
                if (v.children) {
                    for (let i = 0; i < v.children.length; i++) {
                        let pos = visibleItemIds.indexOf(v.children[i]);
                        if (pos == -1) {
                            v.children.splice(i, 1);
                            i--;
                        } else if (polymorph_core.items[visibleItems[pos].id].to && Object.keys(polymorph_core.items[visibleItems[pos].id].to).indexOf(v.id) != -1) { //bidirectional links
                            v.children.splice(i, 1);
                            i--;
                        } else {
                            //assign the to item a parent
                            visibleItems[pos].parents.push(_i);
                        }
                    }
                }
            })
            //figure out the level of the item (its level in the hierarchy)
        let queue = [];
        let roots = [];
        for (let i = 0; i < visibleItems.length; i++) {
            //identify root nodes, add them to the queue
            if (visibleItems[i].parents.length == 0) {
                queue.push.apply(queue, visibleItems[i].children);
                visibleItems[i].level = 0;
                visibleItems[i].parent = undefined;
                roots.push(visibleItems[i]);
            }
        }
        if (roots.length > 1) {
            roots.forEach(i => {
                i.level = 1;
                i.parent = "0";
            })
            visibleItems.push({ id: '0', level: 0, x: 0, y: 0, children: roots.map(i => i.id) });
            roots = [{ id: '0' }];
            visibleItemIds.push('0');
        };
        let cycleNodes = [];
        let pretop = undefined;
        while (queue.length) {
            let top = queue.shift();
            if (top == pretop) {
                cycleNodes.push(top);
                continue;
            }
            pretop = top;
            top = visibleItemIds.indexOf(top);
            if (visibleItems[top].parents.reduce((p, i) => p & visibleItems[i].level != undefined, true)) {
                //if all my parents have a defined level
                let maxmax = visibleItems[top].parents.reduce((p, i) => {
                    if (p[0] < visibleItems[i].level) {
                        p[0] = visibleItems[i].level;
                        p[1] = i;
                    }
                    return p;
                }, [0, visibleItems[top].parents[0]]);
                visibleItems[top].level = maxmax[0] + 1;
                visibleItems[top].parent = visibleItems[maxmax[1]].id;
                queue.push.apply(queue, visibleItems[top].children);
            } else {
                queue.push(visibleItems[top].id);
            }
        }
        //clean up the orphans
        visibleItems.filter(i => i.level == undefined).forEach(i => {
            i.level = 1;
            i.parent = roots[0].id;
            visibleItems[visibleItemIds.indexOf(roots[0].id)].children.push(i.id);
            i.children = [];
        });
        //visibleItems = visibleItems.filter(i => cycleNodes.indexOf(i.id) == -1);
        return visibleItems;
    }

    let squashedHierarchy = (e, visibleItems) => {
        //sort for rendering
        visibleItems.sort((a, b) => {
            return (a.level - b.level) + (a.level == b.level) * (a.x - b.x);
        });

        //Fetch individual item widths
        for (let i = 0; i < visibleItems.length; i++) {
            if (this.itemPointerCache[visibleItems[i].id]) {
                let svgi = this.itemPointerCache[visibleItems[i].id].children()[1];
                visibleItems[i].width = svgi.width() + 10;
                visibleItems[i].height = svgi.height() + 10;
            }
        }

        // Get total width of each level
        let levelWidths = [];
        let levelHeights = [];
        visibleItems.forEach(i => {
            if (!levelWidths[i.level]) {
                levelWidths.push(0);
                levelHeights.push(0);
            }
            levelWidths[i.level] += i.width;
            if (i.height > levelHeights[i.level]) levelHeights[i.level] = i.height;
        });

        //roughly group children
        // Start with the root items
        let levelOrders = [
            visibleItems.filter(i => i.level == 0)
        ];
        let seenBefore = {};
        // For all other items, add children if not seen before
        let IDmap = visibleItems.reduce((p, i) => {
            p[i.id] = i;
            return p;
        }, {});
        let addChildrenToLevels = (v) => {
            if (v.children) {
                v.children.forEach(i => {
                    if (!seenBefore[i]) {
                        seenBefore[i] = true;
                        while (!levelOrders[IDmap[i].level]) levelOrders.push([]);
                        levelOrders[IDmap[i].level].push(IDmap[i]);
                        addChildrenToLevels(IDmap[i]);
                    }
                })
            }
        }
        visibleItems.forEach((v) => addChildrenToLevels(v));

        let heightSoFar = 0;
        // render each layer at a time
        levelOrders.forEach((level, li) => {
            let widthSoFar = -levelWidths[li] / 2;
            level.forEach((itm, ii) => {
                if (polymorph_core.items[itm.id]) {
                    polymorph_core.items[itm.id].itemcluster.viewData[this.settings.currentViewName].y = heightSoFar;
                    polymorph_core.items[itm.id].itemcluster.viewData[this.settings.currentViewName].x = widthSoFar;
                    widthSoFar += itm.width;
                }
            });
            heightSoFar += levelHeights[li] + 30;
        })
    }

    let cartesianHierarchy = (e, visibleItems) => {
        //sort for rendering
        visibleItems.sort((a, b) => {
            return (a.level - b.level) + (a.level == b.level) * (a.x - b.x);
        });
        //sort children as well
        let indexedOrder = visibleItems.map((v) => v.id);
        visibleItems.forEach((v) => {
            if (v.children) {
                v.children.sort((a, b) => { return indexedOrder.indexOf(a) - indexedOrder.indexOf(b) });
            }
        });
        //calculate widths
        let getWidth = (id) => {
            if (id == '0') return 0;
            let c = visibleItems[indexedOrder.indexOf(id)].children;
            if (!c || !c.length) {
                return Number(/\d+/.exec(this.itemPointerCache[id].children()[1].width())) + 10;
            } else {
                let sum = 0;
                for (let i = 0; i < c.length; i++) {
                    if (visibleItems[indexedOrder.indexOf(c[i])].parent == id) sum = sum + getWidth(c[i]);
                }
                let alt = Number(/\d+/.exec(this.itemPointerCache[id].children()[1].width())) + 10;
                if (sum < alt) sum = alt;
                return sum;
            }
        }
        for (let i = 0; i < visibleItems.length; i++) {
            //this needs to be optimised with caching.
            visibleItems[i].width = getWidth(visibleItems[i].id);
        }

        // calculate total width
        let tw = 0;
        for (let i = 0; i < visibleItems.length; i++) {
            if (visibleItems[i].parent == undefined) tw += visibleItems[i].width;
            else break;
        }
        let rect = this.itemSpace.getBoundingClientRect();
        let currentx = e.clientX - rect.left - tw / 2;
        let currenty = e.clientY - rect.top;

        let render = (itm, tx, ty) => { // itm is a visibleItem
            if (itm.id != '0') {
                polymorph_core.items[itm.id].itemcluster.viewData[this.settings.currentViewName].x = tx + (itm.width - Number(/\d+/ig.exec(this.itemPointerCache[itm.id].first().width))) / 2;
                polymorph_core.items[itm.id].itemcluster.viewData[this.settings.currentViewName].y = ty;
            }
            let ctx = tx;
            for (let i = 0; i < itm.children.length; i++) {
                if (visibleItems[indexedOrder.indexOf(itm.children[i])].parent == itm.id) ctx += render(visibleItems[indexedOrder.indexOf(itm.children[i])], ctx, ty + 200);
            }
            return itm.width;
        }

        for (let i = 0; i < visibleItems.length; i++) {
            if (visibleItems[i].parent == undefined) currentx += render(visibleItems[i], currentx, currenty);
        }
    }

    let cartesianHierarchyY = (e, visibleItems) => {
        //sort for rendering
        visibleItems.sort((a, b) => {
            return (a.level - b.level) + (a.level == b.level) * (a.y - b.y);
        });
        //sort children as well
        let indexedOrder = visibleItems.map((v) => v.id);
        visibleItems.forEach((v) => {
                if (v.children) {
                    v.children.sort((a, b) => { return indexedOrder.indexOf(a) - indexedOrder.indexOf(b) });
                }
            })
            //calculate widths
        let getWidth = (id) => {
            if (id == '0') return 0;
            let c = visibleItems[indexedOrder.indexOf(id)].children;
            if (!c || !c.length) {
                return Number(/\d+/.exec(this.itemPointerCache[id].children()[1].height())) + 10;
            } else {
                let sum = 0;
                for (let i = 0; i < c.length; i++) {
                    if (visibleItems[indexedOrder.indexOf(c[i])].parent == id) sum = sum + getWidth(c[i]);
                }
                let alt = Number(/\d+/.exec(this.itemPointerCache[id].children()[1].height())) + 10;
                if (sum < alt) sum = alt;
                return sum;
            }
        }
        for (let i = 0; i < visibleItems.length; i++) {
            //this needs to be optimised with caching.
            visibleItems[i].height = getWidth(visibleItems[i].id);
        }

        // calculate total width
        let th = 0;
        for (let i = 0; i < visibleItems.length; i++) {
            if (visibleItems[i].parent == undefined) th += visibleItems[i].height;
            else break;
        }
        let rect = this.itemSpace.getBoundingClientRect();
        let currenty = e.clientX - rect.top - th / 2;
        let currentx = e.clientX - rect.left;

        let render = (itm, tx, ty) => { // itm is a visibleItem
            if (itm.id != '0') {
                polymorph_core.items[itm.id].itemcluster.viewData[this.settings.currentViewName].x = tx;
                polymorph_core.items[itm.id].itemcluster.viewData[this.settings.currentViewName].y = ty + (itm.height - Number(/\d+/ig.exec(this.itemPointerCache[itm.id].first().height))) / 2;
            }
            let cty = ty;
            for (let i = 0; i < itm.children.length; i++) {
                if (visibleItems[indexedOrder.indexOf(itm.children[i])].parent == itm.id) cty += render(visibleItems[indexedOrder.indexOf(itm.children[i])], tx + 200, cty);
            }
            return itm.height;
        }

        for (let i = 0; i < visibleItems.length; i++) {
            if (visibleItems[i].parent == undefined) currenty += render(visibleItems[i], currentx, currenty);
        }
    }
    let rings = [];
    let radialHierarchy = (e, visibleItems) => {
        //nerf all the rings
        rings.forEach(i => i.remove());
        rings = [];
        //sort for rendering
        if (e.target.classList.contains('stepped')) {
            //stepping
            //count levels
            let levelCount = [0];
            let lastLevel = 0;
            for (let i = 0; i < visibleItems.length; i++) {
                if (lastLevel != visibleItems[i].level) {
                    levelCount.push(0);
                    lastLevel = visibleItems[i].level;
                }
                levelCount[visibleItems[i].level]++;
            }
            //if tiers are too thicc, segregate them
            levelCount = levelCount.map((v, i) => { return Math.ceil(v / (2 * Math.PI * 300 * i / 200)) });
            let staggerCount = 0;
            for (let i = 0; i < visibleItems.length; i++) {
                if (levelCount[visibleItems[i].level] != 0) {
                    visibleItems[i].level += ((staggerCount % levelCount[visibleItems[i].level]) / levelCount[visibleItems[i].level]);
                    staggerCount++;
                }
            }
        }
        //resort visibleItems angularly
        visibleItems.sort((a, b) => {
            let aa = Math.atan2(a.y, a.x);
            if (aa < 0) aa += Math.PI * 2;
            let bb = Math.atan2(b.y, b.x);
            if (bb < 0) bb += Math.PI * 2;
            return (a.level - b.level) + (a.level == b.level) * (aa - bb);
        });
        //sort children as well
        let indexedOrder = visibleItems.map((v) => v.id);
        visibleItems.forEach((v) => {
            if (v.children) {
                v.children.sort((a, b) => { return indexedOrder.indexOf(a) - indexedOrder.indexOf(b) });
            }
        })

        //start rendering
        //calculate angles
        let existing = {};
        let getAngle = (id) => {
            if (existing[id]) {
                if (existing[id] < 0) return 1;
                else return existing[id];
            }
            existing[id] = 1;
            let c = visibleItems[indexedOrder.indexOf(id)].children;
            if (!c || !c.length) {
                existing[id] = 1 / (visibleItems[indexedOrder.indexOf(id)].level + 1);
            } else {
                let sum = 0;
                for (let i = 0; i < c.length; i++) {
                    if (visibleItems[indexedOrder.indexOf(c[i])].parent == id) sum = sum + getAngle(c[i]);
                }
                if (sum < 1 / (visibleItems[indexedOrder.indexOf(id)].level + 1)) sum = 1 / (visibleItems[indexedOrder.indexOf(id)].level + 1);
                existing[id] = sum;
            }
            return existing[id];

        }
        for (let i = 0; i < visibleItems.length; i++) {
            //this needs to be optimised with caching.
            visibleItems[i].angle = getAngle(visibleItems[i].id);
        }

        // calculate total width
        let totalAngle = 0;
        for (let i = 0; i < visibleItems.length; i++) {
            if (visibleItems[i].parent == undefined) totalAngle += visibleItems[i].angle;
            else break;
        }

        for (let i = 0; i < visibleItems.length; i++) {
            visibleItems[i].angle *= Math.PI * 2 / totalAngle;
        }


        //calculate the minimum angle deviation per level and adjust radius accordingly
        let radii = {};
        radii[-1] = 0; // to make the algorithm work. yay js hacks
        let lastLevel = 0;
        let minTheta = visibleItems[0].angle;
        let lastLevelZero = 0;
        let previous = -1;
        for (let i = 1; i < visibleItems.length; i++) {
            if (lastLevel != visibleItems[i].level) {
                let tdeviation = (visibleItems[i - 1].angle + visibleItems[lastLevelZero].angle) / 2;
                if (tdeviation < minTheta) minTheta = tdeviation;
                radii[lastLevel] = Math.max(radii[previous] + 200, 200 / minTheta);
                previous = lastLevel;
                lastLevel = visibleItems[i].level;
                minTheta = Math.PI * 3; //reset
                lastLevelZero = i;
            } else {
                let tdeviation = (visibleItems[i - 1].angle + visibleItems[i].angle) / 2;
                if (tdeviation < minTheta) minTheta = tdeviation;
            }
        }

        //final one
        let tdeviation = (visibleItems[visibleItems.length - 1] + visibleItems[lastLevelZero]) / 2;
        if (tdeviation < minTheta) minTheta = tdeviation;
        radii[lastLevel] = Math.max(radii[lastLevel - 1] + 300, 200 / minTheta);
        //first one
        radii[0] = 0;
        //Start rendering!
        let currentT = 0;
        let triedRendering = [];
        let render = (itm, tT, dp) => { // itm is a visibleItem
            if (triedRendering.indexOf(itm.id) != -1) return itm.angle;
            else triedRendering.push(itm.id);
            let r = radii[itm.level];
            if (itm.id != '0') {
                polymorph_core.items[itm.id].itemcluster.viewData[this.settings.currentViewName].x = r * Math.cos(tT + itm.angle / 2);
                polymorph_core.items[itm.id].itemcluster.viewData[this.settings.currentViewName].y = r * Math.sin(tT + itm.angle / 2);
                //polymorph_core.items[itm.id].title += "rn1";
            }
            let ctT = tT;
            for (let i = 0; i < itm.children.length; i++) {
                if (visibleItems[indexedOrder.indexOf(itm.children[i])].parent == itm.id) ctT += render(visibleItems[indexedOrder.indexOf(itm.children[i])], ctT, dp + 1);
            }
            //this.arrangeItem(itm.id);
            return itm.angle;
        }

        for (let i = 0; i < visibleItems.length; i++) {
            if (visibleItems[i].parent == undefined) currentT += render(visibleItems[i], currentT, 0);
        }
        radii = Object.entries(radii).filter(i => i[0] > 0).sort((a, b) => a[0] - b[0]).map(i => i[1]);
        // now add the rings
        rings = radii.map(i => this.svg.circle(2 * i).cx(0).cy(0).stroke('red').fill('transparent').back());
    }

    let biradialHierarchy = (e, visibleItems) => {
        //sort for rendering
        //set parents, get children to calculate their angle relative to parent, and sort by that
        let indexedOrder = visibleItems.map(v => v.id);
        visibleItems.forEach(v => {
            v.children.forEach(c => {
                visibleItems[indexedOrder.indexOf(c)].parent = v.id;
            });
        });
        visibleItems.forEach(v => {
            if (v.parent) {
                let vp = visibleItems[indexedOrder.indexOf(v.parent)];
                v.angle = Math.atan2(v.y - vp.y, v.x - vp.x);
            } else {
                v.angle = Math.atan2(v.y, v.x);
            }
            if (v.angle < 0) v.angle += Math.PI * 2;
        })
        visibleItems.sort((a, b) => {
            return (a.level - b.level) + !(a.level - b.level) * (a.angle - b.angle);
        })
        indexedOrder = visibleItems.map(v => v.id);
        //render

        let binarySolve = (start, end, f, epsilon = 0.1) => {
                let pme, me;
                let cycleCount = 0;
                me = 2 * epsilon;
                pme = 0;
                while (Math.abs(me) > epsilon && cycleCount < 100) { //ack
                    pme = me;
                    me = f((start + end) / 2);
                    if (me < 0) {
                        start = (start + end) / 2;
                    } else {
                        end = (start + end) / 2
                    } //there's another case where both are negative and that should throw a phat exception...
                    if (isNaN(me)) return NaN; //error...
                    cycleCount++;
                }
                if (cycleCount == 100) {
                    return start - 1;
                }
                return (start + end) / 2;
            }
            //calculate radii - from the bottom up
            //let maxLvl = visibleItems[visibleItems.length - 1].level;
        const itemRadius = 100;
        for (let i = visibleItems.length - 1; i >= 0; i--) {

            if (visibleItems[i].children.length == 0) {
                visibleItems[i].r = 0;
                visibleItems[i].rr = itemRadius / 2;
            } else {
                let radii = visibleItems[i].children.filter(c => visibleItems[indexedOrder.indexOf(c)].parent == visibleItems[i].id).map(v => visibleItems[indexedOrder.indexOf(v)].rr);
                let maxRadius = Math.max.apply(undefined, radii);
                let sum = 0;
                radii.forEach(v => sum += v);
                if (sum > maxRadius * 2) {
                    radii = radii.map(v => (v + itemRadius) * 2);
                    visibleItems[i].r = binarySolve(0, visibleItems[i].children.length * maxRadius + itemRadius, (r) => {
                        let totalAngle = 0;
                        radii.forEach(v => { totalAngle += 2 * Math.asin(((v / 2)) / r) });
                        //console.log(totalAngle);
                        if (isNaN(totalAngle)) return -1;
                        return Math.PI * 2 - totalAngle;
                    })
                } else {
                    //sometimes you get radii=[100,200,800] so the two 100 and 200 aren't big enough to cover the remaining space from the 800
                    //so just set radius = 800 and be done with it
                    visibleItems[i].r = maxRadius + itemRadius;
                }
                //Sometimes the asin in the lower line returns a NaN - prevent this by making the operand 1.
                if (visibleItems[i].r < maxRadius + itemRadius) visibleItems[i].r = maxRadius + itemRadius;
                //reported radius - includes child radii as well.
                visibleItems[i].rr = visibleItems[i].r + maxRadius;
            }
            //if ((maxLvl - visibleItems[i].level)==0)visibleItems[i].r=0;
            //else visibleItems[i].r = 100 * 4 ** (maxLvl - visibleItems[i].level-1);
            //also calculate angle of my children while we're here
            visibleItems[i].children.forEach(v => {
                visibleItems[indexedOrder.indexOf(v)].angle = 2 * Math.asin((visibleItems[indexedOrder.indexOf(v)].rr + itemRadius - 1) / visibleItems[i].r);
                if (isNaN(visibleItems[indexedOrder.indexOf(v)].angle)) visibleItems[indexedOrder.indexOf(v)].angle = 0;
            })
        }
        //render, top down
        for (let i = 0; i < visibleItems.length; i++) {
            visibleItems[i].cumulativeAngle = 0;
            if (visibleItems[i].level == 0) {
                if (visibleItems[i].id != '0') {
                    polymorph_core.items[visibleItems[i].id].itemcluster.viewData[this.settings.currentViewName].x = 0;
                    polymorph_core.items[visibleItems[i].id].itemcluster.viewData[this.settings.currentViewName].y = 0;
                }
            } else {
                visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].cumulativeAngle += visibleItems[i].angle / 2;
                if (visibleItems[i].parent != '0') {
                    polymorph_core.items[visibleItems[i].id].itemcluster.viewData[this.settings.currentViewName].x = polymorph_core.items[visibleItems[i].parent].itemcluster.viewData[this.settings.currentViewName].x +
                        Math.cos(visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].cumulativeAngle) * visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].r;
                    polymorph_core.items[visibleItems[i].id].itemcluster.viewData[this.settings.currentViewName].y = polymorph_core.items[visibleItems[i].parent].itemcluster.viewData[this.settings.currentViewName].y +
                        Math.sin(visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].cumulativeAngle) * visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].r;
                } else {
                    polymorph_core.items[visibleItems[i].id].itemcluster.viewData[this.settings.currentViewName].x = Math.cos(visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].cumulativeAngle) * visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].r;
                    polymorph_core.items[visibleItems[i].id].itemcluster.viewData[this.settings.currentViewName].y = Math.sin(visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].cumulativeAngle) * visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].r;
                }
                visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].cumulativeAngle += visibleItems[i].angle / 2;
            }
        }
    }

    this.rootcontextMenu.addEventListener("click", (e) => {
        if (!e.target.classList.contains("hierarchy")) return;
        let visibleItems = generateHierarchy();
        //visible items looks like this:
        /*
        [{children: ["i78f1k"],
        id: "buwnq5",
        level: 0,
        width: 210,
        x: -2544.984375,
        y: 278}]
        */

        //There is a special id:'0' item that is added if there are multiple roots.
        if (e.target.classList.contains('squashed')) {
            squashedHierarchy(e, visibleItems);
        } else if (e.target.classList.contains('radial')) {
            radialHierarchy(e, visibleItems);
        } else if (e.target.classList.contains('biradial')) {
            biradialHierarchy(e, visibleItems);
        } else if (e.target.classList.contains("horizontal")) {
            cartesianHierarchyY(e, visibleItems);
        } else {
            cartesianHierarchy(e, visibleItems);
        }

        for (let id of visibleItems.map(i => i.id)) {
            if (polymorph_core.items[id]) this.container.fire("updateItem", {
                id: id
            });
        }

    })
    this.searchArray = [];
    let searchArrayIndex = 0;
    let focusSearchItem = (index) => {
        let id = this.searchArray[index];
        if (!id) {
            this.rootcontextMenu.querySelector(".searchNextResult").style.background = "palevioletred";
        } else {
            this.rootcontextMenu.querySelector(".searchNextResult").style.background = "white";
            let ic = polymorph_core.items[this.settings.currentViewName].itemcluster;
            ic.scale = 1;
            ic.cx = polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName].x * ic.XZoomFactor;
            ic.cy = polymorph_core.items[id].itemcluster.viewData[this.settings.currentViewName].y;
            this.viewAdjust();
            this.viewGrid();
        }
    }
    this.rootcontextMenu.querySelector(".search input").addEventListener("input", () => {
        //create the search array
        this.searchArray = [];
        for (let id in polymorph_core.items) {
            if (this.itemIsOurs(id)) {
                if (polymorph_core.items[id][this.settings.textProp] && polymorph_core.items[id][this.settings.textProp].includes(this.rootcontextMenu.querySelector(".search input").value)) {
                    this.searchArray.push(id);
                }
            }
        }
        if (searchArrayIndex > this.searchArray.length) searchArrayIndex = 0;
        focusSearchItem(searchArrayIndex);
    });
    this.rootcontextMenu.querySelector(".searchNextResult").addEventListener("click", () => {
        searchArrayIndex++;
        if (searchArrayIndex > this.searchArray.length) {
            searchArrayIndex = 0;
        }
        focusSearchItem(searchArrayIndex);
    })
    this.viewContextMenu = contextMenuManager.registerContextMenu(
        `<li class="viewDeleteButton">Delete</li>
            <li class="viewCloneButton">Clone view</li>
            <li class="viewAsItemButton">Copy view as item</li>`,
        this.viewDropdownContainer
    );
    this.viewContextMenu.querySelector(".viewAsItemButton").addEventListener("click", e => {
        polymorph_core.shared.itemclusterCopyElement = [{ id: this.settings.currentViewName, x: 0, y: 0 }];
        polymorph_core.items[this.settings.currentViewName].itemcluster.viewData = {};
        this.viewContextMenu.style.display = "none";
    });

    this.viewContextMenu.querySelector(".viewDeleteButton").addEventListener("click", e => {
        this.destroyView(this.settings.currentViewName);
        this.viewContextMenu.style.display = "none";
    });

    this.viewCloneButton = this.viewContextMenu.querySelector(".viewCloneButton");
    this.viewCloneButton.addEventListener("click", e => {
        this.cloneView(this.settings.currentViewName);
        this.viewContextMenu.style.display = "none";
    });
    this.itemContextMenu = contextMenuManager.registerContextMenu(
        `<li class="deleteButton">Delete</li>
        <li class="cascadebtn">Cascade by punctuation</li>
        <li class="hierarchybtn">Hierarchy by punctuation</li>
        <li class="scramble">Scramble</li>
        <li class="collcon">Collect connected items</li>
        <li class="cpybtn">Copy (between views)</li>
        <li class="subview">Open Subview</li>
        <li>Edit style
        <ul class="submenu">
            <li class="cstyl">Copy style</li>
            <li class="pstyl">Paste style</li>
            <li><input class="background" placeholder="Background"></li>
            <li><input class="color" placeholder="Color"></li>
        </ul>
        </li>
        <!--<li class="orientation">Reorient subitems</li>-->
          `,
        this.rootdiv,
        ".floatingItem",
        e => {
            let cte = e.target;
            while (!cte.matches(".floatingItem")) cte = cte.parentElement;
            this.contextedElement = cte;
            if (polymorph_core.items[cte.dataset.id].style) {
                this.itemContextMenu.querySelector(".background").value = polymorph_core.items[cte.dataset.id].style.background || "";
                this.itemContextMenu.querySelector(".color").value = polymorph_core.items[cte.dataset.id].style.color || "";
            } else {
                this.itemContextMenu.querySelector(".background").value = "";
                this.itemContextMenu.querySelector(".color").value = "";
            }
            return true;
        }
    );

    let updateStyle = (e) => {
        let cids = [this.contextedElement.dataset.id];
        let applyToAll = false;
        this.movingDivs.forEach((v) => {
            if (v.el.node.dataset.id == cids[0]) {
                //apply to all moving divs.
                applyToAll = true;
            }
        });
        if (applyToAll) {
            cids = this.movingDivs.map((v) => { return v.el.node.dataset.id });
        }
        cids.forEach((cid) => {
            if (!polymorph_core.items[cid].style) polymorph_core.items[cid].style = {};
            polymorph_core.items[cid].style[e.target.className] = e.target.value;
            this.container.fire("updateItem", {
                sender: this,
                id: cid
            });
            this.arrangeItem(cid);
        })
    }
    this.itemContextMenu
        .querySelector(".cstyl")
        .addEventListener("click", () => {
            let cid = this.contextedElement.dataset.id;
            this.copiedStyle = Object.assign({}, polymorph_core.items[cid].style);
            this.itemContextMenu.style.display = "none";
        });
    this.itemContextMenu
        .querySelector(".pstyl")
        .addEventListener("click", () => {
            let cids = [this.contextedElement.dataset.id];
            let applyToAll = false;
            this.movingDivs.forEach((v) => {
                if (v.el.node.dataset.id == cids[0]) {
                    //apply to all moving divs.
                    applyToAll = true;
                }
            });
            if (applyToAll) {
                cids = this.movingDivs.map((v) => { return v.el.node.dataset.id });
            }
            cids.forEach((cid) => {
                polymorph_core.items[cid].style = Object.assign({}, this.copiedStyle);
                this.arrangeItem(cid);
                this.container.fire("updateItem", {
                    sender: this,
                    id: cid
                });
            })
            this.itemContextMenu.style.display = "none";
        });
    this.itemContextMenu
        .querySelector(".background")
        .addEventListener("input", updateStyle);
    this.itemContextMenu
        .querySelector(".color")
        .addEventListener("input", updateStyle);

    this.itemContextMenu
        .querySelector(".deleteButton")
        .addEventListener("click", e => {
            let cids = [this.contextedElement.dataset.id];
            let applyToAll = false;
            this.movingDivs.forEach((v) => {
                if (v.el.node.dataset.id == cids[0]) {
                    //apply to all moving divs.
                    applyToAll = true;
                }
            });
            if (applyToAll) {
                cids = this.movingDivs.map((v) => { return v.el.node.dataset.id });
                this.clearOutMovingDivs();
            }
            cids.forEach((cid) => {
                //delete the div and delete its corresponding item
                this.removeItem(cid);
            })
            this.itemContextMenu.style.display = "none";
        });

    this.itemContextMenu
        .querySelector(".scramble")
        .addEventListener("click", e => {
            let cids = [this.contextedElement.dataset.id];
            let applyToAll = false;
            this.movingDivs.forEach((v) => {
                if (v.el.node.dataset.id == cids[0]) {
                    //apply to all moving divs.
                    applyToAll = true;
                }
            });
            if (applyToAll) {
                cids = this.movingDivs.map((v) => { return v.el.node.dataset.id });
            }
            cids.forEach((cid) => {
                polymorph_core.items[cid].itemcluster.viewData[this.settings.currentViewName].x = Math.random() * 500 / polymorph_core.items[this.settings.currentViewName].itemcluster.XZoomFactor + polymorph_core.items[cids[0]].itemcluster.viewData[this.settings.currentViewName].x
                polymorph_core.items[cid].itemcluster.viewData[this.settings.currentViewName].y = Math.random() * 500 + polymorph_core.items[cids[0]].itemcluster.viewData[this.settings.currentViewName].y
            })
            this.itemContextMenu.style.display = "none";
        });

    this.itemContextMenu
        .querySelector(".collcon")
        .addEventListener("click", e => {
            let thisit = polymorph_core.items[this.contextedElement.dataset.id];
            let toCollect = Object.keys(thisit.to || {});
            toCollect.push.apply(toCollect, Object.keys(this.fromcache[this.contextedElement.dataset.id] || {}));
            toCollect = toCollect.filter(i => polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData && polymorph_core.items[i].itemcluster.viewData[this.settings.currentViewName]);
            toCollect.forEach((v, i) => {
                polymorph_core.items[v].itemcluster.viewData[this.settings.currentViewName].x = thisit.itemcluster.viewData[this.settings.currentViewName].x + 250 * Math.cos(0.2 + 2 * Math.PI * i / toCollect.length) / polymorph_core.items[this.settings.currentViewName].itemcluster.XZoomFactor;
                polymorph_core.items[v].itemcluster.viewData[this.settings.currentViewName].y = thisit.itemcluster.viewData[this.settings.currentViewName].y + 250 * Math.sin(0.2 + 2 * Math.PI * i / toCollect.length);
                this.container.fire("updateItem", { id: v, sender: this });
                this.arrangeItem(v);
            })
        });

    function segment(innerText) {
        innerText = innerText.replace(/(\d+?)\./g, "*$* $1\\.");
        innerText = innerText.replace(/(((?<!\\)\.|\?|\n)+)/g, "$1*$*");
        innerText = innerText.replace(/\n/g, "");
        innerText = innerText.split(/\*\$\*/g);
        innerText = innerText.filter(i => i.length);
        return innerText;
    }
    this.itemContextMenu
        .querySelector(".cascadebtn")
        .addEventListener("click", e => {
            let innerText = polymorph_core.items[this.contextedElement.dataset.id][this.settings.textProp];
            innerText = segment(innerText);

            //filter out newlinefullstops; todo filter out numbered lists?
            //quick adjustement since lookbehinds are not a thing yet
            /*for (let i = 0; i < innerText.length; i++) {
                if (innerText[i][0] == '.' || innerText[i][0] == '?') {
                    if (i > 0) {
                        innerText[i - 1] += innerText[i][0];
                    }
                }
            }
            for (let i = 0; i < innerText.length; i++)if (innerText[i][0] == '\n') innerText[i] = innerText[i].slice(1);// also slices newline chars
            */
            //first
            polymorph_core.items[this.contextedElement.dataset.id][this.settings.textProp] = innerText.shift();
            this.container.fire("updateItem", { id: this.contextedElement.dataset.id, sender: this });
            //create a bunch of items
            let VDT = polymorph_core.items[this.contextedElement.dataset.id].itemcluster.viewData[this.settings.currentViewName];
            let lasty = VDT.y;
            let lastItem = polymorph_core.items[this.contextedElement.dataset.id];
            if (!lastItem.to) lastItem.to = {};
            let newIDs = innerText.map(i => {
                let newItem = {
                    itemcluster: {
                        viewData: {}
                    },
                    to: {}
                };
                newItem[this.settings.textProp] = i;
                newItem[this.settings.filter] = true;
                newItem.itemcluster.viewData[this.settings.currentViewName] = { x: VDT.x, y: lasty += 50 };
                newID = polymorph_core.insertItem(newItem);
                lastItem.to[newID] = true;
                lastItem = polymorph_core.items[newID];
                this.container.fire("updateItem", { id: newID, sender: this });
                return newID;
            });
            this.arrangeItem(this.contextedElement.dataset.id);
            newIDs.forEach(i => {
                this.arrangeItem(i);
            })
            this.itemContextMenu.style.display = "none";
        });


    this.itemContextMenu
        .querySelector(".hierarchybtn")
        .addEventListener("click", e => {
            let innerText = polymorph_core.items[this.contextedElement.dataset.id][this.settings.textProp];
            innerText = segment(innerText)
                //filter out newlinefullstops; todo filter out numbered lists?
                //quick adjustement since lookbehinds are not a thing yet
                /*for (let i = 0; i < innerText.length; i++) {
                    if (innerText[i][0] == '.' || innerText[i][0] == '?') {
                        if (i > 0) {
                            innerText[i - 1] += innerText[i][0];
                        }
                    }
                }
                for (let i = 0; i < innerText.length; i++)if (innerText[i][0] == '\n') innerText[i] = innerText[i].slice(1);// also slices newline chars
                */
                //first
            polymorph_core.items[this.contextedElement.dataset.id][this.settings.textProp] = innerText.shift();
            //create a bunch of items
            let VDT = polymorph_core.items[this.contextedElement.dataset.id].itemcluster.viewData[this.settings.currentViewName];
            let lastItem = polymorph_core.items[this.contextedElement.dataset.id];
            if (!lastItem.to) lastItem.to = {};
            let newIDs = innerText.map((i, ii) => {
                let newItem = {
                    itemcluster: {
                        viewData: {}
                    },
                    to: {}
                };
                newItem[this.settings.textProp] = i;
                newItem[this.settings.filter] = true;
                newItem.itemcluster.viewData[this.settings.currentViewName] = { x: VDT.x + Math.cos(ii / innerText.length * Math.PI * 2) * 200, y: VDT.y + Math.sin(ii / innerText.length * Math.PI * 2) * 200 };
                newID = polymorph_core.insertItem(newItem);
                polymorph_core.items[this.contextedElement.dataset.id].to[newID] = true;
                this.container.fire("updateItem", { id: newID, sender: this });
                return newID;
            });
            this.container.fire("updateItem", { id: this.contextedElement.dataset.id, sender: this });
            this.arrangeItem(this.contextedElement.dataset.id);
            newIDs.forEach(i => {
                this.arrangeItem(i);
            })
            this.itemContextMenu.style.display = "none";
        });
    this.itemContextMenu
        .querySelector(".cpybtn")
        .addEventListener("click", e => {
            //may be multiple
            let coords = this.mapPageToSvgCoords(e.pageX, e.pageY);
            let cids = [this.contextedElement.dataset.id];
            let applyToAll = false;
            this.movingDivs.forEach((v) => {
                if (v.el.node.dataset.id == cids[0]) {
                    //apply to all moving divs.
                    applyToAll = true;
                }
            });
            if (applyToAll) {
                cids = this.movingDivs.map((v) => v.el.node.dataset.id);
                this.clearOutMovingDivs();
            }
            let els = cids.map((v) => {
                return {
                    id: v,
                    x: polymorph_core.items[v].itemcluster.viewData[this.settings.currentViewName].x - coords.x,
                    y: polymorph_core.items[v].itemcluster.viewData[this.settings.currentViewName].y - coords.y
                };
            })
            polymorph_core.shared.itemclusterCopyElement = els;
            this.itemContextMenu.style.display = "none";
        });
    /*this.itemContextMenu
        .querySelector(".orientation")
        .addEventListener("click", e => {
            //toggle the itemcluster orientation
            polymorph_core.items[this.contextedElement.dataset.id].itemcluster.subitemOrientation = !polymorph_core.items[this.contextedElement.dataset.id].itemcluster.subitemOrientation;
            //reupdate
            this.arrangeItem(this.contextedElement.dataset.id);
            this.itemContextMenu.style.display = "none";
        });*/

    this.itemContextMenu
        .querySelector(".subView")
        .addEventListener("click", e => {
            polymorph_core.items[
                this.contextedElement.dataset.id
            ].itemcluster.viewName = polymorph_core.items[
                this.contextedElement.dataset.id
            ][this.settings.textProp];
            this.switchView(this.contextedElement.dataset.id, true, true);
            this.itemContextMenu.style.display = "none";
        });
    this.trayContextMenu = contextMenuManager.registerContextMenu(`
        <li class="delete">Delete</li>
        `, this.tray, "textarea", (e) => {
        this.trayContextedElement = e.target.parentElement.dataset.id;
        return true;
    });
    this.trayContextMenu.querySelector(".delete").addEventListener("click", (e) => {
        if (this.settings.filter) delete polymorph_core.items[this.trayContextedElement][this.settings.filter];
        else {
            polymorph_core.items[this.trayContextedElement].itemcluster.viewData = {}; //nerf it completely
        }
        this.container.fire("updateItem", { id: this.trayContextedElement });
        this.trayContextMenu.style.display = "none";
    })
}