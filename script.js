const setupSection =
    document.getElementById("setupSection");

const roomSection =
    document.getElementById("roomSection");

const designerSection =
    document.getElementById("designerSection");

const floorWidthInput =
    document.getElementById("floorWidth");

const floorHeightInput =
    document.getElementById("floorHeight");

const roomCountInput =
    document.getElementById("roomCount");

const continueBtn =
    document.getElementById("continueBtn");

const backBtn =
    document.getElementById("backBtn");

const generateBtn =
    document.getElementById("generateBtn");

const resetBtn =
    document.getElementById("resetBtn");

const finalizeBtn =
    document.getElementById("finalizeBtn");

const undoBtn =
    document.getElementById("undoBtn");

const redoBtn =
    document.getElementById("redoBtn");

const saveBtn =
    document.getElementById("saveBtn");

const loadBtn =
    document.getElementById("loadBtn");

const exportJsonBtn =
    document.getElementById("exportJsonBtn");

const exportPngBtn =
    document.getElementById("exportPngBtn");

const regenerateBtn =
    document.getElementById("regenerateBtn");

const editDimensionsBtn =
    document.getElementById("editDimensionsBtn");

const roomInputsContainer =
    document.getElementById("roomInputs");

const setupError =
    document.getElementById("setupError");

const roomError =
    document.getElementById("roomError");

const floorSummary =
    document.getElementById("floorSummary");

const designerFloorSize =
    document.getElementById("designerFloorSize");

const designerRoomCount =
    document.getElementById("designerRoomCount");

const designerFurnitureCount =
    document.getElementById("designerFurnitureCount");

const roomList =
    document.getElementById("roomList");

const selectedName =
    document.getElementById("selectedName");

const selectedRoomInfo =
    document.getElementById("selectedRoomInfo");

const scaleInfo =
    document.getElementById("scaleInfo");

const canvas =
    document.getElementById("floorCanvas");

const ctx =
    canvas.getContext("2d");

const furnitureControls =
    document.getElementById("furnitureControls");

const rotateFurnitureBtn =
    document.getElementById("rotateFurnitureBtn");

const deleteFurnitureBtn =
    document.getElementById("deleteFurnitureBtn");


/* =========================================
   CONSTANTS
========================================= */

const STORAGE_KEY =
    "plancraft-v2-floor-plan";

const WALL_HEIGHT =
    9;

const WALL_THICKNESS =
    0.5;

const MIN_ROOM_SIZE =
    2;

const CANVAS_PADDING =
    30;

const MAX_HISTORY =
    60;


/* =========================================
   STATE
========================================= */

let floor = {
    width: 40,
    height: 30
};

let rooms = [];

let furniture = [];

let selectedRoom =
    null;

let selectedFurniture =
    null;

let isDraggingRoom =
    false;

let isResizingRoom =
    false;

let isDraggingFurniture =
    false;

let activeResizeHandle =
    null;

let activePointerId =
    null;

let dragOffsetX =
    0;

let dragOffsetY =
    0;

let pixelsPerFoot =
    10;

let lastValidRoomState =
    null;

let roomInvalid =
    false;

let paletteDragType =
    null;

let actionStartSnapshot =
    null;


/* =========================================
   FURNITURE DEFINITIONS
========================================= */

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


/* =========================================
   UNDO / REDO
========================================= */

const undoStack = [];
const redoStack = [];


function createSnapshot() {

    return JSON.stringify({
        floor,
        rooms,
        furniture
    });
}


function restoreSnapshot(snapshot) {

    const data =
        JSON.parse(snapshot);

    floor = {
        ...data.floor
    };

    rooms =
        Array.isArray(data.rooms)
            ? data.rooms.map(
                room => ({
                    ...room
                })
            )
            : [];

    furniture =
        Array.isArray(data.furniture)
            ? data.furniture.map(
                item => ({
                    ...item
                })
            )
            : [];

    selectedRoom =
        null;

    selectedFurniture =
        null;

    roomInvalid =
        false;

    floorWidthInput.value =
        floor.width;

    floorHeightInput.value =
        floor.height;

    roomCountInput.value =
        rooms.length || 1;

    updateDesignerUI();

    if (
        !designerSection.classList.contains(
            "hidden"
        )
    ) {

        setTimeout(
            resizeCanvas,
            20
        );
    }
}


function pushHistory(snapshot) {

    if (!snapshot) {
        return;
    }

    const current =
        createSnapshot();

    if (
        snapshot ===
        current
    ) {
        return;
    }

    if (
        undoStack.length &&
        undoStack[
            undoStack.length - 1
        ] === snapshot
    ) {
        return;
    }

    undoStack.push(
        snapshot
    );

    if (
        undoStack.length >
        MAX_HISTORY
    ) {

        undoStack.shift();
    }

    redoStack.length =
        0;

    updateHistoryButtons();
}


function beginAction() {

    actionStartSnapshot =
        createSnapshot();
}


function commitAction() {

    if (
        !actionStartSnapshot
    ) {
        return;
    }

    pushHistory(
        actionStartSnapshot
    );

    actionStartSnapshot =
        null;
}


function cancelAction() {

    actionStartSnapshot =
        null;
}


function undo() {

    if (!undoStack.length) {
        return;
    }

    redoStack.push(
        createSnapshot()
    );

    restoreSnapshot(
        undoStack.pop()
    );

    updateHistoryButtons();
}


function redo() {

    if (!redoStack.length) {
        return;
    }

    undoStack.push(
        createSnapshot()
    );

    restoreSnapshot(
        redoStack.pop()
    );

    updateHistoryButtons();
}


function updateHistoryButtons() {

    undoBtn.disabled =
        undoStack.length === 0;

    redoBtn.disabled =
        redoStack.length === 0;
}


undoBtn.addEventListener(
    "click",
    undo
);

redoBtn.addEventListener(
    "click",
    redo
);


/* =========================================
   STEP 1
========================================= */

