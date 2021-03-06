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
        this.centerVertically();
        this.calcNormals();
        node.set("positions", {positions: this.positions});
        node.set("normals", {normals: this.normals});
        node.set("colors", {colors: this.colors});
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

    B.Terrain.prototype.reset = function() {
        var i, n = 3 * this.S1 * this.S1, avg;
        for (i = 2; i < n; i += 3) {
            this.positions[i] = 0;
        }
    };

    B.Terrain.prototype.calcNormals = function() {
        var x, y, v1, v2, v3, v4;
        for (y = 0; y <= this.S; y++) {
            for (x = 0; x <= this.S; x++) {
                if (x == 0) { // left side
                    if (y == 0) { // bottom left corner
                        v1 = this.surfaceVector(0, 0, 1, 0); // right
                        v2 = this.surfaceVector(0, 0, 0, 1); // up
                        this.setNormal(x, y, v1.cross(v2));
                    } else if (y == this.S) { // top left corner
                        v1 = this.surfaceVector(0, y, 0, y - 1); // down
                        v2 = this.surfaceVector(0, y, 1, y); // right
                        this.setNormal(x, y, v1.cross(v2));
                    } else { // other left side
                        v1 = this.surfaceVector(0, y, 0, y - 1); // down
                        v2 = this.surfaceVector(0, y, 1, y); // right
                        v3 = this.surfaceVector(0, y, 0, y + 1); // up
                        this.setNormal(x, y, v1.cross(v2).add(v2.cross(v3)));
                    }
                } else if (x == this.S) { // right side
                    if (y == 0) { // bottom right corner
                        v1 = this.surfaceVector(x, 0, x, 1); // up
                        v2 = this.surfaceVector(x, 0, x - 1, 0); // left
                        this.setNormal(x, y, v1.cross(v2));
                    } else if (y == this.S) { // top right corner
                        v1 = this.surfaceVector(x, y, x - 1, y); // left
                        v2 = this.surfaceVector(x, y, x, y - 1); // down
                        this.setNormal(x, y, v1.cross(v2));
                    } else { // other right side
                        v1 = this.surfaceVector(x, y, x, y + 1); // up
                        v2 = this.surfaceVector(x, y, x - 1, y); // left
                        v3 = this.surfaceVector(x, y, x, y - 1); // down
                        this.setNormal(x, y, v1.cross(v2).add(v2.cross(v3)));
                    }
                } else if (y == 0) { // bottom side
                    v1 = this.surfaceVector(x, 0, x + 1, 0); // right
                    v2 = this.surfaceVector(x, 0, x, 1); // up
                    v3 = this.surfaceVector(x, 0, x - 1, 0); // left
                    this.setNormal(x, y, v1.cross(v2).add(v2.cross(v3)));
                } else if (y == this.S) { // top side
                    v1 = this.surfaceVector(x, y, x - 1, y); // left
                    v2 = this.surfaceVector(x, y, x, y - 1); // down
                    v3 = this.surfaceVector(x, y, x + 1, y); // right
                    this.setNormal(x, y, v1.cross(v2).add(v2.cross(v3)));
                } else { // interior vertex
                    v1 = this.surfaceVector(x, y, x + 1, y); // right
                    v2 = this.surfaceVector(x, y, x, y + 1); // up
                    v3 = this.surfaceVector(x, y, x - 1, y); // left
                    v4 = this.surfaceVector(x, y, x, y - 1); // down
                    this.setNormal(x, y, v1.cross(v2).add(v2.cross(v3)).
                                   add(v3.cross(v4)).add(v4.cross(v1)));
                }
            }
        }
    };

    B.Terrain.prototype.surfaceVector = function(fromX, fromY, toX, toY) {
        var o, to, from;
        o = this.offset(toX, toY);
        to = new B.Vec3(this.positions.slice(o, o + 3));
        o = this.offset(fromX, fromY);
        from = new B.Vec3(this.positions.slice(o, o + 3));
        return to.sub(from);
    };

    B.Terrain.prototype.smooth = function(ratio, iterations) {
        var smoothZ = new Array(this.S1 * this.S1);
        var x, y, n, ri = 1.0 - ratio;
        var i, j, m = 3 * this.S1 * this.S1;
        var r2 = ratio / 2, r3 = ratio / 3, r4 = ratio / 4;

        for (n = 0; n < iterations; n++) {
            // smooth into smoothZ array
            for (y = 0; y <= this.S; y++) {
                i = y * this.S1;
                for (x = 0; x <= this.S; x++, i++) {
                    if (x == 0) { // left side
                        if (y == 0) { // bottom left corner
                            smoothZ[i] = this.z(x, y) * ri +
                                (this.z(x + 1, y) + this.z(x, y + 1)) * r2;
                        } else if (y == this.S) { // top left corner
                            smoothZ[i] = this.z(x, y) * ri +
                                (this.z(x + 1, y) + this.z(x, y - 1)) * r2;
                        } else { // other left side
                            smoothZ[i] = this.z(x, y) * ri +
                                (this.z(x, y + 1) +
                                 this.z(x, y - 1) +
                                 this.z(x + 1, y)) * r3;
                        }
                    } else if (x == this.S) { // right side
                        if (y == 0) { // bottom right corner
                            smoothZ[i] = this.z(x, y) * ri +
                                (this.z(x - 1, y) + this.z(x, y + 1)) * r2;
                        } else if (y == this.S) { // top right corner
                            smoothZ[i] = this.z(x, y) * ri +
                                (this.z(x - 1, y) + this.z(x, y - 1)) * r2;
                        } else { // other right side
                            smoothZ[i] = this.z(x, y) * ri +
                                (this.z(x, y + 1) +
                                 this.z(x, y - 1) +
                                 this.z(x - 1, y)) * r3;
                        }
                    } else if (y == 0) { // bottom side
                        smoothZ[i] = this.z(x, y) * ri +
                            (this.z(x - 1, y) +
                             this.z(x + 1, y) +
                             this.z(x, y + 1)) * r3;
                    } else if (y == this.S) { // top side
                        smoothZ[i] = this.z(x, y) * ri +
                            (this.z(x - 1, y) +
                             this.z(x + 1, y) +
                             this.z(x, y - 1)) * r3;
                    } else { // interior vertex
                        smoothZ[i] = this.z(x, y) * ri +
                            (this.z(x + 1, y) +
                             this.z(x - 1, y) +
                             this.z(x, y + 1) +
                             this.z(x, y - 1)) * r4;
                    }
                }
            }

            // blast smoothed Zs into positions array
            for (i = 2, j = 0; i < m; i += 3, j++) {
                this.positions[i] = smoothZ[j];
            }
        }
    };

    /* Give random colors to terrain vertexes.
     */
    B.Terrain.prototype.colorRandomly = function() {
        var x, y, i, j;
        this.colors = new Array(4 * this.S1 * this.S1);
        j = 0;
        for (y = 0; y <= this.S; y++) {
            for (x = 0; x <= this.S; x++) {
                i = Math.floor(Math.random() * this.COLORS.length);
                this.colors[j++] = this.COLORS[i][0];
                this.colors[j++] = this.COLORS[i][1];
                this.colors[j++] = this.COLORS[i][2];
                this.colors[j++] = this.COLORS[i][3];
            }
        }
    };

    B.Terrain.prototype.colorByHeight = function() {
        var i, j, n = 4 * this.S1 * this.S1;
        var ary, min, max, f, k;
        ary = this.minMax(); min = ary[0]; max = ary[1];
        f = (this.COLORS.length - 0.0001) / (max - min);
        this.colors = new Array(n);
        for (i = 2, j = 0; j < n; i += 3, j += 4) {
            k = Math.floor((this.positions[i] - min) * f);
            this.colors[j    ] = this.COLORS[k][0];
            this.colors[j + 1] = this.COLORS[k][1];
            this.colors[j + 2] = this.COLORS[k][2];
            this.colors[j + 3] = this.COLORS[k][3];
        }
    };

    B.Terrain.prototype.minMax = function() {
        var i, n = 3 * this.S1 * this.S1, min = 1e8, max = -1e8;
        for (i = 2; i < n; i += 3) {
            if (this.positions[i] < min) min = this.positions[i];
            if (max < this.positions[i]) max = this.positions[i];
        }
        return [min, max];
    };

    B.Terrain.prototype.diamondSquare = function(roughness) {
        var x, y, m, s, s2, avg;

        // base step - set four corners
        m = this.S * roughness;
        this.setZ(0,      0,      B.r(m));
        this.setZ(this.S, 0,      B.r(m));
        this.setZ(0,      this.S, B.r(m));
        this.setZ(this.S, this.S, B.r(m));

        for (s = this.S; s > 1; s = s2) {
            s2 = s / 2;

            m *= roughness;

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
                for (; x <= this.S; x += s) {
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

    B.Terrain.prototype.waves = function() {
        var i, n, s, x, y, z1, z2, ax, ay, fx, fy, kx, ky;
        s = this.S1;
        n = 1;
        while (s > 1) {
            for (i = 0; i < n; i++) {
                ax = s * B.r3(0.05, 0.1);
                fx = 2 * Math.PI / (B.r3(15, 30) * ax);
                kx = B.r(2 * Math.PI);

                ay = s * B.r3(0.05, 0.1);
                fy = 2 * Math.PI / (B.r3(15, 30) * ay);
                ky = B.r(2 * Math.PI);

                for (y = 0; y <= this.S; y++) {
                    z1 = ay * Math.sin(fy * y + ky);

                    for (x = 0; x <= this.S; x++) {
                        z2 = ax * Math.sin(fx * x + kx);
                        this.addZ(x, y, z1 + z2);
                    }
                }
            }
            n *= 2;
            s *= 0.35;
        }
    };

    B.Terrain.prototype.bumps = function(iterations, scale, maxRad) {
        var i, cx, cy, r;
        for (i = 0; i < iterations; i++) {
            this.bump(B.ir2(this.S1), B.ir2(this.S1), B.ir2(maxRad), scale);
            this.bump(B.ir2(this.S1), B.ir2(this.S1), B.ir2(maxRad), -scale);
        }
    };

    B.Terrain.prototype.bump = function(cx, cy, r, k) {
        var begX, begY, endX, endY, x, y, dx, dy, r2;
        begX = cx - r; if (begX < 0) begX = 0;
        begY = cy - r; if (begY < 0) begY = 0;
        endX = cx + r; if (endX > this.S) endX = this.S;
        endY = cy + r; if (endY > this.S) endY = this.S;
        r2 = r * r;
        for (y = begY; y <= endY; y++) {
            dy2 = (cy - y) * (cy - y);
            for (x = begX; x <= endX; x++) {
                dx = cx - x;
                z = Math.sqrt(r2 - dx * dx - dy2);
                if (z > 0.0)
                    this.addZ(x, y, z * k);
            }
        }
    };

    B.Terrain.prototype.particleDeposition = function(iterations, size) {
        var i, x = B.ir2(this.S1), y = B.ir2(this.S1);
        for (i = 0; i < iterations; i++) {
            this.addZ(x, y, size);
            switch (B.ir2(5)) {
            case 0: x++; break;
            case 1: x--; break;
            case 2: y++; break;
            case 3: y--; break;
            }
            if (x < 0) x += this.S; else if (x > this.S) x -= this.S;
            if (y < 0) y += this.S; else if (y > this.S) y -= this.S;
        }
    };

    /* Offset to x,y position in 3-part array.
     */
    B.Terrain.prototype.offset = function(x, y) {
        return 3 * (x + y * this.S1);
    };

    B.Terrain.prototype.z = function(x, y) {
        //if (x < 0 || x > this.S || y < 0 || y > this.S)
        //    alert("z(x, y): " + x + ", ", + y);
        return this.positions[3 * (x + y * this.S1) + 2];
    };

    B.Terrain.prototype.setZ = function(x, y, z) {
        //if (x < 0 || x > this.S || y < 0 || y > this.S)
        //    alert("setZ(x, y): " + x + ", ", + y);
        this.positions[3 * (x + y * this.S1) + 2] = z;
    }

    B.Terrain.prototype.addZ = function(x, y, deltaZ) {
        //if (x < 0 || x > this.S || y < 0 || y > this.S)
        //    alert("deltaZ(x, y): " + x + ", ", + y);
        this.positions[3 * (x + y * this.S1) + 2] += deltaZ;
    }

    B.Terrain.prototype.setNormal = function(x, y, vec) {
        //if (x < 0 || x > this.S || y < 0 || y > this.S)
        //    alert("setNormal(x, y): " + x + ", ", + y);
        vec.normalize();
        this.normals.splice(3 * (x + y * this.S1), 3, vec.x(), vec.y(), vec.z());
    };

    B.r  = function(mag) { return (Math.random() - 0.5) * mag; };
    B.r2 = function(mag) { return Math.random() * mag; };
    B.r3 = function(min, max) { return min + Math.random() * (max - min); };

    B.ir  = function(mag) { return Math.floor((Math.random() - 0.5) * mag); };
    B.ir2 = function(mag) { return Math.floor(Math.random() * mag); };

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
    B.Vec3 = function(ary) {
        this.ary = (ary === undefined) ? [0, 0, 0] : ary;
    };
    B.Vec3.prototype.x = function() { return this.ary[0]; }
    B.Vec3.prototype.y = function() { return this.ary[1]; }
    B.Vec3.prototype.z = function() { return this.ary[2]; }

    B.Vec3.prototype.add = function(v) {
        return new B.Vec3([this.x() + v.x(), this.y() + v.y(), this.z() + v.z()]);
    };
    B.Vec3.prototype.sub = function(v) {
        return new B.Vec3([this.x() - v.x(), this.y() - v.y(), this.z() - v.z()]);
    };
    B.Vec3.prototype.mul = function(f) {
        return new B.Vec3([this.x() * f, this.y() * f, this.z() * f]);
    };
    B.Vec3.prototype.addEq = function(v) {
        this.ary[0] += v.x();
        this.ary[1] += v.y();
        this.ary[2] += v.z();
        return this;
    };
    B.Vec3.prototype.subEq = function(v) {
        this.ary[0] -= v.x();
        this.ary[1] -= v.y();
        this.ary[2] -= v.z();
        return this;
    };
    B.Vec3.prototype.mulEq = function(f) {
        this.ary[0] *= f;
        this.ary[1] *= f;
        this.ary[2] *= f;
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
                           this.x() * v.y() - this.y() * v.x()]);
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
        this.ary[1] = newY;
        this.ary[2] = newZ;
        return this;
    };
    B.Vec3.prototype.rotY = function(deg) {
        var rad = deg * (Math.PI / 180.0);
        var x = this.x(), z = this.z(), cr = Math.cos(rad), sr = Math.sin(rad);
        var newX = z * sr + x * cr;
        var newZ = z * cr - x * sr;
        this.ary[0] = newX;
        this.ary[2] = newZ;
        return this;
    };
    B.Vec3.prototype.rotZ = function(deg) {
        var rad = deg * (Math.PI / 180.0);
        var x = this.x(), y = this.y(), cr = Math.cos(rad), sr = Math.sin(rad);
        var newX = x * cr - y * sr;
        var newY = x * sr + y * cr;
        this.ary[0] = newX;
        this.ary[1] = newY;
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


    /* Camera Class ----------------------------------------------------
     */

    B.Camera = function(eye) {
        this.eye = new B.Vec3(eye);
        this.cen = new B.Vec3([0, 0, 0]);
        this.fixUp();
    };

    B.Camera.prototype.fixUp = function() {
        var toCen = this.cen.sub(this.eye);
        var upZ = new B.Vec3([0, 0, 1]);
        this.up = toCen.cross(upZ).cross(toCen);
    };

    B.Camera.prototype.makeNode = function(children) {
        var eo = this.eyeObj(), lo = this.lookObj(), uo = this.upObj();
        return {
            type: "lookAt", id: "camera-look-at", eye: eo, look: lo, up: uo,
            nodes: [
                {
                    type: "camera",
                    optics: {
                        type: "perspective",
                        fovy: 25.0,
                        aspect: (800 / 600),
                        near: 1.0,
                        far: 1000.0
                    },
                    nodes: children
                }
            ]
        };
    };

    B.Camera.prototype.eyeObj = function() {
        return { x: this.eye.x(), y: this.eye.y(), z: this.eye.z() };
    };
    B.Camera.prototype.lookObj = function() {
        return { x: this.cen.x(), y: this.cen.y(), z: this.cen.z() };
    };
    B.Camera.prototype.upObj = function() {
        return { x: this.up.x(), y: this.up.y(), z: this.up.z() };
    };

    B.Camera.prototype.use = function(scene) {
        var n = scene.findNode("camera-look-at");
        //n.set('look', this.lookObj());
        n.set('eye', this.eyeObj());
        n.set('up', this.upObj());
    };

    B.Camera.prototype.goHome = function(eye) {
        this.eye.ary = eye;
        this.cen.ary = [0, 0, 0];
        this.fixUp();
    };

    /* rotate eye around 'up' */
    B.Camera.prototype.yaw = function(deg) {
        var toEye = this.eye.sub(this.cen);
        this.eye = toEye.rotate(deg, this.up).add(this.cen);
    };

    /* rotate eye around 'right' */
    B.Camera.prototype.pitch = function(deg) {
        var toEye = this.eye.sub(this.cen);
        var right = toEye.cross(this.up);
        toEye = toEye.rotate(deg, right);
        this.up = this.up.rotate(deg, right);
        this.eye = toEye.add(this.cen);
    };

    B.Camera.prototype.zoom = function(z) {
        var toEye = this.eye.sub(this.cen);
        toEye.mulEq(1.0 + z);
        this.eye = toEye.add(this.cen);
    };
})();

