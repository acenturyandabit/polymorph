//v1.2
//eventapi.js: A quick event handler add-on for anything that requires an event system.
//Now with optional error handling argument.
/*
cetch function: f(arg,status)
called once at the start of event fire with arg=passed arguments,status=TRUE;
called for each handler with arg=return value,status=undefined;
called once at the end of every fire with arg=passed arguments,status=FALSE;
return false at any point to interrupt the event.

A sample cetch function similar to e.stopPropagation:

function cetchInterrupt(arg,status){
    if (arg.interrupt){
        return false;
    }
    return true; // or don't return at all - anything but an actual false is fine (undefined is ok)
}
Then:
itm.cetch('event',f);

And a corresponding event handler:
itm.on('event', ()=>{
    return {interrupt:true};
})

*/

function addEventAPI(itm, errf = console.error) {
    itm.events = {};
    itm.fire = function (e, args) {
        let _e = e.split(",");
        _e.push("*"); // a wildcard event listener
        _e.forEach((i) => {
            if (!itm.events[i]) return;
            //prime the ketching function with a starter object to prime it.
            let cnt = true;
            if (itm.events[i].cetches) itm.events[i].cetches.forEach((f) => {
                if (cnt != false) cnt = f(args, true, e)
            });
            //fire each event
            if (itm.events[i].events) {
                itm.events[i].events.forEach((f) => {
                    if (cnt == false) return;
                    try {
                        result = f(args, e);
                        if (itm.events[i].cetches) itm.events[i].cetches.forEach((f) => {
                            if (cnt != false) cnt = f(result, undefined, e)
                        });
                    } catch (er) {
                        errf(er);
                    }

                });
            }
            if (itm.events[i].cetches) itm.events[i].cetches.forEach((f) => (f(args, false, e)));
        })
    };
    itm.on = function (e, f) {
        let _e = e.split(',');
        _e.forEach((i) => {
            if (!itm.events[i]) itm.events[i] = {};
            if (!itm.events[i].events) itm.events[i].events = [];
            itm.events[i].events.push(f);
        })
    };
    itm.cetch = function (i, f) {
        if (!itm.events[i]) itm.events[i] = {};
        if (!itm.events[i].cetches) itm.events[i].cetches = [];
        itm.events[i].cetches.push(f);
    }
}

/*
TODOs:
- add event.stopPropagation facilitation on init
- add addEventListener as an alias to 'on' and corresponding for 'fire'
//better event handling
*/