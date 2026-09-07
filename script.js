const canvas = document.getElementById("floorCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 25;

let currentTool = "select";

let isDrawing = false;
let isDragging = false;

let startX = 0;
let startY = 0;

let selectedObject = null;

let dragOffsetX = 0;
let dragOffsetY = 0;

let activePointerId = null;
let dragStateSaved = false;

let zoomLevel = 1;

const minZoom = 0.5;
const maxZoom = 2;

const objects = [];

let undoStack = [];
let redoStack = [];


/* =========================================
   HELPERS
========================================= */

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();

    canvas.width = Math.max(
        1,
        Math.floor(rect.width)
    );

    canvas.height = Math.max(
        1,
        Math.floor(rect.height)
    );

    redraw();
}

function snap(value) {
    return (
        Math.round(value / gridSize) *
        gridSize
    );
}

function capitalize(text) {
    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );
}

function cloneObjects() {
    return JSON.parse(
        JSON.stringify(objects)
    );
}

function saveState() {
    undoStack.push(
        cloneObjects()
    );

    if (undoStack.length > 60) {
        undoStack.shift();
    }

    redoStack = [];
}

function restoreObjects(state) {
    objects.length = 0;

    state.forEach(obj => {
        objects.push(obj);
    });

    selectedObject = null;

    redraw();
}


/* =========================================
   DEFAULT DEMO
========================================= */

function loadDemoPlan() {
    const saved =
        localStorage.getItem(
            "plancraft-floor-plan"
        );

    if (saved) {
        return;
    }

    objects.push(

        {
            type: "room",
            x: 50,
            y: 50,
            width: 300,
            height: 250,
            name: "Bedroom"
        },

        {
            type: "room",
            x: 350,
            y: 50,
            width: 350,
            height: 250,
            name: "Living Room"
        },

        {
            type: "room",
            x: 50,
            y: 300,
            width: 250,
            height: 200,
            name: "Bathroom"
        },

        {
            type: "room",
            x: 300,
            y: 300,
            width: 400,
            height: 200,
            name: "Dining Area"
        },

        {
            type: "door",
            x: 350,
            y: 175,
            rotation: Math.PI / 2,
            scale: 1
        },

        {
            type: "door",
            x: 175,
            y: 300,
            rotation: 0,
            scale: 1
        },

        {
            type: "window",
            x: 150,
            y: 50,
            rotation: 0,
            scale: 1
        },

        {
            type: "window",
            x: 525,
            y: 50,
            rotation: 0,
            scale: 1
        },

        {
            type: "bed",
            x: 175,
            y: 175,
            rotation: Math.PI / 2,
            scale: 0.9
        },

        {
            type: "sofa",
            x: 500,
            y: 120,
            rotation: 0,
            scale: 0.9
        },

        {
            type: "table",
            x: 580,
            y: 210,
            rotation: 0,
            scale: 0.8
        },

        {
            type: "dining",
            x: 500,
            y: 400,
            rotation: 0,
            scale: 0.85
        },

        {
            type: "toilet",
            x: 170,
            y: 400,
            rotation: 0,
            scale: 0.8
        },

        {
            type: "plant",
            x: 650,
            y: 250,
            rotation: 0,
            scale: 0.8
        }
    );
}


/* =========================================
   STATUS
========================================= */

function updateStatus() {
    document.getElementById(
        "currentToolText"
    ).textContent =
        capitalize(currentTool);

    const selectedText =
        document.getElementById(
            "selectedObjectText"
        );

    if (selectedObject) {
        let label =
            capitalize(
                selectedObject.type
            );

        if (
            selectedObject.type ===
            "room"
        ) {
            label +=
                ` (${selectedObject.name || "Room"})`;
        }

        selectedText.textContent =
            label;
    }

    else {
        selectedText.textContent =
            "None";
    }

    document.getElementById(
        "zoomValue"
    ).textContent =
        `${Math.round(
            zoomLevel * 100
        )}%`;

    updatePropertiesPanel();
}


/* =========================================
   PROPERTIES PANEL
========================================= */

