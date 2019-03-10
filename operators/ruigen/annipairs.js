///////annihilation-pairs/////
annipair = [];
annipairSettings = {
    r: 2,
    bitprob:0.5
}
function startAnniPairs(){
    let things=document.getElementsByClassName("annipairs");
    for (i=0;i<things.length;i++){
        _e=things[i];
        e=document.createElement("canvas");
        _e.append(e);
        e.width = _e.clientWidth;
        e.height = _e.clientHeight;
        annipair.push({
            data: {
                bits: []
            },
            ctx: e.getContext('2d'),
            w: e.width,
            h: e.height
        });
    }
    setInterval(() => {
        annipair.forEach((v, i) => {
            //Generate bit
            if (Math.random() > (1-annipairSettings.bitprob)*Math.min((v.data.bits.length-5)/5,1)) {
                v.data.bits.push({
                    cx: v.w*0.2 + Math.random() * v.w*0.8,
                    cy: v.h*0.2 + Math.random() * v.h*0.8,
                    dist: v.w,
                    dead:false
                })
            }
            //clear screen
            v.ctx.fillStyle = "rgba(0,0,0,0.3)";
            v.ctx.fillRect(0, 0, v.w, v.h);
            //update and draw all bits
            
            for (i = 0; i < v.data.bits.length; i++) {
                if (v.data.bits[i].dist > 0) {
                    v.ctx.fillStyle = "rgb(0,100,0)";
                    v.ctx.fillRect(v.data.bits[i].cx - annipairSettings.r + v.data.bits[
                            i].dist, v.data.bits[i].cy - annipairSettings.r,
                        2 * annipairSettings.r, 2 * annipairSettings.r);
                    v.ctx.fillRect(v.data.bits[i].cx - annipairSettings.r - v.data.bits[
                            i].dist, v.data.bits[i].cy - annipairSettings.r,
                        2 * annipairSettings.r, 2 * annipairSettings.r);
                    v.data.bits[i].dist = v.w - (v.w - v.data.bits[i].dist) * 1.02 - 1;
                } 
                if (v.data.bits[i].dist<=0){
                    v.ctx.fillStyle = "rgb(0,255,0)";
                    if (!v.data.bits[i].dead){
                        v.data.bits[i].dead=true;
                        v.data.bits[i].dist=-1;
                    }
                    v.ctx.fillRect(v.data.bits[i].cx + v.data.bits[
                            i].dist / 2, v.data.bits[i].cy + v
                        .data
                        .bits[i].dist / 2, -v.data.bits[i].dist, -v.data.bits[i].dist
                    );
                    v.data.bits[i].dist--;

                }
            }
            while (v.data.bits.length && v.data.bits[0].dist < -10)
                v.data.bits.shift();
        })
    }, 100)
}
if (document.readyState != "loading") startAnniPairs(); 
else document.addEventListener("DOMContentLoaded", startAnniPairs);