continueBtn.addEventListener(
    "click",
    () => {

        setupError.textContent =
            "";

        const width =
            Number(
                floorWidthInput.value
            );

        const height =
            Number(
                floorHeightInput.value
            );

        const count =
            Number(
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

        floor.width =
            width;

        floor.height =
            height;

        createRoomInputs(
            count
        );

        floorSummary.textContent =
            `${width} ft × ${height} ft`;

        setupSection.classList.add(
            "hidden"
        );

        roomSection.classList.remove(
            "hidden"
        );
    }
);


/* =========================================
   ROOM INPUTS
========================================= */

function createRoomInputs(count) {

    roomInputsContainer.innerHTML =
        "";

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
        15, 12, 10, 8,
        12, 11, 9, 10,
        7, 6, 8, 8
    ];

    const heights = [
        12, 10, 8, 6,
        10, 10, 8, 9,
        6, 6, 6, 8
    ];

    for (
        let i = 0;
        i < count;
        i++
    ) {

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "room-input-row";

        row.innerHTML = `

            <div class="room-number">
                ${i + 1}.
            </div>

            <div class="form-group room-name-group">
                <label>Room Name</label>

                <input
                    class="room-name"
                    type="text"
                    value="${names[i] || `Room ${i + 1}`}"
                >
            </div>

            <div class="form-group room-width-group">
                <label>Width (ft)</label>

                <input
                    class="room-width"
                    type="number"
                    min="2"
                    value="${widths[i] || 8}"
                >
            </div>

            <div class="form-group room-height-group">
                <label>Height (ft)</label>

                <input
                    class="room-height"
                    type="number"
                    min="2"
                    value="${heights[i] || 8}"
                >
            </div>
        `;

        roomInputsContainer.appendChild(
            row
        );
    }
}


/* =========================================
   GENERATE
========================================= */

generateBtn.addEventListener(
    "click",
    generateLayout
);


function generateLayout() {

    roomError.textContent =
        "";

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

    const newRooms =
        [];

    let totalArea =
        0;

    for (
        let i = 0;
        i < names.length;
        i++
    ) {

        const name =
            names[i].value.trim();

        const width =
            Number(
                widths[i].value
            );

        const height =
            Number(
                heights[i].value
            );

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

        if (
            width > floor.width ||
            height > floor.height
        ) {

            roomError.textContent =
                `${name} is larger than the floor.`;

            return;
        }

        totalArea +=
            width * height;

        newRooms.push({

            id:
                createId(),

            name,

            width,
            height,

            x: 0,
            y: 0
        });
    }

    if (
        totalArea >
        floor.width *
        floor.height
    ) {

        roomError.textContent =
            "The total room area is larger than the floor area.";

        return;
    }

    const before =
        createSnapshot();

    rooms =
        newRooms;

    furniture =
        [];

    if (!arrangeRooms()) {

        rooms =
            [];

        roomError.textContent =
            "Unable to fit all rooms inside this floor.";

        return;
    }

    pushHistory(
        before
    );

    openDesigner();
}


/* =========================================
   AUTO LAYOUT
========================================= */

function arrangeRooms() {

    if (!rooms.length) {
        return true;
    }

    const sorted =
        [...rooms].sort(
            (a, b) =>
                b.width * b.height -
                a.width * a.height
        );

    const placed =
        [];

    for (
        let i = 0;
        i < sorted.length;
        i++
    ) {

        const room =
            sorted[i];

        if (i === 0) {

            room.x =
                0;

            room.y =
                0;

            placed.push(
                room
            );

            continue;
        }

        const candidates =
            [];

        const xPositions =
            new Set([0]);

        const yPositions =
            new Set([0]);

        placed.forEach(
            p => {

                xPositions.add(
                    p.x
                );

                xPositions.add(
                    p.x +
                    p.width
                );

                xPositions.add(
                    p.x +
                    p.width -
                    room.width
                );

                yPositions.add(
                    p.y
                );

                yPositions.add(
                    p.y +
                    p.height
                );

                yPositions.add(
                    p.y +
                    p.height -
                    room.height
                );
            }
        );

        xPositions.forEach(
            x => {

                yPositions.forEach(
                    y => {

                        candidates.push({

                            x:
                                Math.round(x),

                            y:
                                Math.round(y)
                        });
                    }
                );
            }
        );

        let best =
            null;

        let bestScore =
            Infinity;

        for (
            const candidate
            of candidates
        ) {

            const test = {
                ...room,
                x:
                    candidate.x,
                y:
                    candidate.y
            };

            if (
                !roomInsideFloor(
                    test
                )
            ) {
                continue;
            }

            if (
                placed.some(
                    p =>
                        roomsOverlap(
                            test,
                            p
                        )
                )
            ) {
                continue;
            }

            let maxRight =
                test.x +
                test.width;

            let maxBottom =
                test.y +
                test.height;

            let sharedEdge =
                0;

            for (
                const p
                of placed
            ) {

                maxRight =
                    Math.max(
                        maxRight,
                        p.x +
                        p.width
                    );

                maxBottom =
                    Math.max(
                        maxBottom,
                        p.y +
                        p.height
                    );

                sharedEdge +=
                    calculateSharedEdge(
                        test,
                        p
                    );
            }

            const boundingArea =
                maxRight *
                maxBottom;

            const score =
                boundingArea * 10 +
                candidate.x +
                candidate.y -
                sharedEdge * 30;

            if (
                score <
                bestScore
            ) {

                bestScore =
                    score;

                best =
                    candidate;
            }
        }

        if (!best) {

            best =
                exhaustivePositionSearch(
                    room,
                    placed
                );
        }

        if (!best) {
            return false;
        }

        room.x =
            best.x;

        room.y =
            best.y;

        placed.push(
            room
        );
    }

    return true;
}


function exhaustivePositionSearch(
    room,
    placed
) {

    let best =
        null;

    let bestScore =
        Infinity;

    for (
        let y = 0;
        y <=
        floor.height -
        room.height;
        y++
    ) {

        for (
            let x = 0;
            x <=
            floor.width -
            room.width;
            x++
        ) {

            const test = {
                ...room,
                x,
                y
            };

            if (
                placed.some(
                    p =>
                        roomsOverlap(
                            test,
                            p
                        )
                )
            ) {
                continue;
            }

            let maxRight =
                test.x +
                test.width;

            let maxBottom =
                test.y +
                test.height;

            placed.forEach(
                p => {

                    maxRight =
                        Math.max(
                            maxRight,
                            p.x +
                            p.width
                        );

                    maxBottom =
                        Math.max(
                            maxBottom,
                            p.y +
                            p.height
                        );
                }
            );

            const score =
                maxRight *
                maxBottom +
                x +
                y;

            if (
                score <
                bestScore
            ) {

                bestScore =
                    score;

                best = {
                    x,
                    y
                };
            }
        }
    }

    return best;
}


