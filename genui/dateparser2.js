/*
Use cases:
- Given a string, create a serializable object that identifies when the string was last parsed as a reference date.
- Parse a string and reference date to determine the next occurence(s) within a time range or after a certain number of occurrences.
*/

//V5.0: Rebuild from ground up with better documentation.
//V4.1: Now with how to use
//V4.0: now with repetition and calendar item generator

/** 
 * A single occurence of an event. To integrate with fullCalendar, simply tack on a `title`.
 * @typedef {Object} Occurrence 
 * @property {number} start - date.getTime() representing the next occurence of the event after the refdate.
 * @property {number} end - date.getTime() representing the end of the next occurence of the event, if specified.
 */

/**
 * An event
 * @typedef {Object} eventWithRef
 * @property {string} datestring
 * @property {number} reference - date.getTime() representing the last time this object was parsed.
 */

/** 
 * An object that can be turned into a set of occurrences.
 * @typedef {string|eventWithRef} TOccurrenceResolvable
 */

/** 
 * An object that can be resolved into a date.
 * @typedef {number|string|Date()|undefined} TDateResolvable
 */

function _dateParser2() {

    /** 
     * Resolve a TDateResolvable into a Date().
     * @param {TDateResolvable} TDateInput
     * @returns {Date()} A Date object which may be invalid.
     */
    let resolveToDate = (TDateInput) => {
        if (!TDateInput) return new Date();
        if (TDateInput.constructor.name == "Date") return TDateInput;
        if (typeof(TDateInput) == "number") {
            return new Date(TDateInput);
        }
        if (typeof(TDateInput) == "string") {
            return new Date(TDateInput);
        }
        return new Date("Invalid Date");
    }

    this.stringToEvent = (string) => {
        return {
            datestring: string,
            reference: Date.now()
        }
    }

    /**
     * Takes a simple string (no repetitions) and returns the next date after the reference date.
     * 
     * @param {string} str The string to be parsed
     * @param {TDateResolvable} refdate The starting reference date.
     * 
     * @returns {Date()} a time if a valid time is detected; otherwise returns the `Invalid Date`.
     */
    let extractNextTime = function(str, refdate) {
        let d;
        if (!refdate) {
            d = new Date();
            refdate = new Date();
        } else {
            if (typeof refdate == "number") {
                refdate = new Date(refdate);
            }
            d = new Date(refdate.getTime());
        }
        me.tempdata = {
            hr: 9,
            noDateSpecific: true,
            d: d
        };
        let seen = false;
        let regres;
        for (let z = 0; z < this.dateParserRegexes.length; z++) {
            this.dateParserRegexes[z].regex.lastIndex = 0; //force reset regexes
            while ((regres = this.dateParserRegexes[z].regex.exec(str)) != null) {
                this.dateParserRegexes[z].operate(regres, me.tempdata, refdate);
                seen = true;
            }
        }

        // make sure new date is later than reference time
        while (me.tempdata.noDateSpecific && refdate.getTime() - me.tempdata.d.getTime() > 0) me.tempdata.d.setDate(me.tempdata.d.getDate() + 1);
        if (seen) return me.tempdata.d;
        else return undefined;
    };

    /**
     * Extract one occurrence.
     * 
     * @param {string} str - input string 
     * @param {TDateResolvable} refdate - reference date 
     * @returns {Occurrence} 
     */

    let extractOneOccurrence = function(str, refdate) {
        let result = {};
        parts = str.split(">");

        result.start = extractNextTime(parts[0], refdate);
        if (parts[1]) {
            result.end = extractNextTime(parts[1], result.start);
        } else {
            result.end = result.start + 1000 * 60 * 60;
        }
        return result;
    };


    /** 
     * An object containing options for getTimes.
     * @typedef {Object} getTimesOptions
     * @property {TDateResolvable} startDate The starting date.
     * @property {TDateResolvable} [endDate]  The ending date.
     * @property {number} [occurenceCount] The number of repetitions. Only used if endDate is undefined.
     */

    /**
     * Takes a rich string and emits Occurrences based on the options specified.
     * @param {TOccurrenceResolvable} event The event to be parsed
     * @param {getTimesOptions} options Some options.
     * 
     * @returns {Occurrence[]} An array of Occurrences that fulfill the options specified. 
     */
    this.getOccurrences = (event, options) => {
        if (!event.datestring) {
            event = this.stringToEvent(event);
        }
        if (!options) {
            options = {
                startDate: new Date(),
                occurenceCount: 1
            };
        }
        if (!options.endDate) options.endDate = -1;

        let possibleDates = [];
        // split date into parts
        let dateParts = event.datestring.split("&");
        // For each part:
        for (let datePart of dateParts) {
            // if it's a repetition structure:
            let reptRegexResult = /\((?:([^\)\|]+)\|\|)?([^\)\|]+)(?:\|([^\)\|]+))?\)/ig.exec(datePart);
            if (reptRegexResult) {
                // Generate repetitions from the repetition's refdate until we hit a time after the startDate
                let repetitionRefDate = options.startDate;
                if (reptRegexResult[1]) {
                    repetitionRefDate = extractNextTime(reptRegexResult[1]);
                }
                while (repetitionRefDate < options.startDate) {
                    repetitionRefDate = extractOneOccurrence(reptRegexResult[2], repetitionRefDate).end;
                }

                // Check if the repetition has any ending conditions
                let repetitionOccurrenceCount = -1;
                let repetitionEndDate = options.endDate;
                if (reptRegexResult[3]) {
                    repetitionOccurrenceCount = Number(reptRegexResult[3]);
                    if (isNaN(repetitionOccurrenceCount)) {
                        repetitionOccurrenceCount = -1;
                        //try and dateparse it
                        repetitionEndDate = extractNextTime(reptRegexResult[3], event.reference);
                        if (!repetitionEndDate) repetitionEndDate = options.endDate;
                    }
                }
                if (options.occurenceCount > -1 && (options.occurenceCount < repetitionOccurrenceCount || repetitionOccurrenceCount == -1)) {
                    repetitionOccurrenceCount = options.occurenceCount;
                }
                // Generate repetitions until we either pass the endDate or hit the occurence count
                while (!(
                        (options.endDate != -1 && repetitionRefDate > options.endDate) ||
                        (repetitionEndDate != -1 && repetitionRefDate > repetitionEndDate) ||
                        (repetitionOccurrenceCount == 0)
                    )) {
                    repetitionRefDate = extractOneOccurrence(reptRegexResult[3], repetitionRefDate);
                    // Pop them into the array
                    possibleDates.push(repetitionRefDate);
                    repetitionRefDate = repetitionEndDate.endDate;
                    repetitionOccurrenceCount--;
                }
            } else {
                // otherwise if not repetition:
                // Pop them into the array
                possibleDates.push(extractOneOccurrence(datePart, options.startDate));
            }
        }
        // Sort the entries by recency
        possibleDates.sort((a, b) => a.startDate - b.startDate);
        // if global occurrencecount, take only the occurrences that matter.
        if (options.occurenceCount) {
            possibleDates = possibleDates.slice(0, options.occurenceCount);
        }
        return possibleDates;
    }


    /**
     * Takes a rich string and emits the next datetime from the nominated reference datetime or now if unspecified.
     * 
     * @param {string} str The string to be parsed
     * @param {Date()} refdate The starting reference date.
     * 
     * @returns {Occurrence} An array of Occurrences calculated from the refdate.
     */
    this.richExtractTime = function(str, refdate) {

        let orefdate = refdate; // Honour orefdate first - this is passed externally
        //otherwise honour the first part of the repetition.
        let dvchain = str.split("&");
        let result = []; //see below.
        for (let k = 0; k < dvchain.length; k++) {
            //Check for repetition structure.
            // repetition looks like: ( start date || next date generator | number of repetitions OR end date)
            let rsplit = /\((?:([^\)\|]+)\|\|)?([^\)\|]+)(?:\|([^\)\|]+))?\)/ig.exec(dvchain[k]);
            let toParse;
            let reps = undefined;
            let part = dvchain[k];
            refdate = undefined;
            if (rsplit) {

                // If we have a starting date, try to use it if it is older than the current date
                // TODO: this should keep using the earlier date, but just loop until it gets to a date that is closer to the present...? 
                if (rsplit[1]) {
                    refdate = this.extractNextTime(rsplit[1]);
                    if (orefdate) refdate = new Date(Math.max(orefdate, refdate));
                } else refdate = orefdate || new Date();

                toParse = rsplit[2];
                if (rsplit[3]) {
                    reps = Number(rsplit[3]);
                    if (isNaN(reps)) {
                        //try and dateparse it
                        reps = this.extractNextTime(rsplit[3], refdate);
                        if (!reps) reps = -1;
                        else reps = reps.toISOString();
                    }
                } else {
                    reps = -1;
                }
                if (typeof(reps) == "number") {
                    part = "(" + refdate.toLocaleString() + "||" + rsplit[2] + "|" + rsplit[3] + ")";
                } else {
                    part = "(" + refdate.toLocaleString() + "||" + rsplit[2] + "|" + reps + ")";
                }
            } else {
                toParse = dvchain[k]; //the whole thing
            }
            if (!orefdate && !refdate) refdate = new Date();
            else if (orefdate && !refdate) refdate = orefdate;
            let db = toParse.split(">");
            let subj = undefined;
            let begin = this.extractNextTime(db[0], refdate);
            if (begin) {
                subj = {
                    date: begin.getTime(),
                    part: part,
                    opart: dvchain[k],
                    refdate: refdate.getTime(),
                    reps: reps
                };
                if (db[1]) {
                    let endDate = me.extractNextTime(db[1], begin);
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
        //array: for each part of the date, returns the earliest object of the form:
        /*
            [{
                refdate: date.getTime() representing the reference date (typically when the item was last updated).
                date: date.getTime() representing the next occurence of the event after the refdate.
                endDate: date.getTime() representing the end of the next occurence of the event, if specified.
                opart: string: the original string that created this chunk.
                part: string: a string that would create this same chunk (some references may have been updated.).
                reps: integer OR ISO date string representing number of times the recurrence should occur. -1 if forever.
                    because storeable in json and ifferent from # reps
            }]

        */
    };
    this.getSortingTimes = (str, refdate) => {
        let rsplit = /\((?:([^\)\|]+)\|\|)?([^\)\|]+)(?:\|([^\)\|]+))?\)/ig.exec(str);
        let hasAuto = /auto/ig.exec(str);
        if (rsplit || hasAuto) {
            return this.richExtractTime(str, new Date());
        } else {
            return this.richExtractTime(str, refdate);
        }
    };
    //Create calendar items for fullcalendar.io and other similar things.
    this.getCalendarTimes = function(dateArray, start, end) {
        // Param: dateArray: as specified above. start: date.getTime() of the starting date. end: date.getTime() of the ending date.
        //Get the date once
        let output;
        let results = [];
        for (let i = 0; i < dateArray.length; i++) {
            let refstart = new Date(dateArray[i].refdate);
            let recurCount = dateArray[i].reps;
            if (!isNaN(recurCount)) {
                if (recurCount < 0 || recurCount > 100) recurCount = 100;
            } else {
                if (!recurCount) recurCount = 1;
                else {
                    end = Math.min(end, new Date(recurCount).getTime());
                    recurCount = 100;
                }
            }
            do {
                output = this.richExtractTime(dateArray[i].part, refstart)[0];
                if (!output) break;
                // check if it is past the recurcount date, if recurcount is a date
                results.push(output);
                recurCount--;
                refstart = new Date(output.endDate);
            } while (output.date < end && recurCount != 0);
        }
        return results;
        //Return an array of objects like the ones above.
        /*
         */
    }

    /*
    this.stringToTimeObject = (str) => {
        let obj = {
            datestring: str,
            date: dateParser.richExtractTime(str)
        }
        return obj;
    }
    */

    this.humanReadableRelativeDate = (datenum) => {
        let d = new Date(datenum);
        let now = new Date();
        //if same day, just report time
        //otherwise report day only
        if (d.getDate() == now.getDate() && d.getFullYear() == now.getFullYear() && d.getMonth() == now.getMonth()) {
            return d.toTimeString().split(" ")[0]
        } else {
            return d.toLocaleDateString().split(" ")[0]
        }
    }



    this.dateParserRegexes = [{
            name: "pmtime",
            regex: /(?:^|\s)(?!:)(\d+)(am|pm)/g,
            operate: function(regres, data) {
                data.d.setMinutes(0);
                data.d.setSeconds(0);
                data.d.setHours(Number(regres[1]));
                if (regres[2] == 'pm') data.d.setHours(Number(regres[1]) + 12);
            }
        },
        {
            name: "time",
            regex: /(?:(?:(\d+)\/(\d+)(?:\/(\d+))?)|(?:(\d+):(\d+)(?::(\d+))?))/g,
            operate: function(regres, data) {
                data.d.setMinutes(0);
                data.d.setSeconds(0);
                //data.noDateSpecific = true;
                if (regres[2]) data.d.setMonth(Number(regres[2]) - 1); // do month first otherwise e.g. 31st in feb will cause an overflow
                if (regres[1]) {
                    data.d.setDate(Number(regres[1]))
                    data.noDateSpecific = false;
                }
                if (regres[3]) {
                    data.yr = Number(regres[3]);
                    if (data.yr < 100) data.yr += 2000;
                    data.d.setFullYear(data.yr)
                }
                if (regres[4]) {
                    data.hr = Number(regres[4]);
                    if (data.hr < 6) data.hr += 12;
                }
                data.d.setHours(data.hr);
                if (regres[5]) data.d.setMinutes(Number(regres[5]))
                if (regres[6]) data.d.setSeconds(Number(regres[6]))
            }
        },
        {
            name: "ampm",
            regex: /(am|pm)/gi,
            operate: function(regres, data) {
                if (regres[1] == "am") {
                    if (data.d.getHours() > 12) {
                        data.d.setHours(data.d.getHours() - 12);
                    }
                } else {
                    if (data.d.getHours() < 12) {
                        data.d.setHours(data.d.getHours() + 12);
                    }
                }
            }
        },
        {
            name: "dayofweek",
            regex: /(?:(mon)|(tue)s*|(?:(wed)(?:nes)*)|(?:(thu)r*s*)|(fri)|(sat)(?:ur)*|(sun))(?:day)*/ig,
            operate: function(regres, data, refdate) {
                data.nextDay = 0;
                for (i = 0; i < regres.length; i++) {
                    if (regres[i] != undefined) {
                        data.nextDay = i;
                    }
                }
                if (data.d.getDay() == data.nextDay % 7 && refdate.getTime() - data.d.getTime() > 0) {
                    data.d.setDate(data.d.getDate() + 7);
                } else {
                    data.d.setDate(data.d.getDate() + (data.nextDay + 7 - data.d.getDay()) % 7);
                }
            }
        },
        {
            name: "weekday",
            regex: /weekday/ig,
            operate: function(regres, data, refdate) {
                data.nextDay = 0;
                let tomorrow = data.d.getDay();
                if (refdate.getTime() - data.d.getTime() <= 0) tomorrow++; //respect past pure days.
                if (!(tomorrow > 0 && tomorrow < 5)) {
                    data.d.setDate(data.d.getDate() + (8 - data.d.getDay()) % 7);
                }
            }
        },
        {
            name: "auto",
            regex: /auto/ig,
            operate: function(regres, data) {
                data.auto = true;
            }
        },
        //setters
        {
            name: "today",
            regex: /today/g,
            operate: function(regres, data) {
                today = new Date();
                data.d.setDate(today.getDate());
                data.d.setMonth(today.getMonth());
                data.noDateSpecific = false;
            }
        },
        {
            name: "now",
            regex: /now/g,
            operate: function(regres, data, refdate) {
                if (refdate) data.d = refdate;
                else data.d = new Date();
                data.noDateSpecific = false;
            }
        },
        {
            name: "delTime",
            regex: /(\+|-)(\d+)(?:(m)(?:in)*|(h)(?:ou)*(?:r)*|(d)(?:ay)*|(w)(?:ee)*(?:k)*|(M)(?:o)*(?:nth)*|(y(?:ea)*(?:r)*))/g,
            operate: function(regres, data) {
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
                if (regres[1] == "-") {
                    data.freeamt *= -1;
                    data.noDateSpecific = false;
                }
                data.d.setTime(data.d.getTime() + data.freeamt);
            }
        }
    ];
}

var dateParser = new _dateParser();