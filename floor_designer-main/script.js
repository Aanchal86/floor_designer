import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =========================================================
   DOM
========================================================= */

const setupSection = document.getElementById("setupSection");
const roomSection = document.getElementById("roomSection");
const designerSection = document.getElementById("designerSection");
const threeDSection = document.getElementById("threeDSection");

const floorWidthInput = document.getElementById("floorWidth");
const floorHeightInput = document.getElementById("floorHeight");
const roomCountInput = document.getElementById("roomCount");

const continueBtn = document.getElementById("continueBtn");
const backBtn = document.getElementById("backBtn");
const generateBtn = document.getElementById("generateBtn");

const resetBtn = document.getElementById("resetBtn");
const finalizeBtn = document.getElementById("finalizeBtn");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const exportPngBtn = document.getElementById("exportPngBtn");

const regenerateBtn = document.getElementById("regenerateBtn");
const editDimensionsBtn = document.getElementById("editDimensionsBtn");

const roomInputsContainer = document.getElementById("roomInputs");
const setupError = document.getElementById("setupError");
const roomError = document.getElementById("roomError");
const floorSummary = document.getElementById("floorSummary");

const designerFloorSize = document.getElementById("designerFloorSize");
const designerRoomCount = document.getElementById("designerRoomCount");
const designerFurnitureCount = document.getElementById("designerFurnitureCount");
const roomList = document.getElementById("roomList");

const selectedName = document.getElementById("selectedName");
const selectedRoomInfo = document.getElementById("selectedRoomInfo");
const scaleInfo = document.getElementById("scaleInfo");

const canvas = document.getElementById("floorCanvas");
const ctx = canvas.getContext("2d");

const furnitureControls = document.getElementById("furnitureControls");
const rotateFurnitureBtn = document.getElementById("rotateFurnitureBtn");
const deleteFurnitureBtn = document.getElementById("deleteFurnitureBtn");

const backTo2DBtn = document.getElementById("backTo2DBtn");
const reset3DCameraBtn = document.getElementById("reset3DCameraBtn");
const topView3DBtn = document.getElementById("topView3DBtn");
const perspective3DBtn = document.getElementById("perspective3DBtn");

const threeDContainer = document.getElementById("threeDContainer");
const threeDFloorSize = document.getElementById("threeDFloorSize");
const threeDRoomCount = document.getElementById("threeDRoomCount");
const threeDFurnitureCount = document.getElementById("threeDFurnitureCount");


/* =========================================================
   CONSTANTS / STATE
========================================================= */

const STORAGE_KEY = "plancraft-v3-floor-plan";

const WALL_HEIGHT = 9;
const WALL_THICKNESS = 0.5;
const MIN_ROOM_SIZE = 2;
const CANVAS_PADDING = 30;
const MAX_HISTORY = 60;

let floor = {
    width: 40,
    height: 30
};

let rooms = [];
let furniture = [];

let selectedRoom = null;
let selectedFurniture = null;

let isDraggingRoom = false;
let isDraggingFurniture = false;
let isResizingRoom = false;

let activeResizeHandle = null;
let activePointerId = null;

let dragOffsetX = 0;
let dragOffsetY = 0;

let pixelsPerFoot = 10;
let roomInvalid = false;

let paletteDragType = null;
let actionStartSnapshot = null;

const undoStack = [];
const redoStack = [];


/* =========================================================
   COLORS
========================================================= */

const roomColors = [
    "#dbeafe",
    "#dcfce7",
    "#fef3c7",
    "#fce7f3",
    "#ede9fe",
    "#cffafe",
    "#ffedd5",
    "#e0e7ff"
];


/* =========================================================
   FURNITURE
========================================================= */

const furnitureDefinitions = {

    bed: {
        name: "Bed",
        icon: "🛏️",
        width: 6,
        height: 4
    },

    sofa: {
        name: "Sofa",
        icon: "🛋️",
        width: 6,
        height: 3
    },

    table: {
        name: "Table",
        icon: "▣",
        width: 4,
        height: 3
    },

    chair: {
        name: "Chair",
        icon: "🪑",
        width: 2,
        height: 2
    },

    dining: {
        name: "Dining Table",
        icon: "🍽️",
        width: 6,
        height: 4
    },

    toilet: {
        name: "Toilet",
        icon: "🚽",
        width: 2,
        height: 3
    },

    plant: {
        name: "Plant",
        icon: "🪴",
        width: 2,
        height: 2
    }
};


/* =========================================================
   UNDO / REDO
========================================================= */

function createSnapshot() {

    return JSON.stringify({
        floor,
        rooms,
        furniture
    });

}


function restoreSnapshot(snapshot) {

    const data = JSON.parse(snapshot);

    floor = {
        ...data.floor
    };

    rooms = Array.isArray(data.rooms)
        ? data.rooms.map(room => ({
            ...room
        }))
        : [];

    furniture = Array.isArray(data.furniture)
        ? data.furniture.map(item => ({
            ...item
        }))
        : [];

    selectedRoom = null;
    selectedFurniture = null;

    roomInvalid = false;

    floorWidthInput.value = floor.width;
    floorHeightInput.value = floor.height;
    roomCountInput.value = rooms.length || 1;

    updateDesignerUI();
}


function pushHistory(snapshot) {

    if (!snapshot) return;

    if (snapshot === createSnapshot()) {
        return;
    }

    undoStack.push(snapshot);

    if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
    }

    redoStack.length = 0;

    updateHistoryButtons();
}


function beginAction() {

    actionStartSnapshot = createSnapshot();

}


function commitAction() {

    if (!actionStartSnapshot) {
        return;
    }

    pushHistory(actionStartSnapshot);

    actionStartSnapshot = null;

}


function undo() {

    if (!undoStack.length) {
        return;
    }

    redoStack.push(createSnapshot());

    restoreSnapshot(
        undoStack.pop()
    );

    updateHistoryButtons();

}


function redo() {

    if (!redoStack.length) {
        return;
    }

    undoStack.push(createSnapshot());

    restoreSnapshot(
        redoStack.pop()
    );

    updateHistoryButtons();

}


function updateHistoryButtons() {

    undoBtn.disabled = undoStack.length === 0;
    redoBtn.disabled = redoStack.length === 0;

}


undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);


/* =========================================================
   STEP 1
========================================================= */

continueBtn.addEventListener("click", () => {

    setupError.textContent = "";

    const width = Number(
        floorWidthInput.value
    );

    const height = Number(
        floorHeightInput.value
    );

    const count = Number(
        roomCountInput.value
    );


    if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width < 5 ||
        height < 5
    ) {

        setupError.textContent =
            "Enter valid floor dimensions.";

        return;
    }


    if (
        !Number.isInteger(count) ||
        count < 1 ||
        count > 12
    ) {

        setupError.textContent =
            "Number of rooms must be between 1 and 12.";

        return;
    }


    floor = {
        width,
        height
    };


    createRoomInputs(count);


    floorSummary.textContent =
        `${width} ft × ${height} ft`;


    setupSection.classList.add("hidden");

    roomSection.classList.remove("hidden");

});


