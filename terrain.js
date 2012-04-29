(function() {
    B = {};

    /* Create a Scene.js translation node.
     */
    B.translate = function(x, y, z, nodes) {
        return { type: "translate", x: x, y: y, z: z, nodes: nodes };
    };


    /* Terrain Class ---------------------------------------------------
     *
     */

    B.Terrain = function(size) {
        this.S = size; this.S1 = size + 1;
        this.makeGeometry();
    };

    /* Generate a geometry node of a plane divided into n rows and m columns,
     * each a unit distance apart, using indexed triangles to render.
     */
    B.Terrain.prototype.makeGeometry = function() {
        var S1 = this.S1;
        var pos  = new Array(S1 * S1 * 3);
        var norm = new Array(S1 * S1 * 3);
        var ind  = new Array(this.S * this.S * 6);
        var x, y, i, rowA, rowB;

        i = 0;
        for (y = 0; y <= this.S; y++) {
            for (x = 0; x <= this.S; x++) {
                pos[i    ] = x;
                pos[i + 1] = y;
                pos[i + 2] = -0.1;

                norm[i    ] = 0;
                norm[i + 1] = 0;
                norm[i + 2] = 1;

                i += 3;
            }
        }

        i = 0;
        for (y = 0; y < this.S; y++) {
            rowA = y * S1;
            rowB = rowA + S1;
            for (x = 0; x < this.S; x++) {
                ind[i    ] = x + rowA;
                ind[i + 1] = x + rowA + 1;
                ind[i + 2] = x + rowB;

                ind[i + 3] = x + rowB;
                ind[i + 4] = x + rowA + 1;
                ind[i + 5] = x + rowB + 1;

                i += 6;
            }
        }

        this.positions = pos;
        this.normals = norm;
        this.indices = ind;
    };

    /* Returns a Scene.js geometry node for this terrain.
     */
    B.Terrain.prototype.makeNode = function(id) {
        return { type: "geometry", primitive: "triangles", id: id,
                 positions: this.positions,
                 normals: this.normals,
                 colors: this.colors,
                 indices: this.indices };
    };

    /* Update the given Scene.js node with current vertex positions and normals.
     */
    B.Terrain.prototype.updateNode = function(node) {
        node.set("positions", {positions: this.positions});
        node.set("normals", {normals: this.normals});
    };

    B.Terrain.prototype.centerVertically = function() {
        var i, n = 3 * this.S1 * this.S1, avg;
        avg = 0.0;
        for (i = 2; i < n; i += 3) {
            avg += this.positions[i];
        }
        avg /= (this.S1 * this.S1);
        for (i = 2; i < n; i += 3) {
            this.positions[i] -= avg;
        }
    };

    B.Terrain.prototype.reset = function() {};
    B.Terrain.prototype.calc_normals = function() {};
    B.Terrain.prototype.smooth = function() {};

    /* Give colors to terrain vertexes.  Random for now.
     */
    B.Terrain.prototype.colorize = function() {
        var x, y, i;
        this.colors = [];
        for (y = 0; y <= this.S; y++) {
            for (x = 0; x <= this.S; x++) {
                i = Math.floor(Math.random() * this.COLORS.length);
                this.colors = this.colors.concat(this.COLORS[i]);
            }
        }
    };

    B.Terrain.prototype.diamondSquare = function() {
        var x, y, m, s, s2, avg;

        // base step - set four corners
        m = this.S * 0.8;
        this.setZ(0,      0,      B.r(m));
        this.setZ(this.S, 0,      B.r(m));
        this.setZ(0,      this.S, B.r(m));
        this.setZ(this.S, this.S, B.r(m));

        for (s = this.S; s > 1; s = s2) {
            s2 = s / 2;

            m *= 0.5;

            // diamond step
            for (y = 0; y < this.S; y += s) {
                for (x = 0; x < this.S; x += s) {
                    // average of corner heights
                    avg = (this.z(x, y) + this.z(x + s, y) + this.z(x, y + s) +
                           this.z(x + s, y + s)) * 0.25;
                    this.setZ(x + s2, y + s2, avg + B.r(m));
                }
            }

            // square step
            x = s2; y = 0;
            while (y <= this.S) {
                var xs = []
                for (; x <= this.S; x += s) {
                    xs = xs.concat(x);

                    if (x == 0) { // left edge
                        avg = (this.z(x, y - s2) + this.z(x, y + s2) +
                               this.z(x + s2, y)) * 0.333;
                    } else if (x == this.S) { // right edge
                        avg = (this.z(x, y - s2) + this.z(x, y + s2) +
                               this.z(x - s2, y)) * 0.333;
                    } else if (y == 0) { // bottom edge
                        avg = (this.z(x - s2, y) + this.z(x + s2, y) +
                               this.z(x, y + s2)) * 0.333;
                    } else if (y == this.S) { // top edge
                        avg = (this.z(x - s2, y) + this.z(x + s2, y) +
                               this.z(x, y - s2)) * 0.333;
                    } else { // internal vertex
                        avg = (this.z(x - s2, y) + this.z(x + s2, y) +
                               this.z(x, y - s2) + this.z(x, y + s2)) * 0.25;
                    }
                    this.setZ(x, y, avg + B.r(m));
                }
                x = x - this.S - s2; y += s2;
            }
        }
    };

    B.Terrain.prototype.z = function(x, y) {
        if (x < 0 || x > this.S || y < 0 || y > this.S)
            alert("z(x, y): " + x + ", ", + y);
        return this.positions[3 * (x + y * this.S1) + 2];
    };
    B.Terrain.prototype.setZ = function(x, y, z) {
        if (x < 0 || x > this.S || y < 0 || y > this.S)
            alert("setZ(x, y): " + x + ", ", + y);
        this.positions[3 * (x + y * this.S1) + 2] = z;
    }

    B.r = function(mag) { return (Math.random() - 0.5) * mag; };

    B.Terrain.prototype.COLORS = [
        [0.35, 0.60, 0.88, 1.0], // water
        [0.17, 0.61, 0.13, 1.0], // grass
        [0.48, 0.31, 0.14, 1.0], // dirt
        [0.93, 0.86, 0.98, 1.0], // snow
        [0.40, 0.40, 0.45, 1.0]  // gray
    ];


    /* Vec3 Class ------------------------------------------------------
     */

    /* 3-element vector operating on a portion of an array.
     */
    B.Vec3 = function(ary, offset) {
        this.ary = ary;
        this.off = offset;
    };
    B.Vec3.prototype.x = function() { return this.ary[this.off]; }
    B.Vec3.prototype.y = function() { return this.ary[this.off + 1]; }
    B.Vec3.prototype.z = function() { return this.ary[this.off + 2]; }
    B.Vec3.prototype.add = function(v) {
        return new B.Vec3([this.x() + v.x(),
                           this.y() + v.y(),
                           this.z() + v.z()], 0);
    };
    B.Vec3.prototype.sub = function(v) {
        return new B.Vec3([this.x() - v.x(),
                           this.y() - v.y(),
                           this.z() - v.z()], 0);
    };
    B.Vec3.prototype.mul = function(f) {
        return new B.Vec3([this.x() * f,
                           this.y() * f,
                           this.z() * f], 0);
    };
    B.Vec3.prototype.addEq = function(v) {
        this.ary[this.off    ] += v.x();
        this.ary[this.off + 1] += v.y();
        this.ary[this.off + 2] += v.z();
        return this;
    };
    B.Vec3.prototype.subEq = function(v) {
        this.ary[this.off    ] -= v.x();
        this.ary[this.off + 1] -= v.y();
        this.ary[this.off + 2] -= v.z();
        return this;
    };
    B.Vec3.prototype.mulEq = function(f) {
        this.ary[this.off    ] *= f;
        this.ary[this.off + 1] *= f;
        this.ary[this.off + 2] *= f;
        return this;
    };

    B.Vec3.prototype.normal = function() {
        return this.mul(1.0 / this.magnitude());
    };
    B.Vec3.prototype.normalize = function() {
        this.mulEq(1.0 / this.magnitude());
        return this;
    };
    B.Vec3.prototype.magnitude = function() {
        var x = this.x(), y = this.y(), z = this.z();
        return Math.sqrt(x * x + y * y + z * z);
    };
    B.Vec3.prototype.dot = function(v) {
        return this.x() * v.x() + this.y() * v.y() + this.z() * v.z();
    };
    B.Vec3.prototype.cross = function(v) {
        return new B.Vec3([this.y() * v.z() - this.z() * v.y(),
                           this.z() * v.x() - this.x() * v.z(),
                           this.x() * v.y() - this.y() * v.x()], 0);
    };

    B.Vec3.prototype.rho = B.Vec3.prototype.magnitude;
    B.Vec3.prototype.theta = function() {
        return Math.atan2(this.y(), this.x());
    };
    B.Vec3.prototype.phi = function() {
        var rho = this.rho();
        return (rho == 0.0) ? 0.0 : Math.acos(this.z() / rho);
    };

    B.Vec3.prototype.rotX = function(deg) {
        var rad = deg * (Math.PI / 180.0);
        var y = this.y(), z = this.z(), cr = Math.cos(rad), sr = Math.sin(rad);
        var newY = y * cr - z * sr;
        var newZ = y * sr + z * cr;
        this.ary[this.off + 1] = newY;
        this.ary[this.off + 2] = newZ;
        return this;
    };
    B.Vec3.prototype.rotY = function(deg) {
        var rad = deg * (Math.PI / 180.0);
        var x = this.x(), z = this.z(), cr = Math.cos(rad), sr = Math.sin(rad);
        var newX = z * sr + x * cr;
        var newZ = z * cr - x * sr;
        this.ary[this.off    ] = newX;
        this.ary[this.off + 2] = newZ;
        return this;
    };
    B.Vec3.prototype.rotZ = function(deg) {
        var rad = deg * (Math.PI / 180.0);
        var x = this.x(), y = this.y(), cr = Math.cos(rad), sr = Math.sin(rad);
        var newX = x * cr - y * sr;
        var newY = x * sr + y * cr;
        this.ary[this.off    ] = newX;
        this.ary[this.off + 1] = newY;
        return this;
    };
    B.Vec3.prototype.rotate = function(deg, axis) {
        var theta = axis.theta() * (180.0 / Math.PI);
        var phi = axis.phi() * (180.0 / Math.PI);
        this.rotZ(-theta);
        this.rotY(-phi);
        this.rotZ(deg);
        this.rotY(phi);
        this.rotZ(theta);
        return this;
    };
})();


