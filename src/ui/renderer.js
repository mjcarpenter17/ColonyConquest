/**
 * Renderer module for canvas rendering
 */

const Renderer = (function() {
    // Private variables
    let _canvas;
    let _ctx;
    let _width;
    let _height;
    let _hexRadius;
    let _animationFrameId;
    let _canvasOffset;
    let _cameraOffset = { x: 0, y: 0 };
    let _scale = 1.0;
    
    /**
     * Initialize the renderer
     * 
     * @param {string} canvasId - Canvas element ID
     * @param {number} hexRadius - Hex radius in pixels
     */
    function initialize(canvasId, hexRadius) {
        _canvas = document.getElementById(canvasId);
        _ctx = _canvas.getContext('2d');
        _hexRadius = hexRadius;
        
        // Handle window resize
        window.addEventListener('resize', resizeCanvas);
        
        // Initial canvas sizing
        resizeCanvas();
        
        // Start render loop
        startRenderLoop();
        
        // Update canvas offset position
        updateCanvasOffset();
    }
    
    /**
     * Update the canvas offset position (for input handling)
     */
    function updateCanvasOffset() {
        const rect = _canvas.getBoundingClientRect();
        _canvasOffset = {
            x: rect.left,
            y: rect.top
        };
    }
    
    /**
     * Get the current canvas offset
     * 
     * @returns {object} - Canvas offset
     */
    function getCanvasOffset() {
        return _canvasOffset;
    }
    
    /**
     * Resize the canvas to fill its container
     */
    function resizeCanvas() {
        const container = _canvas.parentElement;
        _canvas.width = container.clientWidth;
        _canvas.height = container.clientHeight;
        _width = _canvas.width;
        _height = _canvas.height;
        
        // Update offset after resize
        updateCanvasOffset();
        
        // Force redraw
        render();
    }
    
    /**
     * Start the render loop
     */
    function startRenderLoop() {
        if (_animationFrameId) {
            cancelAnimationFrame(_animationFrameId);
        }
        
        _animationFrameId = requestAnimationFrame(renderLoop);
    }
    
    /**
     * Render loop function
     */
    function renderLoop() {
        render();
        _animationFrameId = requestAnimationFrame(renderLoop);
    }
    
    /**
     * Main render function
     */
    function render() {
        // Clear canvas
        _ctx.clearRect(0, 0, _width, _height);
        
        // Save current context state
        _ctx.save();
        
        // Apply camera transformations
        _ctx.translate(_width / 2, _height / 2);
        _ctx.scale(_scale, _scale);
        _ctx.translate(-_width / 2 + _cameraOffset.x, -_height / 2 + _cameraOffset.y);
        
        // Get territories and render them
        const territories = HexGrid.getAllHexes();
        territories.forEach(territory => {
            renderHexagon(territory);
        });
        
        // Restore context state
        _ctx.restore();
    }
    
    /**
     * Render a hexagonal territory
     * 
     * @param {object} territory - Territory to render
     */
    function renderHexagon(territory) {
        const { q, r } = territory.coordinates;
        const center = HexGrid.getHexCenter(q, r);
        
        // Calculate hex corners
        const corners = calculateHexCorners(center.x, center.y);
        
        // Fill hex
        _ctx.beginPath();
        _ctx.moveTo(corners[0].x, corners[0].y);
        
        for (let i = 1; i < corners.length; i++) {
            _ctx.lineTo(corners[i].x, corners[i].y);
        }
        
        _ctx.closePath();
        
        // Fill color based on territory
        _ctx.fillStyle = territory.getColor();
        _ctx.fill();
        
        // Draw border (stronger if selected)
        _ctx.lineWidth = territory.selected ? 3 : 1;
        _ctx.strokeStyle = territory.selected ? CONSTANTS.COLORS.SELECTION : CONSTANTS.COLORS.HEX_STROKE;
        _ctx.stroke();
        
        // Draw resource icon
        drawResourceIcon(center.x, center.y, territory);
    }
    
    /**
     * Draw a resource icon in the territory
     * 
     * @param {number} x - Center X coordinate
     * @param {number} y - Center Y coordinate
     * @param {object} territory - Territory data
     */
    function drawResourceIcon(x, y, territory) {
        _ctx.textAlign = 'center';
        _ctx.textBaseline = 'middle';
        _ctx.font = `${_hexRadius * 0.5}px Arial`;
        
        // Use emoji icons based on resource type
        let icon;
        switch (territory.resourceType) {
            case CONSTANTS.RESOURCE_TYPES.GOLD:
                icon = '🪙';
                break;
            case CONSTANTS.RESOURCE_TYPES.TIMBER:
                icon = '🌲';
                break;
            case CONSTANTS.RESOURCE_TYPES.IRON:
                icon = '⚙️';
                break;
            case CONSTANTS.RESOURCE_TYPES.FOOD:
                icon = '🌾';
                break;
            default:
                icon = '❓';
        }
        
        // Draw the icon and resource value
        _ctx.fillText(icon, x, y - 10);
        _ctx.fillText(territory.resourceValue.toString(), x, y + 10);
        
        // Draw owner indicator if not neutral
        if (territory.owner !== CONSTANTS.PLAYERS.NEUTRAL) {
            _ctx.fillStyle = territory.owner === CONSTANTS.PLAYERS.PLAYER ? 
                CONSTANTS.COLORS.PLAYER : CONSTANTS.COLORS.AI;
            _ctx.beginPath();
            _ctx.arc(x, y - _hexRadius * 0.5, _hexRadius * 0.15, 0, Math.PI * 2);
            _ctx.fill();
        }
    }
    
    /**
     * Calculate hex corner points
     * 
     * @param {number} centerX - Hex center X coordinate
     * @param {number} centerY - Hex center Y coordinate
     * @returns {Array} - Array of corner points
     */
    function calculateHexCorners(centerX, centerY) {
        const corners = [];
        
        for (let i = 0; i < 6; i++) {
            const angle = 2 * Math.PI / 6 * i + Math.PI / 6; // Pointy-top orientation
            corners.push({
                x: centerX + _hexRadius * Math.cos(angle),
                y: centerY + _hexRadius * Math.sin(angle)
            });
        }
        
        return corners;
    }
    
    /**
     * Adjust camera position
     * 
     * @param {number} deltaX - X movement
     * @param {number} deltaY - Y movement
     */
    function panCamera(deltaX, deltaY) {
        _cameraOffset.x += deltaX;
        _cameraOffset.y += deltaY;
    }
    
    /**
     * Adjust zoom level
     * 
     * @param {number} deltaScale - Scale adjustment
     * @param {number} focusX - Focus point X (in canvas coordinates)
     * @param {number} focusY - Focus point Y (in canvas coordinates)
     */
    function zoom(deltaScale, focusX, focusY) {
        const newScale = Math.max(0.5, Math.min(2.0, _scale + deltaScale));
        
        // Adjust camera offset to keep focus point steady
        if (newScale !== _scale) {
            const focusWorldX = (focusX - _width / 2) / _scale + _width / 2 - _cameraOffset.x;
            const focusWorldY = (focusY - _height / 2) / _scale + _height / 2 - _cameraOffset.y;
            
            const newFocusWorldX = (focusX - _width / 2) / newScale + _width / 2 - _cameraOffset.x;
            const newFocusWorldY = (focusY - _height / 2) / newScale + _height / 2 - _cameraOffset.y;
            
            _cameraOffset.x += (newFocusWorldX - focusWorldX);
            _cameraOffset.y += (newFocusWorldY - focusWorldY);
            
            _scale = newScale;
        }
    }
    
    // Public API
    return {
        initialize,
        render,
        getCanvasOffset,
        panCamera,
        zoom,
        updateCanvasOffset
    };
})();