function calculateSharedEdge(
    a,
    b
) {

    let total =
        0;

    if (
        a.x + a.width === b.x ||
        b.x + b.width === a.x
    ) {

        total +=
            Math.max(
                0,

                Math.min(
                    a.y +
                    a.height,

                    b.y +
                    b.height
                ) -

                Math.max(
                    a.y,
                    b.y
                )
            );
    }

    if (
        a.y + a.height === b.y ||
        b.y + b.height === a.y
    ) {

        total +=
            Math.max(
                0,

                Math.min(
                    a.x +
                    a.width,

                    b.x +
                    b.width
                ) -

                Math.max(
                    a.x,
                    b.x
                )
            );
    }

    return total;
}


/* =========================================
   ROOM VALIDATION
========================================= */

function roomsOverlap(
    a,
    b
) {

    return !(
        a.x + a.width <= b.x ||
        b.x + b.width <= a.x ||
        a.y + a.height <= b.y ||
        b.y + b.height <= a.y
    );
}


function hasRoomOverlap(
    room
) {

    return rooms.some(
        other =>
            other !== room &&
            roomsOverlap(
                room,
                other
            )
    );
}


function roomInsideFloor(
    room
) {

    return (
        room.x >= 0 &&
        room.y >= 0 &&
        room.x +
        room.width <=
        floor.width &&
        room.y +
        room.height <=
        floor.height
    );
}


function layoutIsValid() {

    if (!rooms.length) {
        return false;
    }

    return !rooms.some(
        room =>
            hasRoomOverlap(
                room
            )
    );
}


/* =========================================
   DESIGNER
========================================= */

function openDesigner() {

    setupSection.classList.add(
        "hidden"
    );

    roomSection.classList.add(
        "hidden"
    );

    designerSection.classList.remove(
        "hidden"
    );

    finalizeBtn.disabled =
        false;

    selectedRoom =
        null;

    selectedFurniture =
        null;

    updateDesignerUI();

    setTimeout(
        resizeCanvas,
        50
    );
}


function updateDesignerUI() {

    designerFloorSize.textContent =
        `${floor.width} × ${floor.height} ft`;

    designerRoomCount.textContent =
        rooms.length;

    updateFurnitureCount();

    createRoomList();

    redraw();

    exportJsonBtn.disabled =
        rooms.length === 0;

    exportPngBtn.disabled =
        rooms.length === 0;
}


/* =========================================
   CANVAS
========================================= */

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


/* =========================================
   DRAW
========================================= */

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

        drawResizeHandles(
            selectedRoom
        );
    }

    if (
        selectedFurniture
    ) {

        drawFurnitureSelection(
            selectedFurniture
        );
    }

    updateSelectedInfo();
}


/* =========================================
   GRID
========================================= */

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

    ctx.lineWidth =
        1;

    for (
        let x = 0;
        x <= floor.width;
        x++
    ) {

        const px =
            x *
            pixelsPerFoot;

        ctx.beginPath();

        ctx.moveTo(
            px,
            0
        );

        ctx.lineTo(
            px,
            canvas.height
        );

        ctx.stroke();
    }

    for (
        let y = 0;
        y <= floor.height;
        y++
    ) {

        const py =
            y *
            pixelsPerFoot;

        ctx.beginPath();

        ctx.moveTo(
            0,
            py
        );

        ctx.lineTo(
            canvas.width,
            py
        );

        ctx.stroke();
    }

    ctx.strokeStyle =
        "#111827";

    ctx.lineWidth =
        4;

    ctx.strokeRect(
        1,
        1,
        canvas.width - 2,
        canvas.height - 2
    );
}


/* =========================================
   ROOMS
========================================= */

function drawRoom(room) {

    const x =
        room.x *
        pixelsPerFoot;

    const y =
        room.y *
        pixelsPerFoot;

    const width =
        room.width *
        pixelsPerFoot;

    const height =
        room.height *
        pixelsPerFoot;

    const invalid =
        room ===
        selectedRoom &&
        roomInvalid;

    ctx.fillStyle =
        invalid
            ? "rgba(239,68,68,0.28)"
            : getRoomColor(
                room
            );

    ctx.fillRect(
        x,
        y,
        width,
        height
    );

    ctx.strokeStyle =
        invalid
            ? "#dc2626"
            : "#1f2937";

    ctx.lineWidth =
        invalid
            ? 4
            : 2;

    ctx.strokeRect(
        x,
        y,
        width,
        height
    );

    ctx.save();

    ctx.beginPath();

    ctx.rect(
        x,
        y,
        width,
        height
    );

    ctx.clip();

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillStyle =
        invalid
            ? "#991b1b"
            : "#111827";

    ctx.font =
        "bold 13px Arial";

    ctx.fillText(
        room.name,
        x + width / 2,
        y + height / 2 - 7
    );

    ctx.fillStyle =
        invalid
            ? "#b91c1c"
            : "#4b5563";

    ctx.font =
        "10px Arial";

    ctx.fillText(
        `${room.width} × ${room.height} ft`,
        x + width / 2,
        y + height / 2 + 10
    );

    if (invalid) {

        ctx.fillStyle =
            "#991b1b";

        ctx.font =
            "bold 9px Arial";

        ctx.fillText(
            "INVALID PLACEMENT",
            x + width / 2,
            y + height - 12
        );
    }

    ctx.restore();
}


function getRoomColor(
    room
) {

    const colors = [
        "#dbeafe",
        "#dcfce7",
        "#fef3c7",
        "#fce7f3",
        "#ede9fe",
        "#cffafe",
        "#ffedd5",
        "#e0e7ff",
        "#fae8ff",
        "#ecfccb"
    ];

    const index =
        rooms.indexOf(
            room
        );

    return colors[
        index %
        colors.length
    ];
}


