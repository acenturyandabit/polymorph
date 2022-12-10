function capacitor(t, limit, send, settings = {}, checkInterval = 100) {
    let options = {
        fireFirst: false,
        afterLast: true,
    };
    if (typeof(settings) == "boolean") {
        options.fireFirst = settings;
    } else {
        Object.assign(options, settings);
    }
    let me = this;
    let lastUID;
    let lastData;
    let tcount = 0;
    let rqcount = 0;
    let pid = undefined;
    let prefire = false;
    this.forceSend = function() {
        send(lastUID, lastData);
        rqcount = 0;
        clearTimeout(pid);
        pid = undefined;
    }
    this.checkAndUpdate = function() {
        tcount -= checkInterval;
        if (tcount <= 0) {
            if (!prefire) {
                me.forceSend();
            }
        } else {
            pid = setTimeout(me.checkAndUpdate, checkInterval);
        }
    }
    this.submit = function(UID, data) {
        if (options.presubmit) options.presubmit();
        if (lastUID != UID && lastUID) {
            me.forceSend();
        } else {
            if (rqcount == 0 && options.fireFirst) {
                lastUID = UID;
                me.forceSend();
                prefire = true;
            } else {
                prefire = false;
            }
            rqcount++;
            if (rqcount > limit) {
                me.forceSend();
                rqcount = 1;
            }
            if (options.afterLast && pid) {
                clearTimeout(pid);
                pid = undefined;
            }
            if (!pid) {
                tcount = t;
                pid = setTimeout(me.checkAndUpdate, checkInterval);
            }
        }
        lastUID = UID;
        lastData = data;
    }
}

function htmlwrap(html, el) {
    let d = document.createElement(el || 'div');
    d.innerHTML = html;
    if (d.children.length == 1) {
        let dd = d.children[0];
        dd.remove();
        return dd;
    } else return d;
}

function waitForFn(property) {
    let me = this;
    if (!this[property]) this[property] = function(args) {
        setTimeout(() => me[property].apply(me, arguments), 1000);
    }
}

if (!Element.prototype.scrollIntoViewIfNeeded) {
    Element.prototype.scrollIntoViewIfNeeded = function (centerIfNeeded) {
      centerIfNeeded = arguments.length === 0 ? true : !!centerIfNeeded;
  
      var parent = this.parentNode,
          parentComputedStyle = window.getComputedStyle(parent, null),
          parentBorderTopWidth = parseInt(parentComputedStyle.getPropertyValue('border-top-width')),
          parentBorderLeftWidth = parseInt(parentComputedStyle.getPropertyValue('border-left-width')),
          overTop = this.offsetTop - parent.offsetTop < parent.scrollTop,
          overBottom = (this.offsetTop - parent.offsetTop + this.clientHeight - parentBorderTopWidth) > (parent.scrollTop + parent.clientHeight),
          overLeft = this.offsetLeft - parent.offsetLeft < parent.scrollLeft,
          overRight = (this.offsetLeft - parent.offsetLeft + this.clientWidth - parentBorderLeftWidth) > (parent.scrollLeft + parent.clientWidth),
          alignWithTop = overTop && !overBottom;
  
      if ((overTop || overBottom) && centerIfNeeded) {
        parent.scrollTop = this.offsetTop - parent.offsetTop - parent.clientHeight / 2 - parentBorderTopWidth + this.clientHeight / 2;
      }
  
      if ((overLeft || overRight) && centerIfNeeded) {
        parent.scrollLeft = this.offsetLeft - parent.offsetLeft - parent.clientWidth / 2 - parentBorderLeftWidth + this.clientWidth / 2;
      }
  
      if ((overTop || overBottom || overLeft || overRight) && !centerIfNeeded) {
        this.scrollIntoView(alignWithTop);
      }
    };
  }

  