/* =========================================================
   ROOM INPUTS
========================================================= */

function createRoomInputs(count) {

    roomInputsContainer.innerHTML = "";


    const names = [

        "Living Room",
        "Bedroom",
        "Kitchen",
        "Bathroom",
        "Dining Room",
        "Bedroom 2",
        "Study Room",
        "Guest Room",
        "Utility Room",
        "Store Room",
        "Balcony",
        "Room"

    ];


    const widths = [
        15,
        12,
        10,
        8,
        12,
        11,
        9,
        10,
        7,
        6,
        8,
        8
    ];


    const heights = [
        12,
        10,
        8,
        6,
        10,
        10,
        8,
        9,
        6,
        6,
        6,
        8
    ];


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const row =
            document.createElement("div");


        row.className =
            "room-input-row";


        row.innerHTML = `

            <div class="room-number">
                ${i + 1}.
            </div>

            <div class="form-group room-name-group">

                <label>
                    Room Name
                </label>

                <input
                    class="room-name"
                    type="text"
                    value="${names[i] || `Room ${i + 1}`}"
                >

            </div>


            <div class="form-group room-width-group">

                <label>
                    Width (ft)
                </label>

                <input
                    class="room-width"
                    type="number"
                    min="2"
                    value="${widths[i] || 8}"
                >

            </div>


            <div class="form-group room-height-group">

                <label>
                    Height (ft)
                </label>

                <input
                    class="room-height"
                    type="number"
                    min="2"
                    value="${heights[i] || 8}"
                >

            </div>

        `;


        roomInputsContainer.appendChild(row);

    }

}


/* =========================================================
   BACK
========================================================= */

backBtn.addEventListener("click", () => {

    roomSection.classList.add("hidden");

    setupSection.classList.remove("hidden");

});


/* =========================================================
   GENERATE LAYOUT
========================================================= */

generateBtn.addEventListener(
    "click",
    generateLayout
);


function generateLayout() {

    roomError.textContent = "";


    const names =
        document.querySelectorAll(
            ".room-name"
        );

    const widths =
        document.querySelectorAll(
            ".room-width"
        );

    const heights =
        document.querySelectorAll(
            ".room-height"
        );


    const newRooms = [];

    let totalArea = 0;


    for (
        let i = 0;
        i < names.length;
        i++
    ) {

        const name =
            names[i].value.trim();

        const width =
            Number(widths[i].value);

        const height =
            Number(heights[i].value);


        if (!name) {

            roomError.textContent =
                `Enter a name for room ${i + 1}.`;

            return;
        }


        if (
            !Number.isFinite(width) ||
            !Number.isFinite(height) ||
            width < MIN_ROOM_SIZE ||
            height < MIN_ROOM_SIZE
        ) {

            roomError.textContent =
                `Enter valid dimensions for ${name}.`;

            return;
        }


        totalArea +=
            width * height;


        if (
            width > floor.width ||
            height > floor.height
        ) {

            roomError.textContent =
                `${name} is larger than the floor.`;

            return;
        }


        newRooms.push({

            id:
                `room-${Date.now()}-${i}`,

            name,

            x: 0,
            y: 0,

            width,
            height,

            color:
                roomColors[
                    i % roomColors.length
                ]

        });

    }


    if (
        totalArea >
        floor.width * floor.height
    ) {

        roomError.textContent =
            "The total room area is larger than the floor area.";

        return;
    }


    rooms =
        autoArrangeRooms(
            newRooms
        );


    furniture = [];

    selectedRoom = null;
    selectedFurniture = null;

    roomInvalid = false;


    undoStack.length = 0;
    redoStack.length = 0;


    openDesigner();

}


/* =========================================================
   AUTO ARRANGE ROOMS
========================================================= */

function autoArrangeRooms(roomArray) {

    const result = [];

    let cursorX = 0;
    let cursorY = 0;

    let rowHeight = 0;


    for (const room of roomArray) {

        if (
            cursorX + room.width >
            floor.width
        ) {

            cursorX = 0;

            cursorY += rowHeight;

            rowHeight = 0;

        }


        if (
            cursorY + room.height >
            floor.height
        ) {

            cursorX = 0;
            cursorY = 0;

        }


        room.x = cursorX;
        room.y = cursorY;


        cursorX += room.width;

        rowHeight =
            Math.max(
                rowHeight,
                room.height
            );


        result.push(room);

    }


    return result;

}


/* =========================================================
   VALIDATION
========================================================= */

function roomsOverlap(a, b) {

    return !(
        a.x + a.width <= b.x ||
        b.x + b.width <= a.x ||
        a.y + a.height <= b.y ||
        b.y + b.height <= a.y
    );

}


function hasRoomOverlap(room) {

    return rooms.some(
        other =>
            other !== room &&
            roomsOverlap(
                room,
                other
            )
    );

}


function roomInsideFloor(room) {

    return (

        room.x >= 0 &&

        room.y >= 0 &&

        room.x + room.width <=
            floor.width &&

        room.y + room.height <=
            floor.height

    );

}


function layoutIsValid() {

    if (!rooms.length) {
        return false;
    }


    return !rooms.some(
        room =>
            hasRoomOverlap(room) ||
            !roomInsideFloor(room)
    );

}


/* =========================================================
   OPEN DESIGNER
========================================================= */

function openDesigner() {

    setupSection.classList.add("hidden");

    roomSection.classList.add("hidden");

    threeDSection.classList.add("hidden");

    designerSection.classList.remove("hidden");


    finalizeBtn.disabled = false;


    updateDesignerUI();


    setTimeout(
        resizeCanvas,
        50
    );

}


/* =========================================================
   UPDATE DESIGNER UI
========================================================= */

function updateDesignerUI() {

    designerFloorSize.textContent =
        `${floor.width} × ${floor.height} ft`;


    designerRoomCount.textContent =
        rooms.length;


    designerFurnitureCount.textContent =
        furniture.length;


    createRoomList();

    updateFurnitureControls();

    redraw();


    exportJsonBtn.disabled =
        rooms.length === 0;

    exportPngBtn.disabled =
        rooms.length === 0;


    updateHistoryButtons();

}


/* =========================================================
   ROOM LIST
========================================================= */

