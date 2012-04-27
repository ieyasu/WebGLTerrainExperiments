/*
 This example demonstrates how to define and mutate geometry

 Lindsay S. Kay,
 lindsay.kay@xeolabs.com

 https://github.com/xeolabs/scenejs/wiki/geometry
 */

var geom = {
    type: "geometry",
    id: "my-geometry",
    primitive: "triangles",

    positions: [ 0, 0, 0,  1, 0, 0,  0, 1, 0,  1, 1, 0 ],

    normals: [ 0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1 ],

    colors: [ 0.35, 0.60, 0.88, 1.0,  0.17, 0.61, 0.13, 1.0,
              0.48, 0.31, 0.14, 1.0,  0.93, 0.86, 0.98, 1.0 ],

    indices: [ 0, 1, 2,  2, 1, 3 ]
};

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
            eye: { x: 2, y: -6, z: 3 },
            look: { x: 0.5, y: 0.5, z: 0 },
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
