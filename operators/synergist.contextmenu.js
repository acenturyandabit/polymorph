function _synergist_extend_contextmenu(me) {
    ///////////////////////////////////////////////////////////////////////////////////////
    //Various context menus
    scriptassert([
        ["contextmenu", "genui/contextMenu.js"]
    ], () => {
        let contextMenuManager = new _contextMenuManager(me.rootdiv);
        function chk(e) {
            if (e.target.tagName.toLowerCase() == "svg") return true;//only activate on clicks to the background.
        }
        me.rootcontextMenu = contextMenuManager.registerContextMenu(`
        <li class="pastebtn">Paste</li>
        <li class="collect">Collect items here</li>
        <li class="hierarchy">Arrange in hierarchy</li>
        <li class="hierarchy radial">Arrange in radial hierarchy</li>
        <!--<li class="hierarchy radial stepped">Stepped radial hierarchy</li>-->
        `, me.rootdiv, undefined, chk);
        me.rootcontextMenu.querySelector(".pastebtn").addEventListener("click", (e) => {
            if (core.shared.synergistCopyElement) {
                let coords = me.mapPageToSvgCoords(e.pageX, e.pageY);
                core.shared.synergistCopyElement.forEach((v) => {
                    core.items[v.id].itemcluster.viewData[me.settings.currentViewName] = {
                        x: coords.x + v.x,
                        y: coords.y + v.y,
                    }
                    me.arrangeItem(v.id);
                    core.fire("updateItem", {
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
                core.fire("updateItem", {
                    id: i
                });
            }
        })
        me.rootcontextMenu.addEventListener("click", (e) => {
            if (!e.target.classList.contains("hierarchy")) return;
            let rect = me.itemSpace.getBoundingClientRect();

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
            if (!e.target.classList.contains('radial')) {
                //sort by level, then x.
                visibleItems.sort((a, b) => {
                    return (a.level - b.level) + !(a.level - b.level) * (a.x - b.x);
                });
            } else {
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
                    //resort visibleItems

                }
                visibleItems.sort((a, b) => {
                    let aa = Math.atan2(a.y, a.x);
                    if (aa < 0) aa += Math.PI * 2;
                    let bb = Math.atan2(b.y, b.x);
                    if (bb < 0) bb += Math.PI * 2;
                    return (a.level - b.level) + !(a.level - b.level) * (aa - bb);
                });
            }
            //for each item's children, sort it by x position.
            let indexedOrder = visibleItems.map((v) => v.id);
            visibleItems.forEach((v) => {
                if (v.children) {
                    v.children.sort((a, b) => { return indexedOrder.indexOf(a) - indexedOrder.indexOf(b) });
                }
            })

            if (!e.target.classList.contains('radial')) {
                //normal
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

                //visible items looks like this:

                /*
                [{children: ["i78f1k"],
                id: "buwnq5",
                level: 0,
                width: 210,
                x: -2544.984375,
                y: 278}]
                */


                //Start rendering!
                let currentx = e.clientX - rect.left - tw / 2;
                let currenty = e.clientY - rect.top;

                function render(itm, tx, ty) { // itm is a visibleItem
                    core.items[itm.id].itemcluster.viewData[me.settings.currentViewName].x = tx + (itm.width - Number(/\d+/ig.exec(core.items[itm.id].boxsize.w))) / 2;
                    core.items[itm.id].itemcluster.viewData[me.settings.currentViewName].y = ty;
                    let ctx = tx;
                    for (let i = 0; i < itm.children.length; i++) {
                        ctx += render(visibleItems[indexedOrder.indexOf(itm.children[i])], ctx, ty + 200);
                    }
                    me.arrangeItem(itm.id);
                    return itm.width;
                }

                for (let i = 0; i < visibleItems.length; i++) {
                    if (visibleItems[i].parent == undefined) currentx += render(visibleItems[i], currentx, currenty);
                }
            } else {

                //calculate widths
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
                let previous=-1;
                for (let i = 1; i < visibleItems.length; i++) {
                    if (lastLevel != visibleItems[i].level) {
                        let tdeviation = (visibleItems[i - 1].angle + visibleItems[lastLevelZero].angle) / 2;
                        if (tdeviation < minTheta) minTheta = tdeviation;
                        radii[lastLevel] = Math.max(radii[previous] + 300, 200 / minTheta);
                        previous=lastLevel;
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
                    me.arrangeItem(itm.id);
                    return itm.angle;
                }

                for (let i = 0; i < visibleItems.length; i++) {
                    if (visibleItems[i].parent == undefined) currentT += render(visibleItems[i], currentT, 0);
                }
            }
            for (let i in core.items) {
                //second update to fix lines; also alert everyone of changes.
                core.fire("updateItem", {
                    id: i
                });
            }

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
                core.fire("updateItem", {
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
                    core.fire("updateItem", {
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
                core.shared.synergistCopyElement = els;
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
            core.fire("updateItem", { id: me.trayContextedElement });
            me.trayContextMenu.style.display = "none";
        })
    });
}