//V4.1: Now with how to use
//V4.0: now with repetition and calendar item generator

/*HOW TO USE:

let d = new _dateParser();
Date dt = d.extractTime(string data,Date reference);


-- todo lol

*/

function _dateParser() {
    let me = this;
    this.dateParserRegexes = [{
        name: "repetition",
        regex: /\((\d+)*\)/ig,
        operate: function (regres, d, data) {
            if (regres[1]) {
                data.repetition = Number(regres[1]);
            } else data.repetition = -1;
        }
    },
    {
        name: "pmtime",
        regex: /(?:^|\s)(?!:)(\d+)(am|pm)/g,
        operate: function (regres, d, data) {
            d.setMinutes(0);
            d.setSeconds(0);
            d.setHours(Number(regres[1]));
            if (regres[2] == 'pm') d.setHours(Number(regres[1]) + 12);
        }
    },
    {
        name: "time",
        regex: /(?:(?:(\d+)\/(\d+)(?:\/(\d+))?)|(?:(\d+):(\d+)(?::(\d+))?))/g,
        operate: function (regres, d, data) {
            d.setMinutes(0);
            d.setSeconds(0);
            //data.noDateSpecific = true;
            if (regres[1]) {
                d.setDate(Number(regres[1]))
                data.noDateSpecific = false;
            }
            if (regres[2]) d.setMonth(Number(regres[2]) - 1)
            if (regres[3]) {
                data.yr = Number(regres[3]);
                if (data.yr < 100) data.yr += 2000;
                d.setFullYear(data.yr)
            }
            if (regres[4]) {
                data.hr = Number(regres[4]);
                if (data.hr < 6) data.hr += 12;
            }
            d.setHours(data.hr);
            if (regres[5]) d.setMinutes(Number(regres[5]))
            if (regres[6]) d.setSeconds(Number(regres[6]))
        }
    },
    {
        name: "ampm",
        regex: /(am|pm)/gi,
        operate: function (regres, d, data) {
            if (regres[1] == "am") {
                if (d.getHours() > 12) {
                    d.setHours(d.getHours() - 12);
                }
            } else {
                if (d.getHours() < 12) {
                    d.setHours(d.getHours() + 12);
                }
            }
        }
    },
    {
        name: "dayofweek",
        regex: /(?:(mon)|(tue)s*|(?:(wed)(?:nes)*)|(?:(thu)r*s*)|(fri)|(sat)(?:ur)*|(sun))(?:day)*/ig,
        operate: function (regres, d, data, refdate) {
            data.nextDay = 0;
            for (i = 0; i < regres.length; i++) {
                if (regres[i] != undefined) {
                    data.nextDay = i;
                }
            }
            if (d.getDay() == data.nextDay % 7 && refdate.getTime() - d.getTime() > 0) {
                d.setDate(d.getDate() + 7);
            } else {
                d.setDate(d.getDate() + (data.nextDay + 7 - d.getDay()) % 7);
            }
        }
    },
    {
        name: "weekday",
        regex: /weekday/ig,
        operate: function (regres, d, data, refdate) {
            data.nextDay = 0;
            let tomorrow = d.getDay();
            if (refdate.getTime() - d.getTime() <= 0) tomorrow++;//respect past pure days.
            if (!(tomorrow > 0 && tomorrow < 5)) {
                d.setDate(d.getDate() + (8 - d.getDay()) % 7);
            }
        }
    },
    {
        name: "auto",
        regex: /auto/ig,
        operate: function (regres, d, data) {
            data.auto = true;
        }
    },
    //setters
    {
        name: "today",
        regex: /today/g,
        operate: function (regres, d, data) {
            today = new Date();
            d.setDate(today.getDate());
            d.setMonth(today.getMonth());
            data.noDateSpecific = false;
        }
    },
    {
        name: "now",
        regex: /now/g,
        operate: function (regres, d, data) {
            d = new Date();
            data.noDateSpecific = false;
        }
    },
    /*{
        name: "atid",//BROKEN
        regex: /@(\w+)/g,
        operate: function(regres,d,data){
            if (!recursive) d = new Date(Number(extractDate(lookupId(regres[1]), true)));
            else d = new Date();
        }
    },*/
    {
        name: "delTime",
        regex: /(\+|-)(\d+)(?:(m)(?:in)*|(h)(?:ou)*(?:r)*|(d)(?:ay)*|(w)(?:ee)*(?:k)*|(M)(?:o)*(?:nth)*|(y(?:ea)*(?:r)*))/g,
        operate: function (regres, d, data) {
            data.freeamt = 1;
            for (i = 3; i < regres.length; i++) {
                if (regres[i] != undefined) {
                    factor = i;
                }
            }
            switch (factor) { /// this can be improved.
                case 3:
                    data.freeamt = 1000 * 60;
                    break;
                case 4:
                    data.freeamt = 1000 * 60 * 60;
                    break;
                case 5:
                    data.freeamt = 1000 * 60 * 60 * 24;
                    break;
                case 6:
                    data.freeamt = 1000 * 60 * 60 * 24 * 7;
                    break;
                case 7:
                    data.freeamt = 1000 * 60 * 60 * 24 * 30;
                    break;
                case 8:
                    data.freeamt = 1000 * 60 * 60 * 24 * 365;
                    break;
            }
            data.freeamt *= Number(regres[2]);
            if (regres[1] == "-") data.freeamt *= -1;
            d.setTime(d.getTime() + data.freeamt);
        }
    }
    ];
    this.reverse = false;
    this.extractTime = function (str, refdate) {
        let d;
        if (!refdate) {
            d = new Date();
            refdate = new Date();
        } else {
            d = new Date(refdate.getTime());
        }
        me.tempdata = {
            hr: 9,
            noDateSpecific: true
        };
        let seen = false;
        let regres;
        for (let z = 0; z < this.dateParserRegexes.length; z++) {
            this.dateParserRegexes[z].regex.lastIndex = 0; //force reset regexes
            while ((regres = this.dateParserRegexes[z].regex.exec(str)) != null) {
                this.dateParserRegexes[z].operate(regres, d, me.tempdata, refdate);
                seen = true;
            }
        }
        while (me.tempdata.noDateSpecific && refdate.getTime() - d.getTime() > 0) d.setDate(d.getDate() + 1);
        if (seen) return d;
        else return undefined;
        //returns a Date() object, or undefined.
    }

    this.richExtractTime = function (str, refdate) {
        //returns an array of the form:
        /*
        refdate is a Date().

        {date:beginning date (integer)
        part: substring that resulted in this date
        endDate: end date (integer)}
        */
        let orefdate = refdate;// Honour orefdate first - this is passed externally
        //otherwise honour the first part of the repetition.
        let dvchain = str.split("&");
        let result = []; //see below.
        for (let k = 0; k < dvchain.length; k++) {
            //Check for repetition structure.
            let rsplit = /\((?:([^\)\|]+)\|\|)?([^\)\|]+)(?:\|([^\)\|]+))?\)/ig.exec(dvchain[k]);
            let toParse;
            let reps = undefined;
            let part = dvchain[k];
            refdate = undefined;
            if (rsplit) {
                if (rsplit[1] && !orefdate) {
                    refdate = this.extractTime(rsplit[1]);
                } else refdate = orefdate || new Date();
                toParse = rsplit[2];
                if (rsplit[3]) {
                    reps = Number(rsplit[3]);
                }
                if (isNaN(reps)) reps = -1;
                part = "(" + refdate.toLocaleString() + "||" + rsplit[2] + "|" + reps + ")";
            } else {
                toParse = dvchain[k]; //the whole thing
            }
            if (!orefdate && !refdate) refdate = new Date();
            else if (orefdate && !refdate) refdate = orefdate;
            let db = toParse.split(">");
            let subj = undefined;
            let begin = this.extractTime(db[0], refdate);
            if (begin) {
                subj = {
                    date: begin.getTime(),
                    part: part,
                    opart: dvchain[k],
                    refdate: refdate.getTime(),
                    reps: reps
                };
                if (db[1]) {
                    let endDate = me.extractTime(db[1], begin);
                    if (endDate) subj.endDate = endDate.getTime();
                    else subj.endDate = begin.getTime() + 1000 * 60 * 60; // add one hour (will change to some standard time parameter in the future)
                } else subj.endDate = begin.getTime() + 1000 * 60 * 60;
                result.push(subj);
            }
        }
        result.sort((a, b) => {
            return a.date - b.date
        });
        return result;
        //returns an array of objects of the form:
        /*
            [{
                refdate: date.getTime() representing the reference date (typically when the item was last updated).
                date: date.getTime() representing the next occurence of the event after the refdate.
                endDate: date.getTime() representing the end of the next occurence of the event, if specified.
                opart: string: the original string that created this chunk.
                part: string: a string that would create this same chunk (some references may have been updated.).
                reps: integer representing number of times the recurrence should occur. -1 if forever.
            }]

        */
    }

    //Create calendar items for fullcalendar.io and other similar things.
    this.getCalendarTimes = function (dateArray, start, end) {
        // Param: dateArray: as specified above. start: date.getTime() of the starting date. end: date.getTime() of the ending date.
        //Get the date once
        let output;
        let results = [];
        for (let i = 0; i < dateArray.length; i++) {
            let refstart = new Date(dateArray[i].refdate);
            let recurCount = dateArray[i].reps;
            if (!isNaN(recurCount)){
                if (recurCount < 0 || recurCount > 100) recurCount = 100;
            }else{
                recurCount=1;
            }
            do {
                output = this.richExtractTime(dateArray[i].part, refstart)[0];
                if (!output) break;
                results.push(output); //um it's an array?
                recurCount--;
                refstart = new Date(output.endDate);
            } while (output.date < end && recurCount != 0);
        }
        return results;
        //Return an array of objects like the ones above.
        /*
         */
    }

    this.stringToTimeObject = (str) => {
        let obj = {
            datestring: str,
            date: dateParser.richExtractTime(str)
        }
        return obj;
    }

    // quarterMaster.itemComparer = function (a, b) {end
    //     let result;
    //     if (a.done != b.done) result = b.done - a.done;
    //     else if (a.done * b.done) {
    //         result = -(b.date - a.date);
    //     } else {
    //         result = (b.date - a.date);
    //     }
    //     if (!quarterMaster.isDateSortReversed) {
    //         result = -result;
    //     }
    //     return result;
    // };
    // quarterMaster.sort = function () {
    //     let itemsToSort = [];
    //     for (let i in quarterMaster.items) {
    //         let ti = {
    //             id: i
    //         }
    //         if (quarterMaster.items[i].auto) quarterMaster.dateParse(quarterMaster.items[i]);
    //         if (quarterMaster.items[i].dates && quarterMaster.items[i].dates.length > 0) {
    //             ti.date = quarterMaster.items[i].dates[0].date;
    //         } else {
    //             ti.date = 9e15;
    //         }
    //         itemsToSort.push(ti);
    //     }
    //     itemsToSort.sort(quarterMaster.itemComparer);
    //     for (let i = 0; i < itemsToSort.length; i++) {
    //         quarterMaster.taskList.appendChild(quarterMaster.items[itemsToSort[i].id].span);
    //     }
    //     $("#calendarView").fullCalendar('refetchEvents');
    // }
    // //CONTEXT MENU OPTION FOR DATE
    // document.addEventListener("DOMContentLoaded", () => {
    //     let dateContextedTarget;
    //     contextMenuManager.registerContextMenu(`
    // <div>
    //     <li id="rectify">Convert to fixed date</li>
    // </div>
    // `, document.body, "input[data-role='date']", (e) => {
    //         dateContextedTarget = quarterMaster.items[e.target.parentElement.querySelector("[data-role='id']").innerText];
    //         //find currentTarget
    //     });
    //     document.getElementById("rectify").addEventListener("click", () => {
    //         dateContextedTarget.dateString = (new Date(dateContextedTarget.dates[0].date)).toLocaleString();
    //         document.getElementById("rectify").parentElement.style.display = "none";
    //     });
    // });
}

var dateParser = new _dateParser();