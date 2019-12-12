//Do we even need these?  Probably not....
core.isLinked = function (A, B) {
    let ret = 0; //unlinked
    if (core.items[A].to && core.items[A].to[B]) {
        ret = ret + 1;// 1: there is a link FROM A to B
    }
    if (core.items[B].to && core.items[B].to[A]) {
        ret = ret + 2;// 2: there is a link FROM B to A
    }
    return ret;
}

core.link = function (A, B, undirected = false) {
    core.items[A].to = core.items[A].to || {};
    core.items[A].to[B] = core.items[A].to[B] || true;
    if (undirected) {
        core.link(B, A);
    }
}
core.unlink = function (A, B, undirected = false) {
    core.items[A].to = core.items[A].to || {};
    delete core.items[A].to[B];
    if (undirected) {
        core.unlink(B, A);
    }
}