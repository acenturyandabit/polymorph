

function _itemcluster_extend_svg(me) { // very polymorph_core functions! 
    me.svg = SVG(me.rootdiv.querySelector(".itemcluster"));
    me.mapPageToSvgCoords = function (pageX, pageY, vb) {
        let rels = me.svg.node.getBoundingClientRect();
        if (!vb) vb = me.svg.viewbox();
        let ret = {};
        ret.x = (pageX - rels.x) / rels.width * vb.width + vb.x;
        ret.y = (pageY - rels.y) / rels.height * vb.height + vb.y;
        return ret;
    }
    let linePerformanceCache = {};// in start+end, cache [[x,y],[x,y]]
    me.fromcache = {};

    me.arrangeItem = function (id) {
        let sel = me.rootdiv.getRootNode().getSelection();
        let prerange = null;
        if (sel.rangeCount && me.rootdiv.getRootNode().activeElement && me.rootdiv.getRootNode().activeElement.matches(`[data-id="${id}"] *`)) {
            //return immediately, delay the fn call
            //setTimeout(() => me.arrangeItem(id), 1000);
            //return;
            let _prerange = sel.getRangeAt(0);
            prerange = {}
            let props = ["collapsed"
                , "commonAncestorContainer"
                , "endContainer"
                , "endOffset"
                , "startContainer"
                , "startOffset"];
            props.forEach(i => {
                prerange[i] = _prerange[i];
            })
            prerange["node"] = _prerange.startContainer.parentElement;
        }
        //first, get the element(s)
        let previousHandle = me.itemPointerCache[id];
        //check if item relevant
        let willShow = true;
        if (!me.itemRelevant(id)) willShow = false;
        else if (!polymorph_core.items[id].itemcluster.viewData || !polymorph_core.items[id].itemcluster.viewData[me.settings.currentViewName]) willShow = false;

        //remove the elements if not
        if (!willShow) {
            if (previousHandle) {
                previousHandle.remove();
                delete me.itemPointerCache[id];
            }
            return;
        } else {
            if (!previousHandle) {
                previousHandle = me.svg.group().attr({ "data-id": id, class: "floatingItem" });
                previousHandle.add(me.svg.circle(10).fill("transparent").stroke({ width: 2, color: "red" }).cx(0).cy(0));
                let fob = me.svg.foreignObject(50, 20).x(10).y(-10);
                previousHandle.add(fob);
                me.itemPointerCache[id] = previousHandle;
                fob.node.appendChild(htmlwrap(`<div style='position:absolute; margin:0; color: white; background:rgba(10,10,10,0.2)'><p contenteditable class="tta"></p><p style="background:white; color:black" contenteditable class="ttb"></p></div>`));
                //we will need to force link in from all existing items, because.
                for (let i in me.itemPointerCache) {
                    if (polymorph_core.items[i].to && polymorph_core.items[i].to[id]) {
                        // render the link
                        if (i == me.prevFocusID || id == me.prevFocusID) {
                            me.enforceLine(i, id, "red");
                        } else {
                            me.enforceLine(i, id);
                        }
                    }
                }
            }
            //actually update, only if necessary, to save processor time.
            let positionChanged = Math.abs(previousHandle.x() - polymorph_core.items[id].itemcluster.viewData[me.settings.currentViewName].x * polymorph_core.items[me.settings.currentViewName].itemcluster.XZoomFactor) > 0.01 || Math.abs(previousHandle.y() - polymorph_core.items[id].itemcluster.viewData[me.settings.currentViewName].y) > 0.01;
            if (positionChanged) {
                previousHandle.move(polymorph_core.items[id].itemcluster.viewData[me.settings.currentViewName].x * polymorph_core.items[me.settings.currentViewName].itemcluster.XZoomFactor, polymorph_core.items[id].itemcluster.viewData[me.settings.currentViewName].y);
                //draw its lines
            }

            //fill in the textarea inside
            let tta = me.itemPointerCache[id].node.querySelector("p.tta");
            let ttb = me.itemPointerCache[id].node.querySelector("p.ttb");
            let dvd = me.itemPointerCache[id].node.querySelector("div");

            if (polymorph_core.items[id].style) { // dont update this if it hasn't changed.
                if (JSON.stringify(polymorph_core.items[id].style) != JSON.stringify(me.cachedStyle[id])) {
                    dvd.style.background = polymorph_core.items[id].style.background || "";
                    previousHandle.first().style("color", polymorph_core.items[id].style.color || matchContrast((/rgba?\([\d,\s]+\)/.exec(getComputedStyle(tta).background) || ['#000000'])[0]));
                    me.cachedStyle[id] = JSON.parse(JSON.stringify(polymorph_core.items[id].style));
                }
            }
            if (!(polymorph_core.items[id][this.settings.textProp])) {
                polymorph_core.items[id][this.settings.textProp] = "_";
            }
            if (!polymorph_core.items[id][this.settings.focusExtendProp]){
                polymorph_core.items[id][this.settings.focusExtendProp] = "_";
            }
            let widthInvalidated=false;
            if (tta.innerText != polymorph_core.items[id][this.settings.textProp]) {
                tta.innerText = polymorph_core.items[id][this.settings.textProp];
                widthInvalidated=true;
            }
            if (ttb.innerText != polymorph_core.items[id][this.settings.focusExtendProp]) {
                ttb.innerText = polymorph_core.items[id][this.settings.focusExtendProp];
                widthInvalidated=true;
            }
            if (widthInvalidated){
                dvd.style.width = (Math.sqrt(tta.innerText.length + ttb.innerText.length) + 1) * 23;
                dvd.parentElement.setAttribute("width", dvd.scrollWidth);
                if (me.prevFocusID == id) {
                    setTimeout(() => {
                        dvd.parentElement.setAttribute("height", dvd.scrollHeight);
                    })
                } else {
                    setTimeout(() => {
                        dvd.parentElement.setAttribute("height", tta.scrollHeight);
                    })
                }
            }
            let fob = me.itemPointerCache[id].children()[1];
            if (fob.width() == 0) {// when container starts invisible, fob does not show.
                fob.size(dvd.scrollWidth, tta.scrollHeight);
            }

            //add icons if necessary
            /*if (polymorph_core.items[id].itemcluster.viewName) {
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
                for (let i in polymorph_core.items) {
                    if (polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData && polymorph_core.items[i].itemcluster.viewData[id]) count++;
                }
                subviewItemCount.innerText = count;
            } else {
                if (rect.node.children[0].querySelector(".subviewItemCount")) {
                    rect.node.children[0].querySelector(".subviewItemCount").remove();
                }
            }*/

            if (polymorph_core.items[id].to) {
                for (let i in polymorph_core.items[id].to) {
                    if (polymorph_core.items[i] && polymorph_core.items[i].itemcluster && polymorph_core.items[i].itemcluster.viewData[me.settings.currentViewName]) {
                        if (i == me.prevFocusID || id == me.prevFocusID) {
                            me.enforceLine(id, i, "red");
                        } else {
                            me.enforceLine(id, i);
                        }
                    }
                    if (!me.fromcache[i]) me.fromcache[i] = {};
                    me.fromcache[i][id] = true;
                }
            }
            // also enforce lines to this element without using the doubleupdatecapacitor, by looking at the from cache.
            if (me.fromcache[id]) {
                for (let i in me.fromcache[id]) {
                    if (!polymorph_core.items[i].to[id]) delete me.fromcache[id][i];
                    else if (i == me.prevFocusID || id == me.prevFocusID) {
                        me.enforceLine(i, id, "red");
                    } else {
                        me.enforceLine(i, id);
                    }
                }
            }

            if (prerange) {
                let newRange = new Range();
                newRange.setStart(prerange.startContainer, prerange.startOffset);
                newRange.setEnd(prerange.startContainer, prerange.endOffset);
                let props = ["collapsed"
                    , "commonAncestorContainer"
                    , "endContainer"
                    , "endOffset"
                    , "startContainer"
                    , "startOffset"];
                props.forEach(i => {
                    newRange[i] = prerange[i];
                })
                sel.removeAllRanges();
                sel.addRange(newRange);
            }
        }
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
        if (polymorph_core.isLinked(start, end) % 2) {
            polymorph_core.unlink(start, end);
            if (me.activeLines[start] && me.activeLines[start][end]) me.activeLines[start][end].remove();
            delete me.activeLines[start][end];
            delete me.fromcache[end][start];
        } else {
            polymorph_core.link(start, end);
            me.enforceLine(start, end);
        }
    };

    me.redrawLines = function (ci, style = "black") {
        for (let j in me.activeLines[ci]) {
            me.enforceLine(ci, j, style);
        }
        for (let j in me.fromcache[ci]) {
            me.enforceLine(j, ci, style);
        }
    }


    me.enforceLine = function (start, end, style = "black") {
        let sd = me.itemPointerCache[start];
        let ed = me.itemPointerCache[end];
        if (!sd || !ed) {
            return;
        }

        //check if line already exists
        let cp;
        if (me.activeLines[start] && me.activeLines[start][end]) {
            //if so, edit instead of create
            cp = me.activeLines[start][end];
        } else {
            if (!me.activeLines[start]) me.activeLines[start] = {};
            cp = me.svg.path().stroke({ width: 2, color: style });
            cp.marker('mid', 9, 6, function (add) {
                add.path("M0,0 L0,6 L9,3 z").fill("black");
            })
            me.activeLines[start][end] = cp;
            if (!me.fromcache[end]) me.fromcache[end] = {};
            me.fromcache[end][start] = true;
            //problem: when lines are cleared, lines do not redraw because lineperformancecache is not clear.
            if (linePerformanceCache[start]) delete linePerformanceCache[start][end];
        }

        //if either is not visible, then dont draw
        if (sd.style.display == "none" || ed.style.display == "none") {
            cp.hide();
            return;
        } else {
            if (!(!(linePerformanceCache[start])
                || !(linePerformanceCache[start][end])
                || !(Math.abs(linePerformanceCache[start][end][0][0] - sd.x()) < 0.01)
                || !(Math.abs(linePerformanceCache[start][end][0][1] - sd.y()) < 0.01)
                || !(Math.abs(linePerformanceCache[start][end][1][0] - ed.x()) < 0.01)
                || !(Math.abs(linePerformanceCache[start][end][1][1] - ed.y()) < 0.01)
                || !(linePerformanceCache[start][end][2] == style)
            )) return;
            let x = [sd.cx(), 0, ed.cx()];
            let y = [sd.cy(), 0, ed.cy()];
            x[1] = (x[0] + x[2]) / 2;
            y[1] = (y[0] + y[2]) / 2;
            cp.plot(`M ${x[0]} ${y[0]} L ${x[1]} ${y[1]} L ${x[2]} ${y[2]}`);
            cp.stroke({ width: 2, color: style });
            cp.back();
            if (!linePerformanceCache[start]) linePerformanceCache[start] = {};
            linePerformanceCache[start][end] = [[sd.x(), sd.y()], [ed.x(), ed.y()], style];
        }
    };


    //arrange items 
    for (let i in polymorph_core.items) {
        me.arrangeItem(i);
    }
    //twice for lines, as some items may not have loaded yets
    for (let i in polymorph_core.items) {
        me.arrangeItem(i);
    }
    if (me.viewGrid) {
        me.viewGrid();
    }
}
