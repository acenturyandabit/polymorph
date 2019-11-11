function _itemcluster_extend_svg(me) { // very core functions! 
    me.svg = SVG(me.rootdiv.querySelector(".itemcluster"));
    me.mapPageToSvgCoords = function (pageX, pageY, vb) {
        let rels = me.svg.node.getBoundingClientRect();
        if (!vb) vb = me.svg.viewbox();
        let ret = {};
        ret.x = (pageX - rels.x) / rels.width * vb.width + vb.x;
        ret.y = (pageY - rels.y) / rels.height * vb.height + vb.y;
        return ret;
    }
    me.arrangeItem = function (id) {
        if (!core.items[id].itemcluster || (!core.items[id].itemcluster.viewData && !core.items[id].itemcluster.viewName))
            return false;
        if (!core.items[id].itemcluster.viewData) return true; // this is not an item - its a view, but we still care about it
        if (!core.items[id].itemcluster.viewData[me.settings.currentViewName]) {
            //if an item of it exists, hide the item
            let rect = me.itemPointerCache[id];
            if (rect) {
                rect.remove();
                delete me.itemPointerCache[id];
            }
            return true;
        }
        //enforce a property on it with viewName.
        if (!core.items[id][`__itemcluster_${me.settings.currentViewName}`]) core.items[id][`__itemcluster_${me.settings.currentViewName}`] = true;
        let rect = me.itemPointerCache[id];
        if (!rect) {
            //need to make a new rectangle
            //let _rect = rect.rect(100, 50);
            rect = me.svg.foreignObject(100, 50).attr({
                "data-id": id,
                class: "floatingItem"
            });
            rect.appendChild("div");
            me.itemPointerCache[id] = rect;
            me.itemPointerCache[id].node.children[0].appendChild(document.createElement("textarea"));
        }
        rect.show();
        if (core.items[id].itemcluster.viewData[me.settings.currentViewName]) {
            rect.move(core.items[id].itemcluster.viewData[me.settings.currentViewName].x, core.items[id].itemcluster.viewData[me.settings.currentViewName].y);
        }
        //fill in the textarea inside
        let tta = me.itemPointerCache[id].node.children[0].children[0];
        tta.value = core.items[id].title || "";
        if (core.items[id].style) { // dont update this if it hasn't changed.
            if (JSON.stringify(core.items[id].style) != JSON.stringify(me.cachedStyle[id])) {
                tta.style.background = core.items[id].style.background || "";
                tta.style.color = core.items[id].style.color || matchContrast((/rgba?\([\d,\s]+\)/.exec(getComputedStyle(tta).background) || ['#ffffff'])[0]);
                me.cachedStyle[id] = JSON.parse(JSON.stringify(core.items[id].style));
            }

        }
        if (!core.items[id].boxsize) {
            core.items[id].boxsize = {
                w: "200px",
                h: "100px"
            };
        }
        me.itemPointerCache[id].node.children[0].style.width = core.items[id].boxsize.w || "";
        me.itemPointerCache[id].node.children[0].style.height = core.items[id].boxsize.h || "";
        rect.size(Number(/\d+/ig.exec(core.items[id].boxsize.w)[0]), Number(/\d+/ig.exec(core.items[id].boxsize.h)[0]));

        //add icons if necessary
        if (core.items[id].itemcluster.viewName) {
            //this has a subview, make it known!.
            let subviewItemCount;
            if (rect.node.querySelector(".subviewItemCount")) {
                subviewItemCount = rect.node.querySelector(".subviewItemCount");
            } else {
                subviewItemCount = document.createElement("p");
                subviewItemCount.style.cssText = `
                    display: block;
                    width: 1em;
                    height: 1em;
                    font-size: 0.7em;
                    margin: 0px;
                    text-align: center;
                    background: orange;
                    `;
                subviewItemCount.classList.add("subviewItemCount");
                rect.node.children[0].appendChild(subviewItemCount);
                //also count all the items in my subview and report.
            }
            let count = 0;
            for (let i in core.items) {
                if (core.items[i].itemcluster && core.items[i].itemcluster.viewData && core.items[i].itemcluster.viewData[id]) count++;
            }
            subviewItemCount.innerText = count;
        } else {
            if (rect.node.children[0].querySelector(".subviewItemCount")) {
                rect.node.children[0].querySelector(".subviewItemCount").remove();
            }
        }
        //draw its lines
        if (core.items[id].to) {
            for (let i in core.items[id].to) {
                if (i == me.prevFocusID || id == me.prevFocusID) {
                    me.enforceLine(id, i, "red");
                } else {
                    me.enforceLine(id, i);
                }
            }
        }
        //also delete lines associated with it
        return true;
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //Lines


    me.linkingLine = me.svg.line(0, 0, 0, 0).stroke({
        width: 3
    }).back();
    me.activeLines = {};
    me.toggleLine = function (start, end) {
        //start and end is now directional. 
        //check if linked; if linked, remove link
        if (core.isLinked(start, end) % 2) {
            core.unlink(start, end);
            if (me.activeLines[start] && me.activeLines[start][end]) me.activeLines[start][end].remove();
            delete me.activeLines[start][end];
        } else {
            core.link(start, end);
            me.enforceLine(start, end);
        }
    };
    me.redrawLines = function (ci, style = "black") {
        for (let i in me.activeLines) {
            for (let j in me.activeLines[i]) {
                if (i == ci || j == ci) {// this could STILL be done better
                    me.enforceLine(i, j, style);
                }
            }
        }
    }
    me.enforceLine = function (start, end, style = "black") {
        let sd = me.itemPointerCache[start];
        let ed = me.itemPointerCache[end];
        if (!sd || !ed) {
            return;
        }
        //check if line already exists
        if (me.activeLines[start] && me.activeLines[start][end]) {
            //if so, remove
            me.activeLines[start][end].remove();
        }

        //if either is not visible, then dont draw
        if (sd.style.display == "none" || ed.style.display == "none") {
            return;
        } else {
            if (!me.activeLines[start]) me.activeLines[start] = {};
            let x = [sd.cx(), 0, ed.cx()];
            let y = [sd.cy(), 0, ed.cy()];
            x[1] = (x[0] + x[2]) / 2;
            y[1] = (y[0] + y[2]) / 2;
            let l = me.svg.path(`M ${x[0]} ${y[0]} L ${x[1]} ${y[1]} L ${x[2]} ${y[2]}`).stroke({ width: 2, color: style });
            l.marker('mid', 9, 6, function (add) {
                add.path("M0,0 L0,6 L9,3 z").fill(style);
            })
            me.activeLines[start][end] = l;
            l.back();
        }
    };


    //arrange items 
    for (let i in core.items) {
        me.arrangeItem(i);
    }
    //twice for lines, as some items may not have loaded yets
    for (let i in core.items) {
        me.arrangeItem(i);
    }
    if (me.viewGrid) {
        me.viewGrid();
    }
}