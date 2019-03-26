// Spektrum Colorpicker v0.0.0
// Even more lightweight, at the cost of some functionality.
// Author: Steven Liu
// License: MIT

/*
Usage:

spek=new _spektrum(element,options);

spek.show(); // show the colorpicker

spek.on('close',(e)=>{
    color=e.color
})

*/

function _spektrum(el,options){
    let box=document.createElement("div");
    el.appendChild(box);
}