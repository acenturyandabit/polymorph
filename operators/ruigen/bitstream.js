///////////////bitstream/////////
bitstreams = [];
bitsettings = {
    spacing: 1,
    stripcount: 6
}

function startBitStream(el){
    let things;
    if (!el)things=document.getElementsByClassName("bitstream");
    else things=[el];
    for (i = 0; i < things.length; i++) {
        _e = things[i];
        e = document.createElement("canvas");
        _e.append(e);
        e.width = _e.clientWidth;
        e.height = _e.clientHeight;
        //e.height = (v.chipsize + bitsettings.spacing) * bitsettings.stripcount;
        //clear the screen on first run
        _ctx = e.getContext('2d');
        _ctx.fillStyle = "black";
        _ctx.fillRect(0, 0, e.clientWidth, e.clientHeight);
        bitstreams.push({
            data: {
                selfc: e,
                pos: 0
            },
            ctx: _ctx,
            chipheight: e.height / bitsettings.stripcount - bitsettings.spacing,
            chipwidth: e.width / bitsettings.stripcount - bitsettings.spacing,
            h: e.height
        });
    }
    setInterval(() => {
        bitstreams.forEach((v, i) => {
            //Generate bit
            v.ctx.fillStyle = "rgb(0," + Math.floor(Math.random() * 255) + ",0)";
            v.ctx.fillRect(bitsettings.spacing, (v.chipheight + bitsettings.spacing) *
                v.data.pos + 1, v.chipwidth, v.chipheight);
            v.data.pos++;
            //iterate
            if (v.data.pos > bitsettings.stripcount) {
                v.data.pos = 0;
                v.ctx.drawImage(v.data.selfc, v.chipwidth + bitsettings.spacing,
                    0);
                v.ctx.fillStyle = "black";
                v.ctx.fillRect(0, 0, v.chipwidth +
                    bitsettings.spacing, v.h);
            }
        })
    }, 100)
}
if (document.readyState != "loading") startBitStream(); else document.addEventListener("DOMContentLoaded", startBitStream);