//V1.1. Works.

/* TODO:
Make a function that given an item spits out all the events it supports.

.. uuh that's just itm.events tho.

*/

function addEventAPI(itm){
itm.events = {},
        itm.fire = function (e, args) {
            if (itm.events[e]) {
                itm.events[e].forEach((f, i) => {
                    try{
                        f(args)
                    }catch (e){
                        console.log(e);
                    }
                });
            }
        }
    itm.on = function (e, f) {
        _e = e.split(',');
        _e.forEach((i) => {
            if (!itm.events[i]) itm.events[e] = [];
            itm.events[i].push(f);
        })

    }
}