function drawRoomSelection(
    room
) {

    const x =
        room.x *
        pixelsPerFoot;

    const y =
        room.y *
        pixelsPerFoot;

    const width =
        room.width *
        pixelsPerFoot;

    const height =
        room.height *
        pixelsPerFoot;

    ctx.save();

    ctx.strokeStyle =
        roomInvalid
            ? "#dc2626"
            : "#2563eb";

    ctx.lineWidth =
        3;

    ctx.setLineDash([
        7,
        5
    ]);

    ctx.strokeRect(
        x + 3,
        y + 3,
        width - 6,
        height - 6
    );

    ctx.restore();
}


/* =========================================
   ROOM RESIZE
========================================= */

function getResizeHandles(
    room
) {

    const x =
        room.x *
        pixelsPerFoot;

    const y =
        room.y *
        pixelsPerFoot;

    const width =
        room.width *
        pixelsPerFoot;

    const height =
        room.height *
        pixelsPerFoot;

    return {

        nw: {
            x,
            y
        },

        ne: {
            x:
                x + width,
            y
        },

        sw: {
            x,
            y:
                y + height
        },

        se: {
            x:
                x + width,

            y:
                y + height
        }
    };
}


function drawResizeHandles(
    room
) {

    const handles =
        getResizeHandles(
            room
        );

    const size =
        12;

    Object.values(
        handles
    ).forEach(
        handle => {

            ctx.fillStyle =
                roomInvalid
                    ? "#dc2626"
                    : "#2563eb";

            ctx.strokeStyle =
                "#ffffff";

            ctx.lineWidth =
                2;

            ctx.fillRect(
                handle.x -
                size / 2,

                handle.y -
                size / 2,

                size,
                size
            );

            ctx.strokeRect(
                handle.x -
                size / 2,

                handle.y -
                size / 2,

                size,
                size
            );
        }
    );
}


/* =========================================
   FURNITURE DRAW
========================================= */

