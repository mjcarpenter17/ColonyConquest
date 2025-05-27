/**
 * UI Components module for handling the user interface
 */

const UIComponents = (function() {
    /**
     * Initialize the UI components
     */
    function initialize() {
        // Set up event listeners
        setupEventListeners();
        
        // Initial UI setup
        updateResourceDisplay();
        setupInfoPanels();
    }
    
    /**
     * Set up event listeners for UI components
     */
    function setupEventListeners() {
        // End turn button event listener is handled in TurnManager
        
        // Game state subscription for territory selection
        GameState.subscribe('territorySelected', handleTerritorySelection);
        
        // Game state subscription for resource changes
        GameState.subscribe('resourcesChanged', handleResourceChange);
    }
    
    /**
     * Update resource display with current values
     */
    function updateResourceDisplay() {
        const resources = GameState.getResources(CONSTANTS.PLAYERS.PLAYER);
        ResourceManager.updateResourceDisplay(resources);
    }
    
    /**
     * Set up information panels
     */
    function setupInfoPanels() {
        // Hide territory info panel initially
        const territoryInfo = document.getElementById('territory-info');
        if (territoryInfo) {
            territoryInfo.classList.add('hidden');
        }
    }
    
    /**
     * Handle territory selection events
     * 
     * @param {object|null} territory - Selected territory or null if deselected
     */
    function handleTerritorySelection(territory) {
        const territoryInfo = document.getElementById('territory-info');
        if (!territoryInfo) return;
        
        if (territory) {
            // Show and update territory info
            territoryInfo.classList.remove('hidden');
            
            // Get display data from territory
            const data = territory.getDisplayData();
            
            // Update territory info panel
            document.getElementById('territory-name').textContent = `Territory ${data.coordinates}`;
            document.getElementById('territory-owner').textContent = data.owner;
            document.getElementById('territory-resource').textContent = data.resourceType;
            document.getElementById('resource-value').textContent = data.resourceValue;
            document.getElementById('secondary-resource').textContent = data.secondaryResource;
            document.getElementById('secondary-value').textContent = data.secondaryResource !== 'None' ? data.secondaryValue : '0';
            document.getElementById('territory-influence').textContent = data.influence;
        } else {
            // Hide territory info
            territoryInfo.classList.add('hidden');
        }
    }
    
    /**
     * Handle resource change events
     * 
     * @param {object} data - Resource data
     */
    function handleResourceChange(data) {
        // Update resource display
        ResourceManager.updateResourceDisplay(data.playerResources);
        
        // Could add animation for resource changes here
    }
    
    /**
     * Show a message to the player
     * 
     * @param {string} message - Message to show
     * @param {string} type - Message type (info, success, warning, error)
     * @param {number} duration - Duration in milliseconds
     */
    function showMessage(message, type = 'info', duration = 3000) {
        // Create message element if it doesn't exist
        let messageContainer = document.querySelector('.message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.className = 'message-container';
            document.body.appendChild(messageContainer);
        }
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        // Add to container
        messageContainer.appendChild(messageElement);
        
        // Remove after duration
        setTimeout(() => {
            messageElement.classList.add('fade-out');
            setTimeout(() => {
                messageContainer.removeChild(messageElement);
            }, 500);
        }, duration);
    }
    
    // Public API
    return {
        initialize,
        updateResourceDisplay,
        showMessage
    };
})();
