function startRadar() {
    radars = [];
    let things = document.getElementsByClassName("radar");
    for (i = 0; i < things.length; i++) {
        _e = things[i];
        e = document.createElement("canvas");
        _e.append(e);
        e.width = _e.clientWidth;
        e.height = _e.clientHeight;
        slen = e.height;
        if (slen > e.width) slen = e.width;
        radars.push({
            e: e,
            data: {
                r: slen / 2,
                t: 0,
                points: []
            },
            ctx: e.getContext('2d'),
            cx: e.width / 2,
            cy: e.height / 2,
        });
    };
    setInterval(() => {
        radars.forEach((v, i) => {
            //sweep
            v.ctx.beginPath();
            v.ctx.moveTo(v.cx, v.cy);
            v.ctx.lineTo(v.cx + v.data.r * Math.cos(v.data.t), v.cy + v.data.r * Math.sin(
                v.data.t));
            v.ctx.arc(v.cx, v.cy, v.data.r, v.data.t, v.data.t + 2);
            v.data.t += 0.02;
            v.ctx.lineTo(v.cx, v.cy);
            //v.ctx.strokeStyle = "green";
            //v.ctx.stroke();
            v.ctx.fillStyle = "rgba(0,100,0,0.1)";
            v.ctx.fill();
            v.ctx.closePath();
            //fading
            v.ctx.fillStyle = "rgba(0,0,0,0.1)";
            v.ctx.fillRect(0, 0, v.cx * 2, v.cy * 2);

            //generate, remove and update points
            if (Math.random() < 0.1 - 0.01 * v.data.points.length) {
                if (Math.random() < 0.5) {
                    v.data.points.push({
                        rth: Math.random() * 2 + v.data.t,
                        rr: v.data.r,
                        dth: Math.random() * -0.02 + 0.01,
                        drr: Math.random() * -v.data.r * 0.005,
                        t: 0
                    });
                } else {
                    v.data.points.push({
                        rth: 2 + v.data.t,
                        rr: v.data.r * (0.5 + Math.random() * 0.5),
                        dth: Math.random() * -0.02 + 0.01,
                        drr: Math.random() * -v.data.r * 0.005,
                        t: 0
                    });
                }
            }
            for (let i = 0; i < v.data.points.length; i++) {
                v.data.points[i].rth += v.data.points[i].dth;
                v.data.points[i].rr += v.data.points[i].drr;
                v.data.points[i].t++;
                if (v.data.points[i].rth < v.data.t || v.data.points[i].rth > 2 + v.data.t) v.data.points.splice(i, 1);
            }

            //plot points
            for (let i = 0; i < v.data.points.length; i++) {
                d = v.data.points[i];
                if (d.t % 5) continue;
                v.ctx.beginPath();
                v.ctx.arc(v.cx + Math.cos(d.rth) * d.rr, v.cy + Math.sin(d.rth) * d.rr, 5, 0, 2 *
                    Math.PI);
                v.ctx.fillStyle = "rgb(0,200,0)";
                v.ctx.fill();
                v.ctx.closePath();
            }

            //draw crosshairs and rings
            v.ctx.beginPath();
            v.ctx.arc(v.cx, v.cy, v.data.r * 4 / 5, 0, Math.PI * 2);
            v.ctx.strokeStyle = "#001100";
            v.ctx.stroke();
            v.ctx.closePath();
            v.ctx.beginPath();
            v.ctx.arc(v.cx, v.cy, v.data.r * 3 / 5, 0, Math.PI * 2);
            v.ctx.strokeStyle = "#003300";
            v.ctx.stroke();
            v.ctx.closePath();
            v.ctx.beginPath();
            v.ctx.arc(v.cx, v.cy, v.data.r * 2 / 5, 0, Math.PI * 2);
            v.ctx.strokeStyle = "#005500";
            v.ctx.stroke();
            v.ctx.closePath();
            v.ctx.beginPath();
            v.ctx.arc(v.cx, v.cy, v.data.r * 1 / 5, 0, Math.PI * 2);
            v.ctx.strokeStyle = "#007700";
            v.ctx.stroke();
            v.ctx.closePath();
            v.ctx.fillStyle = "#007700";
            v.ctx.fillRect(0, v.e.height / 2, v.e.width, 1);
            v.ctx.fillRect(v.e.width / 2, 0, 1, v.e.height);
        })
    }, 100)
}

if (document.readyState != "loading") startRadar(); else document.addEventListener("DOMContentLoaded", startRadar);