/*
cool features
- function for numPerRound
- object/array doesnt matter


*/

async function inductor(_settings) {
    let settings = {
        fn: (i) => { return i },
        data: [],
        numPerRound: 20,
        roundTime: 300,
        asyncMode: "sync" // or 'await' - await each one; or 'promise_all'. - (promise_all is actually the same as sync ;))
    }
    Object.assign(settings, _settings);
    let total = 0;
    let results = [];
    return new Promise((res) => {
        async function doWork() {
            if (total > settings.data.length) {
                res(await Promise.all(results));
                return;
            } else {
                for (let i = 0; i < settings.numPerRound; i++) {
                    total++;
                    if (total>=settings.data.length)break;
                    switch (settings.asyncMode) {
                        case "sync":
                        case "promise_all":
                            results.push(settings.fn(settings.data[total]));
                            break;
                        case 'await':
                            results.push(await settings.fn(settings.data[total]));
                            break;
                    }
                }
                setTimeout(doWork, settings.roundTime);
            }
        }
        doWork();
    })
}