function createRoomList() {

    roomList.innerHTML = "";


    rooms.forEach(room => {

        const item =
            document.createElement("div");


        item.className =
            "room-list-item" +
            (
                selectedRoom === room
                    ? " active"
                    : ""
            );


        item.innerHTML = `

            <strong>
                ${escapeHtml(room.name)}
            </strong>

            <span>
                ${room.width} ×
                ${room.height} ft
            </span>

        `;


        item.addEventListener(
            "click",
            () => {

                selectedRoom = room;

                selectedFurniture = null;

                redraw();

            }
        );


        roomList.appendChild(item);

    });

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   CANVAS
========================================================= */

function resizeCanvas() {

    const container =
        canvas.parentElement;


    const rect =
        container.getBoundingClientRect();


    const availableWidth =
        Math.max(
            250,
            rect.width -
            CANVAS_PADDING * 2
        );


    const availableHeight =
        Math.max(
            250,
            rect.height -
            CANVAS_PADDING * 2
        );


    pixelsPerFoot =
        Math.max(
            5,
            Math.min(
                availableWidth /
                    floor.width,

                availableHeight /
                    floor.height
            )
        );


    canvas.width =
        Math.round(
            floor.width *
            pixelsPerFoot
        );


    canvas.height =
        Math.round(
            floor.height *
            pixelsPerFoot
        );


    scaleInfo.textContent =
        `${pixelsPerFoot.toFixed(1)} px / ft`;


    redraw();

}


/* =========================================================
   REDRAW
========================================================= */

function redraw() {

    if (
        !canvas.width ||
        !canvas.height
    ) {
        return;
    }


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    drawFloorGrid();


    rooms.forEach(
        drawRoom
    );


    furniture.forEach(
        drawFurniture
    );


    if (selectedRoom) {
        drawRoomSelection(
            selectedRoom
        );
    }


    if (selectedFurniture) {
        drawFurnitureSelection(
            selectedFurniture
        );
    }


    updateSelectedInfo();

    createRoomList();

}


/* =========================================================
   GRID
========================================================= */

function drawFloorGrid() {

    ctx.fillStyle =
        "#ffffff";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.strokeStyle =
        "#e5e7eb";

    ctx.lineWidth = 1;


    const step =
        Math.max(
            1,
            pixelsPerFoot
        );


    for (
        let x = 0;
        x <= canvas.width;
        x += step
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            canvas.height
        );

        ctx.stroke();

    }


    for (
        let y = 0;
        y <= canvas.height;
        y += step
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            canvas.width,
            y
        );

        ctx.stroke();

    }


    ctx.strokeStyle =
        "#111827";

    ctx.lineWidth = 4;


    ctx.strokeRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

}


/* =========================================================
   DRAW ROOM
========================================================= */

function drawRoom(room) {

    const x =
        room.x *
        pixelsPerFoot;

    const y =
        room.y *
        pixelsPerFoot;

    const w =
        room.width *
        pixelsPerFoot;

    const h =
        room.height *
        pixelsPerFoot;


    ctx.fillStyle =
        room.color ||
        "#dbeafe";


    ctx.fillRect(
        x,
        y,
        w,
        h
    );


    ctx.strokeStyle =
        "#1f2937";

    ctx.lineWidth = 3;


    ctx.strokeRect(
        x,
        y,
        w,
        h
    );


    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";


    ctx.fillStyle =
        "#111827";

    ctx.font =
        "700 18px Arial";


    ctx.fillText(
        room.name,
        x + w / 2,
        y + h / 2 - 12
    );


    ctx.font =
        "14px Arial";

    ctx.fillStyle =
        "#374151";


    ctx.fillText(
        `${room.width} × ${room.height} ft`,
        x + w / 2,
        y + h / 2 + 16
    );


    if (roomInvalid) {

        ctx.fillStyle =
            "rgba(220,38,38,0.12)";

        ctx.fillRect(
            x,
            y,
            w,
            h
        );

    }

}


/* =========================================================
   DRAW FURNITURE
========================================================= */

function drawFurniture(item) {

    const x =
        item.x *
        pixelsPerFoot;

    const y =
        item.y *
        pixelsPerFoot;

    const w =
        item.width *
        pixelsPerFoot;

    const h =
        item.height *
        pixelsPerFoot;


    ctx.save();


    ctx.translate(
        x + w / 2,
        y + h / 2
    );


    ctx.rotate(
        (item.rotation || 0) *
        Math.PI / 180
    );


    ctx.fillStyle =
        "#ffffff";

    ctx.strokeStyle =
        "#374151";

    ctx.lineWidth = 2;


    ctx.fillRect(
        -w / 2,
        -h / 2,
        w,
        h
    );


    ctx.strokeRect(
        -w / 2,
        -h / 2,
        w,
        h
    );


    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";


    ctx.font =
        `${Math.max(
            12,
            Math.min(
                24,
                Math.min(w, h) / 2
            )
        )}px Arial`;


    ctx.fillStyle =
        "#111827";


    ctx.fillText(
        item.icon || "■",
        0,
        0
    );


    ctx.restore();

}


/* =========================================================
   ROOM SELECTION
========================================================= */

function drawRoomSelection(room) {

    const x =
        room.x *
        pixelsPerFoot;

    const y =
        room.y *
        pixelsPerFoot;

    const w =
        room.width *
        pixelsPerFoot;

    const h =
        room.height *
        pixelsPerFoot;


    ctx.save();


    ctx.strokeStyle =
        "#2563eb";

    ctx.lineWidth = 3;

    ctx.setLineDash([
        7,
        5
    ]);


    ctx.strokeRect(
        x - 2,
        y - 2,
        w + 4,
        h + 4
    );


    ctx.restore();


    drawResizeHandles(room);

}


/* =========================================================
   RESIZE HANDLES
========================================================= */

function drawResizeHandles(room) {

    const x =
        room.x *
        pixelsPerFoot;

    const y =
        room.y *
        pixelsPerFoot;

    const w =
        room.width *
        pixelsPerFoot;

    const h =
        room.height *
        pixelsPerFoot;


    const handles = [

        [x, y, "nw"],

        [x + w, y, "ne"],

        [x, y + h, "sw"],

        [x + w, y + h, "se"]

    ];


    ctx.fillStyle =
        "#2563eb";


    handles.forEach(
        ([hx, hy]) => {

            ctx.fillRect(
                hx - 5,
                hy - 5,
                10,
                10
            );

        }
    );

}


/* =========================================================
   FURNITURE SELECTION
========================================================= */

function drawFurnitureSelection(item) {

    const x =
        item.x *
        pixelsPerFoot;

    const y =
        item.y *
        pixelsPerFoot;

    const w =
        item.width *
        pixelsPerFoot;

    const h =
        item.height *
        pixelsPerFoot;


    ctx.save();


    ctx.strokeStyle =
        "#dc2626";

    ctx.lineWidth = 2;

    ctx.setLineDash([
        5,
        4
    ]);


    ctx.strokeRect(
        x - 3,
        y - 3,
        w + 6,
        h + 6
    );


    ctx.restore();

}


