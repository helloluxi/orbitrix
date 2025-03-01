
// Some common constants and helper classes/functions
const sqrt2 = Math.sqrt(2), sqrt3 = Math.sqrt(3), sqrt6 = Math.sqrt(6);

class Circle {
    constructor(x, y, r, s) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.s = s;
    }

    containsPoint(x, y) {
        return distance(x, y, this.x, this.y) <= this.r;
    }
}

class Piece {
    constructor(svg, bias_x, bias_y, x, y, a, b) {
        this.svg = svg;
        this.bias_x = bias_x;
        this.bias_y = bias_y;
        this.x = x;
        this.y = y;
        this.a = a;
        this.b = b;
        this.win_x = x;
        this.win_y = y;
        this.win_a = a;
    }

    refreshGraphics() {
        let origin = rotate(this.x, this.y, this.x + this.bias_x, this.y + this.bias_y, this.a);
        this.svg.setAttribute('transform', `translate(${origin.x}, ${origin.y}) rotate(${this.a})`);
    }

    startRotate() {
        this.start_x = this.x;
        this.start_y = this.y;
        this.start_a = this.a;
    }

    rotate(rx, ry, angle) {
        this.a = this.start_a + angle;
        let pieceNewPos = rotate(rx, ry, this.start_x, this.start_y, angle);
        this.x = pieceNewPos.x;
        this.y = pieceNewPos.y;
        this.refreshGraphics();
    }
}

function rotate(centerX, centerY, x, y, angle) {
    angle = angle * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: centerX + (x - centerX) * cos - (y - centerY) * sin,
        y: centerY + (x - centerX) * sin + (y - centerY) * cos
    };
}

function cosd(deg) { return Math.cos(deg / 180 * Math.PI); }
function sind(deg) { return Math.sin(deg / 180 * Math.PI); }

function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function angleBetween(x1, y1, x2, y2, x3, y3) {
    return (Math.atan2(y1 - y2, x1 - x2) - Math.atan2(y3 - y2, x3 - x2)) * 180 / Math.PI;
}

