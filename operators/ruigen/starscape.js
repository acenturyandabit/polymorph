/*
starscape settings{
  sinusoidal: true or false.
  raidalScalingFactor: how much the shape dilates as it goes out. 10 is a nice number for phones.
}
*/

var starscapeDefaultSettings = {
    randcol: function () {
        var output = "#00";
        var ac_char = "0123456789abcdef";
        for (var i = 0; i < 2; i++) {
            output += ac_char[Math.floor(Math.random() * 17)];
        }
        output += "00";
        return output;
    },
    dt:1,
    flux_k:0.02,
    starline:function(){
        this.innerRate=Math.random()*5+2;//rate of radius increase
        this.outerRate=Math.random()*2+this.innerRate;//rate of radius increase
        this.inR=Math.random()*10;//radius
        this.outR=this.inR;
        this.t=0;//theta
        this.bt=Math.random()*2*Math.PI;
        this.lw=(this.outerRate-this.innerRate)/6+0.5;
        this.pushed=false;
        this.col=starscapeSettings.randcol();
    },
};
var starscapeSettings;
if (!starscapeSettings) starscapeSettings = starscapeDefaultSettings;
else starscapeSettings = Object.assign(starscapeDefaultSettings, starscapeSettings);

starscape = [];

///////Kaleiocore
function startstarscape() {
    let things=document.getElementsByClassName("starscape");
     for (i=0;i<things.length;i++){
         e=things[i];
        let starscapeCanvas = document.createElement("canvas");
        starscapeCanvas.width = e.clientWidth;
        starscapeCanvas.height = e.clientHeight;
        e.appendChild(starscapeCanvas);
        ctx = starscapeCanvas.getContext("2d");
        stro = {
            ctx: ctx,
            e: starscapeCanvas,
            phase: 0,
            data: {
                starlines: []
            },
            radius: Math.max(starscapeCanvas.width, starscapeCanvas.height) / 2,
            dt:0,
            phase:0,
            bt:0
        };
        starscape.push(stro);
    };
    setInterval(() => {
        starscape.forEach((v, i) => {
            //clear the canvas
            v.ctx.fillStyle = starscapeSettings.backgroundFillColor;
            v.ctx.fillRect(0, 0, v.e.width, v.e.height);
            //make new shapes
            do{
                v.data.starlines.push(new starscapeSettings.starline());
			}while (Math.random()*1.5<1);
            //update all shapes
            if (Math.abs(v.dt)<0.05){
                v.amp=(Math.random()*0.5+0.5)*Math.PI;
            }
            v.phase+=starscapeSettings.flux_k/v.amp;
            v.dt=v.amp*Math.sin(v.phase);
            for (var i = 0; i < v.data.starlines.length; i++) {
                s=v.data.starlines[i];
				s.inR+=s.innerRate;
				s.outR+=s.outerRate;
				s.t=s.bt+v.dt;
				if (s.inR>v.radius){
                    v.data.starlines.splice(i,1);
                    i--;
                }
                
                //draw the starline
				v.ctx.beginPath();
				v.ctx.moveTo(s.inR*Math.cos(s.t)+v.e.width/2,s.inR*Math.sin(s.t)+v.e.height/2);
				v.ctx.lineTo(s.outR*Math.cos(s.t)+v.e.width/2,s.outR*Math.sin(s.t)+v.e.height/2);
				v.ctx.closePath();
				v.ctx.strokeStyle=s.col;
				v.ctx.lineWidth=s.lw;
				v.ctx.stroke();
            }
        });
    }, 100);
}

if (document.readyState != "loading") startstarscape(); else document.addEventListener("DOMContentLoaded", startstarscape);