/* =========================================================
   SELECTED INFO
========================================================= */

function updateSelectedInfo() {

    if (selectedFurniture) {

        const name =
            furnitureDefinitions[
                selectedFurniture.type
            ]?.name ||
            "Furniture";


        selectedName.textContent =
            name;


        selectedRoomInfo.textContent =
            `Selected: ${name}`;


        updateFurnitureControls();

        return;

    }


    if (selectedRoom) {

        selectedName.textContent =
            selectedRoom.name;


        selectedRoomInfo.textContent =
            `Selected: ${selectedRoom.name} — ` +
            `${selectedRoom.width} × ` +
            `${selectedRoom.height} ft`;


        updateFurnitureControls();

        return;

    }


    selectedName.textContent =
        "None";


    selectedRoomInfo.textContent =
        "Selected: None";


    updateFurnitureControls();

}


/* =========================================================
   CANVAS POINT
========================================================= */

function canvasPoint(event) {

    const rect =
        canvas.getBoundingClientRect();


    return {

        x:
            (event.clientX -
                rect.left) /
            pixelsPerFoot,

        y:
            (event.clientY -
                rect.top) /
            pixelsPerFoot

    };

}


/* =========================================================
   HIT ROOM
========================================================= */

function hitRoom(point) {

    for (
        let i = rooms.length - 1;
        i >= 0;
        i--
    ) {

        const room =
            rooms[i];


        if (

            point.x >= room.x &&

            point.x <=
                room.x + room.width &&

            point.y >= room.y &&

            point.y <=
                room.y + room.height

        ) {

            return room;

        }

    }


    return null;

}


/* =========================================================
   HIT FURNITURE
========================================================= */

function hitFurniture(point) {

    for (
        let i = furniture.length - 1;
        i >= 0;
        i--
    ) {

        const item =
            furniture[i];


        if (

            point.x >= item.x &&

            point.x <=
                item.x + item.width &&

            point.y >= item.y &&

            point.y <=
                item.y + item.height

        ) {

            return item;

        }

    }


    return null;

}


/* =========================================================
   RESIZE HANDLE HIT
========================================================= */

function hitResizeHandle(
    point,
    room
) {

    const threshold =
        0.8;


    const handles = {

        nw: [
            room.x,
            room.y
        ],

        ne: [
            room.x + room.width,
            room.y
        ],

        sw: [
            room.x,
            room.y + room.height
        ],

        se: [
            room.x + room.width,
            room.y + room.height
        ]

    };


    for (
        const [
            name,
            [hx, hy]
        ] of Object.entries(handles)
    ) {

        if (

            Math.abs(
                point.x - hx
            ) <= threshold &&

            Math.abs(
                point.y - hy
            ) <= threshold

        ) {

            return name;

        }

    }


    return null;

}


/* =========================================================
   CANVAS POINTER DOWN
========================================================= */

canvas.addEventListener(
    "pointerdown",
    event => {

        if (event.button !== 0) {
            return;
        }


        const point =
            canvasPoint(event);


        activePointerId =
            event.pointerId;


        canvas.setPointerCapture(
            event.pointerId
        );


        const furnitureHit =
            hitFurniture(point);


        if (furnitureHit) {

            beginAction();


            selectedFurniture =
                furnitureHit;


            selectedRoom = null;


            isDraggingFurniture =
                true;


            dragOffsetX =
                point.x -
                furnitureHit.x;


            dragOffsetY =
                point.y -
                furnitureHit.y;


            redraw();

            return;

        }


        const roomHit =
            hitRoom(point);


        if (!roomHit) {

            selectedRoom = null;

            selectedFurniture = null;

            redraw();

            return;

        }


        const handle =
            hitResizeHandle(
                point,
                roomHit
            );


        beginAction();


        selectedRoom =
            roomHit;


        selectedFurniture = null;


        if (handle) {

            isResizingRoom =
                true;

            activeResizeHandle =
                handle;

        } else {

            isDraggingRoom =
                true;


            dragOffsetX =
                point.x -
                roomHit.x;


            dragOffsetY =
                point.y -
                roomHit.y;

        }


        redraw();

    }
);


/* =========================================================
   CANVAS POINTER MOVE
========================================================= */

canvas.addEventListener(
    "pointermove",
    event => {

        if (
            event.pointerId !==
            activePointerId
        ) {
            return;
        }


        const point =
            canvasPoint(event);


        if (
            isDraggingRoom &&
            selectedRoom
        ) {

            selectedRoom.x =
                clamp(
                    point.x -
                        dragOffsetX,

                    0,

                    floor.width -
                        selectedRoom.width
                );


            selectedRoom.y =
                clamp(
                    point.y -
                        dragOffsetY,

                    0,

                    floor.height -
                        selectedRoom.height
                );


            roomInvalid =
                !layoutIsValid();


            redraw();

            return;

        }


        if (
            isDraggingFurniture &&
            selectedFurniture
        ) {

            selectedFurniture.x =
                clamp(
                    point.x -
                        dragOffsetX,

                    0,

                    Math.max(
                        0,
                        floor.width -
                            selectedFurniture.width
                    )
                );


            selectedFurniture.y =
                clamp(
                    point.y -
                        dragOffsetY,

                    0,

                    Math.max(
                        0,
                        floor.height -
                            selectedFurniture.height
                    )
                );


            redraw();

            return;

        }


        if (
            isResizingRoom &&
            selectedRoom
        ) {

            resizeRoomFromHandle(
                selectedRoom,
                activeResizeHandle,
                point
            );


            roomInvalid =
                !layoutIsValid();


            redraw();

        }

    }
);


/* =========================================================
   POINTER UP
========================================================= */

canvas.addEventListener(
    "pointerup",
    finishPointerAction
);


canvas.addEventListener(
    "pointercancel",
    finishPointerAction
);


function finishPointerAction(event) {

    if (
        event.pointerId !==
        activePointerId
    ) {
        return;
    }


    isDraggingRoom = false;

    isDraggingFurniture = false;

    isResizingRoom = false;


    activeResizeHandle = null;

    activePointerId = null;


    if (actionStartSnapshot) {

        if (layoutIsValid()) {
            roomInvalid = false;
        }

        commitAction();

    }


    updateFurnitureCount();

    updateDesignerUI();

}


/* =========================================================
   RESIZE ROOM
========================================================= */

