function addpolymorph_coreClipboard(polymorph_core) {
    // Clipboard is a rotary buffer
    polymorph_core.clipboard = [];
    polymorph_core.toClip = function(itm) {
        polymorph_core.clipboard.unshift(itm);
        if (polymorph_core.clipboard.length > 10) {
            polymorph_core.clipboard.pop();
        }
    }
}

addpolymorph_coreClipboard(polymorph_core);

/*
mouseleave
-> polymorph_core.toclip (an id){

}

mouseenter:
call before: -> polymorph_core.fromclip(an id){

}







*/