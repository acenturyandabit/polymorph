function _itemcluster_extend_contextmenu(me) {
    ///////////////////////////////////////////////////////////////////////////////////////
    //Various context menus
    scriptassert([
        ["contextmenu", "genui/contextMenu.js"]
    ], () => {
        let contextMenuManager = new _contextMenuManager(me.rootdiv);
        let centreXY = {};
        function chk(e) {
            if (e.target.tagName.toLowerCase() == "svg" || e.target == me.tempTR.node) return true;//only activate on clicks to the background.
            centerXY = me.mapPageToSvgCoords(e.pageX, e.pageY);
        }
        me.rootcontextMenu = contextMenuManager.registerContextMenu(`
        <li class="pastebtn">Paste</li>
        <li class="collect">Collect items here</li>
        <li class="hierarchy">Arrange in hierarchy</li>
        <li class="hierarchy radial">Arrange in radial hierarchy</li>
        <li class="hierarchy biradial">Arrange in biradial hierarchy</li>
        <li class="search">Search
        <ul class="submenu">
        <li><input class="searchbox"></li>
        <li class="searchNextResult">Next result</li>
        </ul>
        </li>
        <!--<li class="hierarchy radial stepped">Stepped radial hierarchy</li>-->
        `, me.rootdiv, undefined, chk);
        me.rootcontextMenu.querySelector(".pastebtn").addEventListener("click", (e) => {
            if (core.shared.itemclusterCopyElement) {
                let coords = me.mapPageToSvgCoords(e.pageX, e.pageY);
                core.shared.itemclusterCopyElement.forEach((v) => {
                    core.items[v.id].itemcluster.viewData[me.settings.currentViewName] = {
                        x: coords.x + v.x,
                        y: coords.y + v.y,
                    }
                    if (me.settings.filter)core.items[v.id][me.settings.filter]=true;
                    me.arrangeItem(v.id);
                    me.container.fire("updateItem", {
                        id: v.id,
                        sender: me
                    });
                });
                //arrange everything again for new links to show up
                for (let i in core.items) {
                    me.arrangeItem(i);
                }
                me.rootcontextMenu.style.display = "none";
            }
        })
        me.rootcontextMenu.querySelector(".collect").addEventListener("click", (e) => {
            let rect = me.itemSpace.getBoundingClientRect();
            for (let i in core.items) {
                if (core.items[i].itemcluster && core.items[i].itemcluster.viewData && core.items[i].itemcluster.viewData[me.settings.currentViewName]) {
                    core.items[i].itemcluster.viewData[me.settings.currentViewName].x = e.clientX - rect.left;
                    core.items[i].itemcluster.viewData[me.settings.currentViewName].y = e.clientY - rect.top;
                    me.arrangeItem(i);
                }
            }
            for (let i in core.items) {
                //second update to fix lines; also alert everyone of changes.
                me.container.fire("updateItem", {
                    id: i
                });
            }
        })
        //hierarchy buttons

        function generateHierarchy() {
            //get position of items, and the links to other items
            let visibleItems = [];
            for (let i in core.items) {
                if (core.items[i].itemcluster && core.items[i].itemcluster.viewData && core.items[i].itemcluster.viewData[me.settings.currentViewName]) {
                    visibleItems.push({
                        id: i,
                        x: core.items[i].itemcluster.viewData[me.settings.currentViewName].x,
                        y: core.items[i].itemcluster.viewData[me.settings.currentViewName].y,
                        children: Object.keys(core.items[i].to || {}),
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
                        } else if (core.items[visibleItems[pos].id].to && Object.keys(core.items[visibleItems[pos].id].to).indexOf(v.id) != -1) {//bidirectional links
                            v.children.splice(i, 1);
                            i--;
                        } else {
                            //assign the to item a parent
                            visibleItems[pos].parent = _i;
                        }
                    }
                }
            })
            //figure out the level of the item (its level in the hierarchy)
            for (let i = 0; i < visibleItems.length; i++) {
                let stack = [];
                if (visibleItems[i].level == undefined) {
                    stack.push(i);
                }
                while (stack.length) {
                    let li = stack[stack.length - 1];
                    if (visibleItems[li].level != undefined) {
                        stack.pop();
                        continue;
                    }
                    if (visibleItems[li].parent != undefined) {
                        if (visibleItems[visibleItems[li].parent].level != undefined) {
                            visibleItems[li].level = visibleItems[visibleItems[li].parent].level + 1;
                            stack.pop();
                        } else if (stack.indexOf(visibleItems[li].parent) != -1) {
                            //cycle - abort
                            visibleItems[li].level = 0;
                            stack.pop();
                        } else {
                            stack.push(visibleItems[li].parent);
                        }
                    } else {
                        //I am a root node, set my level to 0
                        visibleItems[li].level = 0;
                        stack.pop();
                    }
                }
            }
            return visibleItems;
        }

        function cartesianHierarchy(e, visibleItems) {
            //sort for rendering
            visibleItems.sort((a, b) => {
                return (a.level - b.level) + !(a.level - b.level) * (a.x - b.x);
            });
            //sort children as well
            let indexedOrder = visibleItems.map((v) => v.id);
            visibleItems.forEach((v) => {
                if (v.children) {
                    v.children.sort((a, b) => { return indexedOrder.indexOf(a) - indexedOrder.indexOf(b) });
                }
            })
            //calculate widths
            function getWidth(id) {
                let c = visibleItems[indexedOrder.indexOf(id)].children;
                if (!c || !c.length) {
                    return Number(/\d+/.exec(core.items[id].boxsize.w)) + 10;
                } else {
                    let sum = 0;
                    for (let i = 0; i < c.length; i++) {
                        sum = sum + getWidth(c[i]);
                    }
                    let alt = Number(/\d+/.exec(core.items[id].boxsize.w)) + 10;
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
            let rect = me.itemSpace.getBoundingClientRect();
            let currentx = e.clientX - rect.left - tw / 2;
            let currenty = e.clientY - rect.top;

            function render(itm, tx, ty) { // itm is a visibleItem
                core.items[itm.id].itemcluster.viewData[me.settings.currentViewName].x = tx + (itm.width - Number(/\d+/ig.exec(core.items[itm.id].boxsize.w))) / 2;
                core.items[itm.id].itemcluster.viewData[me.settings.currentViewName].y = ty;
                let ctx = tx;
                for (let i = 0; i < itm.children.length; i++) {
                    ctx += render(visibleItems[indexedOrder.indexOf(itm.children[i])], ctx, ty + 200);
                }
                return itm.width;
            }

            for (let i = 0; i < visibleItems.length; i++) {
                if (visibleItems[i].parent == undefined) currentx += render(visibleItems[i], currentx, currenty);
            }
        }

        function radialHierarchy(e, visibleItems) {
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
                return (a.level - b.level) + !(a.level - b.level) * (aa - bb);
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
            function getAngle(id) {
                let c = visibleItems[indexedOrder.indexOf(id)].children;
                if (!c || !c.length) {
                    return 1;
                } else {
                    let sum = 0;
                    for (let i = 0; i < c.length; i++) {
                        sum = sum + getAngle(c[i]);
                    }
                    return sum;
                }
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
                    radii[lastLevel] = Math.max(radii[previous] + 300, 200 / minTheta);
                    previous = lastLevel;
                    lastLevel = visibleItems[i].level;
                    minTheta = Math.PI * 3;//reset
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
            function render(itm, tT, dp) { // itm is a visibleItem
                let r = radii[itm.level];
                core.items[itm.id].itemcluster.viewData[me.settings.currentViewName].x = r * Math.cos(tT + itm.angle / 2);
                core.items[itm.id].itemcluster.viewData[me.settings.currentViewName].y = r * Math.sin(tT + itm.angle / 2);
                let ctT = tT;
                for (let i = 0; i < itm.children.length; i++) {
                    ctT += render(visibleItems[indexedOrder.indexOf(itm.children[i])], ctT, dp + 1);
                }
                //me.arrangeItem(itm.id);
                return itm.angle;
            }

            for (let i = 0; i < visibleItems.length; i++) {
                if (visibleItems[i].parent == undefined) currentT += render(visibleItems[i], currentT, 0);
            }
        }

        function biradialHierarchy(e, visibleItems) {
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
                }
                else {
                    v.angle = Math.atan2(v.y, v.x);
                }
                if (v.angle < 0) v.angle += Math.PI * 2;
            })
            visibleItems.sort((a, b) => {
                return (a.level - b.level) + !(a.level - b.level) * (a.angle - b.angle);
            })
            indexedOrder = visibleItems.map(v => v.id);
            //render

            function binarySolve(start, end, f, epsilon = 0.1) {
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
                    }//there's another case where both are negative and that should throw a phat exception...
                    if (isNaN(me)) return NaN;//error...
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
                    let radii = visibleItems[i].children.map(v => visibleItems[indexedOrder.indexOf(v)].rr);
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
                    if (visibleItems[i].r<maxRadius+itemRadius)visibleItems[i].r=maxRadius+itemRadius; 
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
                    core.items[visibleItems[i].id].itemcluster.viewData[me.settings.currentViewName].x = 0;
                    core.items[visibleItems[i].id].itemcluster.viewData[me.settings.currentViewName].y = 0;
                } else {
                    visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].cumulativeAngle += visibleItems[i].angle / 2;
                    core.items[visibleItems[i].id].itemcluster.viewData[me.settings.currentViewName].x = core.items[visibleItems[i].parent].itemcluster.viewData[me.settings.currentViewName].x +
                        Math.cos(visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].cumulativeAngle) * visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].r;
                    core.items[visibleItems[i].id].itemcluster.viewData[me.settings.currentViewName].y = core.items[visibleItems[i].parent].itemcluster.viewData[me.settings.currentViewName].y +
                        Math.sin(visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].cumulativeAngle) * visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].r;
                    visibleItems[indexedOrder.indexOf(visibleItems[i].parent)].cumulativeAngle += visibleItems[i].angle / 2;
                }
            }
        }

        me.rootcontextMenu.addEventListener("click", (e) => {
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
            if (e.target.classList.contains('radial')) {
                radialHierarchy(e, visibleItems);
            } else if (e.target.classList.contains('biradial')) {
                biradialHierarchy(e, visibleItems);
            } else {
                cartesianHierarchy(e, visibleItems);
            }
            
            for (let i in core.items) {
                me.container.fire("updateItem", {
                    id: i
                });
            }

        })
        me.searchArray = [];
        let searchArrayIndex = 0;
        function focusSearchItem(index) {
            let id = me.searchArray[index];
            if (!id) {
                me.rootcontextMenu.querySelector(".searchNextResult").style.background = "palevioletred";
            } else {
                me.rootcontextMenu.querySelector(".searchNextResult").style.background = "white";
                let ic = core.items[me.settings.currentViewName].itemcluster;
                ic.scale = 1;
                ic.cx = core.items[id].itemcluster.viewData[me.settings.currentViewName].x;
                ic.cy = core.items[id].itemcluster.viewData[me.settings.currentViewName].y;
                me.viewAdjust();
                me.viewGrid();
            }
        }
        me.rootcontextMenu.querySelector(".search input").addEventListener("input", () => {
            //create the search array
            me.searchArray = [];
            for (let id in core.items) {
                if (me.itemIsOurs(id)) {
                    if (core.items[id].title && core.items[id].title.includes(me.rootcontextMenu.querySelector(".search input").value)) {
                        me.searchArray.push(id);
                    }
                }
            }
            if (searchArrayIndex > me.searchArray.length) searchArrayIndex = 0;
            focusSearchItem(searchArrayIndex);
        });
        me.rootcontextMenu.querySelector(".searchNextResult").addEventListener("click", () => {
            searchArrayIndex++;
            if (searchArrayIndex > me.searchArray.length) {
                searchArrayIndex = 0;
            }
            focusSearchItem(searchArrayIndex);
        })
        me.viewContextMenu = contextMenuManager.registerContextMenu(
            `<li class="viewDeleteButton">Delete</li>
                  <li class="viewCloneButton">Clone view</li>`,
            me.viewDropdownContainer
        );
        me.viewDeleteButton = me.viewContextMenu.querySelector(
            ".viewDeleteButton"
        );
        me.viewDeleteButton.addEventListener("click", e => {
            //delete the view
            me.destroyView(me.settings.currentViewName);
            me.viewContextMenu.style.display = "none";
        });

        me.viewCloneButton = me.viewContextMenu.querySelector(".viewCloneButton");
        me.viewCloneButton.addEventListener("click", e => {
            //delete the view
            me.cloneView(me.settings.currentViewName);
            me.viewContextMenu.style.display = "none";
        });
        me.itemContextMenu = contextMenuManager.registerContextMenu(
            `<li class="deleteButton">Delete</li>
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
          <li class="orientation">Reorient subitems</li>
          `,
            me.rootdiv,
            ".floatingItem",
            e => {
                let cte = e.target;
                while (!cte.matches(".floatingItem")) cte = cte.parentElement;
                me.contextedElement = cte;
                if (core.items[cte.dataset.id].style) {
                    me.itemContextMenu.querySelector(".background").value = core.items[cte.dataset.id].style.background || "";
                    me.itemContextMenu.querySelector(".color").value = core.items[cte.dataset.id].style.color || "";
                } else {
                    me.itemContextMenu.querySelector(".background").value = "";
                    me.itemContextMenu.querySelector(".color").value = "";
                }
                return true;
            }
        );

        function updateStyle(e) {
            let cids = [me.contextedElement.dataset.id];
            let applyToAll = false;
            me.movingDivs.forEach((v) => {
                if (v.el.node.dataset.id == cids[0]) {
                    //apply to all moving divs.
                    applyToAll = true;
                }
            });
            if (applyToAll) {
                cids = me.movingDivs.map((v) => { return v.el.node.dataset.id });
            }
            cids.forEach((cid) => {
                if (!core.items[cid].style) core.items[cid].style = {};
                core.items[cid].style[e.target.className] = e.target.value;
                me.container.fire("updateItem", {
                    sender: me,
                    id: cid
                });
                me.arrangeItem(cid);
            })
        }
        me.itemContextMenu
            .querySelector(".cstyl")
            .addEventListener("click", () => {
                let cid = me.contextedElement.dataset.id;
                me.copiedStyle = Object.assign({}, core.items[cid].style);
                me.itemContextMenu.style.display = "none";
            });
        me.itemContextMenu
            .querySelector(".pstyl")
            .addEventListener("click", () => {
                let cids = [me.contextedElement.dataset.id];
                let applyToAll = false;
                me.movingDivs.forEach((v) => {
                    if (v.el.node.dataset.id == cids[0]) {
                        //apply to all moving divs.
                        applyToAll = true;
                    }
                });
                if (applyToAll) {
                    cids = me.movingDivs.map((v) => { return v.el.node.dataset.id });
                }
                cids.forEach((cid) => {
                    core.items[cid].style = Object.assign({}, me.copiedStyle);
                    me.arrangeItem(cid);
                    me.container.fire("updateItem", {
                        sender: me,
                        id: cid
                    });
                })
                me.itemContextMenu.style.display = "none";
            });
        me.itemContextMenu
            .querySelector(".background")
            .addEventListener("input", updateStyle);
        me.itemContextMenu
            .querySelector(".color")
            .addEventListener("input", updateStyle);

        me.itemContextMenu
            .querySelector(".deleteButton")
            .addEventListener("click", e => {
                let cids = [me.contextedElement.dataset.id];
                let applyToAll = false;
                me.movingDivs.forEach((v) => {
                    if (v.el.node.dataset.id == cids[0]) {
                        //apply to all moving divs.
                        applyToAll = true;
                    }
                });
                if (applyToAll) {
                    cids = me.movingDivs.map((v) => { return v.el.node.dataset.id });
                    me.clearOutMovingDivs();
                }
                cids.forEach((cid) => {
                    //delete the div and delete its corresponding item
                    me.removeItem(cid);
                })
                me.itemContextMenu.style.display = "none";
            });
        me.itemContextMenu
            .querySelector(".cpybtn")
            .addEventListener("click", e => {
                //may be multiple
                let coords = me.mapPageToSvgCoords(e.pageX, e.pageY);
                let cids = [me.contextedElement.dataset.id];
                let applyToAll = false;
                me.movingDivs.forEach((v) => {
                    if (v.el.node.dataset.id == cids[0]) {
                        //apply to all moving divs.
                        applyToAll = true;
                    }
                });
                if (applyToAll) {
                    cids = me.movingDivs.map((v) => v.el.node.dataset.id);
                    me.clearOutMovingDivs();
                }
                let els = cids.map((v) => {
                    return {
                        id: v,
                        x: core.items[v].itemcluster.viewData[me.settings.currentViewName].x - coords.x,
                        y: core.items[v].itemcluster.viewData[me.settings.currentViewName].y - coords.y
                    };
                })
                core.shared.itemclusterCopyElement = els;
                me.itemContextMenu.style.display = "none";
            });
        me.itemContextMenu
            .querySelector(".orientation")
            .addEventListener("click", e => {
                //toggle the itemcluster orientation
                core.items[me.contextedElement.dataset.id].itemcluster.subitemOrientation = !core.items[me.contextedElement.dataset.id].itemcluster.subitemOrientation;
                //reupdate
                me.arrangeItem(me.contextedElement.dataset.id);
                me.itemContextMenu.style.display = "none";
            });

        me.itemContextMenu
            .querySelector(".subView")
            .addEventListener("click", e => {
                core.items[
                    me.contextedElement.dataset.id
                ].itemcluster.viewName = core.items[
                    me.contextedElement.dataset.id
                ].title;
                me.switchView(me.contextedElement.dataset.id, true, true);
                me.itemContextMenu.style.display = "none";
            });
        me.trayContextMenu = contextMenuManager.registerContextMenu(`
        <li class="delete">Delete</li>
        `, me.tray, "textarea", (e) => {
            me.trayContextedElement = e.target.parentElement.dataset.id;
            return true;
        });
        me.trayContextMenu.querySelector(".delete").addEventListener("click", (e) => {
            if (me.settings.filter) delete core.items[me.trayContextedElement][me.settings.filter];
            else {
                core.items[me.trayContextedElement].itemcluster.viewData = {};//nerf it completely
            }
            me.container.fire("updateItem", { id: me.trayContextedElement });
            me.trayContextMenu.style.display = "none";
        })
    });
}