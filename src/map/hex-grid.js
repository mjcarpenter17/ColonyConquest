/**
 * Colony Conquest - Hexagonal Grid System
 * Advanced hexagonal grid mathematics and layout management
 */

import { 
    hex, 
    hexAdd, 
    hexSubtract, 
    hexDistance, 
    hexNeighbor, 
    hexNeighbors, 
    hexToPixel, 
    pixelToHex, 
    hexRound, 
    hexCorners 
} from '../utils/math-utils.js';
import { HEX_CONSTANTS, GAME_CONFIG } from '../utils/constants.js';

/**
 * HexGrid class - Manages hexagonal grid layout and operations
 */
export class HexGrid {
    constructor(size = GAME_CONFIG.GRID_SIZE, hexSize = GAME_CONFIG.HEX_SIZE) {
        this.size = size;
        this.hexSize = hexSize;
        this.hexes = new Map(); // Maps hex coordinate string to hex data
        this.layout = this.createLayout();
        this.center = { x: 0, y: 0 }; // Will be set when rendered
        
        this.generateGrid();
        console.log(`🗺️ HexGrid created: ${size}x${size}, ${this.hexes.size} hexes`);
    }

    /**
     * Create hex layout configuration
     */
    createLayout() {
        return {
            orientation: HEX_CONSTANTS.ORIENTATION,
            size: { x: this.hexSize, y: this.hexSize },
            origin: { x: 0, y: 0 }
        };
    }

    /**
     * Generate the hexagonal grid
     */
    generateGrid() {
        const radius = Math.floor(this.size / 2);
        
        for (let q = -radius; q <= radius; q++) {
            const r1 = Math.max(-radius, -q - radius);
            const r2 = Math.min(radius, -q + radius);
            
            for (let r = r1; r <= r2; r++) {
                const hexCoord = hex(q, r);
                const hexKey = this.coordToKey(hexCoord);
                
                this.hexes.set(hexKey, {
                    coord: hexCoord,
                    key: hexKey,
                    neighbors: [],
                    pixelPos: null,
                    corners: null
                });
            }
        }
        
        // Calculate neighbors for each hex
        this.calculateNeighbors();
    }

    /**
     * Calculate neighbors for all hexes
     */
    calculateNeighbors() {
        this.hexes.forEach((hexData, key) => {
            const neighbors = hexNeighbors(hexData.coord);
            hexData.neighbors = neighbors
                .map(neighborCoord => this.coordToKey(neighborCoord))
                .filter(neighborKey => this.hexes.has(neighborKey));
        });
    }

    /**
     * Convert hex coordinate to string key
     */
    coordToKey(hexCoord) {
        return `${hexCoord.q},${hexCoord.r}`;
    }

    /**
     * Convert string key to hex coordinate
     */
    keyToCoord(key) {
        const [q, r] = key.split(',').map(Number);
        return hex(q, r);
    }

    /**
     * Set the center position for pixel coordinate calculations
     */
    setCenter(x, y) {
        this.center = { x, y };
        this.layout.origin = { x, y };
        this.updatePixelPositions();
    }

    /**
     * Update pixel positions for all hexes
     */
    updatePixelPositions() {
        this.hexes.forEach(hexData => {
            hexData.pixelPos = hexToPixel(hexData.coord, this.hexSize, this.center);
            hexData.corners = hexCorners(hexData.pixelPos, this.hexSize);
        });
    }

    /**
     * Get hex data by coordinate
     */
    getHex(q, r) {
        const key = this.coordToKey(hex(q, r));
        return this.hexes.get(key);
    }

    /**
     * Get hex data by key
     */
    getHexByKey(key) {
        return this.hexes.get(key);
    }

    /**
     * Get hex at pixel position
     */
    getHexAtPixel(x, y) {
        const hexCoord = pixelToHex({ x, y }, this.hexSize, this.center);
        const key = this.coordToKey(hexCoord);
        return this.hexes.get(key);
    }

