/**
 * ResourceManager module for handling resource collection, spending, and tracking
 */

const ResourceManager = (function() {
    /**
     * Update the UI to display current resource values
     * 
     * @param {object} resources - Player resources object
     */
    function updateResourceDisplay(resources) {
        // Update UI elements with resource values
        document.getElementById('gold-value').textContent = resources[CONSTANTS.RESOURCE_TYPES.GOLD];
        document.getElementById('timber-value').textContent = resources[CONSTANTS.RESOURCE_TYPES.TIMBER];
        document.getElementById('iron-value').textContent = resources[CONSTANTS.RESOURCE_TYPES.IRON];
        document.getElementById('food-value').textContent = resources[CONSTANTS.RESOURCE_TYPES.FOOD];
    }
    
    /**
     * Calculate the total resource production from territories
     * 
     * @param {Map} territories - Map of territories
     * @param {string} owner - Owner to calculate for
     * @returns {object} - Resource production totals
     */
    function calculateProduction(territories, owner) {
        const production = {
            [CONSTANTS.RESOURCE_TYPES.GOLD]: 0,
            [CONSTANTS.RESOURCE_TYPES.TIMBER]: 0,
            [CONSTANTS.RESOURCE_TYPES.IRON]: 0,
            [CONSTANTS.RESOURCE_TYPES.FOOD]: 0
        };
        
        territories.forEach(territory => {
            if (territory.owner === owner) {
                const territoryProduction = territory.getProduction();
                Object.keys(territoryProduction).forEach(resourceType => {
                    production[resourceType] += territoryProduction[resourceType];
                });
            }
        });
        
        return production;
    }
    
    /**
     * Check if a player has enough resources for a given cost
     * 
     * @param {object} resources - Player resources
     * @param {object} cost - Resource cost
     * @returns {boolean} - True if player has enough resources
     */
    function hasEnoughResources(resources, cost) {
        for (const resourceType in cost) {
            if (cost[resourceType] > resources[resourceType]) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Spend resources from a player's total
     * 
     * @param {object} resources - Player resources
     * @param {object} cost - Resources to spend
     * @returns {object} - Updated resource values
     */
    function spendResources(resources, cost) {
        const updatedResources = { ...resources };
        
        if (!hasEnoughResources(resources, cost)) {
            return resources; // Can't spend more than you have
        }
        
        for (const resourceType in cost) {
            updatedResources[resourceType] -= cost[resourceType];
        }
        
        return updatedResources;
    }
    
    /**
     * Add resources to a player's total
     * 
     * @param {object} resources - Player resources
     * @param {object} amount - Resources to add
     * @returns {object} - Updated resource values
     */
    function addResources(resources, amount) {
        const updatedResources = { ...resources };
        
        for (const resourceType in amount) {
            updatedResources[resourceType] += amount[resourceType];
        }
        
        return updatedResources;
    }
    
    /**
     * Calculate resource costs for different game actions
     * 
     * @param {string} actionType - Type of action
     * @returns {object} - Resource cost
     */
    function getActionCost(actionType) {
        switch(actionType) {
            case 'influence':
                return {
                    [CONSTANTS.RESOURCE_TYPES.GOLD]: 5,
                    [CONSTANTS.RESOURCE_TYPES.FOOD]: 2
                };
            case 'claim_territory':
                return {
                    [CONSTANTS.RESOURCE_TYPES.GOLD]: 10,
                    [CONSTANTS.RESOURCE_TYPES.TIMBER]: 5
                };
            case 'trade_route':
                return {
                    [CONSTANTS.RESOURCE_TYPES.GOLD]: 5,
                    [CONSTANTS.RESOURCE_TYPES.TIMBER]: 5
                };
            // Future action types can be added here
            default:
                return {};
        }
    }
    
    /**
     * Initialize the resource system
     */
    function initialize() {
        // Set up event listeners
        GameState.subscribe('resourcesChanged', (data) => {
            updateResourceDisplay(data.playerResources);
        });
        
        // Initial update of display
        updateResourceDisplay(GameState.getResources(CONSTANTS.PLAYERS.PLAYER));
    }
    
    // Public API
    return {
        initialize,
        updateResourceDisplay,
        calculateProduction,
        hasEnoughResources,
        spendResources,
        addResources,
        getActionCost
    };
})();
