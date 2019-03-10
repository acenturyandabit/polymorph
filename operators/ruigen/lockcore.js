var lockCoreDefaultSettings = {
    angularSlices: 12,
    tiers: 7,
    maxSegments: 9,
    baseShapeCount: 5,
    maxRotationDuration: 30,
    pauseChance: 0.3,
    colorGenerator: function () {
        var output = "rgba(0,";
        output += Math.floor(Math.random() * 200) + 55;
        output += ",0,0.1)";
        return output;
    },
    radialScalingFactor: 0,
    backgroundFillColor: "black",
    rotationSegmentLock: true,
    radialAmplitude: 1,
    allowedElements: ["ring", "sectorFlash", "raidalFlash"],
    shape: function (type) {
        this.type = type;
        this.segments = [];
        this.segmentCount = lockCoreSettings.maxSegments;
        this.segments.push(new lockCoreSettings.bit(0));
        for (i = 0; i < this.segmentCount; i++) {
            this.segments.push(new lockCoreSettings.bit(this.segments[this.segments.length - 1].angleEnd));
        }
        if (type == "ring") {
            this.theta = 0; //Math.random() * Math.PI * 2;
            if (Math.random() < 1 - lockCoreSettings.pauseChance) {
                if (lockCoreSettings.rotationSegmentLock) {
                    this.duration = this.totalDuration = Math.floor((Math.random() * 0.5 + 0.5) * lockCoreSettings.maxRotationDuration);
                    this.rstart = 0;
                    this.rend = Math.floor(Math.random() * 10 - 5) / lockCoreSettings.angularSlices * Math.PI * 2;
                } else {
                    this.duration = this.totalDuration = Math.floor((Math.random() * 0.5 + 0.5) * lockCoreSettings.maxRotationDuration);
                    this.rstart = 0;
                    this.rend = Math.random() * 2 * Math.PI;
                }
            } else {
                this.duration = Math.random() * lockCoreSettings.maxRotationDuration;
                this.delta = 0;
            }
        } else {
            this.duration = 15;
            this.regenerate = function () {
                this.segments = [];
                this.segments.push(new lockCoreSettings.bit(0, this.type));
                if (this.type == "radialFlash") this.segmentCount = 1;
                for (i = 0; i < this.segmentCount; i++) {
                    this.segments.push(new lockCoreSettings.bit(this.segments[this.segments.length - 1].angleEnd, this.type));
                }
            }
            this.regenerate();
            this.theta = 0;
        }
        this.color = lockCoreSettings.colorGenerator();
    },

    bit: function (angleStartMin, flashType) {
        if (flashType == "sectorFlash") {
            this.angleStart = angleStartMin + Math.floor(Math.random()) * 3 + 1; //Math.floor(Math.random() * (lockCoreSettings.angularSlices - angleStartMin)); //Math.floor(Math.random()*3)+this.angleStart;
            this.angleEnd = this.angleStart + Math.floor(Math.random()) * 2 + 1 //Math.floor(Math.random() * (lockCoreSettings.angularSlices - this.angleStart)); //Math.floor(Math.random()*3)+this.angleStart;
            this.tierStart = Math.floor(Math.random() * (lockCoreSettings.tiers - 3)) + 1;
            this.tierEnd = this.tierStart + 1;
        } else if (flashType == "radialFlash") {
            this.angleStart = 0; //Math.floor(Math.random() * (lockCoreSettings.angularSlices - angleStartMin)); //Math.floor(Math.random()*3)+this.angleStart;
            this.angleEnd = lockCoreSettings.angularSlices; //Math.floor(Math.random() * (lockCoreSettings.angularSlices - this.angleStart)); //Math.floor(Math.random()*3)+this.angleStart;
            this.tierStart = Math.floor(Math.random() * (lockCoreSettings.tiers - 3)) + 1;
            this.tierEnd = this.tierStart + 1;
        } else {
            this.angleStart = angleStartMin + Math.floor(Math.random()) * 2; //Math.floor(Math.random() * (lockCoreSettings.angularSlices - angleStartMin)); //Math.floor(Math.random()*3)+this.angleStart;
            this.angleEnd = this.angleStart + Math.floor(Math.random()) * 5 + 3; //Math.floor(Math.random() * (lockCoreSettings.angularSlices - this.angleStart)); //Math.floor(Math.random()*3)+this.angleStart;
            this.tierStart = Math.floor(Math.random() * (lockCoreSettings.tiers - 1)) + 1;
            this.tierEnd = this.tierStart + Math.floor(Math.random() * (lockCoreSettings.tiers - this.tierStart));
        }

    }
};
var lockCoreSettings;
if (!lockCoreSettings) lockCoreSettings = lockCoreDefaultSettings;
else
    lockCoreSettings = Object.assign(
        lockCoreDefaultSettings,
        lockCoreSettings
    );

