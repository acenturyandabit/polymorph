function addDateSorter(quarterMaster) {
    quarterMaster.dateParserRegexes = [{
            name: "time",
            regex: /(?:(?:(\d+)\/(\d+)(?:\/(\d+))?)|(?:(\d+):(\d+)(?::(\d+))?))/g
        },
        {
            name: "ampm",
            regex: /(am|pm)/gi
        },
        {
            name: "dayofweek",
            regex: /(?:(mon)|(tue)s*|(?:(wed)(?:nes)*)|(?:(thu)r*s*)|(fri)|(sat)(?:ur)*|(sun))(?:day)*/ig
        },
        {
            name: "auto",
            regex: /auto/ig
        },
        //put today here
        //put ID parsing here!
        //setters
        {
            name: "today",
            regex: /today/g
        },
        {
            name: "now",
            regex: /now/g
        },
        {
            name: "atid",
            regex: /@(\w+)/g
        },
        {
            name: "delTime",
            regex: /(\+|-)(\d+)(?:(m)(?:in)*|(h)(?:ou)*(?:r)*|(d)(?:ay)*|(w)(?:ee)*(?:k)*|(M)(?:o)*(?:nth)*|(y(?:ea)*(?:r)*))/g
        }
        /*{ auto free might be cool in the future...
            name: "free",
            regex: /free:(\d+)(?:(m)(?:in)*|(h)(?:ou)*(?:r)*|(d)(?:ay)*|(w)(?:ee)*(?:k)*|(M)(?:o)*(?:nth)*|(y(?:ea)*(?:r)*))/g
        }*/
    ];
    quarterMaster.isDateSortReversed = false;
    quarterMaster.reverseSort = function () {
        quarterMaster.isDateSortReversed = !quarterMaster.isDateSortReversed;
        quarterMaster.sort();
    }
    quarterMaster.extractTime = function (str) {
        let d = new Date();
        let hr = 9;
        let seen = false;
        let regres;
        let noDateSpecific = false;
        for (let z = 0; z < quarterMaster.dateParserRegexes.length; z++) {
            quarterMaster.dateParserRegexes[z].regex.lastIndex = 0; //force reset regexes
            while ((regres = quarterMaster.dateParserRegexes[z].regex.exec(str)) != null) {
                seen = true;
                switch (quarterMaster.dateParserRegexes[z].name) {
                    case "time":
                        d.setMinutes(0);
                        d.setSeconds(0);
                        noDateSpecific = true;
                        if (regres[1]) {
                            d.setDate(Number(regres[1]))
                            noDateSpecific = false;
                        }
                        if (regres[2]) d.setMonth(Number(regres[2]) - 1)
                        if (regres[3]) {
                            yr = Number(regres[3]);
                            if (yr < 100) yr += 2000;
                            d.setFullYear(yr)
                        }
                        if (regres[4]) {
                            hr = Number(regres[4]);
                            if (hr < 6) hr += 12;
                        }
                        d.setHours(hr);
                        if (regres[5]) d.setMinutes(Number(regres[5]))
                        if (regres[6]) d.setSeconds(Number(regres[6]))
                        break;
                    case "ampm":
                        if (regres[1] == "am") {
                            if (d.getHours() > 12) {
                                d.setHours(d.getHours() - 12);
                            }
                        } else {
                            if (d.getHours() < 12) {
                                d.setHours(d.getHours() + 12);
                            }
                        }
                        break;
                    case "dayofweek":
                        nextDay = 0;
                        for (i = 0; i < regres.length; i++) {
                            if (regres[i] != undefined) {
                                nextDay = i;
                            }
                        }
                        if (d.getDay() == nextDay % 7 && Date.now() - d.getTime() > 0) {
                            d.setDate(d.getDate() + 7);
                        } else {
                            d.setDate(d.getDate() + (nextDay + 7 - d.getDay()) % 7);
                        }
                        break;
                    case "now":
                        d = new Date();
                        noDateSpecific = false;
                        break;
                    case "today":
                        today = new Date();
                        d.setDate(today.getDate());
                        d.setMonth(today.getMonth());
                        noDateSpecific = false;
                        break;
                    case "atid":
                        if (!recursive) d = new Date(Number(extractDate(lookupId(regres[1]), true)));
                        else d = new Date();
                        break;
                    case "delTime":
                        freeamt = 1;
                        for (i = 3; i < regres.length; i++) {
                            if (regres[i] != undefined) {
                                factor = i;
                            }
                        }
                        switch (factor) { /// this can be improved.
                            case 3:
                                freeamt = 1000 * 60;
                                break;
                            case 4:
                                freeamt = 1000 * 60 * 60;
                                break;
                            case 5:
                                freeamt = 1000 * 60 * 60 * 24;
                                break;
                            case 6:
                                freeamt = 1000 * 60 * 60 * 24 * 7;
                                break;
                            case 7:
                                freeamt = 1000 * 60 * 60 * 24 * 30;
                                break;
                            case 8:
                                freeamt = 1000 * 60 * 60 * 24 * 365;
                                break;
                        }
                        freeamt *= Number(regres[2]);
                        if (regres[1] == "-") freeamt *= -1;
                        d = new Date(d.getTime() + freeamt);
                        break;
                }
            }
        }
        while (noDateSpecific && Date.now() - d.getTime() > 0) d.setDate(d.getDate() + 1);
        if (seen) return d;
        else return undefined;
    }

    quarterMaster.dateParse = function (item) {
        item.auto = false;

        let dvchain = item.dateString;
        dvchain = dvchain.split("&");
        let dlist = [];
        for (let k = 0; k < dvchain.length; k++) {
            let dv = dvchain[k];
            let db = dvchain[k].split(">>");
            let obj = undefined;
            let result = quarterMaster.extractTime(db[0]);
            if (result) {
                obj = {};
                obj.date = result.getTime();
                obj.part = dv;
                if (db[1]) {
                    let endDate = quarterMaster.extractTime(db[1]);
                    if (endDate) {
                        obj.end = endDate.getTime();
                    }
                }
                dlist.push(obj);
            }
        }
        dlist.sort((a, b) => {
            return a.date - b.date;
        });

        item.dates = dlist;
    }
    quarterMaster.itemComparer = function (a, b) {
        let result;
        if (a.done != b.done) result = b.done - a.done;
        else if (a.done * b.done) {
            result = -(b.date - a.date);
        } else {
            result = (b.date - a.date);
        }
        if (!quarterMaster.isDateSortReversed) {
            result = -result;
        }
        return result;
    };
    quarterMaster.sort = function () {
        let itemsToSort = [];
        for (let i in quarterMaster.items) {
            let ti = {
                id: i
            }
            if (quarterMaster.items[i].auto) quarterMaster.dateParse(quarterMaster.items[i]);
            if (quarterMaster.items[i].dates && quarterMaster.items[i].dates.length > 0) {
                ti.date = quarterMaster.items[i].dates[0].date;
            } else {
                ti.date = 9e15;
            }
            itemsToSort.push(ti);
        }
        itemsToSort.sort(quarterMaster.itemComparer);
        for (let i = 0; i < itemsToSort.length; i++) {
            quarterMaster.taskList.appendChild(quarterMaster.items[itemsToSort[i].id].span);
        }
        $("#calendarView").fullCalendar('refetchEvents');
    }
    //CONTEXT MENU OPTION FOR DATE
    document.addEventListener("DOMContentLoaded", () => {
        let dateContextedTarget;
        contextMenuManager.registerContextMenu(`
    <div>
        <li id="rectify">Convert to fixed date</li>
    </div>
    `, document.body, "input[data-role='date']", (e) => {
            dateContextedTarget = quarterMaster.items[e.target.parentElement.querySelector("[data-role='id']").innerText];
            //find currentTarget
        });
        document.getElementById("rectify").addEventListener("click", () => {
            dateContextedTarget.dateString = (new Date(dateContextedTarget.dates[0].date)).toLocaleString();
            document.getElementById("rectify").parentElement.style.display = "none";
        });
    });
}