function resizeRoomFromHandle(
    room,
    handle,
    point
) {

    const right =
        room.x +
        room.width;


    const bottom =
        room.y +
        room.height;


    if (
        handle.includes("e")
    ) {

        room.width =
            Math.max(
                MIN_ROOM_SIZE,
                point.x -
                    room.x
            );

    }


    if (
        handle.includes("s")
    ) {

        room.height =
            Math.max(
                MIN_ROOM_SIZE,
                point.y -
                    room.y
            );

    }


    if (
        handle.includes("w")
    ) {

        const newX =
            Math.min(
                point.x,
                right -
                    MIN_ROOM_SIZE
            );


        room.x =
            clamp(
                newX,
                0,
                floor.width -
                    MIN_ROOM_SIZE
            );


        room.width =
            right -
            room.x;

    }


    if (
        handle.includes("n")
    ) {

        const newY =
            Math.min(
                point.y,
                bottom -
                    MIN_ROOM_SIZE
            );


        room.y =
            clamp(
                newY,
                0,
                floor.height -
                    MIN_ROOM_SIZE
            );


        room.height =
            bottom -
            room.y;

    }


    room.width =
        Math.min(
            room.width,
            floor.width -
                room.x
        );


    room.height =
        Math.min(
            room.height,
            floor.height -
                room.y
        );

}


/* =========================================================
   CLAMP
========================================================= */

function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );

}


/* =========================================================
   ADD FURNITURE
========================================================= */

function addFurniture(
    type,
    x = null,
    y = null
) {

    const def =
        furnitureDefinitions[type];


    if (!def) {
        return;
    }


    const item = {

        id:
            `furniture-${Date.now()}-${Math.random()
                .toString(16)
                .slice(2)}`,

        type,

        icon:
            def.icon,

        x:
            x ??
            Math.max(
                0,
                floor.width / 2 -
                    def.width / 2
            ),

        y:
            y ??
            Math.max(
                0,
                floor.height / 2 -
                    def.height / 2
            ),

        width:
            def.width,

        height:
            def.height,

        rotation: 0

    };


    item.x =
        clamp(
            item.x,
            0,
            Math.max(
                0,
                floor.width -
                    item.width
            )
        );


    item.y =
        clamp(
            item.y,
            0,
            Math.max(
                0,
                floor.height -
                    item.height
            )
        );


    furniture.push(item);


    selectedFurniture =
        item;

    selectedRoom = null;


    updateFurnitureCount();

    redraw();

}


/* =========================================================
   FURNITURE COUNT
========================================================= */

function updateFurnitureCount() {

    designerFurnitureCount.textContent =
        furniture.length;

}


/* =========================================================
   FURNITURE CONTROLS
========================================================= */

function updateFurnitureControls() {

    furnitureControls.classList.toggle(
        "hidden",
        !selectedFurniture
    );

}


/* =========================================================
   FURNITURE PALETTE
========================================================= */

document
    .querySelectorAll(
        ".furniture-item"
    )
    .forEach(item => {

        item.addEventListener(
            "click",
            () => {

                beginAction();

                addFurniture(
                    item.dataset.type
                );

                commitAction();

            }
        );


        item.addEventListener(
            "dragstart",
            event => {

                paletteDragType =
                    item.dataset.type;


                event.dataTransfer.setData(
                    "text/plain",
                    paletteDragType
                );

            }
        );

    });


/* =========================================================
   DRAG FURNITURE ON CANVAS
========================================================= */

canvas.addEventListener(
    "dragover",
    event => {

        event.preventDefault();

    }
);


canvas.addEventListener(
    "drop",
    event => {

        event.preventDefault();


        const type =
            event.dataTransfer
                .getData(
                    "text/plain"
                ) ||
            paletteDragType;


        if (!type) {
            return;
        }


        const point =
            canvasPoint(event);


        beginAction();


        addFurniture(
            type,
            point.x,
            point.y
        );


        commitAction();


        paletteDragType = null;

    }
);


/* =========================================================
   ROTATE FURNITURE
========================================================= */

rotateFurnitureBtn.addEventListener(
    "click",
    () => {

        if (!selectedFurniture) {
            return;
        }


        beginAction();


        const oldWidth =
            selectedFurniture.width;


        selectedFurniture.width =
            selectedFurniture.height;


        selectedFurniture.height =
            oldWidth;


        selectedFurniture.rotation =
            (
                selectedFurniture.rotation +
                90
            ) % 360;


        selectedFurniture.x =
            clamp(
                selectedFurniture.x,
                0,
                Math.max(
                    0,
                    floor.width -
                        selectedFurniture.width
                )
            );


        selectedFurniture.y =
            clamp(
                selectedFurniture.y,
                0,
                Math.max(
                    0,
                    floor.height -
                        selectedFurniture.height
                )
            );


        commitAction();


        redraw();

    }
);


/* =========================================================
   DELETE FURNITURE
========================================================= */

deleteFurnitureBtn.addEventListener(
    "click",
    () => {

        if (!selectedFurniture) {
            return;
        }


        beginAction();


        furniture =
            furniture.filter(
                item =>
                    item !==
                    selectedFurniture
            );


        selectedFurniture = null;


        commitAction();


        updateFurnitureCount();

        redraw();

    }
);


/* =========================================================
   REGENERATE
========================================================= */

regenerateBtn.addEventListener(
    "click",
    () => {

        if (!rooms.length) {
            return;
        }


        beginAction();


        rooms =
            autoArrangeRooms(
                rooms.map(
                    room => ({
                        ...room
                    })
                )
            );


        roomInvalid =
            !layoutIsValid();


        commitAction();


        updateDesignerUI();

    }
);


/* =========================================================
   EDIT DIMENSIONS
========================================================= */

editDimensionsBtn.addEventListener(
    "click",
    () => {

        roomSection.classList.remove(
            "hidden"
        );


        designerSection.classList.add(
            "hidden"
        );


        threeDSection.classList.add(
            "hidden"
        );


        createRoomInputs(
            rooms.length
        );


        document
            .querySelectorAll(
                ".room-name"
            )
            .forEach(
                (input, i) => {

                    input.value =
                        rooms[i].name;

                }
            );


        document
            .querySelectorAll(
                ".room-width"
            )
            .forEach(
                (input, i) => {

                    input.value =
                        rooms[i].width;

                }
            );


        document
            .querySelectorAll(
                ".room-height"
            )
            .forEach(
                (input, i) => {

                    input.value =
                        rooms[i].height;

                }
            );

    }
);


/* =========================================================
   BUILD LAYOUT DATA
========================================================= */

function buildLayoutData() {

    return {

        version: 3,

        project:
            "PlanCraft",

        coordinateSystem: {

            origin:
                "top-left",

            xAxis:
                "right",

            yAxis:
                "down",

            unit:
                "ft"

        },


        floor: {

            width:
                floor.width,

            height:
                floor.height,

            unit:
                "ft",

            wallHeight:
                WALL_HEIGHT,

            wallThickness:
                WALL_THICKNESS

        },


        rooms:
            rooms.map(
                room => ({

                    id:
                        room.id,

                    name:
                        room.name,

                    x:
                        room.x,

                    y:
                        room.y,

                    width:
                        room.width,

                    height:
                        room.height,

                    color:
                        room.color

                })
            ),


        furniture:
            furniture.map(
                item => ({

                    id:
                        item.id,

                    type:
                        item.type,

                    x:
                        item.x,

                    y:
                        item.y,

                    width:
                        item.width,

                    height:
                        item.height,

                    rotation:
                        item.rotation

                })
            )

    };

}


