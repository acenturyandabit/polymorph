core.datautils = {};
//detect and perform all decompression operations.
//compressions should be an array of object with type = the type of compression used.
core.datautils.decompress = function (data) {
    if (data.compressions) {
        for (let i = 0; i < data.compressions.length; i++) {
            data = core.datautils[data.compressions[i].type].decompress(data, i);
        }
    }
    delete data.compressions;
    return data;
}

core.datautils.precompress = function (data, type) {
    //Deep copy it, just in case
    data = JSON.parse(JSON.stringify(data));
    //set up the compression structure so we dont have to do it manually
    if (!data.compressions) {
        data.compressions = [];
    }
    data.compressions.push({ type: type });
    return data;
}

core.datautils.IDCompress = {
    compress: function (data) {
        data = core.datautils.precompress(data, "IDCompress");
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

core.datautils.linkSanitize = () => {
    //clean out all links which point to invalid things.
    for (let i in core.items) {
        if (core.items[i].to) {
            for (let j in core.items[i].to) {
                if (!core.items[j]) {
                    delete core.items[i].to[j];
                }
            }
        }
    }
}