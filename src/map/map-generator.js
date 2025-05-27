/**
 * MapGenerator module for procedural map creation
 */

const MapGenerator = (function() {
    /**
     * Generate a balanced game map
     * 
     * @param {number} width - Map width in hexes
     * @param {number} height - Map height in hexes
     * @returns {Map} - Map of generated territories
     */
    function generateMap(width, height) {
        const territories = new Map();
        
        // Define resource distribution (total should be 100%)
        const resourceDistribution = {
            [CONSTANTS.RESOURCE_TYPES.GOLD]: 0.25,   // 25%
            [CONSTANTS.RESOURCE_TYPES.TIMBER]: 0.25, // 25%
            [CONSTANTS.RESOURCE_TYPES.IRON]: 0.25,   // 25%
            [CONSTANTS.RESOURCE_TYPES.FOOD]: 0.25    // 25%
        };
        
        // Define territory type distribution
        const territoryDistribution = {
            [CONSTANTS.TERRITORY_TYPES.RESOURCE_NODE]: 0.7,    // 70%
            [CONSTANTS.TERRITORY_TYPES.MIXED_ZONE]: 0.2,       // 20%
            [CONSTANTS.TERRITORY_TYPES.STRATEGIC_POINT]: 0.1   // 10%
        };
        
        // Track the number of territories by resource type
        const resourceCount = {
            [CONSTANTS.RESOURCE_TYPES.GOLD]: 0,
            [CONSTANTS.RESOURCE_TYPES.TIMBER]: 0,
            [CONSTANTS.RESOURCE_TYPES.IRON]: 0,
            [CONSTANTS.RESOURCE_TYPES.FOOD]: 0
        };
        
        // Track the number of territories by territory type
        const territoryTypeCount = {
            [CONSTANTS.TERRITORY_TYPES.RESOURCE_NODE]: 0,
            [CONSTANTS.TERRITORY_TYPES.MIXED_ZONE]: 0,
            [CONSTANTS.TERRITORY_TYPES.STRATEGIC_POINT]: 0
        };
        
        // Calculate the total number of territories
        const totalTerritories = width * height;
        
        // Calculate expected distribution counts
        const expectedResourceCounts = {
            [CONSTANTS.RESOURCE_TYPES.GOLD]: Math.round(totalTerritories * resourceDistribution[CONSTANTS.RESOURCE_TYPES.GOLD]),
            [CONSTANTS.RESOURCE_TYPES.TIMBER]: Math.round(totalTerritories * resourceDistribution[CONSTANTS.RESOURCE_TYPES.TIMBER]),
            [CONSTANTS.RESOURCE_TYPES.IRON]: Math.round(totalTerritories * resourceDistribution[CONSTANTS.RESOURCE_TYPES.IRON]),
            [CONSTANTS.RESOURCE_TYPES.FOOD]: Math.round(totalTerritories * resourceDistribution[CONSTANTS.RESOURCE_TYPES.FOOD])
        };
        
        const expectedTerritoryTypeCounts = {
            [CONSTANTS.TERRITORY_TYPES.RESOURCE_NODE]: Math.round(totalTerritories * territoryDistribution[CONSTANTS.TERRITORY_TYPES.RESOURCE_NODE]),
            [CONSTANTS.TERRITORY_TYPES.MIXED_ZONE]: Math.round(totalTerritories * territoryDistribution[CONSTANTS.TERRITORY_TYPES.MIXED_ZONE]),
            [CONSTANTS.TERRITORY_TYPES.STRATEGIC_POINT]: Math.round(totalTerritories * territoryDistribution[CONSTANTS.TERRITORY_TYPES.STRATEGIC_POINT])
        };
        
        // Generate territories
        for (let q = 0; q < width; q++) {
            for (let r = 0; r < height; r++) {
                // Create a unique ID for the territory
                const id = MathUtils.hexToId(q, r);
                
                // Select territory type
                let territoryType;
                if (territoryTypeCount[CONSTANTS.TERRITORY_TYPES.STRATEGIC_POINT] < expectedTerritoryTypeCounts[CONSTANTS.TERRITORY_TYPES.STRATEGIC_POINT]) {
                    territoryType = CONSTANTS.TERRITORY_TYPES.STRATEGIC_POINT;
                } else if (territoryTypeCount[CONSTANTS.TERRITORY_TYPES.MIXED_ZONE] < expectedTerritoryTypeCounts[CONSTANTS.TERRITORY_TYPES.MIXED_ZONE]) {
                    territoryType = CONSTANTS.TERRITORY_TYPES.MIXED_ZONE;
                } else {
                    territoryType = CONSTANTS.TERRITORY_TYPES.RESOURCE_NODE;
                }
                territoryTypeCount[territoryType]++;
                
                // Select resource type - try to balance based on expected distribution
                let resourceType;
                const remainingTypes = Object.keys(resourceCount).filter(
                    type => resourceCount[type] < expectedResourceCounts[type]
                );
                
                if (remainingTypes.length > 0) {
                    // Select from remaining types
                    resourceType = remainingTypes[Math.floor(Math.random() * remainingTypes.length)];
                } else {
                    // Fallback to random selection
                    const types = Object.values(CONSTANTS.RESOURCE_TYPES);
                    resourceType = types[Math.floor(Math.random() * types.length)];
                }
                resourceCount[resourceType]++;
                
                // Determine resource value (1-3)
                const resourceValue = Math.floor(Math.random() * 3) + 1;
                
                // Create territory
                const territory = new Territory(id, q, r, resourceType, resourceValue, territoryType);
                
                // Add secondary resource for mixed zones
                if (territoryType === CONSTANTS.TERRITORY_TYPES.MIXED_ZONE) {
                    // Select secondary resource that's different from primary
                    const otherTypes = Object.values(CONSTANTS.RESOURCE_TYPES)
                        .filter(type => type !== resourceType);
                    const secondaryType = otherTypes[Math.floor(Math.random() * otherTypes.length)];
                    territory.addSecondaryResource(secondaryType, 1);
                }
                
                // Add territory to the map
                territories.set(id, territory);
            }
        }
        
        return territories;
    }
    
    /**
     * Place starting territories for players
     * 
     * @param {Map} territories - Map of territories
     * @param {number} width - Map width
     * @param {number} height - Map height
     */
    function setupStartingTerritories(territories, width, height) {
        // Player starts in the bottom left corner
        const playerStartQ = 0;
        const playerStartR = height - 1;
        const playerId = MathUtils.hexToId(playerStartQ, playerStartR);
        
        // AI starts in the top right corner
        const aiStartQ = width - 1;
        const aiStartR = 0;
        const aiId = MathUtils.hexToId(aiStartQ, aiStartR);
        
        // Set player territory
        if (territories.has(playerId)) {
            const playerTerritory = territories.get(playerId);
            playerTerritory.owner = CONSTANTS.PLAYERS.PLAYER;
            playerTerritory.influence = {
                [CONSTANTS.PLAYERS.PLAYER]: 10,
                [CONSTANTS.PLAYERS.AI]: 0,
                [CONSTANTS.PLAYERS.NEUTRAL]: 0
            };
        }
        
        // Set AI territory
        if (territories.has(aiId)) {
            const aiTerritory = territories.get(aiId);
            aiTerritory.owner = CONSTANTS.PLAYERS.AI;
            aiTerritory.influence = {
                [CONSTANTS.PLAYERS.PLAYER]: 0,
                [CONSTANTS.PLAYERS.AI]: 10,
                [CONSTANTS.PLAYERS.NEUTRAL]: 0
            };
        }
    }
    
    /**
     * Generate a complete game map
     * 
     * @param {number} width - Map width in hexes
     * @param {number} height - Map height in hexes
     * @returns {Map} - Map of generated territories
     */
    function createGameMap(width, height) {
        // Generate base territories
        const territories = generateMap(width, height);
        
        // Setup starting territories
        setupStartingTerritories(territories, width, height);
        
        return territories;
    }
    
    // Public API
    return {
        createGameMap
    };
})();