var terrain = new B.Terrain(64);
terrain.colorize();
var geom = terrain.makeNode("terrain-node");

SceneJS.createScene({
    type: "scene",
    id: "scene",
    canvasId: "terrain-demo",
    loggingElementId: "log",

    flags: {
        //backfaces: false
    },

    nodes: [
        {
            type: "lookAt",
            eye: { x: 0, y: -150, z: 45 },
            look: { x: 0, y: 0, z: 0 },
            up: { x: 0, y: 0, z: 1 },

            nodes: [
                {
                    type: "camera",
                    optics: {
                        type: "perspective",
                        fovy: 25.0,
                        aspect: (800 / 600),
                        near: 0.10,
                        far: 300.0
                    },

                    nodes: [
                        {
                            type: "light",
                            mode: "dir",
                            color: { r: 1.0, g: 1.0, b: 1.0 },
                            dir:   { x: 0.0, y: 0.0, z: -1.0 }
                        },
                        {
                            type: "rotate",
                            id: "yaw",
                            angle: 0.0,
                            z: 1.0,
                            nodes: [
                                B.translate(-32, -32, 0, [
                                    {
                                        type: "material",
                                        baseColor:      { r: 1.0, g: 1.0, b: 1.0 },
                                        specularColor:  { r: 0.4, g: 0.4, b: 0.4 },
                                        specular:       0.2,
                                        shine:          6.0,
                                        nodes: [geom]
                                    }
                                ])
                            ]
                        }
                    ]
                }
            ]
        }
    ]
});