function updatePropertiesPanel() {
    const help =
        document.getElementById(
            "propertyHelp"
        );

    const content =
        document.getElementById(
            "propertyContent"
        );

    const room =
        document.getElementById(
            "roomProperties"
        );

    const transform =
        document.getElementById(
            "transformProperties"
        );

    const wall =
        document.getElementById(
            "wallProperties"
        );

    if (!selectedObject) {
        help.classList.remove(
            "hidden"
        );

        content.classList.add(
            "hidden"
        );

        return;
    }

    help.classList.add(
        "hidden"
    );

    content.classList.remove(
        "hidden"
    );

    room.classList.add(
        "hidden"
    );

    transform.classList.add(
        "hidden"
    );

    wall.classList.add(
        "hidden"
    );

    document.getElementById(
        "propertyType"
    ).value =
        capitalize(
            selectedObject.type
        );

    if (
        selectedObject.type ===
        "wall"
    ) {
        document.getElementById(
            "propertyX"
        ).value =
            Math.round(
                selectedObject.x1
            );

        document.getElementById(
            "propertyY"
        ).value =
            Math.round(
                selectedObject.y1
            );

        const length =
            Math.hypot(
                selectedObject.x2 -
                selectedObject.x1,

                selectedObject.y2 -
                selectedObject.y1
            );

        document.getElementById(
            "propertyLength"
        ).value =
            `${length.toFixed(1)} px`;

        wall.classList.remove(
            "hidden"
        );

        return;
    }

    document.getElementById(
        "propertyX"
    ).value =
        Math.round(
            selectedObject.x
        );

    document.getElementById(
        "propertyY"
    ).value =
        Math.round(
            selectedObject.y
        );

    if (
        selectedObject.type ===
        "room"
    ) {
        document.getElementById(
            "propertyName"
        ).value =
            selectedObject.name ||
            "Room";

        document.getElementById(
            "propertyWidth"
        ).value =
            Math.round(
                selectedObject.width
            );

        document.getElementById(
            "propertyHeight"
        ).value =
            Math.round(
                selectedObject.height
            );

        room.classList.remove(
            "hidden"
        );

        return;
    }

    const degrees =
        Math.round(
            (
                (
                    selectedObject.rotation ||
                    0
                ) *
                180 /
                Math.PI
            ) % 360
        );

    document.getElementById(
        "propertyRotation"
    ).value =
        `${degrees}°`;

    document.getElementById(
        "propertyScale"
    ).value =
        `${(
            selectedObject.scale || 1
        ).toFixed(1)}×`;

    transform.classList.remove(
        "hidden"
    );
}


/* =========================================
   GRID
========================================= */

function drawGrid() {
    const width =
        canvas.width /
        zoomLevel;

    const height =
        canvas.height /
        zoomLevel;

    ctx.strokeStyle =
        "#e5e7eb";

    ctx.lineWidth =
        1 / zoomLevel;

    for (
        let x = 0;
        x <= width;
        x += gridSize
    ) {
        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            height
        );

        ctx.stroke();
    }

    for (
        let y = 0;
        y <= height;
        y += gridSize
    ) {
        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            width,
            y
        );

        ctx.stroke();
    }
}


/* =========================================
   TRANSFORMS
========================================= */

function beginTransform(obj) {
    ctx.save();

    ctx.translate(
        obj.x,
        obj.y
    );

    ctx.rotate(
        obj.rotation || 0
    );

    ctx.scale(
        obj.scale || 1,
        obj.scale || 1
    );
}


/* =========================================
   DRAW FUNCTIONS
========================================= */

function drawWall(obj) {
    ctx.strokeStyle =
        "#111827";

    ctx.lineWidth = 8;

    ctx.lineCap =
        "square";

    ctx.beginPath();

    ctx.moveTo(
        obj.x1,
        obj.y1
    );

    ctx.lineTo(
        obj.x2,
        obj.y2
    );

    ctx.stroke();
}

function drawRoom(obj) {
    ctx.fillStyle =
        "rgba(59,130,246,0.06)";

    ctx.strokeStyle =
        "#111827";

    ctx.lineWidth = 5;

    ctx.fillRect(
        obj.x,
        obj.y,
        obj.width,
        obj.height
    );

    ctx.strokeRect(
        obj.x,
        obj.y,
        obj.width,
        obj.height
    );

    const cx =
        obj.x +
        obj.width / 2;

    const cy =
        obj.y +
        obj.height / 2;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillStyle =
        "#111827";

    ctx.font =
        "bold 15px Arial";

    ctx.fillText(
        obj.name || "Room",
        cx,
        cy - 9
    );

    ctx.fillStyle =
        "#6b7280";

    ctx.font =
        "11px Arial";

    ctx.fillText(
        `${(
            obj.width /
            gridSize
        ).toFixed(1)} × ${(
            obj.height /
            gridSize
        ).toFixed(1)}`,
        cx,
        cy + 12
    );
}

function drawDoor(obj) {
    beginTransform(obj);

    ctx.strokeStyle =
        "#92400e";

    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.moveTo(0, 0);
    ctx.lineTo(50, 0);

    ctx.stroke();

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        50,
        0,
        Math.PI / 2
    );

    ctx.stroke();

    ctx.restore();
}