/* =========================================================
   SAVE
========================================================= */

saveBtn.addEventListener(
    "click",
    () => {

        if (!rooms.length) {

            alert(
                "Create a floor plan before saving."
            );

            return;

        }


        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(
                buildLayoutData()
            )

        );


        alert(
            "Plan saved successfully."
        );

    }
);


/* =========================================================
   LOAD
========================================================= */

loadBtn.addEventListener(
    "click",
    () => {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!saved) {

            alert(
                "No saved PlanCraft plan found."
            );

            return;

        }


        try {

            const data =
                JSON.parse(saved);


            if (
                !data.floor ||
                !Array.isArray(
                    data.rooms
                )
            ) {

                throw new Error(
                    "Invalid plan"
                );

            }


            floor = {

                width:
                    Number(
                        data.floor.width
                    ),

                height:
                    Number(
                        data.floor.height
                    )

            };


            rooms =
                data.rooms.map(
                    (room, i) => ({

                        ...room,

                        color:
                            room.color ||
                            roomColors[
                                i %
                                roomColors.length
                            ]

                    })
                );


            furniture =
                Array.isArray(
                    data.furniture
                )

                    ? data.furniture.map(
                        item => ({

                            ...item,

                            icon:
                                furnitureDefinitions[
                                    item.type
                                ]?.icon ||
                                "■"

                        })
                    )

                    : [];


            floorWidthInput.value =
                floor.width;


            floorHeightInput.value =
                floor.height;


            roomCountInput.value =
                rooms.length;


            openDesigner();


            alert(
                "Plan loaded successfully."
            );

        }

        catch {

            alert(
                "Saved plan could not be loaded."
            );

        }

    }
);


/* =========================================================
   EXPORT JSON
========================================================= */

exportJsonBtn.addEventListener(
    "click",
    () => {

        if (
            !rooms.length ||
            !layoutIsValid()
        ) {

            alert(
                "Fix the layout before exporting."
            );

            return;

        }


        const blob =
            new Blob(

                [
                    JSON.stringify(
                        buildLayoutData(),
                        null,
                        2
                    )
                ],

                {
                    type:
                        "application/json"
                }

            );


        downloadBlob(
            blob,
            "plancraft-layout.json"
        );

    }
);


/* =========================================================
   EXPORT PNG
========================================================= */

exportPngBtn.addEventListener(
    "click",
    () => {

        if (
            !rooms.length ||
            !layoutIsValid()
        ) {

            alert(
                "Fix the layout before exporting."
            );

            return;

        }


        const previousRoom =
            selectedRoom;


        const previousFurniture =
            selectedFurniture;


        selectedRoom = null;

        selectedFurniture = null;


        redraw();


        canvas.toBlob(
            blob => {

                if (blob) {

                    downloadBlob(
                        blob,
                        "plancraft-floor-plan.png"
                    );

                }


                selectedRoom =
                    previousRoom;


                selectedFurniture =
                    previousFurniture;


                redraw();

            },

            "image/png"
        );

    }
);


/* =========================================================
   DOWNLOAD
========================================================= */

function downloadBlob(
    blob,
    filename
) {

    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        filename;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    setTimeout(
        () =>
            URL.revokeObjectURL(url),
        1000
    );

}


/* =========================================================
   =========================================================
   2D → 3D
   =========================================================
   ========================================================= */

let threeScene = null;
let threeCamera = null;
let threeRenderer = null;
let threeControls = null;
let threeModelGroup = null;
let threeResizeObserver = null;


/* =========================================================
   3D OPEN
========================================================= */

function open3DView(layoutData) {

    if (
        !layoutData ||
        !layoutData.rooms.length
    ) {
        return;
    }


    designerSection.classList.add(
        "hidden"
    );


    setupSection.classList.add(
        "hidden"
    );


    roomSection.classList.add(
        "hidden"
    );


    threeDSection.classList.remove(
        "hidden"
    );


    threeDFloorSize.textContent =
        `${layoutData.floor.width} × ` +
        `${layoutData.floor.height} ft`;


    threeDRoomCount.textContent =
        layoutData.rooms.length;


    threeDFurnitureCount.textContent =
        layoutData.furniture.length;


    requestAnimationFrame(
        () => {

            init3DScene();

            build3DModel(
                layoutData
            );

        }
    );

}


/* =========================================================
   INITIALIZE THREE.JS
========================================================= */

function init3DScene() {

    if (threeScene) {

        resize3D();

        return;

    }


    threeScene =
        new THREE.Scene();


    threeScene.background =
        new THREE.Color(
            0xdbeafe
        );


    threeCamera =
        new THREE.PerspectiveCamera(
            45,
            1,
            0.1,
            5000
        );


    threeRenderer =
        new THREE.WebGLRenderer({

            antialias: true,

            powerPreference:
                "high-performance"

        });


    threeRenderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
    );


    threeRenderer.shadowMap.enabled =
        true;


    threeRenderer.shadowMap.type =
        THREE.PCFSoftShadowMap;


    threeDContainer.innerHTML =
        "";


    threeDContainer.appendChild(
        threeRenderer.domElement
    );


    threeControls =
        new OrbitControls(

            threeCamera,

            threeRenderer.domElement

        );


    threeControls.enableDamping =
        true;


    threeControls.dampingFactor =
        0.06;


    threeControls.minDistance =
        5;


    threeControls.maxDistance =
        250;


    threeControls.maxPolarAngle =
        Math.PI / 2.05;


    /* ---------- LIGHTING ---------- */

    const ambient =
        new THREE.HemisphereLight(

            0xffffff,

            0x667085,

            2.0

        );


    threeScene.add(
        ambient
    );


    const directional =
        new THREE.DirectionalLight(
            0xffffff,
            2.5
        );


    directional.position.set(
        20,
        40,
        20
    );


    directional.castShadow =
        true;


    directional.shadow.mapSize.set(
        2048,
        2048
    );


    threeScene.add(
        directional
    );


    /* ---------- GROUND ---------- */

    const ground =
        new THREE.Mesh(

            new THREE.PlaneGeometry(
                1000,
                1000
            ),

            new THREE.MeshStandardMaterial({

                color:
                    0xcbd5e1,

                roughness:
                    1

            })

        );


    ground.rotation.x =
        -Math.PI / 2;


    ground.position.y =
        -0.03;


    ground.receiveShadow =
        true;


    threeScene.add(
        ground
    );


    /* ---------- RESIZE ---------- */

    threeResizeObserver =
        new ResizeObserver(
            resize3D
        );


    threeResizeObserver.observe(
        threeDContainer
    );


    window.addEventListener(
        "resize",
        resize3D
    );


    animate3D();

}