    /**
     * Get all hexes within a certain distance from a center hex
     */
    getHexesInRange(centerQ, centerR, range) {
        const centerCoord = hex(centerQ, centerR);
        const results = [];
        
        for (let q = -range; q <= range; q++) {
            const r1 = Math.max(-range, -q - range);
            const r2 = Math.min(range, -q + range);
            
            for (let r = r1; r <= r2; r++) {
                const hexCoord = hexAdd(centerCoord, hex(q, r));
                const hexData = this.getHex(hexCoord.q, hexCoord.r);
                
                if (hexData) {
                    results.push(hexData);
                }
            }
        }
        
        return results;
    }

    /**
     * Get hexes in a ring around a center hex
     */
    getHexRing(centerQ, centerR, radius) {
        if (radius === 0) {
            return [this.getHex(centerQ, centerR)].filter(Boolean);
        }
        
        const results = [];
        const centerCoord = hex(centerQ, centerR);
        
        // Start at one edge of the ring
        let hexCoord = hexAdd(centerCoord, hex(-radius, 0));
        
        // Walk around the ring
        for (let direction = 0; direction < 6; direction++) {
            for (let step = 0; step < radius; step++) {
                const hexData = this.getHex(hexCoord.q, hexCoord.r);
                if (hexData) {
                    results.push(hexData);
                }
                hexCoord = hexNeighbor(hexCoord, direction);
            }
        }
        
        return results;
    }

    /**
     * Get neighbors of a hex
     */
    getNeighbors(q, r) {
        const hexData = this.getHex(q, r);
        if (!hexData) return [];
        
        return hexData.neighbors
            .map(neighborKey => this.hexes.get(neighborKey))
            .filter(Boolean);
    }

    /**
     * Find path between two hexes using A* algorithm
     */
    findPath(startQ, startR, endQ, endR) {
        const start = this.getHex(startQ, startR);
        const end = this.getHex(endQ, endR);
        
        if (!start || !end) return [];
        
        const openSet = new Set([start.key]);
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        gScore.set(start.key, 0);
        fScore.set(start.key, hexDistance(start.coord, end.coord));
        
        while (openSet.size > 0) {
            // Find node with lowest fScore
            let current = null;
            let lowestF = Infinity;
            
            for (const key of openSet) {
                const f = fScore.get(key) || Infinity;
                if (f < lowestF) {
                    lowestF = f;
                    current = this.hexes.get(key);
                }
            }
            
            if (!current) break;
            
            // Reached goal
            if (current.key === end.key) {
                return this.reconstructPath(cameFrom, current);
            }
            
            openSet.delete(current.key);
            
            // Check neighbors
            for (const neighborKey of current.neighbors) {
                const neighbor = this.hexes.get(neighborKey);
                if (!neighbor) continue;
                
                const tentativeG = (gScore.get(current.key) || 0) + 1;
                
                if (tentativeG < (gScore.get(neighbor.key) || Infinity)) {
                    cameFrom.set(neighbor.key, current.key);
                    gScore.set(neighbor.key, tentativeG);
                    fScore.set(neighbor.key, tentativeG + hexDistance(neighbor.coord, end.coord));
                    
                    if (!openSet.has(neighbor.key)) {
                        openSet.add(neighbor.key);
                    }
                }
            }
        }
        
        return []; // No path found
    }

    /**
     * Reconstruct path from A* algorithm
     */
    reconstructPath(cameFrom, current) {
        const path = [current];
        
        while (cameFrom.has(current.key)) {
            current = this.hexes.get(cameFrom.get(current.key));
            path.unshift(current);
        }
        
        return path;
    }

    /**
     * Get distance between two hexes
     */
    getDistance(q1, r1, q2, r2) {
        return hexDistance(hex(q1, r1), hex(q2, r2));
    }

