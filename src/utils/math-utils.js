/**
 * Math utility functions for Colony Conquest
 * Primarily focused on hexagonal grid calculations
 */

const MathUtils = (function() {
    /**
     * Convert hex grid coordinates to pixel coordinates for rendering
     * Using pointy-top orientation
     * 
     * @param {number} hexQ - Hex grid Q coordinate (column)
     * @param {number} hexR - Hex grid R coordinate (row)
     * @param {number} hexRadius - Radius of hexagon in pixels
     * @returns {{x: number, y: number}} Pixel coordinates
     */
    function hexToPixel(hexQ, hexR, hexRadius) {
        const x = hexRadius * (Math.sqrt(3) * hexQ + Math.sqrt(3) / 2 * hexR);
        const y = hexRadius * (3/2 * hexR);
        return { x, y };
    }

    /**
     * Convert pixel coordinates to hex grid coordinates
     * Using pointy-top orientation
     * 
     * @param {number} pixelX - Screen X coordinate
     * @param {number} pixelY - Screen Y coordinate
     * @param {number} hexRadius - Radius of hexagon in pixels
     * @returns {{q: number, r: number}} Hex grid fractional coordinates
     */
    function pixelToHex(pixelX, pixelY, hexRadius) {
        const q = (Math.sqrt(3)/3 * pixelX - 1/3 * pixelY) / hexRadius;
        const r = (2/3 * pixelY) / hexRadius;
        return { q, r };
    }

    /**
     * Rounds fractional hex coordinates to nearest integer hex coordinates
     * 
     * @param {number} q - Fractional Q coordinate
     * @param {number} r - Fractional R coordinate
     * @returns {{q: number, r: number, s: number}} Integer hex coordinates
     */
    function hexRound(q, r) {
        let s = -q - r;
        let qi = Math.round(q);
        let ri = Math.round(r);
        let si = Math.round(s);
        
        const qDiff = Math.abs(qi - q);
        const rDiff = Math.abs(ri - r);
        const sDiff = Math.abs(si - s);
        
        if (qDiff > rDiff && qDiff > sDiff) {
            qi = -ri - si;
        } else if (rDiff > sDiff) {
            ri = -qi - si;
        } else {
            si = -qi - ri;
        }
        
        return { q: qi, r: ri, s: si };
    }
    
    /**
     * Get all neighboring hex coordinates for a given hex
     * 
     * @param {number} q - Hex Q coordinate
     * @param {number} r - Hex R coordinate
     * @returns {Array<{q: number, r: number}>} Array of neighbor coordinates
     */
    function getHexNeighbors(q, r) {
        const directions = [
            { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
            { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
        ];
        
        return directions.map(dir => ({
            q: q + dir.q,
            r: r + dir.r
        }));
    }
    
    /**
     * Calculate distance between two hex coordinates
     * 
     * @param {number} q1 - First hex Q coordinate
     * @param {number} r1 - First hex R coordinate
     * @param {number} q2 - Second hex Q coordinate
     * @param {number} r2 - Second hex R coordinate
     * @returns {number} Distance in hex units
     */
    function getHexDistance(q1, r1, q2, r2) {
        const s1 = -q1 - r1;
        const s2 = -q2 - r2;
        return Math.max(
            Math.abs(q1 - q2),
            Math.abs(r1 - r2),
            Math.abs(s1 - s2)
        );
    }
    
    /**
     * Check if hex coordinates are within bounds
     * 
     * @param {number} q - Hex Q coordinate
     * @param {number} r - Hex R coordinate
     * @param {number} width - Map width
     * @param {number} height - Map height
     * @returns {boolean} True if within bounds
     */
    function isHexInBounds(q, r, width, height) {
        // For a rectangular map layout
        return q >= 0 && q < width && r >= 0 && r < height;
    }
    
    /**
     * Generate a unique ID for a hex based on coordinates
     * 
     * @param {number} q - Hex Q coordinate
     * @param {number} r - Hex R coordinate
     * @returns {string} Unique hex ID
     */
    function hexToId(q, r) {
        return `hex_${q}_${r}`;
    }
    
    /**
     * Parse hex coordinates from ID
     * 
     * @param {string} id - Hex ID
     * @returns {{q: number, r: number}} Hex coordinates
     */
    function idToHex(id) {
        const parts = id.split('_');
        return {
            q: parseInt(parts[1], 10),
            r: parseInt(parts[2], 10)
        };
    }
    
    // Public API
    return {
        hexToPixel,
        pixelToHex,
        hexRound,
        getHexNeighbors,
        getHexDistance,
        isHexInBounds,
        hexToId,
        idToHex
    };
})();
