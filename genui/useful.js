//v4.0: added capacitor.
function isPhone() {
    var mobiles = [
        "Android",
        "iPhone",
        "Linux armv8l",
        "Linux armv7l",
        "Linux aarch64"
    ];
    if (mobiles.includes(navigator.platform) || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true;
    }
    return false;
}

function guid(count = 6, priorkeys) {
    let pool = "1234567890qwertyuiopasdfghjklzxcvbnm";
    do {
        tguid = "";
        for (i = 0; i < count; i++) tguid += pool[Math.floor(Math.random() * pool.length)];
    } while (priorkeys && (priorkeys[i] ||
        (priorkeys.length != undefined && priorkeys.includes(i))
    ));
    return tguid;
}

function randcol() {
    var output = "#";
    ac_char = "1234567890abcdef";
    for (var i = 0; i < 6; i++) {
        output += ac_char[Math.floor(Math.random() * 17)];
    }
    return output;
}

function randCSSCol() {
    let rgb = [0, 0, 0];
    rgb[0] = Math.round(Math.random() * 255);
    rgb[1] = Math.round(Math.random() * 255);
    rgb[2] = Math.round(Math.random() * 255);
    return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
}

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

function documentReady(f) {
    if (document.readyState == 'loading') {
        document.addEventListener("DOMContentLoaded", f);
    } else f();
}

function htmlwrap(html, el) {
    let d = document.createElement(el || 'div');
    d.innerHTML = html;
    if (d.children.length == 1) return d.children[0];
    else return d;
}
/*
Transcopy: transcribes from one set of properties to another.
transcopy(obj, {
    remap: {
        "a":"b",
        "c":"d"
    },
    reverse: true || false
})

*/
function transcopy(obj, options) {
    let obj2 = {};
    let _remap = {};
    if (options.reverse) {
        for (let i in options.remap) {
            _remap[options.remap[i]] = i;
        }
    } else {
        _remap = options.remap;
    }
    for (let i in obj) {
        if (_remap[i]) obj2[_remap[i]] = obj[i];
        else obj2[i] = obj[i];
    }
    return obj2;
}

/*
solve((n)=>{return n[1]-n[2]},[1,2,3],0,0.001,1000)
set cmax to -1 to run until bounds are met. (dangerous)
*/
function solve(f, v, p, eps = 0.01, inc = 0.01, cmax = 1000) {
    // solves for a parameter given other parameters, using newton's method.
    let devn = Math.abs(eps) + 1;
    while (Math.abs(devn) > Math.abs(eps) && cmax != 0) {
        let dv = [];
        v.forEach((i) => dv.push(i));
        let fx = f(v);
        dv[p] += inc;
        let dx = (f(dv) - fx) / inc;
        devn = fx / dx;
        v[p] -= devn;
        cmax--;
    }
    if (cmax == 0) console.log("Cycle count exceeded!");
    return v[p];
}
//console.log(solve((x)=>{return Math.cos(x[0])-Math.pow(Math.E,x[0])},[0.5],0));

//maybe function: Either return a function call on an object, or a given property of an object.
function mf(obj, args) {
    let _obj = obj;
    try {
        if (typeof obj == "string" && obj.includes("(")) obj = eval(obj); //danger zoonee
    } catch (e) {
        obj = _obj;
    }
    if (!obj && _obj) obj = _obj;
    if (typeof obj == "function") {
        return obj(args);
    } else {
        return args[obj];
    }
}

function autoReturn(inputTag, submitTag) {
    document.addEventListener("DOMContentLoaded", (e) => {
        if (e.target.classList.contains(inputTag)) {
            e.target.parentElement.getElementsByClassName(submitTag)[0].click();
        }
    });
}



/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * credits to Gary Tan and Mohsen on stackoverflow
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h, s, l) {
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function waitForFn(property) {
    let me = this;
    if (!this[property]) this[property] = function (args) {
        setTimeout(() => me[property].apply(me, arguments), 1000);
    }
}
//waitForFn.apply(obj,["run"]);