//V4.1: Now with how to use
//V4.0: now with repetition and calendar item generator

/*HOW TO USE:

let d = new _dateParser();
Date dt = d.extractTime(string data,Date reference);


-- todo lol

*/

function _intervalParser() {
    this.regexes = [
        {
            name: "hh?mmss",
            regex: /(?:(\d+)\:)?(\d+):(\d+)/g,
            operate: function (regres, data) {
                if (regres[1]) {
                    data.len = 60 * 60 * 1000 * Number(regres[1]);
                }
                data.len += 60 * 1000 * Number(regres[2]);
                data.len += 1000 * Number(regres[3]);
            }
        },
        {
            name: "sOnly",
            regex: /(\d+)s/g,
            operate: function (regres, data) {
                data.len += 1000 * Number(regres[1]);
            }
        },
        {
            name: "ms",
            regex: /^\s*(\d+)\s*$/g,
            operate: function (regres, data) {
                data.len += Number(regres[1]);
            }
        },
    ];
    this.reverse = false;
    this.extractTime = (str) => {
        this.tempdata = {
            len: 0
        };
        let seen = false;
        let regres;
        for (let z = 0; z < this.regexes.length; z++) {
            this.regexes[z].regex.lastIndex = 0; //force reset regexes
            while ((regres = this.regexes[z].regex.exec(str)) != null) {
                this.regexes[z].operate(regres, this.tempdata);
                seen = true;
            }
        }
        if (seen) return { string: str, t: this.tempdata.len };
        else return undefined;
    }
}

var intervalParser = new _intervalParser();