var yaw = 30;
var pitch = -30;
var lastX;
var lastY;
var dragging = false;

function mouseDown(event) {
    lastX = event.clientX;
    lastY = event.clientY;
    dragging = true;
}

function touchStart(event) {
    lastX = event.targetTouches[0].clientX;
    lastY = event.targetTouches[0].clientY;
    dragging = true;
}

function mouseUp() {
    dragging = false;
}

function touchEnd() {
    dragging = false;
}

var scene = SceneJS.scene("scene");

function mouseMove(event) {
    var posX = event.clientX;
    var posY = event.clientY;
    actionMove(posX,posY);
}

function touchMove(event) {
    var posX = event.targetTouches[0].clientX;
    var posY = event.targetTouches[0].clientY;
    actionMove(posX,posY);
}

/* On a mouse drag, we'll re-render the scene, passing in
 * incremented angles in each time.
 */
function actionMove(posX, posY) {
    if (dragging) {
        yaw += (posX - lastX) * 0.5;
        pitch += (posY - lastY) * 0.5;

        lastX = posX;
        lastY = posY;

        //scene.findNode("pitch").set("angle", pitch);
        scene.findNode("yaw").set("angle", yaw);
    }
}

var canvas = document.getElementById("terrain-demo");
canvas.addEventListener('mousedown', mouseDown, true);
canvas.addEventListener('mousemove', mouseMove, true);
canvas.addEventListener('mouseup', mouseUp, true);
canvas.addEventListener('touchstart', touchStart, true);
canvas.addEventListener('touchmove', touchMove, true);
canvas.addEventListener('touchend', touchEnd, true);

var theta = 0.0;

scene.start({
    /*idleFunc: function() {
        scene.findNode("yaw").set("angle", theta);
        theta += 0.1;
    }*/
});

var geom = scene.findNode("terrain-node");

function touchit() {
    terrain.diamondSquare();
    terrain.centerVertically();
    terrain.updateNode(geom);
}
