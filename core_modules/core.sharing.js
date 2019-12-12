let rc = randCSSCol();
Object.assign(core.userData, {
    uniqueStyle: {
        background: rc,
        color: matchContrast(rc)
    },
    id: guid(10),
});

//todo: overload insertItem to add default styling when in online mode.