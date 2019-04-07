///helpful stuff///
function getRand(arr) {
    if (arr && arr.length) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
    // The undefined will be returned if the empty array was passed
}







//////////matrixText//////
matrixText = [];
matrixTextSettings = {
    frequency: 0.5,
    finalHoldingTime: 10,
    allowedChars: "QWERTYUIOPASDFGHJKLZXCVBNM<>?{}!@#$%^&*()+~1234567890-=/[]|\\",
}




function startMatrixText() {
    $("head").append(`
    <style>
        
</style>`)
    let things = document.getElementsByClassName("matrixtext");
    for (i = 0; i < things.length; i++) {
        e = things[i];
        matrixCanvas = document.createElement("canvas");
        matrixCanvas.width = e.clientWidth;
        matrixCanvas.height = e.clientHeight;
        e.appendChild(matrixCanvas);
        ctx = matrixCanvas.getContext('2d');
        matrixText.push({
            ctx: ctx,
            e: matrixCanvas,
            data: {
                streams: []
            }
        });
    }
    setInterval(() => {
        matrixText.forEach((v, i) => {
            //generate new line
            if (Math.random() < matrixTextSettings.frequency) {
                strlens = Math.floor(Math.random() * v.e.height / 20 + 10);
                basestr = "";
                for (i = 0; i < strlens; i++) basestr += getRand(matrixTextSettings.allowedChars);
                v.data.streams.push({
                    genstep: 0,
                    finalLen: strlens,
                    rooty: 10,
                    rootx: Math.floor(Math.random() * v.e.width),
                    size: Math.floor(Math.random() * 15 + 10),
                    str: basestr
                })
            }
            v.ctx.fillStyle = "rgba(0,0,0,0.3)";
            v.ctx.fillRect(0, 0, v.e.width, v.e.height);
            v.data.streams.forEach((e, i) => {
                //draw all residuals
                undraw = true;
                if (e.genstep >= 0) {
                    for (let j = 0; j < e.genstep; j++) {
                        v.ctx.fillStyle = "rgb(0," + Math.floor(j / (e.genstep + 1) * 255) + ",0)"
                        v.ctx.fillStyle = "green";
                        if (j == e.genstep - 1) v.ctx.fillStyle = "white";
                        v.ctx.font = e.size + "px monospace";
                        //if (v.ctx.fillStyle!="#008000")console.log(v.ctx.fillStyle);
                        v.ctx.fillText(e.str[j], e.rootx, e.rooty + j * e.size);

                    }
                    undraw = false;
                    e.genstep++;
                    if (e.genstep > e.finalLen) e.genstep = -1;
                } else {
                    if (e.genstep < -matrixTextSettings.finalHoldingTime) {
                        v.data.streams.splice(v.data.streams.indexOf(e), 1);
                        undraw = false;
                    } else {
                        for (let j = 0; j < e.finalLen; j++) {
                            v.ctx.fillStyle = "rgb(0," + Math.floor((j + e.genstep) / e.finalLen * 255) + ",0)";
                            if (j == e.finalLen - 1) {
                                //ghosty=Math.floor((1+(e.genstep/e.finalLen))*255);
                                //v.ctx.fillStyle = "rgb("+ghosty+","+ghosty+","+ghosty+")";
                                v.ctx.fillStyle = "white";
                            }
                            v.ctx.font = e.size + "px monospace";
                            if ((j != e.finalLen - 1) || (e.genstep % 2 != 0)) v.ctx.fillText(e.str[j], e.rootx, e.rooty + j * e.size);
                        }
                        undraw = false;
                        e.genstep--;
                    }
                }
                if (undraw) console.log("huh");
            });
        });
    }, 100)
}

if (document.readyState != "loading") startMatrixText(); else document.addEventListener("DOMContentLoaded", startMatrixText);