function drawFurniture(
    item
) {

    const definition =
        furnitureDefinitions[
            item.type
        ];

    if (!definition) {
        return;
    }

    const centerX =
        (
            item.x +
            item.width / 2
        ) *
        pixelsPerFoot;

    const centerY =
        (
            item.y +
            item.height / 2
        ) *
        pixelsPerFoot;

    const width =
        item.width *
        pixelsPerFoot;

    const height =
        item.height *
        pixelsPerFoot;

    ctx.save();

    ctx.translate(
        centerX,
        centerY
    );

    ctx.rotate(
        item.rotation *
        Math.PI /
        180
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.strokeStyle =
        "#475569";

    ctx.lineWidth =
        2;

    roundRect(
        ctx,
        -width / 2,
        -height / 2,
        width,
        height,
        6
    );

    ctx.fill();
    ctx.stroke();

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.font =
        `${Math.max(
            16,
            Math.min(
                width,
                height
            ) * 0.35
        )}px Arial`;

    ctx.fillStyle =
        "#111827";

    ctx.fillText(
        definition.icon,
        0,
        -4
    );

    if (
        width > 45 &&
        height > 35
    ) {

        ctx.font =
            "bold 9px Arial";

        ctx.fillStyle =
            "#475569";

        ctx.fillText(
            definition.name,
            0,
            height / 2 - 10
        );
    }

    ctx.restore();
}


function drawFurnitureSelection(
    item
) {

    const box =
        getFurnitureBoundingBox(
            item
        );

    ctx.save();

    ctx.strokeStyle =
        "#7c3aed";

    ctx.lineWidth =
        3;

    ctx.setLineDash([
        6,
        4
    ]);

    ctx.strokeRect(
        box.x *
        pixelsPerFoot +
        2,

        box.y *
        pixelsPerFoot +
        2,

        box.width *
        pixelsPerFoot -
        4,

        box.height *
        pixelsPerFoot -
        4
    );

    ctx.restore();
}


function getFurnitureBoundingBox(
    item
) {

    const rotated =
        item.rotation %
        180 !== 0;

    if (!rotated) {

        return {
            x:
                item.x,

            y:
                item.y,

            width:
                item.width,

            height:
                item.height
        };
    }

    const centerX =
        item.x +
        item.width / 2;

    const centerY =
        item.y +
        item.height / 2;

    return {

        x:
            centerX -
            item.height / 2,

        y:
            centerY -
            item.width / 2,

        width:
            item.height,

        height:
            item.width
    };
}


/* =========================================
   PALETTE DRAG / CLICK
========================================= */

document
    .querySelectorAll(
        ".furniture-item"
    )
    .forEach(
        item => {

            item.addEventListener(
                "dragstart",
                event => {

                    paletteDragType =
                        item.dataset.type;

                    event.dataTransfer.setData(
                        "text/plain",
                        paletteDragType
                    );

                    event.dataTransfer.effectAllowed =
                        "copy";

                    item.classList.add(
                        "dragging"
                    );
                }
            );


            item.addEventListener(
                "dragend",
                () => {

                    paletteDragType =
                        null;

                    item.classList.remove(
                        "dragging"
                    );
                }
            );


            item.addEventListener(
                "click",
                () => {

                    const before =
                        createSnapshot();

                    addFurnitureToRoom(
                        item.dataset.type
                    );

                    pushHistory(
                        before
                    );
                }
            );
        }
    );


canvas.addEventListener(
    "dragover",
    event => {

        event.preventDefault();

        if (
            event.dataTransfer
        ) {

            event.dataTransfer.dropEffect =
                "copy";
        }
    }
);


canvas.addEventListener(
    "drop",
    event => {

        event.preventDefault();

        const type =
            event.dataTransfer
                ? event.dataTransfer.getData(
                    "text/plain"
                )
                : paletteDragType;

        if (
            !type ||
            !furnitureDefinitions[
                type
            ]
        ) {
            return;
        }

        const before =
            createSnapshot();

        addFurnitureAtPosition(
            type,
            event
        );

        pushHistory(
            before
        );

        paletteDragType =
            null;
    }
);


function addFurnitureToRoom(
    type
) {

    const definition =
        furnitureDefinitions[
            type
        ];

    if (!definition) {
        return;
    }

    const room =
        selectedRoom ||
        rooms[0];

    let x =
        0;

    let y =
        0;

    if (room) {

        x =
            room.x +
            Math.max(
                0,

                Math.floor(
                    (
                        room.width -
                        definition.width
                    ) / 2
                )
            );

        y =
            room.y +
            Math.max(
                0,

                Math.floor(
                    (
                        room.height -
                        definition.height
                    ) / 2
                )
            );
    }

    x =
        clamp(
            x,
            0,
            floor.width -
            definition.width
        );

    y =
        clamp(
            y,
            0,
            floor.height -
            definition.height
        );

    const item = {

        id:
            createId(),

        type,

        x,
        y,

        width:
            definition.width,

        height:
            definition.height,

        rotation:
            0
    };

    furniture.push(
        item
    );

    selectedFurniture =
        item;

    selectedRoom =
        null;

    updateFurnitureCount();

    createRoomList();

    redraw();
}


function addFurnitureAtPosition(
    type,
    event
) {

    const definition =
        furnitureDefinitions[
            type
        ];

    const position =
        getPointerPosition(
            event
        );

    let x =
        Math.round(
            position.x -
            definition.width / 2
        );

    let y =
        Math.round(
            position.y -
            definition.height / 2
        );

    x =
        clamp(
            x,
            0,
            floor.width -
            definition.width
        );

    y =
        clamp(
            y,
            0,
            floor.height -
            definition.height
        );

    const item = {

        id:
            createId(),

        type,

        x,
        y,

        width:
            definition.width,

        height:
            definition.height,

        rotation:
            0
    };

    furniture.push(
        item
    );

    selectedFurniture =
        item;

    selectedRoom =
        null;

    updateFurnitureCount();

    createRoomList();

    redraw();
}


/* =========================================
   POINTER POSITION
========================================= */

function getPointerPosition(
    event
) {

    const rect =
        canvas.getBoundingClientRect();

    const scaleX =
        canvas.width /
        rect.width;

    const scaleY =
        canvas.height /
        rect.height;

    return {

        x:
            (
                event.clientX -
                rect.left
            ) *
            scaleX /
            pixelsPerFoot,

        y:
            (
                event.clientY -
                rect.top
            ) *
            scaleY /
            pixelsPerFoot
    };
}


/* =========================================
   HIT TEST
========================================= */

function findFurnitureAt(
    x,
    y
) {

    for (
        let i =
            furniture.length - 1;
        i >= 0;
        i--
    ) {

        const item =
            furniture[i];

        const centerX =
            item.x +
            item.width / 2;

        const centerY =
            item.y +
            item.height / 2;

        const angle =
            -item.rotation *
            Math.PI /
            180;

        const dx =
            x -
            centerX;

        const dy =
            y -
            centerY;

        const localX =
            dx *
            Math.cos(angle) -
            dy *
            Math.sin(angle);

        const localY =
            dx *
            Math.sin(angle) +
            dy *
            Math.cos(angle);

        if (
            Math.abs(
                localX
            ) <=
            item.width / 2 &&

            Math.abs(
                localY
            ) <=
            item.height / 2
        ) {

            return item;
        }
    }

    return null;
}


function findRoomAt(
    x,
    y
) {

    for (
        let i =
            rooms.length - 1;
        i >= 0;
        i--
    ) {

        const room =
            rooms[i];

        if (
            x >= room.x &&
            x <=
            room.x +
            room.width &&

            y >= room.y &&
            y <=
            room.y +
            room.height
        ) {

            return room;
        }
    }

    return null;
}


function findResizeHandle(
    room,
    event
) {

    if (!room) {
        return null;
    }

    const rect =
        canvas.getBoundingClientRect();

    const scaleX =
        canvas.width /
        rect.width;

    const scaleY =
        canvas.height /
        rect.height;

    const pointerX =
        (
            event.clientX -
            rect.left
        ) *
        scaleX;

    const pointerY =
        (
            event.clientY -
            rect.top
        ) *
        scaleY;

    const handles =
        getResizeHandles(
            room
        );

    const hitSize =
        18;

    for (
        const [
            name,
            handle
        ]
        of Object.entries(
            handles
        )
    ) {

        if (
            Math.abs(
                pointerX -
                handle.x
            ) <= hitSize &&

            Math.abs(
                pointerY -
                handle.y
            ) <= hitSize
        ) {

            return name;
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

        if (!event.isPrimary) {
            return;
        }

        event.preventDefault();

        activePointerId =
            event.pointerId;

        try {

            canvas.setPointerCapture(
                event.pointerId
            );

        } catch (_) {
        }

        const position =
            getPointerPosition(
                event
            );

        const resizeHandle =
            findResizeHandle(
                selectedRoom,
                event
            );

        if (
            selectedRoom &&
            resizeHandle
        ) {

            beginAction();

            selectedFurniture =
                null;

            isResizingRoom =
                true;

            isDraggingRoom =
                false;

            isDraggingFurniture =
                false;

            activeResizeHandle =
                resizeHandle;

            saveRoomState();

            roomInvalid =
                false;

            redraw();

            return;
        }

        const clickedFurniture =
            findFurnitureAt(
                position.x,
                position.y
            );

        if (
            clickedFurniture
        ) {

            beginAction();

            selectedFurniture =
                clickedFurniture;

            selectedRoom =
                null;

            isDraggingFurniture =
                true;

            isDraggingRoom =
                false;

            isResizingRoom =
                false;

            dragOffsetX =
                position.x -
                clickedFurniture.x;

            dragOffsetY =
                position.y -
                clickedFurniture.y;

            createRoomList();

            redraw();

            return;
        }

        const clickedRoom =
            findRoomAt(
                position.x,
                position.y
            );

        if (clickedRoom) {

            beginAction();

            selectedRoom =
                clickedRoom;

            selectedFurniture =
                null;

            isDraggingRoom =
                true;

            isDraggingFurniture =
                false;

            isResizingRoom =
                false;

            dragOffsetX =
                position.x -
                clickedRoom.x;

            dragOffsetY =
                position.y -
                clickedRoom.y;

            saveRoomState();

            roomInvalid =
                false;
        }

        else {

            selectedRoom =
                null;

            selectedFurniture =
                null;

            cancelAction();
        }

        createRoomList();

        redraw();
    }
);


/* =========================================
   POINTER MOVE
========================================= */

canvas.addEventListener(
    "pointermove",
    event => {

        if (
            activePointerId !==
            event.pointerId
        ) {
            return;
        }

        const position =
            getPointerPosition(
                event
            );

        if (
            isResizingRoom &&
            selectedRoom
        ) {

            event.preventDefault();

            resizeSelectedRoom(
                position
            );

            return;
        }

        if (
            isDraggingRoom &&
            selectedRoom
        ) {

            event.preventDefault();

            moveSelectedRoom(
                position
            );

            return;
        }

        if (
            isDraggingFurniture &&
            selectedFurniture
        ) {

            event.preventDefault();

            moveSelectedFurniture(
                position
            );
        }
    }
);


/* =========================================
   MOVE ROOM
========================================= */

function moveSelectedRoom(
    position
) {

    let newX =
        Math.round(
            position.x -
            dragOffsetX
        );

    let newY =
        Math.round(
            position.y -
            dragOffsetY
        );

    newX =
        clamp(
            newX,
            0,
            floor.width -
            selectedRoom.width
        );

    newY =
        clamp(
            newY,
            0,
            floor.height -
            selectedRoom.height
        );

    selectedRoom.x =
        newX;

    selectedRoom.y =
        newY;

    roomInvalid =
        hasRoomOverlap(
            selectedRoom
        );

    if (!roomInvalid) {
        saveRoomState();
    }

    redraw();
}


/* =========================================
   RESIZE ROOM
========================================= */

function resizeSelectedRoom(
    position
) {

    const room =
        selectedRoom;

    if (!room) {
        return;
    }

    const right =
        room.x +
        room.width;

    const bottom =
        room.y +
        room.height;

    const pointerX =
        Math.round(
            position.x
        );

    const pointerY =
        Math.round(
            position.y
        );

    let x =
        room.x;

    let y =
        room.y;

    let width =
        room.width;

    let height =
        room.height;

    if (
        activeResizeHandle === "ne" ||
        activeResizeHandle === "se"
    ) {

        width =
            clamp(
                pointerX -
                room.x,

                MIN_ROOM_SIZE,

                floor.width -
                room.x
            );
    }

    if (
        activeResizeHandle === "nw" ||
        activeResizeHandle === "sw"
    ) {

        x =
            clamp(
                pointerX,
                0,
                right -
                MIN_ROOM_SIZE
            );

        width =
            right -
            x;
    }

    if (
        activeResizeHandle === "sw" ||
        activeResizeHandle === "se"
    ) {

        height =
            clamp(
                pointerY -
                room.y,

                MIN_ROOM_SIZE,

                floor.height -
                room.y
            );
    }

    if (
        activeResizeHandle === "nw" ||
        activeResizeHandle === "ne"
    ) {

        y =
            clamp(
                pointerY,
                0,
                bottom -
                MIN_ROOM_SIZE
            );

        height =
            bottom -
            y;
    }

    room.x =
        Math.round(x);

    room.y =
        Math.round(y);

    room.width =
        Math.round(width);

    room.height =
        Math.round(height);

    roomInvalid =
        hasRoomOverlap(
            room
        );

    if (!roomInvalid) {
        saveRoomState();
    }

    redraw();
}


/* =========================================
   ROOM STATE
========================================= */

function saveRoomState() {

    if (!selectedRoom) {
        return;
    }

    lastValidRoomState = {

        x:
            selectedRoom.x,

        y:
            selectedRoom.y,

        width:
            selectedRoom.width,

        height:
            selectedRoom.height
    };
}


function restoreRoomState() {

    if (
        !selectedRoom ||
        !lastValidRoomState
    ) {
        return;
    }

    Object.assign(
        selectedRoom,
        lastValidRoomState
    );
}


/* =========================================
   MOVE FURNITURE
========================================= */

function moveSelectedFurniture(
    position
) {

    const item =
        selectedFurniture;

    let x =
        Math.round(
            position.x -
            dragOffsetX
        );

    let y =
        Math.round(
            position.y -
            dragOffsetY
        );

    const rotated =
        item.rotation %
        180 !== 0;

    if (!rotated) {

        item.x =
            clamp(
                x,
                0,
                floor.width -
                item.width
            );

        item.y =
            clamp(
                y,
                0,
                floor.height -
                item.height
            );
    }

    else {

        const centerX =
            x +
            item.width / 2;

        const centerY =
            y +
            item.height / 2;

        const minCenterX =
            item.height / 2;

        const maxCenterX =
            floor.width -
            item.height / 2;

        const minCenterY =
            item.width / 2;

        const maxCenterY =
            floor.height -
            item.width / 2;

        const clampedCenterX =
            clamp(
                centerX,
                minCenterX,
                maxCenterX
            );

        const clampedCenterY =
            clamp(
                centerY,
                minCenterY,
                maxCenterY
            );

        item.x =
            clampedCenterX -
            item.width / 2;

        item.y =
            clampedCenterY -
            item.height / 2;
    }

    redraw();
}


/* =========================================
   POINTER END
========================================= */

function endCanvasPointer(
    event
) {

    if (
        activePointerId !==
        null &&
        event.pointerId !==
        activePointerId
    ) {
        return;
    }

    if (
        selectedRoom &&
        roomInvalid
    ) {

        restoreRoomState();
    }

    try {

        if (
            canvas.hasPointerCapture(
                event.pointerId
            )
        ) {

            canvas.releasePointerCapture(
                event.pointerId
            );
        }

    } catch (_) {
    }

    const didAction =
        isDraggingRoom ||
        isResizingRoom ||
        isDraggingFurniture;

    activePointerId =
        null;

    isDraggingRoom =
        false;

    isResizingRoom =
        false;

    isDraggingFurniture =
        false;

    activeResizeHandle =
        null;

    roomInvalid =
        false;

    if (didAction) {
        commitAction();
    }

    createRoomList();

    redraw();
}


canvas.addEventListener(
    "pointerup",
    endCanvasPointer
);

canvas.addEventListener(
    "pointercancel",
    endCanvasPointer
);


/* =========================================
   FURNITURE CONTROLS
========================================= */

rotateFurnitureBtn.addEventListener(
    "click",
    () => {

        if (
            !selectedFurniture
        ) {
            return;
        }

        const before =
            createSnapshot();

        selectedFurniture.rotation =
            (
                selectedFurniture.rotation +
                90
            ) %
            360;

        keepFurnitureInsideFloor(
            selectedFurniture
        );

        pushHistory(
            before
        );

        redraw();
    }
);


function keepFurnitureInsideFloor(
    item
) {

    let box =
        getFurnitureBoundingBox(
            item
        );

    if (
        box.x < 0
    ) {

        item.x +=
            -box.x;
    }

    if (
        box.y < 0
    ) {

        item.y +=
            -box.y;
    }

    box =
        getFurnitureBoundingBox(
            item
        );

    if (
        box.x +
        box.width >
        floor.width
    ) {

        item.x -=
            box.x +
            box.width -
            floor.width;
    }

    if (
        box.y +
        box.height >
        floor.height
    ) {

        item.y -=
            box.y +
            box.height -
            floor.height;
    }
}


deleteFurnitureBtn.addEventListener(
    "click",
    () => {

        if (
            !selectedFurniture
        ) {
            return;
        }

        const before =
            createSnapshot();

        furniture =
            furniture.filter(
                item =>
                    item !==
                    selectedFurniture
            );

        selectedFurniture =
            null;

        pushHistory(
            before
        );

        updateFurnitureCount();

        redraw();
    }
);


/* =========================================
   ROOM LIST
========================================= */

function createRoomList() {

    roomList.innerHTML =
        "";

    rooms.forEach(
        room => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "room-list-item";

            if (
                room ===
                selectedRoom
            ) {

                item.classList.add(
                    "active"
                );
            }

            item.innerHTML = `

                <strong>
                    ${escapeHTML(room.name)}
                </strong>

                <span>
                    ${room.width} × ${room.height} ft
                </span>
            `;

            item.addEventListener(
                "click",
                () => {

                    selectedRoom =
                        room;

                    selectedFurniture =
                        null;

                    roomInvalid =
                        false;

                    createRoomList();

                    redraw();
                }
            );

            roomList.appendChild(
                item
            );
        }
    );
}


/* =========================================
   SELECTED INFO
========================================= */

function updateSelectedInfo() {

    furnitureControls.classList.toggle(
        "hidden",
        !selectedFurniture
    );

    if (
        selectedFurniture
    ) {

        const definition =
            furnitureDefinitions[
                selectedFurniture.type
            ];

        selectedName.textContent =
            definition.name;

        selectedRoomInfo.textContent =
            `${definition.name} | ${selectedFurniture.width} × ${selectedFurniture.height} ft | Rotation: ${selectedFurniture.rotation}°`;

        return;
    }

    if (
        selectedRoom
    ) {

        selectedName.textContent =
            selectedRoom.name;

        if (
            roomInvalid
        ) {

            selectedRoomInfo.textContent =
                `${selectedRoom.name} | Invalid placement`;

            return;
        }

        selectedRoomInfo.textContent =
            `${selectedRoom.name} | ${selectedRoom.width} × ${selectedRoom.height} ft | Position: ${selectedRoom.x}, ${selectedRoom.y}`;

        return;
    }

    selectedName.textContent =
        "None";

    selectedRoomInfo.textContent =
        "Selected: None";
}


function updateFurnitureCount() {

    designerFurnitureCount.textContent =
        furniture.length;
}


/* =========================================
   REGENERATE
========================================= */

regenerateBtn.addEventListener(
    "click",
    () => {

        const before =
            createSnapshot();

        selectedRoom =
            null;

        selectedFurniture =
            null;

        roomInvalid =
            false;

        if (
            !arrangeRooms()
        ) {

            alert(
                "Unable to regenerate this layout."
            );

            return;
        }

        pushHistory(
            before
        );

        createRoomList();

        redraw();
    }
);


/* =========================================
   EDIT DIMENSIONS
========================================= */

editDimensionsBtn.addEventListener(
    "click",
    () => {

        designerSection.classList.add(
            "hidden"
        );

        roomSection.classList.remove(
            "hidden"
        );

        loadRoomsIntoInputs();

        finalizeBtn.disabled =
            true;
    }
);


function loadRoomsIntoInputs() {

    roomInputsContainer.innerHTML =
        "";

    rooms.forEach(
        (
            room,
            index
        ) => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "room-input-row";

            row.innerHTML = `

                <div class="room-number">
                    ${index + 1}.
                </div>

                <div class="form-group room-name-group">
                    <label>Room Name</label>

                    <input
                        class="room-name"
                        type="text"
                        value="${escapeHTML(room.name)}"
                    >
                </div>

                <div class="form-group room-width-group">
                    <label>Width (ft)</label>

                    <input
                        class="room-width"
                        type="number"
                        min="2"
                        value="${room.width}"
                    >
                </div>

                <div class="form-group room-height-group">
                    <label>Height (ft)</label>

                    <input
                        class="room-height"
                        type="number"
                        min="2"
                        value="${room.height}"
                    >
                </div>
            `;

            roomInputsContainer.appendChild(
                row
            );
        }
    );
}


