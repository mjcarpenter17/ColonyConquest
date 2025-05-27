/**
 * Territory class for representing individual hexagonal territories
 */

class Territory {
    /**
     * Create a new Territory
     * 
     * @param {string} id - Unique identifier for the territory
     * @param {number} q - Q coordinate in hex grid
     * @param {number} r - R coordinate in hex grid
     * @param {string} resourceType - Primary resource type
     * @param {number} resourceValue - Primary resource production value
     * @param {string} territoryType - Type of territory
     */
    constructor(id, q, r, resourceType, resourceValue, territoryType) {
        this.id = id;
        this.coordinates = { q, r };
        this.owner = CONSTANTS.PLAYERS.NEUTRAL;
        this.resourceType = resourceType;
        this.resourceValue = resourceValue;
        this.secondaryResource = null;
        this.secondaryValue = 0;
        this.influence = {
            [CONSTANTS.PLAYERS.PLAYER]: 0,
            [CONSTANTS.PLAYERS.AI]: 0,
            [CONSTANTS.PLAYERS.NEUTRAL]: 5
        };
        this.territoryType = territoryType || CONSTANTS.TERRITORY_TYPES.RESOURCE_NODE;
        this.units = [];
        this.isContested = false;
        this.lastCaptured = null;
        this.selected = false;
    }
    
    /**
     * Add a secondary resource to the territory
     * 
     * @param {string} resourceType - Secondary resource type
     * @param {number} resourceValue - Secondary resource production value
     */
    addSecondaryResource(resourceType, resourceValue) {
        this.secondaryResource = resourceType;
        this.secondaryValue = resourceValue;
    }
    
    /**
     * Update the territory owner based on influence
     * 
     * @returns {boolean} - Whether ownership changed
     */
    updateOwnership() {
        // Determine owner based on highest influence
        let maxInfluence = this.influence[CONSTANTS.PLAYERS.NEUTRAL];
        let maxOwner = CONSTANTS.PLAYERS.NEUTRAL;
        
        if (this.influence[CONSTANTS.PLAYERS.PLAYER] > maxInfluence) {
            maxInfluence = this.influence[CONSTANTS.PLAYERS.PLAYER];
            maxOwner = CONSTANTS.PLAYERS.PLAYER;
        }
        
        if (this.influence[CONSTANTS.PLAYERS.AI] > maxInfluence) {
            maxInfluence = this.influence[CONSTANTS.PLAYERS.AI];
            maxOwner = CONSTANTS.PLAYERS.AI;
        }
        
        // Check if the territory is contested
        const playerInfluence = this.influence[CONSTANTS.PLAYERS.PLAYER];
        const aiInfluence = this.influence[CONSTANTS.PLAYERS.AI];
        const neutralInfluence = this.influence[CONSTANTS.PLAYERS.NEUTRAL];
        
        // Territory is contested if two or more factions have equal highest influence
        const isPlayerContesting = playerInfluence === maxInfluence && maxInfluence > 0;
        const isAIContesting = aiInfluence === maxInfluence && maxInfluence > 0;
        const isNeutralContesting = neutralInfluence === maxInfluence && maxInfluence > 0;
        
        this.isContested = (isPlayerContesting && isAIContesting) || 
                           (isPlayerContesting && isNeutralContesting) || 
                           (isAIContesting && isNeutralContesting);
        
        // Check if ownership changed
        const ownershipChanged = this.owner !== maxOwner;
        
        // Update owner if changed
        if (ownershipChanged) {
            this.owner = maxOwner;
            this.lastCaptured = GameState.getCurrentTurn();
        }
        
        return ownershipChanged;
    }
    
    /**
     * Add influence from a player to this territory
     * 
     * @param {string} player - Player identifier
     * @param {number} amount - Amount of influence to add
     */
    addInfluence(player, amount) {
        this.influence[player] += amount;
        
        // Ensure influence is not negative
        if (this.influence[player] < 0) {
            this.influence[player] = 0;
        }
    }
    
