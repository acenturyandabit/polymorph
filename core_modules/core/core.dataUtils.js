polymorph_core.datautils = {};
//detect and perform all decompression operations.
//compressions should be an array of object with type = the type of compression used.
polymorph_core.datautils.decompress = function (data) {
    if (data.compressions) {
        for (let i = 0; i < data.compressions.length; i++) {
            data = polymorph_core.datautils[data.compressions[i].type].decompress(data, i);
        }
        return data.items;
    }
    else return data;
}

polymorph_core.datautils.precompress = function (data, type) {
    //Deep copy it, just in case
    data = JSON.parse(JSON.stringify(data));

    if (!data.compressions) {
        data = {
            compressions: [],
            items: data
        }
    }
    data.compressions.push({ type: type });
    return data;
}

polymorph_core.datautils.IDCompress = {
    compress: function (data) {
        data = polymorph_core.datautils.precompress(data, "IDCompress");
        let propDict = {};
        for (let i in data.items) {
            for (let j in data.items[i]) {
                if (!propDict[j]) propDict[j] = 0;
                propDict[j]++;
            }
        }
        let encodingIndex = 1;
        function numberToEncodable(n) {
            let base = "qwertyuiopasdfghjklzxcvbnm";
            if (n == 0) return base[0];
            let output = "";
            let max = Math.floor(Math.log(n) / Math.log(base.length));
            for (let i = 0; i <= max; i++) {
                output = base[n % base.length] + output;
                n = Math.floor(n / base.length);
            }
            return output;
        }
        data.compressions[data.compressions.length - 1].keymap = {};
        let km = data.compressions[data.compressions.length - 1].keymap;
        for (let i in propDict) {
            //it will instead be stored in something like xyz:v, v:... so v*(propdict+1)+3 or something.
            if (i.length * propDict[i] > 3 * (propDict[i] + 1) + i.length) {
                //compress this
                while (propDict[numberToEncodable(encodingIndex)]) {
                    encodingIndex++;
                }
                let newkey = numberToEncodable(encodingIndex);
                km[newkey] = i;
                for (let it in data.items) {
                    if (data.items[it][i]) {
                        data.items[it][newkey] = data.items[it][i];
                        delete data.items[it][i];
                    }
                }
                //increment so we dont use the same keys
                encodingIndex++;
            }
        }
        return data;
    },
    decompress: function (data, cid) {
        for (let it in data.items) {
            for (let k in data.compressions[cid].keymap) {
                if (data.items[it][k]) {
                    data.items[it][data.compressions[cid].keymap[k]] = data.items[it][k];
                    delete data.items[it][k];
                }
            }
        }
        return data;
    }
}

polymorph_core.datautils.linkSanitize = () => {
    //clean out all links which point to invalid things.
    for (let i in polymorph_core.items) {
        if (polymorph_core.items[i].to) {
            for (let j in polymorph_core.items[i].to) {
                if (!polymorph_core.items[j]) {
                    delete polymorph_core.items[i].to[j];
                }
            }
        }
    }
}

polymorph_core.datautils.viewToItems = (obj) => {
    //_meta is special. Just a little safeguard so it doesnt get overwritten or anything.
    let newObj = {};
    for (let i in obj.items) {
        newObj[i] = obj.items[i];
    }
    //metadata
    let meta = {};
    for (let m in obj) {
        if (m != "items" && m != "views") {
            meta[m] = obj[m];
            meta[m].lastChanged = Date.now();
        }
    }
    newObj._meta = meta;
    //views
    function createObjectFromOperator(o, parent) {
        let obj = { _od: {} };
        Object.assign(obj._od, o.opdata);
        obj._od.t = obj._od.type;
        delete obj._od.type;
        if (parent) {
            obj._od.p = parent;
        }
        //ID is needed before subframe processing
        let newID = guid(6, newObj);
        newObj[newID] = obj;
        //you need to deal with subrects here as well ://)
        if (obj._od.t == "subframe") {
            createObjectFromRect(obj._od.data.rectUnderData, newID);
        }
        return newID;
    }

    function createObjectFromRect(r, parent, isView) {
        let obj = { _rd: {} };
        Object.assign(obj._rd, r);
        obj._rd.ps = obj._rd.p;
        delete obj._rd.p;
        if (isView) {
            obj._rd.vn = parent;
        } else if (parent) {
            obj._rd.p = parent;
        }
        let newID = guid(6, newObj);
        newObj[newID] = {};//stake claim to the newID
        if (r.c) {
            createObjectFromRect(r.c[0], newID);
            createObjectFromRect(r.c[1], newID);
        } else if (r.o) {
            let oids = r.o.map((o) => {
                return createObjectFromOperator(o, newID);
            })
            obj._rd.s = oids[r.s];
        }
        delete obj._rd.c;
        delete obj._rd.o;
        newObj[newID] = obj;
        return newID;
    }
    for (let i in obj.views) {
        let newRectID = createObjectFromRect(obj.views[i], i, true);
        if (i == newObj._meta.currentView) newObj._meta.currentView = newRectID;
    }
    return newObj;
}

//called by docloading, and called when the preferences dialog is closed.

polymorph_core.datautils.upgradeSaveData = function (id, source) {
    let defaultDoc = { saveSources: {}, saveHooks: {}, loadHooks: {} };
    Object.assign(defaultDoc, polymorph_core.userData.documents[id]);
    polymorph_core.userData.documents[id] = defaultDoc;
    if (source) {
        if (!polymorph_core.userData.documents[id].saveSources[source]) {
            //if the source didnt exist, then we assume it didnt exist and we hook it, unless explicitly stated otherwise.
            polymorph_core.userData.documents[id].saveHooks[source] = true;
            polymorph_core.userData.documents[id].loadHooks[source] = true;
        }
        polymorph_core.userData.documents[id].saveSources[source] = polymorph_core.userData.documents[id].saveSources[source] || id;
    }
}