/**
 * Colony Conquest - Mathematical Utilities
 * Hexagonal grid mathematics and utility functions
 */

import { HEX_CONSTANTS } from './constants.js';

/**
 * Hexagonal Grid Mathematics
 * Using cube coordinates (q, r, s) where q + r + s = 0
 */

/**
 * Create a hex coordinate object
 * @param {number} q - Q coordinate
 * @param {number} r - R coordinate
 * @returns {Object} Hex coordinate {q, r, s}
 */
export function hex(q, r) {
    return { q: q, r: r, s: -q - r };
}

/**
 * Add two hex coordinates
 * @param {Object} a - First hex coordinate
 * @param {Object} b - Second hex coordinate
 * @returns {Object} Sum of coordinates
 */
export function hexAdd(a, b) {
    return hex(a.q + b.q, a.r + b.r);
}

/**
 * Subtract two hex coordinates
 * @param {Object} a - First hex coordinate
 * @param {Object} b - Second hex coordinate
 * @returns {Object} Difference of coordinates
 */
export function hexSubtract(a, b) {
    return hex(a.q - b.q, a.r - b.r);
}

/**
 * Scale a hex coordinate
 * @param {Object} hexCoord - Hex coordinate to scale
 * @param {number} factor - Scale factor
 * @returns {Object} Scaled hex coordinate
 */
export function hexScale(hexCoord, factor) {
    return hex(hexCoord.q * factor, hexCoord.r * factor);
}

/**
 * Get the distance between two hex coordinates
 * @param {Object} a - First hex coordinate
 * @param {Object} b - Second hex coordinate
 * @returns {number} Distance in hex units
 */
export function hexDistance(a, b) {
    const diff = hexSubtract(a, b);
    return (Math.abs(diff.q) + Math.abs(diff.q + diff.r) + Math.abs(diff.r)) / 2;
}

/**
 * Get a neighbor hex coordinate in the given direction
 * @param {Object} hexCoord - Starting hex coordinate
 * @param {number} direction - Direction index (0-5)
 * @returns {Object} Neighbor hex coordinate
 */
export function hexNeighbor(hexCoord, direction) {
    return hexAdd(hexCoord, HEX_CONSTANTS.DIRECTIONS[direction]);
}

/**
 * Get all neighbors of a hex coordinate
 * @param {Object} hexCoord - Center hex coordinate
 * @returns {Array} Array of neighbor hex coordinates
 */
export function hexNeighbors(hexCoord) {
    const neighbors = [];
    for (let i = 0; i < 6; i++) {
        neighbors.push(hexNeighbor(hexCoord, i));
    }
    return neighbors;
}

/**
 * Convert hex coordinates to pixel coordinates
 * @param {Object|number} hexCoordOrQ - Hex coordinate {q, r, s} or Q coordinate
 * @param {number} sizeOrR - Hex size (radius) or R coordinate if first param is Q
 * @param {Object|number} originOrSize - Origin point {x, y} or size if using Q,R params
 * @param {Object} origin - Origin point {x, y} (only used with Q,R,size params)
 * @returns {Object} Pixel coordinates {x, y}
 */
export function hexToPixel(hexCoordOrQ, sizeOrR, originOrSize = { x: 0, y: 0 }, origin = { x: 0, y: 0 }) {
    let hexCoord, size, originPoint;
    
    // Handle different parameter patterns
    if (typeof hexCoordOrQ === 'object') {
        // Called with (hexCoord, size, origin)
        hexCoord = hexCoordOrQ;
        size = sizeOrR;
        originPoint = originOrSize;
    } else {
        // Called with (q, r, size, origin) or (q, r, size)
        hexCoord = { q: hexCoordOrQ, r: sizeOrR };
        size = originOrSize;
        originPoint = origin;
    }
    
    const orientation = HEX_CONSTANTS.ORIENTATION;
    const x = (orientation.f0 * hexCoord.q + orientation.f1 * hexCoord.r) * size;
    const y = (orientation.f2 * hexCoord.q + orientation.f3 * hexCoord.r) * size;
    return { x: x + originPoint.x, y: y + originPoint.y };
}

/**
 * Convert pixel coordinates to hex coordinates
 * @param {Object} point - Pixel coordinates {x, y}
 * @param {number} size - Hex size (radius)
 * @param {Object} origin - Origin point {x, y}
 * @returns {Object} Hex coordinate {q, r, s}
 */
export function pixelToHex(point, size, origin = { x: 0, y: 0 }) {
    const orientation = HEX_CONSTANTS.ORIENTATION;
    const pt = { x: (point.x - origin.x) / size, y: (point.y - origin.y) / size };
    const q = orientation.b0 * pt.x + orientation.b1 * pt.y;
    const r = orientation.b2 * pt.x + orientation.b3 * pt.y;
    return hexRound(hex(q, r));
}

/**
 * Round fractional hex coordinates to the nearest hex
 * @param {Object} hexCoord - Fractional hex coordinate
 * @returns {Object} Rounded hex coordinate
 */
export function hexRound(hexCoord) {
    let q = Math.round(hexCoord.q);
    let r = Math.round(hexCoord.r);
    let s = Math.round(hexCoord.s);
    
    const q_diff = Math.abs(q - hexCoord.q);
    const r_diff = Math.abs(r - hexCoord.r);
    const s_diff = Math.abs(s - hexCoord.s);
    
    if (q_diff > r_diff && q_diff > s_diff) {
        q = -r - s;
    } else if (r_diff > s_diff) {
        r = -q - s;
    } else {
        s = -q - r;
    }
    
    return { q: q, r: r, s: s };
}

/**
 * Get hex coordinates for a rectangular grid layout
 * @param {number} width - Grid width
 * @param {number} height - Grid height
 * @returns {Array} Array of hex coordinates for the grid
 */
export function generateHexGrid(width, height) {
    const hexes = [];
    
    for (let r = 0; r < height; r++) {
        const r_offset = Math.floor(r / 2);
        for (let q = -r_offset; q < width - r_offset; q++) {
            hexes.push(hex(q, r));
        }
    }
    
    return hexes;
}

/**
 * Check if a hex coordinate is within grid bounds
 * @param {Object} hexCoord - Hex coordinate to check
 * @param {number} gridSize - Size of the grid (assumes square grid)
 * @returns {boolean} True if within bounds
 */
export function isHexInBounds(hexCoord, gridSize) {
    const radius = Math.floor(gridSize / 2);
    return hexDistance(hex(0, 0), hexCoord) <= radius;
}

/**
 * Get the corner coordinates of a hexagon in pixel space
 * @param {Object} center - Center point {x, y}
 * @param {number} size - Hex size (radius)
 * @returns {Array} Array of corner points [{x, y}, ...]
 */
export function hexCorners(center, size) {
    const corners = [];
    const orientation = HEX_CONSTANTS.ORIENTATION;
    
    for (let i = 0; i < 6; i++) {
        const angle = 2 * Math.PI * (orientation.start_angle + i) / 6;
        const x = center.x + size * Math.cos(angle);
        const y = center.y + size * Math.sin(angle);
        corners.push({ x: x, y: y });
    }
    
    return corners;
}

/**
 * General Math Utilities
 */

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Calculate distance between two points
 * @param {Object} a - First point {x, y}
 * @param {Object} b - Second point {x, y}
 * @returns {number} Distance
 */
export function distance(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random float
 */
export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Choose a random element from an array
 * @param {Array} array - Array to choose from
 * @returns {*} Random element
 */
export function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array (modifies original)
 */
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
