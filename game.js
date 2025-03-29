let lvId, lv;
let isPlayMode = true;
let currentPiece = null, currentCircle = null, startX, startY;
let arrowButton = document.getElementById('arrow-button');

let arrows = [];
function tryClearArrows() {
    if (arrows.length > 0) {
        arrows.forEach(arrow => arrow.remove());
        arrows = [];
    }
}

function getRelX() {
    const viewboxRect = document.getElementById('main-viewbox').getBoundingClientRect();
    return viewboxRect.left + viewboxRect.width / 2;
}

function getRelY() {
    const viewboxRect = document.getElementById('main-viewbox').getBoundingClientRect();
    return viewboxRect.top + viewboxRect.height / 2;
}

function resetPuzzle() {
    if (isPlayMode){
        lv.scrambleFunc();
        lv.pieces.forEach(piece => {
            piece.refreshGraphics();
        });
    } else {
        lv.pieces.forEach(piece => {
            piece.x = piece.win_x;
            piece.y = piece.win_y;
            piece.a = piece.win_a;
            piece.refreshGraphics();
        });
    }
    tryClearArrows();
}

function switchMode() {
    if (isPlayMode) {
        lv.pieces.forEach(piece => {
            piece.restore_x = piece.x;
            piece.restore_y = piece.y;
            piece.restore_a = piece.a;
            piece.x = piece.win_x;
            piece.y = piece.win_y;
            piece.a = piece.win_a;
            piece.refreshGraphics();
        });
        isPlayMode = false;
        arrowButton.style.display = 'block';
        debug('Test Mode');
    } else {
        lv.pieces.forEach(piece => {
            piece.x = piece.restore_x;
            piece.y = piece.restore_y;
            piece.a = piece.restore_a;
            piece.refreshGraphics();
        });
        isPlayMode = true;
        arrowButton.style.display = 'none';
        debug('');
    }
    tryClearArrows();
}

function debug(text) {
    document.getElementById('debug').textContent = text;
}

// Touch and mouse event handlers
function getTouchCoordinates(e) {
    const touch = e.touches ? e.touches[0] : e;
    const viewboxRect = document.getElementById('main-viewbox').getBoundingClientRect();
    
    // Get the touch coordinates relative to the viewport
    let clientX = touch.clientX;
    let clientY = touch.clientY;
    
    // If the touch is outside the viewbox, return null
    if (clientX < viewboxRect.left || clientX > viewboxRect.right ||
        clientY < viewboxRect.top || clientY > viewboxRect.bottom) {
        return null;
    }
    
    return {
        clientX: clientX,
        clientY: clientY
    };
}

function onStart(e) {
    e.preventDefault();
    const coords = getTouchCoordinates(e);
    if (!coords) return;
    
    const target = e.target || (e.touches && e.touches[0].target);
    currentPiece = lv.pieces.find(p => p.svg === target.parentNode.parentNode);
    if (currentPiece) {
        startX = coords.clientX - getRelX();
        startY = coords.clientY - getRelY();
    }
    tryClearArrows();
}

function onMove(e) {
    e.preventDefault();
    const coords = getTouchCoordinates(e);
    if (!coords) return;
    
    let mx = coords.clientX - getRelX(), my = coords.clientY - getRelY();
    
    if (currentPiece && !currentCircle) {
        let minAngle = 999;
        lv.circles.forEach(c => {
            if (c.containsPoint(mx, my)) {
                let angle = angleBetween(mx, my, startX, startY, c.x, c.y);
                angle = (angle + 540) % 360 - 180;
                angle = Math.abs(angle);
                if (angle < minAngle) {
                    minAngle = angle;
                    currentCircle = c;
                }
            }
        });
        lv.pieces.forEach(piece => {
            piece.startRotate();
        });
    }
    if (currentCircle) {
        currentPiece = null;
        let delta_a = angleBetween(mx, my, currentCircle.x, currentCircle.y, startX, startY);
        lv.pieces.forEach(piece => {
            if (currentCircle.containsPoint(piece.x, piece.y)) {
                piece.rotate(currentCircle.x, currentCircle.y, delta_a);
            }
        });
    }
}

