
const sqrt2 = Math.sqrt(2), sqrt3 = Math.sqrt(3), sqrt6 = Math.sqrt(6), pi = Math.PI;
const sin15 = Math.sin(pi / 12), cos15 = Math.cos(pi / 12), cos45 = Math.sin(pi / 4), cos30 = Math.cos(pi / 6);

class Circle {
    constructor(x, y, r, s, innerR=0) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.s = s;
        this.innerR = innerR;
    }

    containsPoint(x, y) {
        let dist = distance(x, y, this.x, this.y);
        return dist <= this.r && dist >= this.innerR;
    }
}

class Piece {
    constructor(svg, x, y, a, b) {
        this.svg = svg;
        this.x = x;
        this.y = y;
        this.a = a;
        this.b = b;
        this.win_x = x;
        this.win_y = y;
        this.win_a = a;
    }

    refreshGraphics() {
        let origin = rotate(this.x, this.y, this.x, this.y, this.a);
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
    let angle = (Math.atan2(y1 - y2, x1 - x2) - Math.atan2(y3 - y2, x3 - x2)) * 180 / Math.PI;
    return (angle + 360) % 360;
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

function createCirclePath(r) {
    return `M 0, ${-r} A ${r},${r} 0 1,0 0,${r} A ${r},${r} 0 1,0 0,${-r} Z`;
}

function createArcPath(arcPts, arcParams) {
    let path = [`M ${arcPts[0].x} ${arcPts[0].y}`];
    for (let i = 0; i < arcPts.length; i++) {
        let nextPoint = arcPts[(i + 1) % arcPts.length];
        let params = arcParams[i];
        path.push(`A ${params.r} ${params.r} 0 ${params.largeArcFlag} ${params.sweepFlag} ${nextPoint.x} ${nextPoint.y}`);
    }
    path.push('Z'); // Close the path
    return path.join(' ');
}

function loadSVG(pathData, color) {
    if (pathData.length < 20) {
        pathData = document.getElementById(pathData).cloneNode(true).getAttribute('d');
    }
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', color);
    path.setAttribute('display', 'inline');
    g.appendChild(path);
    const g2 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g2.appendChild(g);
    return g2;
}

function genPiece(pieces, svg, circle, n, r, posAngle, rot, color) {
    for (let i = 0; i < n; i++) {
        pieces.push(new Piece(
            svg.cloneNode(true),
            circle.x + r * cosd(posAngle + 360 / circle.s * i),
            circle.y + r * sind(posAngle + 360 / circle.s * i),
            rot + 360 / circle.s * i,
            color
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
    let scrambleFunc, testFunc, name = '';

    if (levelId === 4813) {
        let r = 250;
        circles = [
            new Circle(-r / sqrt2, 0, r, 6),
            new Circle(r / sqrt2, 0, r, 6)
        ];
        // shield-4
        const r_shield4 = r * (cos15 - cos45) * 2 / sqrt3;
        const pathShield4 = createArcPath([
            { x: 0, y: r_shield4 },
            { x: r_shield4 * cos30, y: -r_shield4 / 2 },
            { x: -r_shield4 * cos30, y: -r_shield4 / 2 }
        ], [
            { r: r, largeArcFlag: 0, sweepFlag: 0},
            { r: r, largeArcFlag: 0, sweepFlag: 0},
            { r: r, largeArcFlag: 0, sweepFlag: 0}
        ]);
        const svg00 = loadSVG(pathShield4, 'red');
        const svg01 = loadSVG(pathShield4, 'green');
        const svg02 = loadSVG(pathShield4, 'yellow');
        genPiece(pieces, svg00, circles[0], 4, sqrt6 / 3 * r, 90, 60, 0);
        genPiece(pieces, svg01, circles[1], 4, sqrt6 / 3 * r, -90, 0, 1);
        genPiece(pieces, svg02, circles[1], 2, sqrt6 / 3 * r, 150, 0, 2);

        // pillow-4
        const pathPillow4 = createArcPath([
            { x: r * (cos15 - cos45), y : r * sin15 },
            { x: r * (cos15 - cos45), y : -r * sin15 },
            { x: -r * (cos15 - cos45), y : -r * sin15 },
            { x: -r * (cos15 - cos45), y : r * sin15 }
        ], [
            { r: r, largeArcFlag: 0, sweepFlag: 0},
            { r: r, largeArcFlag: 0, sweepFlag: 1},
            { r: r, largeArcFlag: 0, sweepFlag: 0},
            { r: r, largeArcFlag: 0, sweepFlag: 1}
        ]);
        const svg10 = loadSVG(pathPillow4, 'red');
        const svg11 = loadSVG(pathPillow4, 'green');
        const svg12 = loadSVG(pathPillow4, 'yellow');
        genPiece(pieces, svg10, circles[0], 5, r / sqrt2, 60, 60, 0);
        genPiece(pieces, svg11, circles[1], 5, r / sqrt2, -120, 60, 1);
        genPiece(pieces, svg12, circles[0], 1, r / sqrt2, 0, 0, 2);

        // hex-4
        const rHex4 = 2 * r * sin15;
        const pathHex4 = createArcPath([
            { x: 0, y: rHex4 },
            { x: rHex4 * cos30, y: rHex4 / 2 },
            { x: rHex4 * cos30, y: -rHex4 / 2 },
            { x: 0, y: -rHex4 },
            { x: -rHex4 * cos30, y: -rHex4 / 2 },
            { x: -rHex4 * cos30, y: rHex4 / 2 }
        ], [
            { r: r, largeArcFlag: 0, sweepFlag: 1},
            { r: r, largeArcFlag: 0, sweepFlag: 1},
            { r: r, largeArcFlag: 0, sweepFlag: 1},
            { r: r, largeArcFlag: 0, sweepFlag: 1},
            { r: r, largeArcFlag: 0, sweepFlag: 1},
            { r: r, largeArcFlag: 0, sweepFlag: 1}
        ]);
        const svg20 = loadSVG(pathHex4, 'red');
        const svg21 = loadSVG(pathHex4, 'green');
        genPiece(pieces, svg20, circles[0], 1, 0, 0, 0, 0);
        genPiece(pieces, svg21, circles[1], 1, 0, 0, 0, 1);

        scrambleFunc = generateScrambleFunc([10, 11, 1, 1], pieces);
        testFunc = (x, y, a, b) => {
            if (b === 0) return circles[0].containsPoint(x, y) && !circles[1].containsPoint(x, y);
            else if (b === 1) return circles[1].containsPoint(x, y) && !circles[0].containsPoint(x, y);
            else return circles[0].containsPoint(x, y) && circles[1].containsPoint(x, y);
        };
    }
    else if (levelId === 5639) {
        let r = 300;
        circles = [
            new Circle(-r / 2, 0, r, 6),
            new Circle(r / 2, 0, r, 6)
        ];
        
        // lens-6
        const pathLens6 = createArcPath([
            { x: 0, y: r / 2  },
            { x: 0, y: -r / 2 }
        ], [
            { r: r, largeArcFlag: 0, sweepFlag: 1},
            { r: r, largeArcFlag: 0, sweepFlag: 1}
        ]);
        const svg00 = loadSVG(pathLens6, 'cyan');
        const svg01 = loadSVG(pathLens6, 'blue');
        genPiece(pieces, svg00, circles[1], 6, r / 2, 0, 90, 0);
        genPiece(pieces, svg00, circles[1], 6, r / 2 * sqrt3, 30, 30, 0);
        genPiece(pieces, svg01, circles[0], 3, r / 2, 120, 210, 1);
        genPiece(pieces, svg01, circles[0], 4, r / 2 * sqrt3, 90, 90, 1);

        // tri-6
        const pathTri6 = createArcPath([
            { x: 0, y: r / sqrt3 },
            { x: r / 2, y: -r / 2 / sqrt3 },
            { x: -r / 2, y: -r / 2 / sqrt3 }
        ], [
            { r: r, largeArcFlag: 0, sweepFlag: 1},
            { r: r, largeArcFlag: 0, sweepFlag: 1},
            { r: r, largeArcFlag: 0, sweepFlag: 1}
        ]);
        const svg10 = loadSVG(pathTri6, 'cyan');
        const svg11 = loadSVG(pathTri6, 'blue');
        genPiece(pieces, svg10, circles[1], 6, r / sqrt3, -30, 60, 0);
        genPiece(pieces, svg11, circles[0], 4, r / sqrt3, 90, 60, 1);

        scrambleFunc = generateScrambleFunc([19, 10], pieces);
        testFunc = (x, y, a, b) => {
            if (b === 0) return circles[1].containsPoint(x, y);
            else return !circles[1].containsPoint(x, y);
        };
    }
    else if (levelId === 3623) {
        let r = 300, rs = 2 * r * sind(15);
        circles = [
            new Circle(r * sqrt3 / 2, -r / 2, rs, 3),
            new Circle(-r * sqrt3 / 2, -r / 2, rs, 3),
            new Circle(0, 0, r, 6)
        ];

        // lens-12
        const pathLens12 = createArcPath([
            { x: 0, y:  rs * sin15 },
            { x: 0, y: -rs * sin15 }
        ], [
            { r: rs, largeArcFlag: 0, sweepFlag: 1},
            { r: rs, largeArcFlag: 0, sweepFlag: 1}
        ]);
        const svg00 = loadSVG(pathLens12, 'orange');
        const svg01 = loadSVG(pathLens12, 'purple');
        const svg02 = loadSVG(pathLens12, 'white');
        genPiece(pieces, svg00, circles[0], 3, r / 2, 90, 90, 0);
        genPiece(pieces, svg01, circles[1], 3, r / 2, 90, 90, 1);
        genPiece(pieces, svg02, circles[2], 2, r / 2 * sqrt3, 60, -30, 2);

        // rocket-12
        const temp_rss = (r - rs) / 2,
            tmp_r = Math.sqrt(r * r * 0.75 + temp_rss * temp_rss),
            tmp_d = Math.atan2(r * 0.75 - temp_rss / 2, r * sqrt3 / 4 + temp_rss * sqrt3 / 2) * 180 / Math.PI;
        const pathRocket12 = createArcPath([
            { x: 0, y: -rs / 2 },
            { x:  rs * sin15, y: temp_rss },
            { x: -rs * sin15, y: temp_rss }
        ], [
            { r: r,  largeArcFlag: 0, sweepFlag: 1},
            { r: rs, largeArcFlag: 0, sweepFlag: 0},
            { r: r,  largeArcFlag: 0, sweepFlag: 1}
        ]);
        const svg10 = loadSVG(pathRocket12, 'orange');
        const svg11 = loadSVG(pathRocket12, 'purple');
        const svg12 = loadSVG(pathRocket12, 'white');
        genPiece(pieces, svg10, circles[0], 3, rs / 2, -30, -120, 0);
        genPiece(pieces, svg11, circles[1], 3, rs / 2, -30, -120, 1);
        genPiece(pieces, svg12, circles[2], 3, tmp_r, tmp_d, 60, 2);
        genPiece(pieces, svg12, circles[2], 1, tmp_r, tmp_d - 120, -60, 2);
        genPiece(pieces, svg12, circles[2], 3, tmp_r, 60 - tmp_d, 180, 2);
        genPiece(pieces, svg12, circles[2], 1, tmp_r, -60 - tmp_d, 60, 2);

        // mushroom-12
        const pathMushroom12 = createArcPath([
            { x: 0, y: r / 4 },
            { x:  rs * cos45, y: r / 4 - rs * cos45 },
            { x: -rs * cos45, y: r / 4 - rs * cos45 }
        ], [
            { r: r,  largeArcFlag: 0, sweepFlag: 1},
            { r: rs, largeArcFlag: 0, sweepFlag: 0},
            { r: r,  largeArcFlag: 0, sweepFlag: 1}
        ]);
        const svg20 = loadSVG(pathMushroom12, 'orange');
        const svg21 = loadSVG(pathMushroom12, 'purple');
        const svg22 = loadSVG(pathMushroom12, 'white');
        genPiece(pieces, svg20, circles[0], 3, rs / 2, 30, 120, 0);
        genPiece(pieces, svg21, circles[1], 3, rs / 2, 30, 120, 1);
        genPiece(pieces, svg22, circles[2], 3, r - rs / 2, 30, -60, 2);
        genPiece(pieces, svg22, circles[2], 1, r - rs / 2, -90, 180, 2);

        // hex-6
        const rHex6 = r - 2 * rs * sin15;
        const pathHex6 = createArcPath([
            { x: 0, y: rHex6 },
            { x: rHex6 * cos30, y: rHex6 / 2 },
            { x: rHex6 * cos30, y: -rHex6 / 2 },
            { x: 0, y: -rHex6 },
            { x: -rHex6 * cos30, y: -rHex6 / 2 },
            { x: -rHex6 * cos30, y: rHex6 / 2 }
        ], [
            { r: rs, largeArcFlag: 0, sweepFlag: 1},
            { r: rs, largeArcFlag: 0, sweepFlag: 1},
            { r: rs, largeArcFlag: 0, sweepFlag: 1},
            { r: rs, largeArcFlag: 0, sweepFlag: 1},
            { r: rs, largeArcFlag: 0, sweepFlag: 1},
            { r: rs, largeArcFlag: 0, sweepFlag: 1}
        ]);
        const svg30 = loadSVG(pathHex6, 'white');
        genPiece(pieces, svg30, circles[2], 1, 0, 0, 30, 2);

        scrambleFunc = generateScrambleFunc([8, 14, 10, 1], pieces);
        testFunc = (x, y, a, b) => {
            if (b === 0) return circles[0].containsPoint(x, y);
            else if (b === 1) return circles[1].containsPoint(x, y);
            else return !circles[0].containsPoint(x, y) && !circles[1].containsPoint(x, y);
        };
    }
    else if (levelId == 2767) {
        let r = 200, rc = r * 2 / sqrt6, halfY = r * sqrt6 / 4;
        circles = [
            new Circle(0, -halfY, r, 6),
            new Circle(-r / sqrt2, halfY, r, 6),
            new Circle(r / sqrt2, halfY, r, 6)
        ];
        // shield-4
        const r_shield4 = r * (cos15 - cos45) * 2 / sqrt3;
        const pathShield4 = createArcPath([
            { x: 0, y: r_shield4 },
            { x: r_shield4 * cos30, y: -r_shield4 / 2 },
            { x: -r_shield4 * cos30, y: -r_shield4 / 2 }
        ], [
            { r: r, largeArcFlag: 0, sweepFlag: 0},
            { r: r, largeArcFlag: 0, sweepFlag: 0},
            { r: r, largeArcFlag: 0, sweepFlag: 0}
        ]);
        const svg00 = loadSVG(pathShield4, 'red');
        const svg01 = loadSVG(pathShield4, 'green');
        const svg02 = loadSVG(pathShield4, 'blue');
        const svg03 = loadSVG(pathShield4, 'yellow');
        const svg04 = loadSVG(pathShield4, 'purple');
        const svg05 = loadSVG(pathShield4, 'cyan');
        const svg06 = loadSVG(pathShield4, 'white');
        genPiece(pieces, svg00, circles[0], 3, sqrt6 / 3 * r, -150, 60, 0);
        genPiece(pieces, svg01, circles[1], 3, sqrt6 / 3 * r,   90, 60, 1);
        genPiece(pieces, svg02, circles[2], 3, sqrt6 / 3 * r,  -30, 60, 3);
        genPiece(pieces, svg03, circles[0], 1, sqrt6 / 3 * r,  150,  0, 2);
        genPiece(pieces, svg04, circles[0], 1, sqrt6 / 3 * r,   30,  0, 4);
        genPiece(pieces, svg05, circles[1], 1, sqrt6 / 3 * r,   30,  0, 5);
        genPiece(pieces, svg06, circles[1], 1, sqrt6 / 3 * r,  -30, 60, 6);

        // pillow-4
        const pathPillow4 = createArcPath([
            { x: r * (cos15 - cos45), y : r * sin15 },
            { x: r * (cos15 - cos45), y : -r * sin15 },
            { x: -r * (cos15 - cos45), y : -r * sin15 },
            { x: -r * (cos15 - cos45), y : r * sin15 }
        ], [
            { r: r, largeArcFlag: 0, sweepFlag: 0},
            { r: r, largeArcFlag: 0, sweepFlag: 1},
            { r: r, largeArcFlag: 0, sweepFlag: 0},
            { r: r, largeArcFlag: 0, sweepFlag: 1}
        ]);
        const svg10 = loadSVG(pathPillow4, 'red');
        const svg11 = loadSVG(pathPillow4, 'green');
        const svg12 = loadSVG(pathPillow4, 'blue');
        const svg13 = loadSVG(pathPillow4, 'yellow');
        const svg14 = loadSVG(pathPillow4, 'purple');
        const svg15 = loadSVG(pathPillow4, 'cyan');
        genPiece(pieces, svg10, circles[0], 4, r / sqrt2, -180,   0, 0);
        genPiece(pieces, svg11, circles[1], 4, r / sqrt2,   60,  60, 1);
        genPiece(pieces, svg12, circles[2], 4, r / sqrt2,  -60, 120, 3);
        genPiece(pieces, svg13, circles[0], 1, r / sqrt2,  120, 120, 2);
        genPiece(pieces, svg14, circles[0], 1, r / sqrt2,   60,  60, 4);
        genPiece(pieces, svg15, circles[1], 1, r / sqrt2,    0,   0, 5);

        // hex-4
        const rHex4 = 2 * r * sin15;
        const pathHex4 = createArcPath([
            { x: 0, y: rHex4 },
            { x: rHex4 * cos30, y: rHex4 / 2 },
            { x: rHex4 * cos30, y: -rHex4 / 2 },
            { x: 0, y: -rHex4 },
            { x: -rHex4 * cos30, y: -rHex4 / 2 },
            { x: -rHex4 * cos30, y: rHex4 / 2 }
        ], [
            { r: r, largeArcFlag: 0, sweepFlag: 1},
            { r: r, largeArcFlag: 0, sweepFlag: 1},
            { r: r, largeArcFlag: 0, sweepFlag: 1},
            { r: r, largeArcFlag: 0, sweepFlag: 1},
            { r: r, largeArcFlag: 0, sweepFlag: 1},
            { r: r, largeArcFlag: 0, sweepFlag: 1}
        ]);
        const svg20 = loadSVG(pathHex4, 'red');
        const svg21 = loadSVG(pathHex4, 'green');
        const svg22 = loadSVG(pathHex4, 'blue');
        genPiece(pieces, svg20, circles[0], 1, 0, 0, 0, 0);
        genPiece(pieces, svg21, circles[1], 1, 0, 0, 0, 1);
        genPiece(pieces, svg22, circles[2], 1, 0, 0, 0, 3);

        scrambleFunc = generateScrambleFunc([13, 15, 1, 1, 1], pieces);
        testFunc = (x, y, a, b) => {
            let flag = circles[0].containsPoint(x, y) | circles[1].containsPoint(x, y) << 1 | circles[2].containsPoint(x, y) << 2;
            return flag === b + 1;
        };
    }
    else if (levelId === 9547) {
        name = 'Hungarian Rings';
        
        let r = 250; // Radius of the rings
        let ballRadius = 30; // Radius of each ball
        
        // Define two overlapping circles
        circles = [
            new Circle(-r / sqrt2, 0, r+ballRadius, 20, innerR=r-ballRadius), // Left circle
            new Circle( r / sqrt2, 0, r+ballRadius, 20, innerR=r-ballRadius) // Right circle
        ];
        
        // Generate the pieces (balls)
        const colors = ['red', 'blue', 'green', 'yellow']; // Ball colors
        let svgBalls = colors.map(color => loadSVG(createCirclePath(ballRadius), color));
        genPiece(pieces, svgBalls[0], circles[0], 10, r, -27, 0, 0);
        genPiece(pieces, svgBalls[1], circles[0], 9,  r, 153, 0, 1);
        genPiece(pieces, svgBalls[2], circles[1], 9,  r, -27, 0, 2);
        genPiece(pieces, svgBalls[3], circles[1], 10, r, 153, 0, 3);
    
        // Scramble function to shuffle balls
        scrambleFunc = generateScrambleFunc([38], pieces);
    
        // Function to check if a move is valid (a ball belongs to a ring)
        testFunc = (x, y, a, b) => {
            let circleIdx = b < 2 ? 0 : 1;
            let side = (y - circles[circleIdx].y) + (x - circles[circleIdx].x) < 0 ? 1 : 0;
            return circles[circleIdx].containsPoint(x, y) && b % 2 === side;
        };
    }
    
    // Instead of using global variables, we return a structure with the level data.
    const levelData = {
        circles,
        pieces,
        scrambleFunc,
        testFunc,
        name
    };
    return levelData;
}

function initViewBox(pieces, viewbox, mainViewBox=true) {
    viewbox.innerHTML = '';
    pieces.forEach(p => {
        const svgClone = mainViewBox ? p.svg.cloneNode(true) : p.svg;
        let origin = rotate(p.win_x, p.win_y, p.win_x, p.win_y, p.win_a);
        svgClone.setAttribute('transform', `translate(${origin.x}, ${origin.y}) rotate(${p.win_a})`);
        viewbox.appendChild(svgClone);
    });
}