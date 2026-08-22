const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');
const startPauseBtn = document.getElementById('startPauseBtn');
const clearBtn = document.getElementById('clearBtn');
const randomBtn = document.getElementById('randomBtn');
const generationCount = document.getElementById('generationCount');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const sizeSlider = document.getElementById('sizeSlider');
const sizeValue = document.getElementById('sizeValue');

let size = 20;
let cellSize = canvas.width / size;
let map = Array.from({ length: size }, () => Array(size).fill(0));
let isRunning = false;
let generation = 0;
let intervalId = null;
let isDrawing = false;
let isPanning = false;
let isCtrlPressed = false;

let hoverR = -1;
let hoverC = -1;

let zoom = 1;
let offsetX = 0;
let offsetY = 0;
let startPanX = 0;
let startPanY = 0;
let simSpeed = 200;

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 1 / zoom;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (map[r][c] === 1) {
                ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
            ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
    }

    if (hoverR >= 0 && hoverR < size && hoverC >= 0 && hoverC < size) {
        ctx.fillStyle = isCtrlPressed ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(hoverC * cellSize, hoverR * cellSize, cellSize, cellSize);
    }
    
    ctx.restore();
}

function countNeighbors(grid, r, c) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            let nr = (r + i + size) % size;
            let nc = (c + j + size) % size;
            count += grid[nr][nc];
        }
    }
    return count;
}

function updateSimulation() {
    let nextMap = Array.from({ length: size }, () => Array(size).fill(0));
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            let neighbors = countNeighbors(map, r, c);
            if (map[r][c] === 1) {
                nextMap[r][c] = (neighbors === 2 || neighbors === 3) ? 1 : 0;
            } else {
                nextMap[r][c] = (neighbors === 3) ? 1 : 0;
            }
        }
    }
    map = nextMap;
    generation++;
    generationCount.textContent = `Generation: ${generation}`;
    drawGrid();
}

function startTimer() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(updateSimulation, simSpeed);
}

function getMouseCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - offsetX) / zoom;
    const worldY = (mouseY - offsetY) / zoom;
    return {
        c: Math.floor(worldX / cellSize),
        r: Math.floor(worldY / cellSize)
    };
}

function interact(r, c) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
        let newValue = isCtrlPressed ? 0 : 1;
        if (map[r][c] !== newValue) {
            map[r][c] = newValue;
            drawGrid();
        }
    }
}

startPauseBtn.addEventListener('click', () => {
    isRunning = !isRunning;
    if (isRunning) {
        startPauseBtn.textContent = 'Pause';
        startPauseBtn.style.backgroundColor = '#a31515';
        startTimer();
    } else {
        startPauseBtn.textContent = 'Start';
        startPauseBtn.style.backgroundColor = '#0e639c';
        clearInterval(intervalId);
    }
});

clearBtn.addEventListener('click', () => {
    isRunning = false;
    startPauseBtn.textContent = 'Start';
    startPauseBtn.style.backgroundColor = '#0e639c';
    clearInterval(intervalId);
    map = Array.from({ length: size }, () => Array(size).fill(0));
    generation = 0;
    generationCount.textContent = `Generation: ${generation}`;
    offsetX = 0;
    offsetY = 0;
    zoom = 1;
    drawGrid();
});

randomBtn.addEventListener('click', () => {
    map = Array.from({ length: size }, () => 
        Array.from({ length: size }, () => Math.random() < 0.3 ? 1 : 0)
    );
    drawGrid();
});

speedSlider.addEventListener('input', (e) => {
    const maxSpeed = 1000;
    const minSpeed = 50;
    simSpeed = maxSpeed - parseInt(e.target.value) + minSpeed;
    speedValue.textContent = `${parseInt(e.target.value)} ms`;
    if (isRunning) startTimer();
});

sizeSlider.addEventListener('input', (e) => {
    if (isRunning) {
        isRunning = false;
        startPauseBtn.textContent = 'Start';
        startPauseBtn.style.backgroundColor = '#0e639c';
        clearInterval(intervalId);
    }
    const oldSize = size;
    size = parseInt(e.target.value);
    sizeValue.textContent = `${size}`;
    cellSize = canvas.width / size;
    
    let newMap = Array.from({ length: size }, () => Array(size).fill(0));
    for (let r = 0; r < Math.min(oldSize, size); r++) {
        for (let c = 0; c < Math.min(oldSize, size); c++) {
            newMap[r][c] = map[r][c];
        }
    }
    map = newMap;
    drawGrid();
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1) {
        isPanning = true;
        startPanX = e.clientX - offsetX;
        startPanY = e.clientY - offsetY;
        e.preventDefault();
        return;
    }
    if (e.button === 2) isCtrlPressed = true;
    isDrawing = true;
    const coords = getMouseCoords(e);
    interact(coords.r, coords.c);
});

canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        offsetX = e.clientX - startPanX;
        offsetY = e.clientY - startPanY;
        drawGrid();
        return;
    }
    
    const coords = getMouseCoords(e);
    if (coords.r !== hoverR || coords.c !== hoverC) {
        hoverR = coords.r;
        hoverC = coords.c;
        if (isDrawing) {
            interact(coords.r, coords.c);
        } else {
            drawGrid();
        }
    }
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - offsetX) / zoom;
    const worldY = (mouseY - offsetY) / zoom;
    
    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
        zoom *= zoomFactor;
    } else {
        zoom /= zoomFactor;
    }
    
    zoom = Math.max(0.5, Math.min(zoom, 10));
    offsetX = mouseX - worldX * zoom;
    offsetY = mouseY - worldY * zoom;
    drawGrid();
});

canvas.addEventListener('mouseleave', () => {
    hoverR = -1;
    hoverC = -1;
    isDrawing = false;
    isPanning = false;
    drawGrid();
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 1) isPanning = false;
    if (e.button === 2) isCtrlPressed = false;
    isDrawing = false;
    drawGrid();
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Control') {
        isCtrlPressed = true;
        drawGrid();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'Control') {
        isCtrlPressed = false;
        drawGrid();
    }
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());
drawGrid();