/* =========================================
   BACK
========================================= */

backBtn.addEventListener(
    "click",
    () => {

        roomSection.classList.add(
            "hidden"
        );

        setupSection.classList.remove(
            "hidden"
        );
    }
);


/* =========================================
   SAVE
========================================= */

saveBtn.addEventListener(
    "click",
    () => {

        if (!rooms.length) {

            alert(
                "Create a floor plan before saving."
            );

            return;
        }

        const data =
            buildLayoutData();

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                data
            )
        );

        alert(
            "Plan saved successfully."
        );
    }
);


/* =========================================
   LOAD
========================================= */

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
                JSON.parse(
                    saved
                );

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

            const before =
                createSnapshot();

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
                    room => ({
                        ...room
                    })
                );

            furniture =
                Array.isArray(
                    data.furniture
                )
                    ? data.furniture.map(
                        item => ({
                            ...item
                        })
                    )
                    : [];

            pushHistory(
                before
            );

            floorWidthInput.value =
                floor.width;

            floorHeightInput.value =
                floor.height;

            roomCountInput.value =
                rooms.length;

            setupSection.classList.add(
                "hidden"
            );

            roomSection.classList.add(
                "hidden"
            );

            designerSection.classList.remove(
                "hidden"
            );

            finalizeBtn.disabled =
                false;

            selectedRoom =
                null;

            selectedFurniture =
                null;

            updateDesignerUI();

            setTimeout(
                resizeCanvas,
                50
            );

            alert(
                "Plan loaded successfully."
            );

        } catch (_) {

            alert(
                "Saved plan could not be loaded."
            );
        }
    }
);