var HOME = [-50, -300, 200];

var terrain = new B.Terrain(128);
terrain.colorRandomly();
var geom = terrain.makeNode("terrain-node");

var camera = new B.Camera(HOME);

SceneJS.createScene({
    type: "scene",
    id: "scene",
    canvasId: "terrain-demo",

    flags: {
        //backfaces: false
    },

    nodes: [ camera.makeNode([
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
            nodes: [ B.translate(-64, -64, 0, [
                {
                    type: "material",
                    baseColor:      { r: 1.0, g: 1.0, b: 1.0 },
                    specularColor:  { r: 0.4, g: 0.4, b: 0.4 },
                    specular:       0.2,
                    shine:          6.0,
                    nodes: [geom]
                }
            ]) ]
        }
    ]) ]
});

var lastX = -1;
var lastY = -1;
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
    var deg;

    if (dragging) {
        if (lastX < 0) lastX = posX;
        if (lastY < 0) lastY = posY;

        deg = (lastX - posX) * 0.5;
        camera.yaw(deg);

        deg = (posY - lastY) * 0.5;
        camera.pitch(deg);

        lastX = posX;
        lastY = posY;

        camera.use(scene);
    }
}

var canvas = document.getElementById("terrain-demo");
canvas.addEventListener('mousedown', mouseDown, true);
canvas.addEventListener('mousemove', mouseMove, true);
canvas.addEventListener('mouseup', mouseUp, true);
canvas.addEventListener('touchstart', touchStart, true);
canvas.addEventListener('touchmove', touchMove, true);
canvas.addEventListener('touchend', touchEnd, true);