function shuffleGen(n, start) {
    const array = Array.from({ length: n }, (_, index) => index + start);
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateScrambleFunc(groupArr, pieces) {
    return () => {
        let start = 0;
        let mapping = groupArr.map(n => {
            const shuffle = shuffleGen(n, start);
            start += n;
            return shuffle;
        }).flat();
        pieces.forEach((p, index) => {
            p.x = pieces[mapping[index]].win_x;
            p.y = pieces[mapping[index]].win_y;
            p.a = pieces[mapping[index]].win_a;
            p.refreshGraphics();
        });
    };
}

function loadSVG(id, color, s) {
    const clone = document.getElementById(id).cloneNode(true);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.appendChild(clone);
    clone.setAttribute('fill', color);
    clone.setAttribute('display', 'inline');
    g.setAttribute('transform', `scale(${s})`);
    const g2 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g2.appendChild(g);
    return g2;
}

function genPiece(pieces, svg, bias_x, bias_y, circle, n, r, d, a, b) {
    for (let i = 0; i < n; i++) {
        pieces.push(new Piece(
            svg.cloneNode(true),
            bias_x,
            bias_y,
            circle.x + r * cosd(d + 360 / circle.s * i),
            circle.y + r * sind(d + 360 / circle.s * i),
            a + 360 / circle.s * i,
            b
        ));
    }
}

/**
 * Structure representing the loaded level.
 * @typedef {Object} LevelData
 * @property {Circle[]} circles - The array of circles in the level.
 * @property {Piece[]} pieces - The array of pieces in the level.
 * @property {Function} scrambleFunc - Function to scramble the pieces.
 * @property {Function} testFunc - Function to test if a move is valid.
 */

/**
 * Loads a level and returns the level data.
 * @param {number} levelId - The level number to load.
 * @returns {LevelData} The structured data for the loaded level.
 */
function loadLevel(levelId) {
    // Local arrays for this level
    let circles = [];
    let pieces = [];
    let scrambleFunc, testFunc;

    if (levelId === 1) {
        let r = 250;
        circles = [
            new Circle(-r / sqrt2, 0, r, 6),
            new Circle(r / sqrt2, 0, r, 6)
        ];
        // Level 1 pieces
        const svg00 = loadSVG('shield-4', 'red', r / 50);
        const svg01 = loadSVG('shield-4', 'green', r / 50);
        const svg02 = loadSVG('shield-4', 'yellow', r / 50);
        const bias0x = -0.275 * r, bias0y = -0.194 * r;
        genPiece(pieces, svg00, bias0x, bias0y, circles[0], 4, sqrt6 / 3 * r, 90, 60, 0);
        genPiece(pieces, svg01, bias0x, bias0y, circles[1], 4, sqrt6 / 3 * r, -90, 0, 1);
        genPiece(pieces, svg02, bias0x, bias0y, circles[1], 2, sqrt6 / 3 * r, 150, 0, 2);

        const svg10 = loadSVG('pillow-4', 'red', r / 50);
        const svg11 = loadSVG('pillow-4', 'green', r / 50);
        const svg12 = loadSVG('pillow-4', 'yellow', r / 50);
        const bias1x = -0.303 * r, bias1y = -0.27 * r;
        genPiece(pieces, svg10, bias1x, bias1y, circles[0], 5, r / sqrt2, 60, 60, 0);
        genPiece(pieces, svg11, bias1x, bias1y, circles[1], 5, r / sqrt2, -120, 60, 1);
        genPiece(pieces, svg12, bias1x, bias1y, circles[0], 1, r / sqrt2, 0, 0, 2);

        const svg20 = loadSVG('hex-4', 'red', r / 50);
        const svg21 = loadSVG('hex-4', 'green', r / 50);
        const bias2x = -0.46 * r, bias2y = -0.53 * r;
        genPiece(pieces, svg20, bias2x, bias2y, circles[0], 1, 0, 0, 0, 0);
        genPiece(pieces, svg21, bias2x, bias2y, circles[1], 1, 0, 0, 0, 1);

        scrambleFunc = generateScrambleFunc([10, 11, 1, 1], pieces);
        testFunc = (x, y, a, b) => {
            if (b === 0) return circles[0].containsPoint(x, y) && !circles[1].containsPoint(x, y);
            else if (b === 1) return circles[1].containsPoint(x, y) && !circles[0].containsPoint(x, y);
            else return circles[0].containsPoint(x, y) && circles[1].containsPoint(x, y);
        };
    }
    else if (levelId === 2) {
        let r = 300;
        circles = [
            new Circle(-r / 2, 0, r, 6),
            new Circle(r / 2, 0, r, 6)
        ];
        
        const svg00 = loadSVG('lens-6', 'cyan', r / 50);
        const svg01 = loadSVG('lens-6', 'blue', r / 50);
        const bias0x = -0.145 * r, bias0y = -0.52 * r;
        genPiece(pieces, svg00, bias0x, bias0y, circles[1], 6, r / 2, 0, 90, 0);
        genPiece(pieces, svg00, bias0x, bias0y, circles[1], 6, r / 2 * sqrt3, 30, 30, 0);
        genPiece(pieces, svg01, bias0x, bias0y, circles[0], 3, r / 2, 120, 210, 1);
        genPiece(pieces, svg01, bias0x, bias0y, circles[0], 4, r / 2 * sqrt3, 90, 90, 1);

        const svg10 = loadSVG('tri-6', 'cyan', r / 50);
        const svg11 = loadSVG('tri-6', 'blue', r / 50);
        const bias1x = -0.435 * r, bias1y = -0.62 * r;
        genPiece(pieces, svg10, bias1x, bias1y, circles[1], 6, r / 2, -30, 0, 0);
        genPiece(pieces, svg11, bias1x, bias1y, circles[0], 4, r / 2, 90, 120, 1);

        scrambleFunc = generateScrambleFunc([19, 10], pieces);
        testFunc = (x, y, a, b) => {
            if (b === 0) return circles[1].containsPoint(x, y);
            else return !circles[1].containsPoint(x, y);
        };
    }
    else if (levelId === 3) {
        let r = 300, rs = 2 * r * sind(15);
        circles = [
            new Circle(r * sqrt3 / 2, -r / 2, rs, 3),
            new Circle(-r * sqrt3 / 2, -r / 2, rs, 3),
            new Circle(0, 0, r, 6)
        ];

        const svg00 = loadSVG('lens-12', 'orange', r / 50);
        const svg01 = loadSVG('lens-12', 'purple', r / 50);
        const svg02 = loadSVG('lens-12', 'white', r / 50);
        const bias0x = -0.03 * r, bias0y = -0.17 * r;
        genPiece(pieces, svg00, bias0x, bias0y, circles[0], 3, r / 2, 90, 90, 0);
        genPiece(pieces, svg01, bias0x, bias0y, circles[1], 3, r / 2, 90, 90, 1);
        genPiece(pieces, svg02, bias0x, bias0y, circles[2], 2, r / 2 * sqrt3, 60, -30, 2);

        const svg10 = loadSVG('rocket-12', 'orange', r / 50);
        const svg11 = loadSVG('rocket-12', 'purple', r / 50);
        const svg12 = loadSVG('rocket-12', 'white', r / 50);
        const bias1x = -0.145 * r, bias1y = -0.285 * r;
        genPiece(pieces, svg10, bias1x, bias1y, circles[0], 3, rs / 2, -30, -120, 0);
        genPiece(pieces, svg11, bias1x, bias1y, circles[1], 3, rs / 2, -30, -120, 1);
        let temp_rss = (r - rs) / 2,
            tmp_r = Math.sqrt(r * r * 0.75 + temp_rss * temp_rss),
            tmp_d = Math.atan2(r * 0.75 - temp_rss / 2, r * sqrt3 / 4 + temp_rss * sqrt3 / 2) * 180 / Math.PI;
        genPiece(pieces, svg12, bias1x, bias1y, circles[2], 3, tmp_r, tmp_d, 60, 2);
        genPiece(pieces, svg12, bias1x, bias1y, circles[2], 1, tmp_r, tmp_d - 120, -60, 2);
        genPiece(pieces, svg12, bias1x, bias1y, circles[2], 3, tmp_r, 60 - tmp_d, 180, 2);
        genPiece(pieces, svg12, bias1x, bias1y, circles[2], 1, tmp_r, -60 - tmp_d, 60, 2);

        const svg20 = loadSVG('mushroom-12', 'orange', r / 50);
        const svg21 = loadSVG('mushroom-12', 'purple', r / 50);
        const svg22 = loadSVG('mushroom-12', 'white', r / 50);
        const bias2x = -0.385 * r, bias2y = -0.264 * r;
        genPiece(pieces, svg20, bias2x, bias2y, circles[0], 3, rs / 2, 30, 120, 0);
        genPiece(pieces, svg21, bias2x, bias2y, circles[1], 3, rs / 2, 30, 120, 1);
        genPiece(pieces, svg22, bias2x, bias2y, circles[2], 3, r - rs / 2, 30, -60, 2);
        genPiece(pieces, svg22, bias2x, bias2y, circles[2], 1, r - rs / 2, -90, 180, 2);

        scrambleFunc = generateScrambleFunc([8, 14, 10], pieces);
        testFunc = (x, y, a, b) => {
            if (b === 0) return circles[0].containsPoint(x, y);
            else if (b === 1) return circles[1].containsPoint(x, y);
            else return !circles[0].containsPoint(x, y) && !circles[1].containsPoint(x, y);
        };
    }

    // Instead of using global variables, we return a structure with the level data.
    const levelData = {
        circles,
        pieces,
        scrambleFunc,
        testFunc
    };
    return levelData;
}

function initViewBox(pieces, viewbox, mainViewBox=true) {
    viewbox.innerHTML = '';
    pieces.forEach(p => {
        const svgClone = mainViewBox ? p.svg.cloneNode(true) : p.svg;
        let origin = rotate(p.win_x, p.win_y, p.win_x + p.bias_x, p.win_y + p.bias_y, p.win_a);
        svgClone.setAttribute('transform', `translate(${origin.x}, ${origin.y}) rotate(${p.win_a})`);
        viewbox.appendChild(svgClone);
    });
}