// http://www.w3.org/TR/AERT#color-contrast
function matchContrast(col) {
    var colours = {
        "aliceblue": "#f0f8ff",
        "antiquewhite": "#faebd7",
        "aqua": "#00ffff",
        "aquamarine": "#7fffd4",
        "azure": "#f0ffff",
        "beige": "#f5f5dc",
        "bisque": "#ffe4c4",
        "black": "#000000",
        "blanchedalmond": "#ffebcd",
        "blue": "#0000ff",
        "blueviolet": "#8a2be2",
        "brown": "#a52a2a",
        "burlywood": "#deb887",
        "cadetblue": "#5f9ea0",
        "chartreuse": "#7fff00",
        "chocolate": "#d2691e",
        "coral": "#ff7f50",
        "cornflowerblue": "#6495ed",
        "cornsilk": "#fff8dc",
        "crimson": "#dc143c",
        "cyan": "#00ffff",
        "darkblue": "#00008b",
        "darkcyan": "#008b8b",
        "darkgoldenrod": "#b8860b",
        "darkgray": "#a9a9a9",
        "darkgreen": "#006400",
        "darkkhaki": "#bdb76b",
        "darkmagenta": "#8b008b",
        "darkolivegreen": "#556b2f",
        "darkorange": "#ff8c00",
        "darkorchid": "#9932cc",
        "darkred": "#8b0000",
        "darksalmon": "#e9967a",
        "darkseagreen": "#8fbc8f",
        "darkslateblue": "#483d8b",
        "darkslategray": "#2f4f4f",
        "darkturquoise": "#00ced1",
        "darkviolet": "#9400d3",
        "deeppink": "#ff1493",
        "deepskyblue": "#00bfff",
        "dimgray": "#696969",
        "dodgerblue": "#1e90ff",
        "firebrick": "#b22222",
        "floralwhite": "#fffaf0",
        "forestgreen": "#228b22",
        "fuchsia": "#ff00ff",
        "gainsboro": "#dcdcdc",
        "ghostwhite": "#f8f8ff",
        "gold": "#ffd700",
        "goldenrod": "#daa520",
        "gray": "#808080",
        "green": "#008000",
        "greenyellow": "#adff2f",
        "honeydew": "#f0fff0",
        "hotpink": "#ff69b4",
        "indianred ": "#cd5c5c",
        "indigo": "#4b0082",
        "ivory": "#fffff0",
        "khaki": "#f0e68c",
        "lavender": "#e6e6fa",
        "lavenderblush": "#fff0f5",
        "lawngreen": "#7cfc00",
        "lemonchiffon": "#fffacd",
        "lightblue": "#add8e6",
        "lightcoral": "#f08080",
        "lightcyan": "#e0ffff",
        "lightgoldenrodyellow": "#fafad2",
        "lightgrey": "#d3d3d3",
        "lightgreen": "#90ee90",
        "lightpink": "#ffb6c1",
        "lightsalmon": "#ffa07a",
        "lightseagreen": "#20b2aa",
        "lightskyblue": "#87cefa",
        "lightslategray": "#778899",
        "lightsteelblue": "#b0c4de",
        "lightyellow": "#ffffe0",
        "lime": "#00ff00",
        "limegreen": "#32cd32",
        "linen": "#faf0e6",
        "magenta": "#ff00ff",
        "maroon": "#800000",
        "mediumaquamarine": "#66cdaa",
        "mediumblue": "#0000cd",
        "mediumorchid": "#ba55d3",
        "mediumpurple": "#9370d8",
        "mediumseagreen": "#3cb371",
        "mediumslateblue": "#7b68ee",
        "mediumspringgreen": "#00fa9a",
        "mediumturquoise": "#48d1cc",
        "mediumvioletred": "#c71585",
        "midnightblue": "#191970",
        "mintcream": "#f5fffa",
        "mistyrose": "#ffe4e1",
        "moccasin": "#ffe4b5",
        "navajowhite": "#ffdead",
        "navy": "#000080",
        "oldlace": "#fdf5e6",
        "olive": "#808000",
        "olivedrab": "#6b8e23",
        "orange": "#ffa500",
        "orangered": "#ff4500",
        "orchid": "#da70d6",
        "palegoldenrod": "#eee8aa",
        "palegreen": "#98fb98",
        "paleturquoise": "#afeeee",
        "palevioletred": "#d87093",
        "papayawhip": "#ffefd5",
        "peachpuff": "#ffdab9",
        "peru": "#cd853f",
        "pink": "#ffc0cb",
        "plum": "#dda0dd",
        "powderblue": "#b0e0e6",
        "purple": "#800080",
        "rebeccapurple": "#663399",
        "red": "#ff0000",
        "rosybrown": "#bc8f8f",
        "royalblue": "#4169e1",
        "saddlebrown": "#8b4513",
        "salmon": "#fa8072",
        "sandybrown": "#f4a460",
        "seagreen": "#2e8b57",
        "seashell": "#fff5ee",
        "sienna": "#a0522d",
        "silver": "#c0c0c0",
        "skyblue": "#87ceeb",
        "slateblue": "#6a5acd",
        "slategray": "#708090",
        "snow": "#fffafa",
        "springgreen": "#00ff7f",
        "steelblue": "#4682b4",
        "tan": "#d2b48c",
        "teal": "#008080",
        "thistle": "#d8bfd8",
        "tomato": "#ff6347",
        "turquoise": "#40e0d0",
        "violet": "#ee82ee",
        "wheat": "#f5deb3",
        "white": "#ffffff",
        "whitesmoke": "#f5f5f5",
        "yellow": "#ffff00",
        "yellowgreen": "#9acd32"
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
            } else return "black"; //no idea
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