/* =========================================================
   RESIZE 3D
========================================================= */

function resize3D() {

    if (
        !threeRenderer ||
        !threeCamera
    ) {
        return;
    }


    const width =
        Math.max(
            1,
            threeDContainer.clientWidth
        );


    const height =
        Math.max(
            1,
            threeDContainer.clientHeight
        );


    threeRenderer.setSize(
        width,
        height,
        false
    );


    threeCamera.aspect =
        width / height;


    threeCamera.updateProjectionMatrix();

}


/* =========================================================
   CLEAR OLD MODEL
========================================================= */

function clear3DModel() {

    if (!threeModelGroup) {
        return;
    }


    threeScene.remove(
        threeModelGroup
    );


    threeModelGroup.traverse(
        object => {

            if (object.geometry) {

                object.geometry.dispose();

            }


            if (object.material) {

                if (
                    Array.isArray(
                        object.material
                    )
                ) {

                    object.material.forEach(
                        material =>
                            material.dispose()
                    );

                }

                else {

                    object.material.dispose();

                }

            }

        }
    );


    threeModelGroup = null;

}


/* =========================================================
   BUILD 3D MODEL
========================================================= */

function build3DModel(data) {

    if (!threeScene) {
        return;
    }


    clear3DModel();


    threeModelGroup =
        new THREE.Group();


    threeScene.add(
        threeModelGroup
    );


    const width =
        data.floor.width;


    const depth =
        data.floor.height;


    const wallHeight =
        data.floor.wallHeight ||
        WALL_HEIGHT;


    const wallThickness =
        data.floor.wallThickness ||
        WALL_THICKNESS;


    /*
       2D origin is top-left.

       3D uses:

       X = left/right
       Y = up/down
       Z = front/back
    */


    const originX =
        -width / 2;


    const originZ =
        -depth / 2;


    /* =====================================================
       FLOOR
    ===================================================== */

    const floorMesh =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                width,
                0.25,
                depth
            ),

            new THREE.MeshStandardMaterial({

                color:
                    0xe5e7eb,

                roughness:
                    0.85

            })

        );


    floorMesh.position.set(
        0,
        -0.15,
        0
    );


    floorMesh.receiveShadow =
        true;


    threeModelGroup.add(
        floorMesh
    );


    /* =====================================================
       ROOMS
    ===================================================== */

    data.rooms.forEach(
        (room, index) => {

            const color =
                room.color

                    ? new THREE.Color(
                        room.color
                    )

                    : new THREE.Color(
                        roomColors[
                            index %
                            roomColors.length
                        ]
                    );


            /* ---------- ROOM FLOOR ---------- */

            const centerX =
                originX +
                room.x +
                room.width / 2;


            const centerZ =
                originZ +
                room.y +
                room.height / 2;


            const roomFloor =
                new THREE.Mesh(

                    new THREE.BoxGeometry(

                        room.width,

                        0.12,

                        room.height

                    ),

                    new THREE.MeshStandardMaterial({

                        color,

                        roughness:
                            0.75

                    })

                );


            roomFloor.position.set(
                centerX,
                0,
                centerZ
            );


            roomFloor.receiveShadow =
                true;


            threeModelGroup.add(
                roomFloor
            );


            /* ---------- TOP WALL ---------- */

            addWall(

                centerX,

                wallHeight / 2,

                originZ +
                    room.y,

                room.width +
                    wallThickness,

                wallHeight,

                wallThickness

            );


            /* ---------- BOTTOM WALL ---------- */

            addWall(

                centerX,

                wallHeight / 2,

                originZ +
                    room.y +
                    room.height,

                room.width +
                    wallThickness,

                wallHeight,

                wallThickness

            );


            /* ---------- LEFT WALL ---------- */

            addWall(

                originX +
                    room.x,

                wallHeight / 2,

                centerZ,

                wallThickness,

                wallHeight,

                room.height +
                    wallThickness

            );


            /* ---------- RIGHT WALL ---------- */

            addWall(

                originX +
                    room.x +
                    room.width,

                wallHeight / 2,

                centerZ,

                wallThickness,

                wallHeight,

                room.height +
                    wallThickness

            );

        }
    );


    /* =====================================================
       FURNITURE
    ===================================================== */

    data.furniture.forEach(
        item => {

            add3DFurniture(
                item,
                originX,
                originZ
            );

        }
    );


    /* =====================================================
       OUTER WALLS
    ===================================================== */

    addWall(

        0,

        wallHeight / 2,

        originZ,

        width +
            wallThickness,

        wallHeight,

        wallThickness

    );


    addWall(

        0,

        wallHeight / 2,

        originZ +
            depth,

        width +
            wallThickness,

        wallHeight,

        wallThickness

    );


    addWall(

        originX,

        wallHeight / 2,

        0,

        wallThickness,

        wallHeight,

        depth

    );


    addWall(

        originX +
            width,

        wallHeight / 2,

        0,

        wallThickness,

        wallHeight,

        depth

    );


    frame3DModel(
        width,
        depth,
        wallHeight
    );

}


/* =========================================================
   ADD WALL
========================================================= */

function addWall(
    x,
    y,
    z,
    width,
    height,
    depth
) {

    const mesh =
        new THREE.Mesh(

            new THREE.BoxGeometry(

                width,

                height,

                depth

            ),

            new THREE.MeshStandardMaterial({

                color:
                    0xf8fafc,

                roughness:
                    0.82

            })

        );


    mesh.position.set(
        x,
        y,
        z
    );


    mesh.castShadow =
        true;


    mesh.receiveShadow =
        true;


    threeModelGroup.add(
        mesh
    );

}


/* =========================================================
   ADD 3D FURNITURE
========================================================= */

