////////triflow//////
triflow = [];
triflowsettings = {
    bitprob: 0.1,
    delTheta: 0.1,
    flowrate: 5,
    genStep: 3,
    innerRadius: 0.1,
    outerRadius: 0.25
}

function startTriflow() {
    let things = document.getElementsByClassName("triflow");
    for (i = 0; i < things.length; i++) {
        _e = things[i];
        e = document.createElement("canvas");
        _e.append(e);
        e.width = _e.clientWidth;
        e.height = _e.clientHeight;
        triflow.push({
            data: {
                bits: []
            },
            ctx: e.getContext('2d'),
            h: e.height,
            w: e.width,
            tick: 0
        });
    };
    setInterval(() => {
        triflow.forEach((v, i) => {
            //Generate bit
            if (!(v.tick % triflowsettings.genStep) || v.data.bits.length < 3) {
                v.data.bits.push({
                    x: -2 / triflowsettings.bitprob,
                    //c: e.clientHeight*(0.4 + Math.random() * 0.1),
                    c: e.clientHeight / 2,
                    a: (() => {
                        if (v.tick % (triflowsettings.genStep * 2)) return e.clientHeight * triflowsettings.innerRadius;
                        return e.clientHeight * triflowsettings.outerRadius
                    })(), //*(0.2 + Math.random() * 0.05),
                    //a:e.clientHeight/4,
                    //omg: 0.02 + Math.random() * 0.1,
                    omg: triflowsettings.delTheta,
                    phi: 0, //Math.random() * 2 * Math.PI
                    //phi: v.tick*0.01*Math.PI
                })
                //v.tick+=Math.random()*5;
            }
            v.tick++;
            //clear screen
            v.ctx.fillStyle = "black";
            v.ctx.fillRect(0, 0, v.w, v.h);
            //Draw bits
            if (v.data.bits.length > 3) {
                for (i = 2; i < v.data.bits.length; i++) {
                    //v.ctx.fillStyle = "rgb(0," + Math.floor(Math.random() * 255) + ",0)";
                    //v.ctx.strokeStyle = "rgb(0," + Math.floor(Math.random() * 255) + ",0)";
                    v.ctx.strokeStyle = "green"
                    v.ctx.beginPath();
                    v.ctx.moveTo(v.data.bits[i].x, v.data.bits[i].c + v.data.bits[i].a *
                        Math.sin(v.data.bits[i].phi));
                    v.ctx.lineTo(v.data.bits[i - 1].x, v.data.bits[i - 1].c + v.data.bits[
                        i - 1].a * Math.sin(v.data.bits[i - 1].phi));
                    v.ctx.lineTo(v.data.bits[i - 2].x, v.data.bits[i - 2].c + v.data.bits[
                        i - 2].a * Math.sin(v.data.bits[i - 2].phi));
                    v.ctx.lineTo(v.data.bits[i].x, v.data.bits[i].c + v.data.bits[i].a *
                        Math.sin(v.data.bits[i].phi));
                    //v.ctx.fill();
                    v.ctx.stroke();
                }
            }
            //update all bits
            for (i = 0; i < v.data.bits.length; i++) {
                v.data.bits[i].phi += v.data.bits[i].omg;
                v.data.bits[i].x += triflowsettings.flowrate;
            }
            while (v.data.bits.length && v.data.bits[0].x > v.w) v
                .data.bits.shift();
        })
    }, 100)
}

if (document.readyState != "loading") startTriflow();
else document.addEventListener("DOMContentLoaded", startTriflow);