lockCore = [];


function startlockCore() {
    let things = document.getElementsByClassName("lockCore");
    for (i = 0; i < things.length; i++) {
        e = things[i];
        lockCanvas = document.createElement("canvas");
        lockCanvas.width = e.clientWidth;
        lockCanvas.height = e.clientHeight;
        e.appendChild(lockCanvas);
        ctx = lockCanvas.getContext("2d");
        lockCore.push({
            ctx: ctx,
            e: lockCanvas,
            phase: 0,
            data: {
                shapes: []
            },
            radius: Math.min(lockCanvas.width, lockCanvas.height) / 2
        });
    };
    setInterval(() => {
        lockCore.forEach((v, i) => {
            //clear board
            v.ctx.fillStyle = lockCoreSettings.backgroundFillColor;
            v.ctx.fillRect(0, 0, v.e.width, v.e.height);
            //make a bunch of core shapes, if we dont have any
            if (!v.shapesLoaded) {
                v.shapesLoaded = true;
                for (i = 0; i < lockCoreSettings.baseShapeCount; i++) {
                    v.data.shapes.push(new lockCoreSettings.shape("ring"));
                }
            }
            if (v.data.shapes.length < lockCoreSettings.baseShapeCount + 1) {
                if (Math.random() * 1 < 0.05) {
                    v.data.shapes.push(new lockCoreSettings.shape("sectorFlash"));
                }
                if (Math.random() * 1 < 0.05) {
                    v.data.shapes.push(new lockCoreSettings.shape("radialFlash"));
                }
            }

            //Rotate the ring locks
            for (var i = 0; i < v.data.shapes.length; i++) {
                s = v.data.shapes[i];
                if (s.type == "ring") {
                    s.theta = s.rend + (s.rstart - s.rend) * (s.duration / s.totalDuration);
                    s.duration -= 1;
                    if (s.duration < 0) {
                        if (Math.random() < 1 - lockCoreSettings.pauseChance) {
                            if (lockCoreSettings.rotationSegmentLock) {
                                s.duration = s.totalDuration = Math.floor((Math.random() * 0.5 + 0.5) * lockCoreSettings.maxRotationDuration);
                                s.rstart = s.rend;
                                s.rend = Math.floor(Math.random() * 10 - 5) / lockCoreSettings.angularSlices * Math.PI * 2;
                            } else {
                                s.duration = s.totalDuration = Math.floor((Math.random() * 0.5 + 0.5) * lockCoreSettings.maxRotationDuration);
                                s.rstart = s.rend;
                                s.rend = Math.random() * 2 * Math.PI;
                            }
                        } else {
                            s.duration =s.totalDuration= Math.random() * lockCoreSettings.maxRotationDuration;
                            s.rstart=s.rend;
                        }
                    }
                } else /*if (s.type=="sectorFlash")*/ {
                    s.duration--;
                    if (!(s.duration % 5)) {
                        s.regenerate();
                    }
                    if (s.duration <= 0) {
                        v.data.shapes.splice(lockCoreSettings.baseShapeCount);
                    }
                }
            }

            //draw everything
            for (let k = 0; k < v.data.shapes.length; k++) {
                sh = v.data.shapes[k];
                if (sh.type == "ring") {
                    v.ctx.fillStyle = sh.color;
                    //v.ctx.globalCompositeOperation="source-over";
                } else {
                    v.ctx.fillStyle = "rgba(255,255,255,0.1)";
                    //v.ctx.globalCompositeOperation="lighter";
                }
                for (let i = 0; i < sh.segments.length; i++) {
                    s = sh.segments[i];
                    v.ctx.beginPath();
                    v.ctx.arc(v.e.width / 2, v.e.height / 2, v.radius * s.tierStart / (lockCoreSettings.tiers - 1), sh.theta + s.angleStart * 2 * Math.PI / lockCoreSettings.angularSlices, sh.theta + s.angleEnd * 2 * Math.PI / lockCoreSettings.angularSlices);
                    v.ctx.arc(v.e.width / 2, v.e.height / 2, v.radius * s.tierEnd / (lockCoreSettings.tiers - 1), sh.theta + s.angleEnd * 2 * Math.PI / lockCoreSettings.angularSlices, sh.theta + s.angleStart * 2 * Math.PI / lockCoreSettings.angularSlices, true);

                    v.ctx.closePath();
                    v.ctx.fill();
                }
            }
            //draw centre circle
            //draw eye mask
        });
    }, 100);
}

if (document.readyState != "loading") startlockCore();
else document.addEventListener("DOMContentLoaded", startlockCore);