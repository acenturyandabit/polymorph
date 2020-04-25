// http://www.w3.org/TR/AERT#color-contrast
function matchContrast(col) {
    var colours = {
        "aliceblue": "#f0f8ff", "antiquewhite": "#faebd7", "aqua": "#00ffff", "aquamarine": "#7fffd4", "azure": "#f0ffff",
        "beige": "#f5f5dc", "bisque": "#ffe4c4", "black": "#000000", "blanchedalmond": "#ffebcd", "blue": "#0000ff", "blueviolet": "#8a2be2", "brown": "#a52a2a", "burlywood": "#deb887",
        "cadetblue": "#5f9ea0", "chartreuse": "#7fff00", "chocolate": "#d2691e", "coral": "#ff7f50", "cornflowerblue": "#6495ed", "cornsilk": "#fff8dc", "crimson": "#dc143c", "cyan": "#00ffff",
        "darkblue": "#00008b", "darkcyan": "#008b8b", "darkgoldenrod": "#b8860b", "darkgray": "#a9a9a9", "darkgreen": "#006400", "darkkhaki": "#bdb76b", "darkmagenta": "#8b008b", "darkolivegreen": "#556b2f",
        "darkorange": "#ff8c00", "darkorchid": "#9932cc", "darkred": "#8b0000", "darksalmon": "#e9967a", "darkseagreen": "#8fbc8f", "darkslateblue": "#483d8b", "darkslategray": "#2f4f4f", "darkturquoise": "#00ced1",
        "darkviolet": "#9400d3", "deeppink": "#ff1493", "deepskyblue": "#00bfff", "dimgray": "#696969", "dodgerblue": "#1e90ff",
        "firebrick": "#b22222", "floralwhite": "#fffaf0", "forestgreen": "#228b22", "fuchsia": "#ff00ff",
        "gainsboro": "#dcdcdc", "ghostwhite": "#f8f8ff", "gold": "#ffd700", "goldenrod": "#daa520", "gray": "#808080", "green": "#008000", "greenyellow": "#adff2f",
        "honeydew": "#f0fff0", "hotpink": "#ff69b4",
        "indianred ": "#cd5c5c", "indigo": "#4b0082", "ivory": "#fffff0", "khaki": "#f0e68c",
        "lavender": "#e6e6fa", "lavenderblush": "#fff0f5", "lawngreen": "#7cfc00", "lemonchiffon": "#fffacd", "lightblue": "#add8e6", "lightcoral": "#f08080", "lightcyan": "#e0ffff", "lightgoldenrodyellow": "#fafad2",
        "lightgrey": "#d3d3d3", "lightgreen": "#90ee90", "lightpink": "#ffb6c1", "lightsalmon": "#ffa07a", "lightseagreen": "#20b2aa", "lightskyblue": "#87cefa", "lightslategray": "#778899", "lightsteelblue": "#b0c4de",
        "lightyellow": "#ffffe0", "lime": "#00ff00", "limegreen": "#32cd32", "linen": "#faf0e6",
        "magenta": "#ff00ff", "maroon": "#800000", "mediumaquamarine": "#66cdaa", "mediumblue": "#0000cd", "mediumorchid": "#ba55d3", "mediumpurple": "#9370d8", "mediumseagreen": "#3cb371", "mediumslateblue": "#7b68ee",
        "mediumspringgreen": "#00fa9a", "mediumturquoise": "#48d1cc", "mediumvioletred": "#c71585", "midnightblue": "#191970", "mintcream": "#f5fffa", "mistyrose": "#ffe4e1", "moccasin": "#ffe4b5",
        "navajowhite": "#ffdead", "navy": "#000080",
        "oldlace": "#fdf5e6", "olive": "#808000", "olivedrab": "#6b8e23", "orange": "#ffa500", "orangered": "#ff4500", "orchid": "#da70d6",
        "palegoldenrod": "#eee8aa", "palegreen": "#98fb98", "paleturquoise": "#afeeee", "palevioletred": "#d87093", "papayawhip": "#ffefd5", "peachpuff": "#ffdab9", "peru": "#cd853f", "pink": "#ffc0cb", "plum": "#dda0dd", "powderblue": "#b0e0e6", "purple": "#800080",
        "rebeccapurple": "#663399", "red": "#ff0000", "rosybrown": "#bc8f8f", "royalblue": "#4169e1",
        "saddlebrown": "#8b4513", "salmon": "#fa8072", "sandybrown": "#f4a460", "seagreen": "#2e8b57", "seashell": "#fff5ee", "sienna": "#a0522d", "silver": "#c0c0c0", "skyblue": "#87ceeb", "slateblue": "#6a5acd", "slategray": "#708090", "snow": "#fffafa", "springgreen": "#00ff7f", "steelblue": "#4682b4",
        "tan": "#d2b48c", "teal": "#008080", "thistle": "#d8bfd8", "tomato": "#ff6347", "turquoise": "#40e0d0",
        "violet": "#ee82ee",
        "wheat": "#f5deb3", "white": "#ffffff", "whitesmoke": "#f5f5f5",
        "yellow": "#ffff00", "yellowgreen": "#9acd32"
    };
    //returns either black or white from either a #COLOR or a rgb(color) or a name.
    cols = /\#(..)(..)(..)/i.exec(col)
    if (!cols) {
        cols = /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(col);
        if (!cols) {
            //its probably a name color
            col = col.toLowerCase();
            if (colours[col]) {
                return matchContrast(colours[col]);
            } else return "black";//no idea
        }
    } else {
        cols = [cols[0], cols[1], cols[2], cols[3]];
        cols[1] = parseInt(cols[1], 16);
        cols[2] = parseInt(cols[2], 16);
        cols[3] = parseInt(cols[3], 16);
    }
    if (!cols) throw "Invalid color: " + col;
    let value = Math.round(((parseInt(cols[1]) * 299) +
        (parseInt(cols[2]) * 587) +
        (parseInt(cols[3]) * 114)) / 1000);
    return (value > 125) ? 'black' : 'white';
}

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

    me.arrangeItem = function (id) {
        let sel = me.rootdiv.getRootNode().getSelection();
        let prerange = null;
        if (sel.rangeCount && me.rootdiv.getRootNode().activeElement && me.rootdiv.getRootNode().activeElement.matches(`[data-id="${id}"] *`)) {
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
            }
            //actually update, only if necessary, to save processor time.
            let positionChanged=Math.abs(previousHandle.x() - polymorph_core.items[id].itemcluster.viewData[me.settings.currentViewName].x) > 0.01 && Math.abs(previousHandle.y() - polymorph_core.items[id].itemcluster.viewData[me.settings.currentViewName].y) > 0.01;
            if (positionChanged) {
                previousHandle.move(polymorph_core.items[id].itemcluster.viewData[me.settings.currentViewName].x, polymorph_core.items[id].itemcluster.viewData[me.settings.currentViewName].y);
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
            if ((tta.innerText != polymorph_core.items[id][this.settings.textProp]) || (ttb.innerText != polymorph_core.items[id][this.settings.focusExtendProp])) {
                tta.innerText = polymorph_core.items[id][this.settings.textProp] || "_";
                ttb.innerText = polymorph_core.items[id][this.settings.focusExtendProp] || "_";
                dvd.style.width = (Math.sqrt(tta.innerText.length + ttb.innerText.length) + 1) * 23;
                dvd.parentElement.setAttribute("width", dvd.scrollWidth);
                let fob = me.itemPointerCache[id].children()[1];
                if (me.prevFocusID == id) {
                    dvd.parentElement.setAttribute("height", dvd.scrollHeight);
                } else {
                    dvd.parentElement.setAttribute("height", tta.scrollHeight);
                }
            }
            //rect.size(Number(/\d+/ig.exec(polymorph_core.items[id].boxsize.w)[0]), Number(/\d+/ig.exec(polymorph_core.items[id].boxsize.h)[0]));

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
                positionChanged || !(linePerformanceCache[id])) && 
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
                }
            }

            if (prerange) {
                let newRange = new Range();
                newRange.setStart(prerange.node.childNodes[0], prerange.startOffset);
                newRange.setEnd(prerange.node.childNodes[0], prerange.endOffset);
                /*let props = ["collapsed"
                    , "commonAncestorContainer"
                    , "endContainer"
                    , "endOffset"
                    , "startContainer"
                    , "startOffset"];
                props.forEach(i => {
                    newRange[i] = prerange[i];
                })*/
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
        } else {
            polymorph_core.link(start, end);
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
                || !(linePerformanceCache[start][end][2]==style)
                )) return;
            let x = [sd.cx(), 0, ed.cx()];
            let y = [sd.cy(), 0, ed.cy()];
            x[1] = (x[0] + x[2]) / 2;
            y[1] = (y[0] + y[2]) / 2;
            cp.plot(`M ${x[0]} ${y[0]} L ${x[1]} ${y[1]} L ${x[2]} ${y[2]}`);
            cp.stroke({ width: 2, color: style });
            cp.back();
            if (!linePerformanceCache[start]) linePerformanceCache[start] = {};
            linePerformanceCache[start][end] = [[sd.x(), sd.y()], [ed.x(), ed.y()],style];
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
