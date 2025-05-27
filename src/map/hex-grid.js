/**
 * HexGrid module for managing the hexagonal map
 * Handles operations on the entire grid structure
 */

const HexGrid = (function() {
    // Private variables
    let _width = 0;
    let _height = 0;
    let _hexRadius = 0;
    let _hexes = new Map();
    let _centerX = 0;
    let _centerY = 0;
    
    /**
     * Initialize the hex grid with specific dimensions
     * 
     * @param {number} width - Number of columns in the grid
     * @param {number} height - Number of rows in the grid
     * @param {number} hexRadius - Radius of each hexagon in pixels
     */
    function initialize(width, height, hexRadius) {
        _width = width;
        _height = height;
        _hexRadius = hexRadius;
        _hexes.clear();
        
        // Calculate grid center for positioning
        const gridWidthPx = Math.sqrt(3) * hexRadius * width;
        const gridHeightPx = 1.5 * hexRadius * height;
        
        // Center and offset to account for pointy-top hex grid layout
        _centerX = gridWidthPx / 2;
        _centerY = gridHeightPx / 2;
    }
    
    /**
     * Add a hex to the grid
     * 
     * @param {string} id - Unique hex identifier
     * @param {object} hexData - Hex territory data
     */
    function addHex(id, hexData) {
        _hexes.set(id, hexData);
    }
    
    /**
     * Get a hex by its ID
     * 
     * @param {string} id - Hex identifier
     * @returns {object|undefined} - The hex data or undefined if not found
     */
    function getHex(id) {
        return _hexes.get(id);
    }
    
    /**
     * Get a hex by its coordinates
     * 
     * @param {number} q - Q coordinate
     * @param {number} r - R coordinate
     * @returns {object|undefined} - The hex data or undefined if not found
     */
    function getHexByCoord(q, r) {
        const id = MathUtils.hexToId(q, r);
        return _hexes.get(id);
    }
    
    /**
     * Get all hexes in the grid
     * 
     * @returns {Map} - Map of all hexes
     */
    function getAllHexes() {
        return _hexes;
    }
    
    /**
     * Check if coordinates are within the grid bounds
     * 
     * @param {number} q - Q coordinate
     * @param {number} r - R coordinate
     * @returns {boolean} - True if within bounds
     */
    function isInBounds(q, r) {
        return MathUtils.isHexInBounds(q, r, _width, _height);
    }
    
    /**
     * Get neighboring hexes for a given hex
     * 
     * @param {string} id - Hex identifier
     * @returns {Array} - Array of neighboring hex data
     */
    function getNeighbors(id) {
        const hex = _hexes.get(id);
        if (!hex) return [];
        
        const neighbors = [];
        const {q, r} = hex.coordinates;
        
        // Get all possible neighbors
        const possibleNeighbors = MathUtils.getHexNeighbors(q, r);
        
        // Filter for valid neighbors within bounds
        for (const neighbor of possibleNeighbors) {
            if (isInBounds(neighbor.q, neighbor.r)) {
                const neighborId = MathUtils.hexToId(neighbor.q, neighbor.r);
                const neighborHex = _hexes.get(neighborId);
                if (neighborHex) {
                    neighbors.push(neighborHex);
                }
            }
        }
        
        return neighbors;
    }
    
    /**
     * Convert screen coordinates to hex coordinates
     * 
     * @param {number} x - Screen x coordinate
     * @param {number} y - Screen y coordinate
     * @param {object} canvasOffset - Canvas position offset
     * @returns {object|null} - Hex at coordinates or null if not found
     */
    function screenToHex(x, y, canvasOffset) {
        // Adjust for canvas position and center offset
        const adjustedX = x - canvasOffset.x - _centerX;
        const adjustedY = y - canvasOffset.y - _centerY;
        
        // Convert to hex coordinates
        const hexCoord = MathUtils.pixelToHex(adjustedX, adjustedY, _hexRadius);
        const roundedHex = MathUtils.hexRound(hexCoord.q, hexCoord.r);
        
        // Adjust for grid center
        const gridQ = Math.floor(_width / 2) + roundedHex.q;
        const gridR = Math.floor(_height / 2) + roundedHex.r;
        
        // Check if within bounds
        if (isInBounds(gridQ, gridR)) {
            return getHexByCoord(gridQ, gridR);
        }
        
        return null;
    }
    
    /**
     * Get pixel coordinates for rendering a hex
     * 
     * @param {number} q - Q coordinate
     * @param {number} r - R coordinate
     * @returns {object} - {x, y} pixel coordinates
     */
    function getHexCenter(q, r) {
        // Adjust for grid center
        const adjustedQ = q - Math.floor(_width / 2);
        const adjustedR = r - Math.floor(_height / 2);
        
        const pixel = MathUtils.hexToPixel(adjustedQ, adjustedR, _hexRadius);
        
        // Add center offset
        return {
            x: pixel.x + _centerX,
            y: pixel.y + _centerY
        };
    }
    
    /**
     * Clear all hexes from the grid
     */
    function clearGrid() {
        _hexes.clear();
    }
    
    /**
     * Get the dimensions of the grid
     */
    function getDimensions() {
        return {
            width: _width,
            height: _height,
            hexRadius: _hexRadius,
            pixelWidth: Math.sqrt(3) * _hexRadius * _width,
            pixelHeight: 1.5 * _hexRadius * _height
        };
    }
    
    // Public API
    return {
        initialize,
        addHex,
        getHex,
        getHexByCoord,
        getAllHexes,
        isInBounds,
        getNeighbors,
        screenToHex,
        getHexCenter,
        clearGrid,
        getDimensions
    };
})();