    /**
     * Check if hex coordinates are valid (within grid bounds)
     */
    isValidHex(q, r) {
        return this.hexes.has(this.coordToKey(hex(q, r)));
    }

    /**
     * Get all hexes as an array
     */
    getAllHexes() {
        return Array.from(this.hexes.values());
    }

    /**
     * Get grid bounds
     */
    getBounds() {
        let minQ = Infinity, maxQ = -Infinity;
        let minR = Infinity, maxR = -Infinity;
        
        this.hexes.forEach(hexData => {
            const { q, r } = hexData.coord;
            minQ = Math.min(minQ, q);
            maxQ = Math.max(maxQ, q);
            minR = Math.min(minR, r);
            maxR = Math.max(maxR, r);
        });
        
        return { minQ, maxQ, minR, maxR };
    }

    /**
     * Get pixel bounds for the entire grid
     */
    getPixelBounds() {
        if (this.hexes.size === 0) return null;
        
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        this.hexes.forEach(hexData => {
            if (hexData.corners) {
                hexData.corners.forEach(corner => {
                    minX = Math.min(minX, corner.x);
                    maxX = Math.max(maxX, corner.x);
                    minY = Math.min(minY, corner.y);
                    maxY = Math.max(maxY, corner.y);
                });
            }
        });
        
        return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
    }

    /**
     * Check if a point is inside a hex
     */
    isPointInHex(x, y, hexData) {
        if (!hexData || !hexData.corners) return false;
        
        // Use ray casting algorithm
        const corners = hexData.corners;
        let inside = false;
        
        for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
            if (((corners[i].y > y) !== (corners[j].y > y)) &&
                (x < (corners[j].x - corners[i].x) * (y - corners[i].y) / (corners[j].y - corners[i].y) + corners[i].x)) {
                inside = !inside;
            }
        }
        
        return inside;
    }

    /**
     * Get hex layout information for rendering
     */
    getLayoutInfo() {
        return {
            layout: this.layout,
            size: this.size,
            hexSize: this.hexSize,
            center: this.center,
            hexCount: this.hexes.size,
            bounds: this.getBounds(),
            pixelBounds: this.getPixelBounds()
        };
    }

    /**
     * Convert the grid to JSON for saving
     */
    toJSON() {
        return {
            size: this.size,
            hexSize: this.hexSize,
            center: this.center,
            hexes: Array.from(this.hexes.entries())
        };
    }

    /**
     * Load grid from JSON
     */
    fromJSON(data) {
        this.size = data.size;
        this.hexSize = data.hexSize;
        this.center = data.center;
        this.layout = this.createLayout();
        this.layout.origin = this.center;
        
        this.hexes.clear();
        data.hexes.forEach(([key, hexData]) => {
            this.hexes.set(key, hexData);
        });
        
        console.log(`📥 HexGrid loaded from JSON: ${this.hexes.size} hexes`);
    }

    /**
     * Create spiral iterator for traversing hexes in spiral order
     */
    spiralIterator(centerQ = 0, centerR = 0) {
        const results = [];
        const center = this.getHex(centerQ, centerR);
        
        if (center) {
            results.push(center);
            
            for (let radius = 1; radius <= Math.floor(this.size / 2); radius++) {
                const ring = this.getHexRing(centerQ, centerR, radius);
                results.push(...ring);
            }
        }
        
        return results;
    }

    /**
     * Get statistics about the grid
     */
    getStatistics() {
        const bounds = this.getBounds();
        const pixelBounds = this.getPixelBounds();
        
        return {
            totalHexes: this.hexes.size,
            gridSize: this.size,
            hexSize: this.hexSize,
            coordinateBounds: bounds,
            pixelBounds: pixelBounds,
            center: this.center,
            averageNeighbors: Array.from(this.hexes.values())
                .reduce((sum, hex) => sum + hex.neighbors.length, 0) / this.hexes.size
        };
    }
}
