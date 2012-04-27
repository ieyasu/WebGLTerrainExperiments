(function() {
    B = {};

    /* Generate a geometry node of a plane divided into n rows and m columns,
     * each a unit distance apart, using indexed triangles to render.
     */
    B.plane = function(nx, ny) {
        var nx1 = nx + 1, ny1 = ny + 1;
        var pos  = new Array(nx1 * ny1 * 3);
        var norm = new Array(nx1 * ny1 * 3);
        var ind  = new Array(nx * ny * 6);
        var x, y, i, rowA, rowB;

        i = 0;
        for (y = 0; y <= ny; y++) {
            for (x = 0; x <= nx; x++) {
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
        for (y = 0; y < ny; y++) {
            rowA = y * nx1;
            rowB = rowA + nx1;
            for (x = 0; x < nx; x++) {
                ind[i    ] = x + rowA;
                ind[i + 1] = x + rowA + 1;
                ind[i + 2] = x + rowB;

                ind[i + 3] = x + rowB;
                ind[i + 4] = x + rowA + 1;
                ind[i + 5] = x + rowB + 1;

                i += 6;
            }
        }

        return { type: "geometry", primitive: "triangles",
                 positions: pos, normals: norm, indices: ind };
    }
})();

var COLORS = [
    [0.35, 0.60, 0.88, 1.0], // water
    [0.17, 0.61, 0.13, 1.0], // grass
    [0.48, 0.31, 0.14, 1.0], // dirt
    [0.93, 0.86, 0.98, 1.0], // snow
    [0.40, 0.40, 0.45, 1.0]  // gray
];

var geom = B.plane(4, 4); 
geom.colors = [];
(function() {
    for (var y = 0; y <= 4; y++) {
        for (var x = 0; x <= 4; x++) {
            var i = Math.floor(Math.random() * COLORS.length);
            geom.colors = geom.colors.concat(COLORS[i]);
        }
    }
})();

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
            eye: { x: 5, y: -18, z: 6 },
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
                            mode:                   "dir",
                            color:                  { r: 1.0, g: 1.0, b: 1.0 },
                            dir:                    { x: 0.0, y: 0.0, z: -1.0 }
                        },
                        {
                            type: "rotate",
                            id: "pitch",
                            angle: 0.0,
                            x: 1.0,

                            nodes: [
                                {
                                    type: "rotate",
                                    id: "yaw",
                                    angle: 0.0,
                                    z: 1.0,

                                    nodes: [
                                        {
                                            type: "material",
                                            baseColor:      { r: 1.0, g: 1.0, b: 1.0 },
                                            specularColor:  { r: 0.4, g: 0.4, b: 0.4 },
                                            specular:       0.2,
                                            shine:          6.0,

                                            nodes: [geom]
                                        }
                                    ]
                                }
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

        scene.findNode("pitch").set("angle", pitch);
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

//var geometry = scene.findNode("my-geometry");

var theta = 0.0;

scene.start({
    idleFunc: function() {
        scene.findNode("yaw").set("angle", theta);
        theta += 0.1;
    }
});