$('#terrain-demo').mousewheel(function(e, delta) {
    camera.zoom(delta * -0.1);
    camera.use(scene);
    return false; // cancel the window scroll if the mouse is in the canvas
});
$(document).keydown(function(e) {
    if (e.which === 36) { // home
        camera.goHome(HOME);
        camera.use(scene);
        e.preventDefault();
    }
});

var theta = 0.0;
scene.start({
    /*idleFunc: function() {
        scene.findNode("yaw").set("angle", theta);
        theta += 0.1;
    }*/
});

function floatInput(thing, min, max) {
    var s = $(thing).val();
    var f = parseFloat(s);
    if (isNaN(f)) {
        alert("Cannot convert '" + s + "' into a float");
        $(thing).focus();
        return NaN;
    }
    if (min !== undefined && f < min) {
        f = min;
        $(thing).val(f);
    } else if (max !== undefined && f > max) {
        f = max;
        $(thing).val(f);
    }
    return f;
}

var geom = scene.findNode("terrain-node");

function diamondSquare() {
    var r = floatInput('#rough', 0.0001, 1.0);
    if (!isNaN(r)) {
        terrain.diamondSquare(r);
        terrain.updateNode(geom);
    }
}

function waves() {
    terrain.reset();
    terrain.waves();
    terrain.updateNode(geom);
}

