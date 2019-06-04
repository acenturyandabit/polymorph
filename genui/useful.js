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

function guid(count = 6) {
    let pool = "1234567890qwertyuiopasdfghjklzxcvbnm";
    tguid = "";
    for (i = 0; i < count; i++) tguid += pool[Math.floor(Math.random() * pool.length)];
    return tguid;
}

function randcol() {
    var output = "#00";
    var ac_char = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "0",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f"
    ];
    for (var i = 0; i < 2; i++) {
        output += ac_char[Math.floor(Math.random() * 17)];
    }
    output += "00";
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
    //returns either black or white from either a #COLOR or a rgb(color)
    cols = /\#(..)(..)(..)/i.exec(col)
    if (!cols) {
        cols = /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(col);
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
        if (typeof obj == "string") obj = eval(obj); //danger zoonee
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

function delta(O1, O2) {
    //added + changed
    //removed
    //output
}

function applyDelta(O1, d, undo) {

}

function autoReturn(inputTag, submitTag) {
    document.addEventListener("DOMContentLoaded", (e) => {
        if (e.target.classList.contains(inputTag)) {
            e.target.parentElement.getElementsByClassName(submitTag)[0].click();
        }
    });
}