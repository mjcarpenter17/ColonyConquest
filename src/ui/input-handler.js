/**
 * InputHandler module for managing user input
 */

const InputHandler = (function() {
    // Private variables
    let _canvas;
    let _isDragging = false;
    let _lastMousePosition = { x: 0, y: 0 };
    let _enablePanning = true;
    let _touchStartTime = 0;
    
    /**
     * Initialize the input handler
     * 
     * @param {string} canvasId - Canvas element ID
     */
    function initialize(canvasId) {
        _canvas = document.getElementById(canvasId);
        
        // Mouse event listeners
        _canvas.addEventListener('mousedown', handleMouseDown);
        _canvas.addEventListener('mousemove', handleMouseMove);
        _canvas.addEventListener('mouseup', handleMouseUp);
        _canvas.addEventListener('mouseleave', handleMouseLeave);
        _canvas.addEventListener('wheel', handleMouseWheel);
        
        // Touch event listeners
        _canvas.addEventListener('touchstart', handleTouchStart);
        _canvas.addEventListener('touchmove', handleTouchMove);
        _canvas.addEventListener('touchend', handleTouchEnd);
        
        // Prevent context menu on right-click
        _canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * Handle mouse down event
     * 
     * @param {MouseEvent} e - Mouse event
     */
    function handleMouseDown(e) {
        e.preventDefault();
        
        // Right mouse button for panning
        if (e.button === 2 && _enablePanning) {
            _isDragging = true;
            _lastMousePosition = { x: e.clientX, y: e.clientY };
            _canvas.style.cursor = 'grabbing';
            return;
        }
        
        // Left mouse button for selection
        if (e.button === 0) {
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            handleHexSelection(mouseX, mouseY);
        }
    }
    
    /**
     * Handle mouse move event
     * 
     * @param {MouseEvent} e - Mouse event
     */
    function handleMouseMove(e) {
        e.preventDefault();
        
        // Handle panning
        if (_isDragging && _enablePanning) {
            const deltaX = e.clientX - _lastMousePosition.x;
            const deltaY = e.clientY - _lastMousePosition.y;
            
            Renderer.panCamera(deltaX, deltaY);
            
            _lastMousePosition = { x: e.clientX, y: e.clientY };
        }
    }
    
    /**
     * Handle mouse up event
     * 
     * @param {MouseEvent} e - Mouse event
     */
    function handleMouseUp(e) {
        e.preventDefault();
        
        if (e.button === 2) {
            _isDragging = false;
            _canvas.style.cursor = 'default';
        }
    }
    
    /**
     * Handle mouse leave event
     * 
     * @param {MouseEvent} e - Mouse event
     */
    function handleMouseLeave(e) {
        e.preventDefault();
        _isDragging = false;
        _canvas.style.cursor = 'default';
    }
    
    /**
     * Handle mouse wheel event for zooming
     * 
     * @param {WheelEvent} e - Mouse wheel event
     */
    function handleMouseWheel(e) {
        e.preventDefault();
        
        const deltaScale = -e.deltaY * 0.001; // Adjust zoom sensitivity
        Renderer.zoom(deltaScale, e.clientX, e.clientY);
    }
    
    /**
     * Handle touch start event
     * 
     * @param {TouchEvent} e - Touch event
     */
    function handleTouchStart(e) {
        e.preventDefault();
        
        // Record time for distinguishing between tap and pan
        _touchStartTime = Date.now();
        
        if (e.touches.length === 1) {
            // Single touch - potential selection or pan
            _lastMousePosition = { 
                x: e.touches[0].clientX, 
                y: e.touches[0].clientY 
            };
        }
    }
    
    /**
     * Handle touch move event
     * 
     * @param {TouchEvent} e - Touch event
     */
    function handleTouchMove(e) {
        e.preventDefault();
        
        // If it's a drag rather than a tap
        if (e.touches.length === 1 && Date.now() - _touchStartTime > 200) {
            _isDragging = true;
            
            const deltaX = e.touches[0].clientX - _lastMousePosition.x;
            const deltaY = e.touches[0].clientY - _lastMousePosition.y;
            
            Renderer.panCamera(deltaX, deltaY);
            
            _lastMousePosition = { 
                x: e.touches[0].clientX, 
                y: e.touches[0].clientY 
            };
        }
    }
    
    /**
     * Handle touch end event
     * 
     * @param {TouchEvent} e - Touch event
     */
    function handleTouchEnd(e) {
        e.preventDefault();
        
        // If it was a short tap, treat as selection
        if (!_isDragging && Date.now() - _touchStartTime < 200) {
            const touchX = _lastMousePosition.x;
            const touchY = _lastMousePosition.y;
            handleHexSelection(touchX, touchY);
        }
        
        _isDragging = false;
    }
    
    /**
     * Handle hex selection based on screen coordinates
     * 
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     */
    function handleHexSelection(screenX, screenY) {
        // Get canvas offset
        const canvasOffset = Renderer.getCanvasOffset();
        
        // Get hex at mouse position
        const hex = HexGrid.screenToHex(screenX, screenY, canvasOffset);
        
        // If hex found, select it
        if (hex) {
            GameState.selectTerritory(hex.id);
            
            // Update territory info panel
            updateTerritoryInfo(hex);
        } else {
            // If clicked outside any hex, clear selection
            GameState.clearSelection();
            hideTerritoryInfo();
        }
    }
    
    /**
     * Update the territory info panel with selected territory data
     * 
     * @param {object} territory - Selected territory
     */
    function updateTerritoryInfo(territory) {
        const territoryInfo = document.getElementById('territory-info');
        const territoryName = document.getElementById('territory-name');
        const territoryOwner = document.getElementById('territory-owner');
        const territoryResource = document.getElementById('territory-resource');
        const resourceValue = document.getElementById('resource-value');
        const secondaryResource = document.getElementById('secondary-resource');
        const secondaryValue = document.getElementById('secondary-value');
        const territoryInfluence = document.getElementById('territory-influence');
        
        if (!territoryInfo) return;
        
        // Show info panel
        territoryInfo.classList.remove('hidden');
        
        // Get display data
        const data = territory.getDisplayData();
        
        // Update fields
        territoryName.textContent = `Territory ${data.coordinates}`;
        territoryOwner.textContent = data.owner;
        territoryResource.textContent = data.resourceType;
        resourceValue.textContent = data.resourceValue;
        secondaryResource.textContent = data.secondaryResource;
        secondaryValue.textContent = data.secondaryResource !== 'None' ? data.secondaryValue : '0';
        territoryInfluence.textContent = data.influence;
    }
    
    /**
     * Hide the territory info panel
     */
    function hideTerritoryInfo() {
        const territoryInfo = document.getElementById('territory-info');
        if (territoryInfo) {
            territoryInfo.classList.add('hidden');
        }
    }
    
    /**
     * Set whether panning is enabled
     * 
     * @param {boolean} enabled - Whether panning is enabled
     */
    function setPanningEnabled(enabled) {
        _enablePanning = enabled;
    }
    
    // Public API
    return {
        initialize,
        setPanningEnabled,
        handleHexSelection
    };
})();
