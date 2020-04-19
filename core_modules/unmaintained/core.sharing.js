let rc = randCSSCol();
Object.assign(polymorph_core.userData, {
    uniqueStyle: {
        background: rc,
        color: matchContrast(rc)
    },
    id: polymorph_core.guid(10),
});

//todo: overload insertItem to add default styling when in online mode.