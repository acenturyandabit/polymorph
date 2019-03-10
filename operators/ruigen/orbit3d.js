/*
orbit3dSettings{
  sinusoidal: true or false.
  raidalScalingFactor: how much the shape dilates as it goes out. 10 is a nice number for phones.
}
*/

function Vector(x, y, z) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
}

Vector.prototype = {
  negative: function () {
    return new Vector(-this.x, -this.y, -this.z);
  },
  add: function (v) {
    if (v instanceof Vector)
      return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
    else return new Vector(this.x + v, this.y + v, this.z + v);
  },
  subtract: function (v) {
    if (v instanceof Vector)
      return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
    else return new Vector(this.x - v, this.y - v, this.z - v);
  },
  multiply: function (v) {
    if (v instanceof Vector)
      return new Vector(this.x * v.x, this.y * v.y, this.z * v.z);
    else return new Vector(this.x * v, this.y * v, this.z * v);
  },
  divide: function (v) {
    if (v instanceof Vector)
      return new Vector(this.x / v.x, this.y / v.y, this.z / v.z);
    else return new Vector(this.x / v, this.y / v, this.z / v);
  },
  equals: function (v) {
    return this.x == v.x && this.y == v.y && this.z == v.z;
  },
  dot: function (v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  },
  scaleTo: function (len) {
    return this.divide(this.length()).multiply(len);
  },
  cross: function (v) {
    return new Vector(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  },
  length: function () {
    return Math.sqrt(this.dot(this));
  },
  unit: function () {
    return this.divide(this.length());
  },
  min: function () {
    return Math.min(Math.min(this.x, this.y), this.z);
  },
  max: function () {
    return Math.max(Math.max(this.x, this.y), this.z);
  },
  toAngles: function () {
    return {
      theta: Math.atan2(this.z, this.x),
      phi: Math.asin(this.y / this.length())
    };
  },
  angleTo: function (a) {
    return Math.acos(this.dot(a) / (this.length() * a.length()));
  },
  toArray: function (n) {
    return [this.x, this.y, this.z].slice(0, n || 3);
  },
  clone: function () {
    return new Vector(this.x, this.y, this.z);
  },
  toXY: function () {
    xx = this.x * -(Math.sqrt(3) / 2) + this.z * (Math.sqrt(3) / 2);
    yy = this.x / 2 + this.z / 2 - this.y;
    return [xx, yy];
  },
  init: function (x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
};

Vector.rotate = function (ax, rd, th) {
  c = ax.cross(rd);
  rs = rd.multiply(Math.cos(th)).add(c.multiply(Math.sin(th)));
  return rs;
};

Vector.negative = function (a, b) {
  b.x = -a.x;
  b.y = -a.y;
  b.z = -a.z;
  return b;
};
Vector.add = function (a, b, c) {
  if (b instanceof Vector) {
    c.x = a.x + b.x;
    c.y = a.y + b.y;
    c.z = a.z + b.z;
  } else {
    c.x = a.x + b;
    c.y = a.y + b;
    c.z = a.z + b;
  }
  return c;
};
Vector.subtract = function (a, b, c) {
  if (b instanceof Vector) {
    c.x = a.x - b.x;
    c.y = a.y - b.y;
    c.z = a.z - b.z;
  } else {
    c.x = a.x - b;
    c.y = a.y - b;
    c.z = a.z - b;
  }
  return c;
};
Vector.multiply = function (a, b, c) {
  if (b instanceof Vector) {
    c.x = a.x * b.x;
    c.y = a.y * b.y;
    c.z = a.z * b.z;
  } else {
    c.x = a.x * b;
    c.y = a.y * b;
    c.z = a.z * b;
  }
  return c;
};
Vector.divide = function (a, b, c) {
  if (b instanceof Vector) {
    c.x = a.x / b.x;
    c.y = a.y / b.y;
    c.z = a.z / b.z;
  } else {
    c.x = a.x / b;
    c.y = a.y / b;
    c.z = a.z / b;
  }
  return c;
};
Vector.cross = function (a, b, c) {
  c.x = a.y * b.z - a.z * b.y;
  c.y = a.z * b.x - a.x * b.z;
  c.z = a.x * b.y - a.y * b.x;
  return c;
};
Vector.unit = function (a, b) {
  var length = a.length();
  b.x = a.x / length;
  b.y = a.y / length;
  b.z = a.z / length;
  return b;
};
Vector.fromAngles = function (theta, phi) {
  return new Vector(
    Math.cos(theta) * Math.cos(phi),
    Math.sin(phi),
    Math.sin(theta) * Math.cos(phi)
  );
};
Vector.randomDirection = function () {
  return Vector.fromAngles(
    Math.random() * Math.PI * 2,
    Math.asin(Math.random() * 2 - 1)
  );
};
Vector.min = function (a, b) {
  return new Vector(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
};
Vector.max = function (a, b) {
  return new Vector(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));
};
Vector.lerp = function (a, b, fraction) {
  return b
    .subtract(a)
    .multiply(fraction)
    .add(a);
};
Vector.fromArray = function (a) {
  return new Vector(a[0], a[1], a[2]);
};
Vector.angleBetween = function (a, b) {
  return a.angleTo(b);
};


var orbit3dDefaultSettings = {
  factor: 8,
  angularAmplitude: 5,
  shapeCount:3,
  colorGenerator: function () {
    var output = "#00";
    var ac_char = [
      "6",
      "7",
      "8",
      "9",
      "0",
      "a",
      "b",
      "c",
      "d",
      "e",
      "f"
    ];
    for (var i = 0; i < 2; i++) {
      output += ac_char[Math.floor(Math.random() * 17)];
    }
    output += "00";
    return output;
  },
  radialScalingFactor: 0,
  axialRotationFactor: 0.03,
  backgroundFillColor: "black",
  maxVertices: 8,
  forceOrthogonality: true,
  radialAmplitude: 1,
  shape: function (maxR, ramR) {
    //for sinusoidal radius
    if (orbit3dSettings.sinusoidal) {
      this.ram = (Math.random() * 0.5 + 0.5) * ramR; // the radius at which the sin function peaks.
      this.rsin = 0; //term in the sin function for sinusoidal radius
    }
    //end sinusoidal radius
    //axis theta and phi
    this.at = Math.random() * Math.PI;
    this.ap = Math.random() * Math.PI;
    this.axis = Vector.fromAngles(this.at, this.ap);
    this.dat = Math.random() * orbit3dSettings.axialRotationFactor;
    this.dap = Math.random() * orbit3dSettings.axialRotationFactor;
    //end axis theta and phi
    this.rvector = new Vector(1, 0, 0); //change to random vector and then cross and normalise
    if (orbit3dSettings.forceOrthogonality) {
      this.rvector = this.rvector.cross(this.axis).scaleTo(1);
    }
    this.r = Math.random() * ramR; //radius
    this.dt = Math.random() * orbit3dSettings.angularAmplitude; //theta
    this.color = orbit3dSettings.colorGenerator(); //this color
    this.factor = orbit3dSettings.factor;
    var vt = Math.floor(Math.random() * (orbit3dSettings.maxVertices - 3) + 3); //number of vertices
    this.bits = [];
    for (var i = 0; i < vt; i++) this.bits.push(new bit(maxR / 3));
    this.bitT = 0; //bit theta for rotation
    //this.bitDt = (Math.random() * 2 - 1) * 0.01; // bit d theta
    this.bitDt = 0; // bit d theta
  }
};
var orbit3dSettings;
if (!orbit3dSettings) orbit3dSettings = orbit3dDefaultSettings;
else orbit3dSettings = Object.assign(orbit3dDefaultSettings, orbit3dSettings);

orbit3d = [];

function bit(maxR) {
  this.dt = Math.random() * 5;
  this.dr = Math.random() * maxR;
}

///////Kaleiocore
function startOrbit3d() {
  let things = document.getElementsByClassName("orbit3d");
  for (i = 0; i < things.length; i++) {
    e = things[i];
    let orbit3dCanvas = document.createElement("canvas");
    orbit3dCanvas.width = e.clientWidth;
    orbit3dCanvas.height = e.clientHeight;
    e.appendChild(orbit3dCanvas);
    ctx = orbit3dCanvas.getContext("2d");
    o3do = {
      ctx: ctx,
      e: orbit3dCanvas,
      phase: 0,
      data: {
        predisp: [],
        shapes: []
      },
      radius: Math.min(orbit3dCanvas.width, orbit3dCanvas.height) / 2
    };
    for (i = 0; i < orbit3dSettings.shapeCount; i++) {
      o3do.data.shapes.push(new orbit3dSettings.shape(o3do.radius, o3do.radius));
    }
    orbit3d.push(o3do);
  };
  setInterval(() => {
    orbit3d.forEach((v, i) => {
      v.ctx.fillStyle = orbit3dSettings.backgroundFillColor;
      v.ctx.fillRect(0, 0, v.e.width, v.e.height);
      for (var i = 0; i < v.data.shapes.length; i++) {
        s = v.data.shapes[i];
        if (orbit3dSettings.sinusoidal) {
          s.rsin += s.rRate;
          s.r = s.ram * Math.sin(s.rsin / 100) ** 1.8;
        }
        s.bitT += s.bitDt;
        // rotate the vector about the axis
        s.at += s.dat;
        s.ap += s.dap;
        s.axis = Vector.fromAngles(s.at, s.ap);
        s.rvector = Vector.rotate(s.axis, s.rvector, s.dt * Math.PI / 180).scaleTo(
          s.r
        );
      }
      //draw everything
      for (var k = 0; k < v.data.shapes.length; k++) {
        s = v.data.shapes[k];
        for (var i = 0; i < s.factor; i++) {
          v.ctx.beginPath();
          var ist = true;
          cnt = Vector.rotate(
            s.axis,
            s.rvector,
            (i * Math.PI * 2) / s.factor
          ).scaleTo(s.rvector.length());
          for (var j = 0; j < s.bits.length; j++) {
            b = s.bits[j];
            kr = b.dr;
            kd = b.dt + s.bitT;
            pos = cnt.add(Vector.rotate(s.axis, s.rvector, kd + (i * Math.PI * 2) / s.factor).scaleTo(kr));
            posxy = pos.toXY();
            if (ist) {
              v.ctx.moveTo(posxy[0] + v.e.width / 2, posxy[1] + v.e.height / 2);
              ist = false;
            } else v.ctx.lineTo(posxy[0] + v.e.width / 2, posxy[1] + v.e.height / 2);
          }
          b = s.bits[0];
          kr = b.dr / 5;
          kd = b.dt + s.bitT;
          pos = cnt.add(Vector.rotate(s.axis, s.rvector, kd + (i * Math.PI * 2) / s.factor).scaleTo(kr));
          posxy = pos.toXY();
          v.ctx.lineTo(posxy[0] + v.e.width / 2, posxy[1] + v.e.height / 2);
          v.ctx.fillStyle = s.color;
          v.ctx.closePath();
          v.ctx.fill();
        }
      }
    });
  }, 100);
}

if (document.readyState != "loading") startOrbit3d(); else document.addEventListener("DOMContentLoaded", startOrbit3d);