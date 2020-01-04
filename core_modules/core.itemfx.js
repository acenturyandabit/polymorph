//Do we even need these?  Probably not....
polymorph_core.isLinked = function (A, B) {
    let ret = 0; //unlinked
    if (polymorph_core.items[A].to && polymorph_core.items[A].to[B]) {
        ret = ret + 1;// 1: there is a link FROM A to B
    }
    if (polymorph_core.items[B].to && polymorph_core.items[B].to[A]) {
        ret = ret + 2;// 2: there is a link FROM B to A
    }
    return ret;
}

polymorph_core.link = function (A, B, settings = {}) {
    if (settings == true) {
        settings = { undirected: true };
    }
    let toProp = settings.toProp || "to";
    let fromProp = settings.fromProp;
    let undirected = settings.undirected;
    polymorph_core.items[A][toProp] = polymorph_core.items[A][toProp] || {};
    polymorph_core.items[A][toProp][B] = polymorph_core.items[A][toProp][B] || true;
    if (fromProp) {
        polymorph_core.items[B][fromProp] = polymorph_core.items[B][fromProp] || {};
        polymorph_core.items[B][fromProp][A] = polymorph_core.items[B][fromProp][A] || true;
    }
    if (undirected) {
        polymorph_core.link(B, A, settings);
    }
}
polymorph_core.unlink = function (A, B, settings = {}) {
    if (settings == true) {
        settings = { undirected: true };
    }
    let toProp = settings.toProp || "to";
    let fromProp = settings.fromProp;
    let undirected = settings.undirected;
    polymorph_core.items[A][toProp] = polymorph_core.items[A][toProp] || {};
    delete polymorph_core.items[A][toProp][B];
    if (fromProp) {
        polymorph_core.items[B][fromProp] = polymorph_core.items[B][fromProp] || {};
        delete polymorph_core.items[B][fromProp][A];
    }
    if (undirected) {
        polymorph_core.unlink(B, A);
    }
}

polymorph_core.garbageClean = () => {
    for (let i in polymorph_core.items){
        polymorph_core.tryGarbageCollect(i);
    }
}