/* =========================================
   BUILD EXPORT DATA
========================================= */

function buildLayoutData() {

    return {

        version:
            2,

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
                        room.height
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


/* =========================================
   EXPORT JSON
========================================= */

exportJsonBtn.addEventListener(
    "click",
    () => {

        if (!rooms.length) {

            alert(
                "Create a floor plan before exporting."
            );

            return;
        }

        if (
            !layoutIsValid()
        ) {

            alert(
                "Fix overlapping rooms before exporting."
            );

            return;
        }

        const data =
            buildLayoutData();

        const json =
            JSON.stringify(
                data,
                null,
                2
            );

        const blob =
            new Blob(
                [json],
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


/* =========================================
   EXPORT PNG
========================================= */

exportPngBtn.addEventListener(
    "click",
    () => {

        if (!rooms.length) {

            alert(
                "Create a floor plan before exporting."
            );

            return;
        }

        if (
            !layoutIsValid()
        ) {

            alert(
                "Fix overlapping rooms before exporting."
            );

            return;
        }

        const previousRoom =
            selectedRoom;

        const previousFurniture =
            selectedFurniture;

        const previousInvalid =
            roomInvalid;

        selectedRoom =
            null;

        selectedFurniture =
            null;

        roomInvalid =
            false;

        redraw();

        canvas.toBlob(
            blob => {

                if (!blob) {

                    alert(
                        "PNG export failed."
                    );

                    selectedRoom =
                        previousRoom;

                    selectedFurniture =
                        previousFurniture;

                    roomInvalid =
                        previousInvalid;

                    redraw();

                    return;
                }

                downloadBlob(
                    blob,
                    "plancraft-floor-plan.png"
                );

                selectedRoom =
                    previousRoom;

                selectedFurniture =
                    previousFurniture;

                roomInvalid =
                    previousInvalid;

                redraw();
            },
            "image/png"
        );
    }
);


/* =========================================
   FINALIZE
========================================= */

finalizeBtn.addEventListener(
    "click",
    () => {

        if (
            !layoutIsValid()
        ) {

            alert(
                "Fix overlapping rooms before finalizing."
            );

            return;
        }

        const layoutData =
            buildLayoutData();

        console.log(
            "Final 2D Layout:",
            layoutData
        );

        alert(
            "2D layout finalized successfully. It is ready for 3D conversion."
        );
    }
);


/* =========================================
   DOWNLOAD HELPER
========================================= */

function downloadBlob(
    blob,
    filename
) {

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href =
        url;

    link.download =
        filename;

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    setTimeout(
        () => {
            URL.revokeObjectURL(
                url
            );
        },
        1000
    );
}


/* =========================================
   RESET
========================================= */

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

        const before =
            createSnapshot();

        floor = {
            width:
                40,
            height:
                30
        };

        rooms =
            [];

        furniture =
            [];

        selectedRoom =
            null;

        selectedFurniture =
            null;

        floorWidthInput.value =
            40;

        floorHeightInput.value =
            30;

        roomCountInput.value =
            4;

        pushHistory(
            before
        );

        finalizeBtn.disabled =
            true;

        exportJsonBtn.disabled =
            true;

        exportPngBtn.disabled =
            true;

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
    }
);


/* =========================================
   KEYBOARD
========================================= */

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
            event.key.toLowerCase() ===
            "z"
        ) {

            event.preventDefault();

            undo();

            return;
        }

        if (
            event.ctrlKey &&
            event.key.toLowerCase() ===
            "y"
        ) {

            event.preventDefault();

            redo();
        }
    }
);