function bumps() {
    var iterations = floatInput('#bump_iterations', 1, 100000);
    if (!isNaN(iterations)) {
        var scale = floatInput('#bump_scale', 0.0001, 10.0);
        if (!isNaN(scale)) {
            var maxRad = floatInput('#bump_rad', 1, 1000);
            if (!isNaN(maxRad)) {
                terrain.reset();
                terrain.bumps(iterations, scale, maxRad);
                terrain.updateNode(geom);
            }
        }
    }
}

function color() {
    terrain.colorByHeight();
    terrain.updateNode(geom);
}

function reset() {
    terrain.reset();
    terrain.updateNode(geom);
}

function depositParticles() {
    var iterations = floatInput('#particle_iterations', 1, 1e16);
    if (!isNaN(iterations)) {
        var size = floatInput('#particle_size', 0.0001, 100.0);
        if (!isNaN(size)) {
            terrain.particleDeposition(iterations, size);
            terrain.updateNode(geom);
        }
    }
};

function smooth() {
    var ratio = floatInput('#smooth_ratio', 0.01, 0.99)
    if (!isNaN(ratio)) {
        var iterations = floatInput('#smooth_iterations', 1, 1000);
        if (!isNaN(iterations)) {
            terrain.smooth(ratio, iterations);
            terrain.updateNode(geom);
        }
    }
}

function preset1() {
    terrain.diamondSquare(0.6);
    terrain.colorByHeight();
    terrain.smooth(0.2, 10);
    terrain.updateNode(geom);
}

function preset2() {
    terrain.reset();
    terrain.bumps(500, 0.023, 64);
    terrain.colorByHeight();
    terrain.smooth(0.25, 8);
    terrain.updateNode(geom);
}
