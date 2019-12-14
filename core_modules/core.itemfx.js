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

polymorph_core.link = function (A, B, undirected = false) {
    polymorph_core.items[A].to = polymorph_core.items[A].to || {};
    polymorph_core.items[A].to[B] = polymorph_core.items[A].to[B] || true;
    if (undirected) {
        polymorph_core.link(B, A);
    }
}
polymorph_core.unlink = function (A, B, undirected = false) {
    polymorph_core.items[A].to = polymorph_core.items[A].to || {};
    delete polymorph_core.items[A].to[B];
    if (undirected) {
        polymorph_core.unlink(B, A);
    }
}

polymorph_core.itemRelevant=function (operator, id){
    if (!operator.settings.filter){
        return true;
    }
    if (polymorph_core.items[id][operator.settings.filter]){
        return true;
    }else{
        return false;
    }
}