function add3DFurniture(
    item,
    originX,
    originZ
) {

    const def =
        furnitureDefinitions[
            item.type
        ];


    if (!def) {
        return;
    }


    const colorMap = {

        bed:
            0x8fb7df,

        sofa:
            0x9ca3af,

        table:
            0x9a7652,

        chair:
            0x7c5c43,

        dining:
            0x8b6b4d,

        toilet:
            0xe5e7eb,

        plant:
            0x72a36a

    };


    const baseColor =
        colorMap[
            item.type
        ] ||
        0x94a3b8;


    let height = 1.4;


    if (
        item.type === "bed"
    ) {
        height = 1.8;
    }


    if (
        item.type === "sofa"
    ) {
        height = 2.0;
    }


    if (
        item.type === "chair"
    ) {
        height = 2.2;
    }


    if (
        item.type === "plant"
    ) {
        height = 3.0;
    }


    if (
        item.type === "toilet"
    ) {
        height = 1.7;
    }


    const centerX =
        originX +
        item.x +
        item.width / 2;


    const centerZ =
        originZ +
        item.y +
        item.height / 2;


    const mesh =
        new THREE.Mesh(

            new THREE.BoxGeometry(

                item.width,

                height,

                item.height

            ),

            new THREE.MeshStandardMaterial({

                color:
                    baseColor,

                roughness:
                    0.65

            })

        );


    mesh.position.set(

        centerX,

        height / 2 + 0.08,

        centerZ

    );


    mesh.rotation.y =
        THREE.MathUtils.degToRad(
            item.rotation || 0
        );


    mesh.castShadow =
        true;


    mesh.receiveShadow =
        true;


    threeModelGroup.add(
        mesh
    );

}


/* =========================================================
   FRAME CAMERA
========================================================= */

function frame3DModel(
    width,
    depth,
    wallHeight
) {

    const maxDimension =
        Math.max(
            width,
            depth
        );


    threeCamera.position.set(

        maxDimension * 0.95,

        Math.max(
            wallHeight * 1.35,
            maxDimension * 0.65
        ),

        maxDimension * 0.95

    );


    threeControls.target.set(

        0,

        wallHeight * 0.25,

        0

    );


    threeControls.minDistance =
        Math.max(
            5,
            maxDimension * 0.25
        );


    threeControls.maxDistance =
        Math.max(
            100,
            maxDimension * 5
        );


    threeControls.update();

}


/* =========================================================
   3D ANIMATION
========================================================= */

function animate3D() {

    requestAnimationFrame(
        animate3D
    );


    if (
        !threeRenderer ||
        !threeScene ||
        !threeCamera
    ) {
        return;
    }


    if (threeControls) {

        threeControls.update();

    }


    threeRenderer.render(
        threeScene,
        threeCamera
    );

}


/* =========================================================
   TOP VIEW
========================================================= */

function setTopView() {

    if (
        !threeCamera ||
        !threeControls ||
        !threeModelGroup
    ) {
        return;
    }


    const box =
        new THREE.Box3()
            .setFromObject(
                threeModelGroup
            );


    const size =
        box.getSize(
            new THREE.Vector3()
        );


    const maxDimension =
        Math.max(
            size.x,
            size.z
        );


    threeCamera.position.set(

        0,

        maxDimension * 1.25,

        0.01

    );


    threeControls.target.set(
        0,
        0,
        0
    );


    threeControls.update();

}


/* =========================================================
   PERSPECTIVE VIEW
========================================================= */

function setPerspectiveView() {

    if (
        !threeCamera ||
        !threeControls ||
        !threeModelGroup
    ) {
        return;
    }


    const box =
        new THREE.Box3()
            .setFromObject(
                threeModelGroup
            );


    const size =
        box.getSize(
            new THREE.Vector3()
        );


    const maxDimension =
        Math.max(
            size.x,
            size.z
        );


    threeCamera.position.set(

        maxDimension * 0.9,

        maxDimension * 0.65,

        maxDimension * 0.9

    );


    threeControls.target.set(
        0,
        0,
        0
    );


    threeControls.update();

}


/* =========================================================
   FINALIZE 2D → 3D
========================================================= */

finalizeBtn.addEventListener(
    "click",
    () => {

        if (!layoutIsValid()) {

            alert(
                "Fix overlapping/out-of-floor rooms before converting to 3D."
            );

            return;

        }


        const layoutData =
            buildLayoutData();


        console.log(
            "Final 2D Layout:",
            layoutData
        );


        open3DView(
            layoutData
        );

    }
);


/* =========================================================
   BACK TO 2D
========================================================= */

backTo2DBtn.addEventListener(
    "click",
    () => {

        threeDSection.classList.add(
            "hidden"
        );


        designerSection.classList.remove(
            "hidden"
        );


        setTimeout(
            resizeCanvas,
            50
        );

    }
);


/* =========================================================
   RESET 3D CAMERA
========================================================= */

reset3DCameraBtn.addEventListener(
    "click",
    () => {

        if (
            !threeModelGroup
        ) {
            return;
        }


        const box =
            new THREE.Box3()
                .setFromObject(
                    threeModelGroup
                );


        const size =
            box.getSize(
                new THREE.Vector3()
            );


        const maxDimension =
            Math.max(
                size.x,
                size.z
            );


        threeCamera.position.set(

            maxDimension * 0.95,

            Math.max(
                WALL_HEIGHT * 1.35,
                maxDimension * 0.65
            ),

            maxDimension * 0.95

        );


        threeControls.target.set(

            0,

            WALL_HEIGHT * 0.25,

            0

        );


        threeControls.update();

    }
);


/* =========================================================
   3D BUTTONS
========================================================= */

topView3DBtn.addEventListener(
    "click",
    setTopView
);


perspective3DBtn.addEventListener(
    "click",
    setPerspectiveView
);


/* =========================================================
   RESET PROJECT
========================================================= */

resetBtn.addEventListener(
    "click",
    () => {

        if (
            !confirm(
                "Start a new floor plan?"
            )
        ) {
            return;
        }


        floor = {

            width: 40,

            height: 30

        };


        rooms = [];

        furniture = [];


        selectedRoom = null;

        selectedFurniture = null;


        roomInvalid = false;


        floorWidthInput.value =
            40;


        floorHeightInput.value =
            30;


        roomCountInput.value =
            4;


        finalizeBtn.disabled =
            true;


        exportJsonBtn.disabled =
            true;


        exportPngBtn.disabled =
            true;


        threeDSection.classList.add(
            "hidden"
        );


        designerSection.classList.add(
            "hidden"
        );


        roomSection.classList.add(
            "hidden"
        );


        setupSection.classList.remove(
            "hidden"
        );


        setupError.textContent =
            "";


        roomError.textContent =
            "";


        undoStack.length = 0;

        redoStack.length = 0;


        updateHistoryButtons();

    }
);


/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        const active =
            document.activeElement;


        const typing =

            active &&

            (
                active.tagName ===
                    "INPUT" ||

                active.tagName ===
                    "TEXTAREA"
            );


        if (typing) {
            return;
        }


        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "z"
        ) {

            event.preventDefault();

            undo();

        }


        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "y"
        ) {

            event.preventDefault();

            redo();

        }


        if (
            event.key === "Delete" &&
            selectedFurniture
        ) {

            deleteFurnitureBtn.click();

        }

    }
);


/* =========================================================
   WINDOW RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        if (
            !designerSection.classList.contains(
                "hidden"
            )
        ) {

            resizeCanvas();

        }

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

updateHistoryButtons();

updateFurnitureControls();