    /**
     * Get the total production of this territory based on owner
     * 
     * @returns {object} - Resource production map
     */
    getProduction() {
        const production = {
            [CONSTANTS.RESOURCE_TYPES.GOLD]: 0,
            [CONSTANTS.RESOURCE_TYPES.TIMBER]: 0,
            [CONSTANTS.RESOURCE_TYPES.IRON]: 0,
            [CONSTANTS.RESOURCE_TYPES.FOOD]: 0
        };
        
        // Only produce if territory is owned by a player
        if (this.owner !== CONSTANTS.PLAYERS.NEUTRAL) {
            production[this.resourceType] += this.resourceValue;
            
            if (this.secondaryResource) {
                production[this.secondaryResource] += this.secondaryValue;
            }
        }
        
        return production;
    }
    
    /**
     * Get color for rendering this territory
     * 
     * @returns {string} - CSS color code
     */
    getColor() {
        // Base color determined by resource type
        let baseColor;
        switch (this.resourceType) {
            case CONSTANTS.RESOURCE_TYPES.GOLD:
                baseColor = CONSTANTS.COLORS.GOLD;
                break;
            case CONSTANTS.RESOURCE_TYPES.TIMBER:
                baseColor = CONSTANTS.COLORS.TIMBER;
                break;
            case CONSTANTS.RESOURCE_TYPES.IRON:
                baseColor = CONSTANTS.COLORS.IRON;
                break;
            case CONSTANTS.RESOURCE_TYPES.FOOD:
                baseColor = CONSTANTS.COLORS.FOOD;
                break;
            default:
                baseColor = CONSTANTS.COLORS.NEUTRAL;
        }
        
        // Adjust color based on owner
        if (this.owner === CONSTANTS.PLAYERS.PLAYER) {
            return this.isContested ? `${CONSTANTS.COLORS.PLAYER}99` : CONSTANTS.COLORS.PLAYER;
        } else if (this.owner === CONSTANTS.PLAYERS.AI) {
            return this.isContested ? `${CONSTANTS.COLORS.AI}99` : CONSTANTS.COLORS.AI;
        }
        
        // Use base resource color for neutral territories
        return baseColor;
    }
    
    /**
     * Select this territory
     * 
     * @param {boolean} selected - Whether the territory is selected
     */
    setSelected(selected) {
        this.selected = selected;
    }
    
    /**
     * Get a simplified representation for UI display
     * 
     * @returns {object} - Simplified territory data
     */
    getDisplayData() {
        // Get the dominant influence
        const playerInfluence = this.influence[CONSTANTS.PLAYERS.PLAYER];
        const aiInfluence = this.influence[CONSTANTS.PLAYERS.AI];
        const neutralInfluence = this.influence[CONSTANTS.PLAYERS.NEUTRAL];
        
        let dominantInfluence;
        let dominantAmount;
        
        if (playerInfluence >= aiInfluence && playerInfluence >= neutralInfluence) {
            dominantInfluence = "Player";
            dominantAmount = playerInfluence;
        } else if (aiInfluence >= playerInfluence && aiInfluence >= neutralInfluence) {
            dominantInfluence = "AI";
            dominantAmount = aiInfluence;
        } else {
            dominantInfluence = "Neutral";
            dominantAmount = neutralInfluence;
        }
        
        return {
            id: this.id,
            coordinates: `(${this.coordinates.q}, ${this.coordinates.r})`,
            owner: this.owner === CONSTANTS.PLAYERS.NEUTRAL ? 'None' : 
                   this.owner === CONSTANTS.PLAYERS.PLAYER ? 'Player' : 'AI',
            resourceType: this.resourceType.charAt(0).toUpperCase() + this.resourceType.slice(1),
            resourceValue: this.resourceValue,
            secondaryResource: this.secondaryResource ? 
                              this.secondaryResource.charAt(0).toUpperCase() + this.secondaryResource.slice(1) : 'None',
            secondaryValue: this.secondaryValue,
            influence: `${dominantInfluence} (${dominantAmount})`,
            isContested: this.isContested,
            territoryType: this.territoryType.replace('_', ' ')
        };
    }
}