function onEnd(e) {
    e.preventDefault();
    const coords = getTouchCoordinates(e);
    if (!coords) return;
    
    let mx = coords.clientX - getRelX(), my = coords.clientY - getRelY();
    const testWin = isPlayMode || localStorage.getItem('obx.debug') == 1;
    
    if (currentCircle) {
        let angle = angleBetween(mx, my, currentCircle.x, currentCircle.y, startX, startY);
        angle = Math.round(angle / (360 / currentCircle.s)) * (360 / currentCircle.s);
        lv.pieces.forEach(piece => {
            if (currentCircle.containsPoint(piece.x, piece.y)) {
                piece.rotate(currentCircle.x, currentCircle.y, angle);
            }
        });
        if (testWin && lv.pieces.every(p => lv.testFunc(p.x, p.y, p.a, p.b))) {
            debug('Congratulations!');
            localStorage.setItem(`obx.p${lvId}`, 1);
        }
    }
    currentPiece = null;
    currentCircle = null;
}

function toggleArrows() {
    if (arrows.length === 0) {
        // First, create the arrowhead marker definition if it doesn't exist
        let defs = document.getElementById('arrow-defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.id = 'arrow-defs';
            document.getElementById('main-viewbox').appendChild(defs);
            
            // Create a marker element for the arrowhead
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '6');
            marker.setAttribute('markerHeight', '4');
            marker.setAttribute('refX', '6');  // Changed to markerWidth to align tip with endpoint
            marker.setAttribute('refY', '2');
            marker.setAttribute('orient', 'auto');
            
            // Create the actual arrowhead shape (a polygon without stroke)
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 6 2, 0 4');
            polygon.setAttribute('fill', 'pink');
            polygon.setAttribute('stroke', 'none');
            
            marker.appendChild(polygon);
            defs.appendChild(marker);
        }
        
        // Now create the arrows with the marker
        lv.pieces.forEach(piece => {
            const distance = Math.hypot(piece.x - piece.win_x, piece.y - piece.win_y);
            if (distance > 1) { // Adjust the threshold as needed
                const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                arrow.setAttribute('stroke', 'pink');
                arrow.setAttribute('stroke-width', '5');
                arrow.setAttribute('marker-end', 'url(#arrowhead)');
                
                // Use exact endpoints - no adjustment
                arrow.setAttribute('x1', piece.win_x);
                arrow.setAttribute('y1', piece.win_y);
                arrow.setAttribute('x2', piece.x);
                arrow.setAttribute('y2', piece.y);
                
                document.getElementById('main-viewbox').appendChild(arrow);
                arrows.push(arrow);
            }
        });
    }
    else tryClearArrows();
}

function initGame() {
    debug('');
    const mainViewbox = document.getElementById('main-viewbox');

    // Touch events
    mainViewbox.addEventListener('touchstart', onStart, { passive: false });
    mainViewbox.addEventListener('touchmove', onMove, { passive: false });
    mainViewbox.addEventListener('touchend', onEnd, { passive: false });
    mainViewbox.addEventListener('touchcancel', onEnd, { passive: false });
    
    // Mouse events
    mainViewbox.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);

    document.getElementById('restart-button').addEventListener('click', resetPuzzle);
    document.getElementById('switch-button').addEventListener('click', switchMode);
    arrowButton.addEventListener('click', toggleArrows);
}

function initLevel(levelId) {
    const mainViewbox = document.getElementById('main-viewbox');
    const miniViewbox = document.getElementById('mini-viewbox');
    lvId = levelId;
    lv = loadLevel(levelId);
    initViewBox(lv.pieces, mainViewbox, false);
    initViewBox(lv.pieces, miniViewbox);
    isPlayMode = true;
    arrowButton.style.display = 'none';
    resetPuzzle();
}