/* =========================================
   HELPERS
========================================= */

function createId() {

    if (
        typeof crypto !==
        "undefined" &&
        crypto.randomUUID
    ) {

        return crypto.randomUUID();
    }

    return (
        Date.now().toString() +
        Math.random()
            .toString(16)
            .slice(2)
    );
}


function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            value,
            max
        )
    );
}


function escapeHTML(
    value
) {

    return String(
        value
    )

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
            "\"",
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


function roundRect(
    context,
    x,
    y,
    width,
    height,
    radius
) {

    const r =
        Math.min(
            radius,
            width / 2,
            height / 2
        );

    context.beginPath();

    context.moveTo(
        x + r,
        y
    );

    context.lineTo(
        x +
        width -
        r,
        y
    );

    context.quadraticCurveTo(
        x + width,
        y,
        x + width,
        y + r
    );

    context.lineTo(
        x + width,
        y +
        height -
        r
    );

    context.quadraticCurveTo(
        x + width,
        y + height,
        x +
        width -
        r,
        y + height
    );

    context.lineTo(
        x + r,
        y + height
    );

    context.quadraticCurveTo(
        x,
        y + height,
        x,
        y +
        height -
        r
    );

    context.lineTo(
        x,
        y + r
    );

    context.quadraticCurveTo(
        x,
        y,
        x + r,
        y
    );

    context.closePath();
}


/* =========================================
   WINDOW RESIZE
========================================= */

let resizeTimer =
    null;

window.addEventListener(
    "resize",
    () => {

        if (
            designerSection.classList.contains(
                "hidden"
            )
        ) {
            return;
        }

        clearTimeout(
            resizeTimer
        );

        resizeTimer =
            setTimeout(
                resizeCanvas,
                120
            );
    }
);


/* =========================================
   INITIAL STATE
========================================= */

updateHistoryButtons();

exportJsonBtn.disabled =
    true;

exportPngBtn.disabled =
    true;