function drawWindow(obj) {
    beginTransform(obj);

    ctx.strokeStyle =
        "#2563eb";

    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.moveTo(-25, 0);
    ctx.lineTo(25, 0);

    ctx.stroke();

    ctx.strokeStyle =
        "#93c5fd";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(-25, -6);
    ctx.lineTo(25, -6);

    ctx.moveTo(-25, 6);
    ctx.lineTo(25, 6);

    ctx.stroke();

    ctx.restore();
}

function drawBed(obj) {
    beginTransform(obj);

    ctx.fillStyle =
        "#dbeafe";

    ctx.strokeStyle =
        "#1f2937";

    ctx.lineWidth = 2;

    ctx.fillRect(
        -40,
        -60,
        80,
        120
    );

    ctx.strokeRect(
        -40,
        -60,
        80,
        120
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.fillRect(
        -30,
        -50,
        60,
        25
    );

    ctx.strokeRect(
        -30,
        -50,
        60,
        25
    );

    ctx.beginPath();

    ctx.moveTo(-40, -15);
    ctx.lineTo(40, -15);

    ctx.stroke();

    ctx.restore();
}

function drawTable(obj) {
    beginTransform(obj);

    ctx.fillStyle =
        "#d6a76c";

    ctx.strokeStyle =
        "#1f2937";

    ctx.lineWidth = 2;

    ctx.fillRect(
        -45,
        -30,
        90,
        60
    );

    ctx.strokeRect(
        -45,
        -30,
        90,
        60
    );

    ctx.restore();
}

function drawChair(obj) {
    beginTransform(obj);

    ctx.fillStyle =
        "#9ca3af";

    ctx.strokeStyle =
        "#1f2937";

    ctx.lineWidth = 2;

    ctx.fillRect(
        -20,
        -20,
        40,
        40
    );

    ctx.strokeRect(
        -20,
        -20,
        40,
        40
    );

    ctx.restore();
}

function drawSofa(obj) {
    beginTransform(obj);

    ctx.fillStyle =
        "#c4b5fd";

    ctx.strokeStyle =
        "#1f2937";

    ctx.lineWidth = 2;

    ctx.fillRect(
        -60,
        -30,
        120,
        60
    );

    ctx.strokeRect(
        -60,
        -30,
        120,
        60
    );

    ctx.fillStyle =
        "#ddd6fe";

    ctx.fillRect(
        -48,
        -20,
        42,
        40
    );

    ctx.fillRect(
        6,
        -20,
        42,
        40
    );

    ctx.strokeRect(
        -48,
        -20,
        42,
        40
    );

    ctx.strokeRect(
        6,
        -20,
        42,
        40
    );

    ctx.restore();
}

function drawDining(obj) {
    beginTransform(obj);

    ctx.fillStyle =
        "#d6a76c";

    ctx.strokeStyle =
        "#1f2937";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.ellipse(
        0,
        0,
        45,
        32,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();
    ctx.stroke();

    ctx.fillStyle =
        "#9ca3af";

    ctx.fillRect(-15, -55, 30, 18);
    ctx.fillRect(-15, 37, 30, 18);
    ctx.fillRect(-70, -10, 18, 20);
    ctx.fillRect(52, -10, 18, 20);

    ctx.restore();
}

function drawToilet(obj) {
    beginTransform(obj);

    ctx.fillStyle =
        "#f8fafc";

    ctx.strokeStyle =
        "#334155";

    ctx.lineWidth = 2;

    ctx.fillRect(
        -20,
        -35,
        40,
        22
    );

    ctx.strokeRect(
        -20,
        -35,
        40,
        22
    );

    ctx.beginPath();

    ctx.ellipse(
        0,
        8,
        25,
        32,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();
    ctx.stroke();

    ctx.beginPath();

    ctx.ellipse(
        0,
        8,
        14,
        20,
        0,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.restore();
}

function drawPlant(obj) {
    beginTransform(obj);

    ctx.fillStyle =
        "#92400e";

    ctx.strokeStyle =
        "#1f2937";

    ctx.lineWidth = 2;

    ctx.fillRect(
        -16,
        8,
        32,
        24
    );

    ctx.strokeRect(
        -16,
        8,
        32,
        24
    );

    ctx.strokeStyle =
        "#166534";

    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.moveTo(0, 8);
    ctx.lineTo(0, -25);

    ctx.stroke();

    ctx.fillStyle =
        "#22c55e";

    ctx.beginPath();

    ctx.ellipse(
        -13,
        -18,
        14,
        8,
        -0.5,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.ellipse(
        13,
        -18,
        14,
        8,
        0.5,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.ellipse(
        0,
        -32,
        13,
        9,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}


/* =========================================
   OBJECT DISPATCH
========================================= */

function drawObject(obj) {
    switch (obj.type) {

        case "wall":
            drawWall(obj);
            break;

        case "room":
            drawRoom(obj);
            break;

        case "door":
            drawDoor(obj);
            break;

        case "window":
            drawWindow(obj);
            break;

        case "bed":
            drawBed(obj);
            break;

        case "table":
            drawTable(obj);
            break;

        case "chair":
            drawChair(obj);
            break;

        case "sofa":
            drawSofa(obj);
            break;

        case "dining":
            drawDining(obj);
            break;

        case "toilet":
            drawToilet(obj);
            break;

        case "plant":
            drawPlant(obj);
            break;
    }
}


/* =========================================
   OBJECT SIZE
========================================= */

function getObjectSize(obj) {
    const sizes = {

        bed: [100, 140],
        table: [110, 80],
        chair: [65, 65],
        door: [115, 115],
        window: [90, 50],
        sofa: [145, 90],
        dining: [155, 130],
        toilet: [75, 100],
        plant: [75, 90]
    };

    return (
        sizes[obj.type] ||
        [80, 80]
    );
}


/* =========================================
   SELECTION
========================================= */

function drawSelection(obj) {
    ctx.save();

    ctx.strokeStyle =
        "#ef4444";

    ctx.lineWidth =
        2 / zoomLevel;

    ctx.setLineDash([
        6 / zoomLevel,
        5 / zoomLevel
    ]);

    if (
        obj.type ===
        "room"
    ) {
        ctx.strokeRect(
            obj.x - 6,
            obj.y - 6,
            obj.width + 12,
            obj.height + 12
        );
    }

    else if (
        obj.type ===
        "wall"
    ) {
        const minX =
            Math.min(
                obj.x1,
                obj.x2
            );

        const minY =
            Math.min(
                obj.y1,
                obj.y2
            );

        const width =
            Math.abs(
                obj.x2 -
                obj.x1
            );

        const height =
            Math.abs(
                obj.y2 -
                obj.y1
            );

        ctx.strokeRect(
            minX - 10,
            minY - 10,
            Math.max(
                width,
                10
            ) + 20,
            Math.max(
                height,
                10
            ) + 20
        );
    }

    else {
        const scale =
            obj.scale || 1;

        const [width, height] =
            getObjectSize(obj);

        ctx.strokeRect(
            obj.x -
                width *
                scale / 2,

            obj.y -
                height *
                scale / 2,

            width * scale,
            height * scale
        );
    }

    ctx.restore();
}


/* =========================================
   REDRAW
========================================= */

function redraw() {
    ctx.setTransform(
        1,
        0,
        0,
        1,
        0,
        0
    );

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.setTransform(
        zoomLevel,
        0,
        0,
        zoomLevel,
        0,
        0
    );

    drawGrid();

    objects.forEach(
        drawObject
    );

    if (selectedObject) {
        drawSelection(
            selectedObject
        );
    }

    updateStatus();
}


/* =========================================
   POINTER POSITION
========================================= */

function getPointerPosition(event) {
    const rect =
        canvas.getBoundingClientRect();

    const scaleX =
        canvas.width /
        rect.width;

    const scaleY =
        canvas.height /
        rect.height;

    return {

        x: snap(
            (
                (
                    event.clientX -
                    rect.left
                ) *
                scaleX
            ) /
            zoomLevel
        ),

        y: snap(
            (
                (
                    event.clientY -
                    rect.top
                ) *
                scaleY
            ) /
            zoomLevel
        )
    };
}


/* =========================================
   HIT DETECTION
========================================= */

function distanceToLine(
    px,
    py,
    x1,
    y1,
    x2,
    y2
) {
    const dx =
        x2 - x1;

    const dy =
        y2 - y1;

    const lengthSquared =
        dx * dx +
        dy * dy;

    if (
        lengthSquared === 0
    ) {
        return Math.hypot(
            px - x1,
            py - y1
        );
    }

    let t =
        (
            (px - x1) * dx +
            (py - y1) * dy
        ) /
        lengthSquared;

    t =
        Math.max(
            0,
            Math.min(
                1,
                t
            )
        );

    const x =
        x1 +
        t * dx;

    const y =
        y1 +
        t * dy;

    return Math.hypot(
        px - x,
        py - y
    );
}

function isPointInsideObject(
    obj,
    x,
    y
) {
    if (
        obj.type ===
        "room"
    ) {
        return (
            x >= obj.x &&
            x <=
                obj.x +
                obj.width &&

            y >= obj.y &&
            y <=
                obj.y +
                obj.height
        );
    }

    if (
        obj.type ===
        "wall"
    ) {
        return (
            distanceToLine(
                x,
                y,
                obj.x1,
                obj.y1,
                obj.x2,
                obj.y2
            ) <= 18
        );
    }

    const scale =
        obj.scale || 1;

    const [width, height] =
        getObjectSize(obj);

    return (
        x >=
            obj.x -
            width *
            scale / 2 &&

        x <=
            obj.x +
            width *
            scale / 2 &&

        y >=
            obj.y -
            height *
            scale / 2 &&

        y <=
            obj.y +
            height *
            scale / 2
    );
}

function findObjectAt(
    x,
    y
) {
    for (
        let i =
            objects.length - 1;

        i >= 0;

        i--
    ) {
        if (
            isPointInsideObject(
                objects[i],
                x,
                y
            )
        ) {
            return objects[i];
        }
    }

    return null;
}


/* =========================================
   POINTER DOWN
========================================= */

canvas.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        activePointerId =
            event.pointerId;

        canvas.setPointerCapture(
            event.pointerId
        );

        const pos =
            getPointerPosition(
                event
            );

        if (
            currentTool ===
            "select"
        ) {

            selectedObject =
                findObjectAt(
                    pos.x,
                    pos.y
                );

            dragStateSaved =
                false;

            if (
                selectedObject
            ) {
                isDragging =
                    true;

                if (
                    selectedObject.type ===
                    "room"
                ) {
                    dragOffsetX =
                        pos.x -
                        selectedObject.x;

                    dragOffsetY =
                        pos.y -
                        selectedObject.y;
                }

                else if (
                    selectedObject.type ===
                    "wall"
                ) {
                    dragOffsetX =
                        pos.x -
                        selectedObject.x1;

                    dragOffsetY =
                        pos.y -
                        selectedObject.y1;
                }

                else {
                    dragOffsetX =
                        pos.x -
                        selectedObject.x;

                    dragOffsetY =
                        pos.y -
                        selectedObject.y;
                }
            }

            redraw();

            return;
        }

        if (
            currentTool ===
                "wall" ||
            currentTool ===
                "room"
        ) {
            startX =
                pos.x;

            startY =
                pos.y;

            isDrawing =
                true;

            return;
        }

        const placeableTools = [
            "door",
            "window",
            "chair",
            "table",
            "bed",
            "sofa",
            "dining",
            "toilet",
            "plant"
        ];

        if (
            placeableTools.includes(
                currentTool
            )
        ) {
            saveState();

            objects.push({

                type:
                    currentTool,

                x:
                    pos.x,

                y:
                    pos.y,

                rotation:
                    0,

                scale:
                    1
            });

            redraw();
        }
    }
);


/* =========================================
   POINTER MOVE
========================================= */

canvas.addEventListener(
    "pointermove",
    event => {

        if (
            activePointerId !== null &&
            event.pointerId !==
                activePointerId
        ) {
            return;
        }

        event.preventDefault();

        const pos =
            getPointerPosition(
                event
            );

        if (
            currentTool ===
                "select" &&
            isDragging &&
            selectedObject
        ) {

            let changed = false;

            if (
                selectedObject.type ===
                "room"
            ) {
                const newX =
                    pos.x -
                    dragOffsetX;

                const newY =
                    pos.y -
                    dragOffsetY;

                if (
                    newX !==
                        selectedObject.x ||
                    newY !==
                        selectedObject.y
                ) {
                    changed = true;
                }

                if (
                    changed &&
                    !dragStateSaved
                ) {
                    saveState();

                    dragStateSaved =
                        true;
                }

                selectedObject.x =
                    newX;

                selectedObject.y =
                    newY;
            }

            else if (
                selectedObject.type ===
                "wall"
            ) {
                const newX =
                    pos.x -
                    dragOffsetX;

                const newY =
                    pos.y -
                    dragOffsetY;

                const dx =
                    newX -
                    selectedObject.x1;

                const dy =
                    newY -
                    selectedObject.y1;

                if (
                    dx !== 0 ||
                    dy !== 0
                ) {
                    changed =
                        true;
                }

                if (
                    changed &&
                    !dragStateSaved
                ) {
                    saveState();

                    dragStateSaved =
                        true;
                }

                selectedObject.x1 +=
                    dx;

                selectedObject.y1 +=
                    dy;

                selectedObject.x2 +=
                    dx;

                selectedObject.y2 +=
                    dy;
            }

            else {
                const newX =
                    pos.x -
                    dragOffsetX;

                const newY =
                    pos.y -
                    dragOffsetY;

                if (
                    newX !==
                        selectedObject.x ||
                    newY !==
                        selectedObject.y
                ) {
                    changed =
                        true;
                }

                if (
                    changed &&
                    !dragStateSaved
                ) {
                    saveState();

                    dragStateSaved =
                        true;
                }

                selectedObject.x =
                    newX;

                selectedObject.y =
                    newY;
            }

            redraw();

            return;
        }

        if (!isDrawing) {
            return;
        }

        redraw();

        if (
            currentTool ===
            "wall"
        ) {
            drawWall({

                type:
                    "wall",

                x1:
                    startX,

                y1:
                    startY,

                x2:
                    pos.x,

                y2:
                    pos.y
            });
        }

        if (
            currentTool ===
            "room"
        ) {
            const x =
                Math.min(
                    startX,
                    pos.x
                );

            const y =
                Math.min(
                    startY,
                    pos.y
                );

            const width =
                Math.abs(
                    pos.x -
                    startX
                );

            const height =
                Math.abs(
                    pos.y -
                    startY
                );

            drawRoom({

                type:
                    "room",

                x,
                y,
                width,
                height,

                name:
                    "Room"
            });
        }
    }
);


/* =========================================
   POINTER UP
========================================= */

canvas.addEventListener(
    "pointerup",
    event => {

        event.preventDefault();

        const pos =
            getPointerPosition(
                event
            );

        if (
            canvas.hasPointerCapture(
                event.pointerId
            )
        ) {
            canvas.releasePointerCapture(
                event.pointerId
            );
        }

        activePointerId =
            null;

        if (
            isDragging
        ) {
            isDragging =
                false;

            dragStateSaved =
                false;

            redraw();

            return;
        }

        if (!isDrawing) {
            return;
        }

        if (
            currentTool ===
            "wall"
        ) {
            if (
                startX !==
                    pos.x ||
                startY !==
                    pos.y
            ) {
                saveState();

                objects.push({

                    type:
                        "wall",

                    x1:
                        startX,

                    y1:
                        startY,

                    x2:
                        pos.x,

                    y2:
                        pos.y
                });
            }
        }

        if (
            currentTool ===
            "room"
        ) {
            const x =
                Math.min(
                    startX,
                    pos.x
                );

            const y =
                Math.min(
                    startY,
                    pos.y
                );

            const width =
                Math.abs(
                    pos.x -
                    startX
                );

            const height =
                Math.abs(
                    pos.y -
                    startY
                );

            if (
                width >=
                    gridSize &&
                height >=
                    gridSize
            ) {
                saveState();

                objects.push({

                    type:
                        "room",

                    x,
                    y,
                    width,
                    height,

                    name:
                        "Room"
                });
            }
        }

        isDrawing =
            false;

        redraw();
    }
);


/* =========================================
   POINTER CANCEL
========================================= */

canvas.addEventListener(
    "pointercancel",
    () => {

        activePointerId =
            null;

        isDrawing =
            false;

        isDragging =
            false;

        dragStateSaved =
            false;

        redraw();
    }
);


/* =========================================
   TOOL BUTTONS
========================================= */

document
    .querySelectorAll(
        ".tool-btn"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".tool-btn"
                    )
                    .forEach(btn => {

                        btn.classList.remove(
                            "active"
                        );
                    });

                button.classList.add(
                    "active"
                );

                currentTool =
                    button.dataset.tool;

                if (
                    currentTool !==
                    "select"
                ) {
                    selectedObject =
                        null;
                }

                canvas.style.cursor =
                    currentTool ===
                    "select"
                        ? "default"
                        : "crosshair";

                redraw();
            }
        );
    });


/* =========================================
   ROTATE
========================================= */

document
    .getElementById(
        "rotateBtn"
    )
    .addEventListener(
        "click",
        () => {

            if (!selectedObject) {

                alert(
                    "Select an object first."
                );

                return;
            }

            if (
                selectedObject.type ===
                    "room" ||
                selectedObject.type ===
                    "wall"
            ) {

                alert(
                    "Rooms and walls cannot be rotated with this button."
                );

                return;
            }

            saveState();

            selectedObject.rotation =
                (
                    selectedObject.rotation ||
                    0
                ) +
                Math.PI / 2;

            redraw();
        }
    );


/* =========================================
   SCALE UP
========================================= */

document
    .getElementById(
        "scaleUpBtn"
    )
    .addEventListener(
        "click",
        () => {

            if (!selectedObject) {

                alert(
                    "Select an object first."
                );

                return;
            }

            saveState();

            if (
                selectedObject.type ===
                "room"
            ) {
                selectedObject.width +=
                    gridSize;

                selectedObject.height +=
                    gridSize;
            }

            else if (
                selectedObject.type ===
                "wall"
            ) {

                const dx =
                    selectedObject.x2 -
                    selectedObject.x1;

                const dy =
                    selectedObject.y2 -
                    selectedObject.y1;

                const length =
                    Math.hypot(
                        dx,
                        dy
                    );

                if (
                    length > 0
                ) {
                    selectedObject.x2 =
                        snap(
                            selectedObject.x2 +
                            dx /
                            length *
                            gridSize
                        );

                    selectedObject.y2 =
                        snap(
                            selectedObject.y2 +
                            dy /
                            length *
                            gridSize
                        );
                }
            }

            else {
                selectedObject.scale =
                    Math.min(
                        (
                            selectedObject.scale ||
                            1
                        ) + 0.1,
                        2
                    );
            }

            redraw();
        }
    );


/* =========================================
   SCALE DOWN
========================================= */

document
    .getElementById(
        "scaleDownBtn"
    )
    .addEventListener(
        "click",
        () => {

            if (!selectedObject) {

                alert(
                    "Select an object first."
                );

                return;
            }

            if (
                selectedObject.type ===
                "room"
            ) {
                if (
                    selectedObject.width <=
                        gridSize * 2 &&
                    selectedObject.height <=
                        gridSize * 2
                ) {
                    return;
                }

                saveState();

                selectedObject.width =
                    Math.max(
                        gridSize * 2,
                        selectedObject.width -
                            gridSize
                    );

                selectedObject.height =
                    Math.max(
                        gridSize * 2,
                        selectedObject.height -
                            gridSize
                    );
            }

            else if (
                selectedObject.type ===
                "wall"
            ) {

                const dx =
                    selectedObject.x2 -
                    selectedObject.x1;

                const dy =
                    selectedObject.y2 -
                    selectedObject.y1;

                const length =
                    Math.hypot(
                        dx,
                        dy
                    );

                if (
                    length <=
                    gridSize * 2
                ) {
                    return;
                }

                saveState();

                selectedObject.x2 =
                    snap(
                        selectedObject.x2 -
                        dx /
                        length *
                        gridSize
                    );

                selectedObject.y2 =
                    snap(
                        selectedObject.y2 -
                        dy /
                        length *
                        gridSize
                    );
            }

            else {

                const scale =
                    selectedObject.scale ||
                    1;

                if (
                    scale <= 0.5
                ) {
                    return;
                }

                saveState();

                selectedObject.scale =
                    Math.max(
                        scale - 0.1,
                        0.5
                    );
            }

            redraw();
        }
    );


/* =========================================
   RENAME
========================================= */

document
    .getElementById(
        "renameBtn"
    )
    .addEventListener(
        "click",
        () => {

            if (
                !selectedObject ||
                selectedObject.type !==
                    "room"
            ) {

                alert(
                    "Select a room first."
                );

                return;
            }

            const name =
                prompt(
                    "Enter room name:",
                    selectedObject.name ||
                        "Room"
                );

            if (
                name &&
                name.trim()
            ) {
                saveState();

                selectedObject.name =
                    name.trim();

                redraw();
            }
        }
    );


/* =========================================
   DUPLICATE
========================================= */

document
    .getElementById(
        "duplicateBtn"
    )
    .addEventListener(
        "click",
        () => {

            if (!selectedObject) {

                alert(
                    "Select an object first."
                );

                return;
            }

            saveState();

            const copy =
                JSON.parse(
                    JSON.stringify(
                        selectedObject
                    )
                );

            if (
                copy.type ===
                "wall"
            ) {
                copy.x1 +=
                    gridSize;

                copy.y1 +=
                    gridSize;

                copy.x2 +=
                    gridSize;

                copy.y2 +=
                    gridSize;
            }

            else {
                copy.x +=
                    gridSize;

                copy.y +=
                    gridSize;
            }

            objects.push(copy);

            selectedObject =
                copy;

            redraw();
        }
    );


/* =========================================
   LAYERS
========================================= */

document
    .getElementById(
        "bringFrontBtn"
    )
    .addEventListener(
        "click",
        () => {

            if (!selectedObject) {
                return;
            }

            const index =
                objects.indexOf(
                    selectedObject
                );

            if (
                index ===
                objects.length - 1
            ) {
                return;
            }

            saveState();

            objects.splice(
                index,
                1
            );

            objects.push(
                selectedObject
            );

            redraw();
        }
    );


document
    .getElementById(
        "sendBackBtn"
    )
    .addEventListener(
        "click",
        () => {

            if (!selectedObject) {
                return;
            }

            const index =
                objects.indexOf(
                    selectedObject
                );

            if (
                index === 0
            ) {
                return;
            }

            saveState();

            objects.splice(
                index,
                1
            );

            objects.unshift(
                selectedObject
            );

            redraw();
        }
    );


/* =========================================
   DELETE
========================================= */

function deleteSelected() {

    if (!selectedObject) {
        return;
    }

    const index =
        objects.indexOf(
            selectedObject
        );

    if (
        index !== -1
    ) {
        saveState();

        objects.splice(
            index,
            1
        );
    }

    selectedObject =
        null;

    redraw();
}

document
    .getElementById(
        "deleteBtn"
    )
    .addEventListener(
        "click",
        deleteSelected
    );


/* =========================================
   UNDO / REDO
========================================= */

function undo() {

    if (
        undoStack.length ===
        0
    ) {
        return;
    }

    redoStack.push(
        cloneObjects()
    );

    restoreObjects(
        undoStack.pop()
    );
}

function redo() {

    if (
        redoStack.length ===
        0
    ) {
        return;
    }

    undoStack.push(
        cloneObjects()
    );

    restoreObjects(
        redoStack.pop()
    );
}

document
    .getElementById(
        "undoBtn"
    )
    .addEventListener(
        "click",
        undo
    );

document
    .getElementById(
        "redoBtn"
    )
    .addEventListener(
        "click",
        redo
    );


/* =========================================
   SAVE / LOAD
========================================= */

document
    .getElementById(
        "saveBtn"
    )
    .addEventListener(
        "click",
        () => {

            localStorage.setItem(
                "plancraft-floor-plan",
                JSON.stringify(
                    objects
                )
            );

            alert(
                "Floor plan saved successfully."
            );
        }
    );


document
    .getElementById(
        "loadBtn"
    )
    .addEventListener(
        "click",
        () => {

            const saved =
                localStorage.getItem(
                    "plancraft-floor-plan"
                );

            if (!saved) {

                alert(
                    "No saved floor plan found."
                );

                return;
            }

            try {

                const data =
                    JSON.parse(
                        saved
                    );

                if (
                    !Array.isArray(
                        data
                    )
                ) {
                    throw new Error(
                        "Invalid floor plan."
                    );
                }

                saveState();

                objects.length =
                    0;

                data.forEach(
                    obj => {
                        objects.push(
                            obj
                        );
                    }
                );

                selectedObject =
                    null;

                redraw();

                alert(
                    "Floor plan loaded successfully."
                );
            }

            catch (error) {

                console.error(
                    error
                );

                alert(
                    "Could not load the floor plan."
                );
            }
        }
    );


/* =========================================
   CLEAR
========================================= */

document
    .getElementById(
        "clearBtn"
    )
    .addEventListener(
        "click",
        () => {

            if (
                objects.length ===
                0
            ) {
                return;
            }

            const confirmed =
                confirm(
                    "Clear the entire floor plan?"
                );

            if (!confirmed) {
                return;
            }

            saveState();

            objects.length =
                0;

            selectedObject =
                null;

            redraw();
        }
    );


/* =========================================
   EXPORT
========================================= */

document
    .getElementById(
        "exportBtn"
    )
    .addEventListener(
        "click",
        () => {

            const previousSelection =
                selectedObject;

            selectedObject =
                null;

            redraw();

            const link =
                document.createElement(
                    "a"
                );

            link.download =
                "plancraft-floor-plan.png";

            link.href =
                canvas.toDataURL(
                    "image/png"
                );

            link.click();

            selectedObject =
                previousSelection;

            redraw();
        }
    );


/* =========================================
   ZOOM
========================================= */

document
    .getElementById(
        "zoomInBtn"
    )
    .addEventListener(
        "click",
        () => {

            zoomLevel =
                Math.min(
                    maxZoom,
                    Math.round(
                        (
                            zoomLevel +
                            0.1
                        ) * 10
                    ) / 10
                );

            redraw();
        }
    );


document
    .getElementById(
        "zoomOutBtn"
    )
    .addEventListener(
        "click",
        () => {

            zoomLevel =
                Math.max(
                    minZoom,
                    Math.round(
                        (
                            zoomLevel -
                            0.1
                        ) * 10
                    ) / 10
                );

            redraw();
        }
    );


document
    .getElementById(
        "resetZoomBtn"
    )
    .addEventListener(
        "click",
        () => {

            zoomLevel = 1;

            redraw();
        }
    );


/* =========================================
   KEYBOARD
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Delete"
        ) {
            deleteSelected();
        }

        if (
            event.ctrlKey &&
            event.key.toLowerCase() ===
                "z"
        ) {
            event.preventDefault();

            undo();
        }

        if (
            event.ctrlKey &&
            event.key.toLowerCase() ===
                "y"
        ) {
            event.preventDefault();

            redo();
        }

        if (
            event.ctrlKey &&
            event.key.toLowerCase() ===
                "d"
        ) {
            event.preventDefault();

            if (
                selectedObject
            ) {
                document
                    .getElementById(
                        "duplicateBtn"
                    )
                    .click();
            }
        }
    }
);


/* =========================================
   INITIALIZE
========================================= */

window.addEventListener(
    "resize",
    () => {

        clearTimeout(
            window.resizeTimer
        );

        window.resizeTimer =
            setTimeout(
                resizeCanvas,
                100
            );
    }
);

loadDemoPlan();

resizeCanvas();