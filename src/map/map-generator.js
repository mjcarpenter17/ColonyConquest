/**
 * Map Generator
 * Generates balanced hexagonal maps with strategic resource distribution
 */

import { HexGrid } from './hex-grid.js';
import { GAME_CONFIG, RESOURCE_TYPES, OWNERS } from '../utils/constants.js';

export class MapGenerator {
    constructor(hexGrid, territoryManager) { // Accept hexGrid and territoryManager
        if (!hexGrid) {
            throw new Error("MapGenerator requires a HexGrid instance.");
        }
        if (!territoryManager) {
            throw new Error("MapGenerator requires a TerritoryManager instance.");
        }
        this.hexGrid = hexGrid; // Store hexGrid instance
        this.territoryManager = territoryManager; // Store territoryManager instance
        this.playerStartPositions = []; // Still useful for internal logic
    }

    /**
     * Generate a balanced game map for a given number of players.
     * This method will now orchestrate the creation of territories via TerritoryManager.
     * @param {number} playerCount - Number of players (e.g., 2).
     * @param {number} mapSize - Optional map size (radius), defaults to GAME_CONFIG.GRID_SIZE.
     */
    generateBalancedMap(playerCount = 2, mapSize = GAME_CONFIG.GRID_SIZE) {
        this.validateInput(playerCount, mapSize); // mapSize might not be directly used if hexGrid is pre-initialized
        
        this.playerStartPositions = []; // Reset for this generation

        // 1. Create initial territory objects for all hexes in the grid via TerritoryManager
        // TerritoryManager.initializeTerritories can create default territories for all hexes.
        // Or, we can iterate and call createOrGetTerritory for each hex if more control is needed here.
        // For now, let's assume GameScene calls initializeMap which calls this, and TM has already
        // created blank territories for all hexes in hexGrid during its own initializeTerritories.
        // So, this method will focus on *configuring* those territories.

        const allHexCoords = this.hexGrid.getAllHexes(); // allHexCoords is an array of hexData objects
                                                       // hexData = { coord: {q, r, s}, key: "q,r", ... }
        let territoryConfigs = allHexCoords.map(hexData => ({
            q: hexData.coord.q,
            r: hexData.coord.r,
            s: hexData.coord.s, // s is present in hexData.coord, Territory constructor can also calculate it
            id: hexData.key,    // hexData.key is the string "q,r"
            owner: OWNERS.NEUTRAL,
            resourceType: RESOURCE_TYPES.NONE,
            resourceValue: 0,
            isHomeBase: false,
            isHomeBaseFor: OWNERS.NONE
        }));

        // 2. Distribute resources strategically
        territoryConfigs = this.distributeResources(territoryConfigs, mapSize);
        
        // 3. Set player starting positions and mark home bases
        territoryConfigs = this.setPlayerStartPositions(territoryConfigs, playerCount, mapSize);
        
        // 4. Balance resource accessibility (optional, can be complex)
        // territoryConfigs = this.balanceResourceAccess(territoryConfigs, playerCount, mapSize);
        
        // 5. Finalize and register all territories with TerritoryManager
        this.territoryManager.initializeTerritories(territoryConfigs);
        
        // 6. Validate map (optional, internal checks)
        // this.validateMapSetup(playerCount);

        console.log(`MapGenerator: Generated and configured map for ${playerCount} players.`);
        // No longer returns map data directly, GameScene will use TerritoryManager
    }

    /**
     * Validate input parameters
     * @param {number} playerCount 
     * @param {number} mapSize 
     */
    validateInput(playerCount, mapSize) {
        if (playerCount < 2 || playerCount > 4) {
            throw new Error('Player count must be between 2 and 4');
        }
        if (mapSize < 2 || mapSize > 14) { // Adjusted mapSize validation to allow up to 14
            throw new Error('Map size must be between 2 and 14');
        }
    }

    /**
     * Create territory objects for all grid positions
     * @param {number} mapSize 
     */
    createTerritories(mapSize) {
        // This method is now effectively handled by TerritoryManager.initializeTerritories
        // or by the initial loop in generateBalancedMap. 
        // Kept for reference or if a different generation strategy is needed.
        console.warn("MapGenerator.createTerritories is deprecated; TerritoryManager now handles initial creation.");
        /*
        const hexPositions = this.grid.generateGridPositions(); // Assuming this.grid is set
        const configs = [];
        for (const [q, r] of hexPositions) {
            configs.push({ q, r, owner: OWNERS.NEUTRAL, resourceType: RESOURCE_TYPES.NONE, resourceValue: 0 });
        }
        this.territoryManager.initializeTerritories(configs);
        */
    }

    /**
     * Distribute resources across the map with strategic balance
     * @param {Array<object>} currentConfigs - The current array of territory configuration objects.
     * @param {number} mapSize - The size of the map.
     * @returns {Array<object>} Updated territory configs.
     */
    distributeResources(currentConfigs, mapSize) {
        const totalTerritories = currentConfigs.length;
        if (totalTerritories === 0) return currentConfigs;

        // Calculate target distribution (example)
        const targetDistribution = {
            [RESOURCE_TYPES.FOOD]: Math.ceil(totalTerritories * 0.35), // 35% food (most common)
            [RESOURCE_TYPES.WOOD]: Math.ceil(totalTerritories * 0.25), // 25% wood
            [RESOURCE_TYPES.STONE]: Math.ceil(totalTerritories * 0.20), // 20% stone
            [RESOURCE_TYPES.IRON]: Math.ceil(totalTerritories * 0.12),  // 12% iron
            [RESOURCE_TYPES.GOLD]: Math.ceil(totalTerritories * 0.08)   // 8% gold (rarest)
        };
        
        // Assign resources based on target distribution
        const shuffledTerritories = this.shuffleArray([...currentConfigs]);
        let resourceIndex = 0;
        
        for (const [resourceType, count] of Object.entries(targetDistribution)) {
            for (let i = 0; i < count && resourceIndex < shuffledTerritories.length; i++) {
                const territoryConfig = shuffledTerritories[resourceIndex];
                // Avoid overwriting home bases if they are already marked
                if (!territoryConfig.isHomeBase) {
                    territoryConfig.resourceType = resourceType;
                    territoryConfig.resourceValue = this.generateBalancedResourceValue(resourceType);
                }
                resourceIndex++;
            }
        }
        
        // console.log('Resource distribution calculated:', this.getResourceDistributionStats(shuffledTerritories));
        return shuffledTerritories; // Return the modified configs
    }

    /**
     * Generate balanced resource values
     * @param {string} resourceType 
     * @returns {number}
     */
    generateBalancedResourceValue(resourceType) {
        const valueRanges = {
            'food': { min: 2, max: 4, avg: 3 },
            'wood': { min: 2, max: 4, avg: 3 },
            'stone': { min: 1, max: 3, avg: 2 },
            'iron': { min: 1, max: 3, avg: 2 },
            'gold': { min: 1, max: 2, avg: 1.5 }
        };
        
        const range = valueRanges[resourceType];
        // Weighted towards average values for balance
        const random = Math.random();
        
        if (random < 0.6) {
            return Math.round(range.avg);
        } else if (random < 0.8) {
            return range.min;
        } else {
            return range.max;
        }
    }

    /**
     * Set balanced starting positions for players
     * @param {number} playerCount 
     */
    setPlayerStartPositions(currentConfigs, playerCount, mapSize) {
        const startHexCoords = this.calculateOptimalStartPositions(playerCount, mapSize);
        this.playerStartPositions = []; // Clear previous
        
        for (let i = 0; i < playerCount; i++) {
            const playerOwner = i === 0 ? OWNERS.PLAYER : OWNERS[`AI_${i}`]; // Assign PLAYER, AI_1, AI_2 etc.
            if (!playerOwner) {
                console.warn(`No owner constant defined for player index ${i}. Defaulting to AI_1 for now.`);
                // Fallback or throw error if OWNERS.AI_i doesn't exist
            }
            const pos = startHexCoords[i];
            if (!pos) {
                console.error(`Could not determine start position for player ${i}`);
                continue;
            }

            const key = `${pos.q},${pos.r}`;
            // Find the corresponding territory config to update
            const territoryConfig = currentConfigs.find(tc => tc.q === pos.q && tc.r === pos.r);
            
            if (territoryConfig) {
                territoryConfig.owner = playerOwner || OWNERS.AI_1; // Ensure owner is set
                territoryConfig.isHomeBase = true;
                territoryConfig.isHomeBaseFor = playerOwner || OWNERS.AI_1;
                territoryConfig.resourceType = RESOURCE_TYPES.NONE; // Home bases usually don't have resources
                territoryConfig.resourceValue = 0;

                this.playerStartPositions.push({
                    playerId: i, // or playerOwner
                    position: pos,
                    territoryId: territoryConfig.id // Store ID for reference
                });
            } else {
                console.warn(`MapGenerator: Could not find territory config at ${key} for player start position.`);
            }
        }
        
        // console.log(`Set ${playerCount} player start positions in configs.`);
        return currentConfigs; // Return modified configs
    }

    /**
     * Calculate optimal starting positions for maximum balance
     * @param {number} playerCount 
     * @param {number} mapSize - Radius of the map.
     * @returns {Array<{q: number, r: number}>} Starting positions
     */
    calculateOptimalStartPositions(playerCount, mapSize) {
        const allHexes = this.hexGrid.getAllHexes().map(hexData => hexData.coord); // Get all valid hex coordinates
        if (allHexes.length === 0) {
            console.error("MapGenerator: No hexes available in HexGrid to select start positions from.");
            // Fallback to very basic positions if grid is empty (should not happen in normal flow)
            const fallbackPositions = [];
            for (let i = 0; i < playerCount; i++) {
                fallbackPositions.push({ q: 0, r: i === 0 ? 0 : (i % 2 === 0 ? -1 : 1) * Math.floor(i/2 + 1) });
            }
            return fallbackPositions;
        }

        const gridRadius = Math.floor(mapSize / 2);
        let idealPositions = [];
        
        switch (playerCount) {
            case 2:
                idealPositions.push({ q: -gridRadius, r: 0 });
                idealPositions.push({ q: gridRadius, r: 0 });
                break;
            case 3:
                idealPositions.push({ q: gridRadius, r: 0 });
                idealPositions.push({ q: -gridRadius, r: Math.floor(gridRadius / 2) });
                idealPositions.push({ q: 0, r: gridRadius });
                break;
            case 4:
                idealPositions.push({ q: gridRadius, r: -Math.floor(gridRadius / 2) });
                idealPositions.push({ q: -gridRadius, r: Math.floor(gridRadius / 2) });
                idealPositions.push({ q: Math.floor(gridRadius / 2), r: gridRadius });
                idealPositions.push({ q: -Math.floor(gridRadius / 2), r: -gridRadius });
                break;
            default:
                idealPositions.push({ q: 0, r: 0 });
        }

        const selectedPositions = [];
        const availableHexes = [...allHexes]; // Create a mutable copy

        for (const idealPos of idealPositions) {
            if (selectedPositions.length >= playerCount) break;

            let bestMatch = null;
            let minDistance = Infinity;

            // Try to find the ideal position or the closest one in the actual grid
            for (let i = 0; i < availableHexes.length; i++) {
                const hex = availableHexes[i];
                const distance = this.hexGrid.getDistance(idealPos, hex); // Assuming hexGrid has getDistance

                if (distance < minDistance) {
                    minDistance = distance;
                    bestMatch = hex;
                }
                // If an exact match is found, prioritize it (distance 0)
                if (distance === 0) break; 
            }
            
            if (bestMatch) {
                selectedPositions.push(bestMatch);
                // Remove the selected hex from availableHexes to avoid picking it again
                const indexInAvailable = availableHexes.findIndex(h => h.q === bestMatch.q && h.r === bestMatch.r);
                if (indexInAvailable > -1) { // Corrected syntax error here
                    availableHexes.splice(indexInAvailable, 1);
                }
            }
        }
        
        // If not enough unique positions were found (e.g., small map, many players)
        // fill remaining spots from any available hexes, trying to maximize distance from already selected ones.
        if (selectedPositions.length < playerCount) {
            console.warn(`MapGenerator: Could only find ${selectedPositions.length}/${playerCount} distinct optimal start positions. Filling remaining...`);
            while (selectedPositions.length < playerCount && availableHexes.length > 0) {
                let bestFallback = availableHexes[0];
                let maxMinDist = -1;

                // Try to pick a hex that is furthest from any already selected position
                for (const fallbackHex of availableHexes) {
                    let currentMinDistToSelected = Infinity;
                    for (const sp of selectedPositions) {
                        currentMinDistToSelected = Math.min(currentMinDistToSelected, this.hexGrid.getDistance(fallbackHex, sp));
                    }
                    if (currentMinDistToSelected > maxMinDist) {
                        maxMinDist = currentMinDistToSelected;
                        bestFallback = fallbackHex;
                    }
                }
                selectedPositions.push(bestFallback);
                const indexInAvailable = availableHexes.findIndex(h => h.q === bestFallback.q && h.r === bestFallback.r);
                if (indexInAvailable > -1) { // Corrected syntax error here
                    availableHexes.splice(indexInAvailable, 1);
                }
            }
        }


        if (selectedPositions.length < playerCount) {
            console.error(`MapGenerator: Critical - Could not calculate enough valid start positions (${selectedPositions.length}/${playerCount}) for mapSize ${mapSize}. Some players may not have a start position.`);
            // Fill with duplicates or (0,0) if absolutely necessary, though this indicates a deeper issue.
            while(selectedPositions.length < playerCount) {
                selectedPositions.push(allHexes.length > 0 ? allHexes[0] : {q:0, r:0}); // Last resort
            }
        }
        
        return selectedPositions.slice(0, playerCount);
    }

    /**
     * Ensure each player has access to diverse resources
     * @param {Array} territoryConfigs 
     * @param {number} playerId 
     * @param {object} playerStartPos - The starting position of the player.
     */    ensureResourceDiversity(territoryConfigs, playerId, playerStartPos) {
        const nearbyHexes = this.hexGrid.getHexesInRange(playerStartPos, 2); // Get hex coords
        const resourceTypes = Object.values(RESOURCE_TYPES).filter(rt => rt !== RESOURCE_TYPES.NONE);
        const nearbyResources = new Set();

        // Check what resources are available nearby
        for (const hexPos of nearbyHexes) {
            const targetConfig = territoryConfigs.find(tc => tc.q === hexPos.q && tc.r === hexPos.r);
            if (targetConfig && !targetConfig.isHomeBase && targetConfig.resourceType !== RESOURCE_TYPES.NONE) {
                nearbyResources.add(targetConfig.resourceType);
            }
        }
        
        // Ensure at least 3 different resource types are accessible (excluding NONE)
        const missingResources = resourceTypes.filter(type => !nearbyResources.has(type));
        
        if (nearbyResources.size < Math.min(3, resourceTypes.length) && missingResources.length > 0) {
            const availableForChange = nearbyHexes.map(hexPos => 
                territoryConfigs.find(tc => tc.q === hexPos.q && tc.r === hexPos.r)
            ).filter(tc => tc && !tc.isHomeBase && tc.owner === OWNERS.NEUTRAL); // Only change neutral, non-homebase tiles
            
            this.shuffleArray(availableForChange); // Shuffle to pick random ones

            const resourcesToPlace = missingResources.slice(0, Math.min(3, resourceTypes.length) - nearbyResources.size);
            
            for (let i = 0; i < resourcesToPlace.length && i < availableForChange.length; i++) {
                const territoryToChange = availableForChange[i];
                if (territoryToChange) {
                    territoryToChange.resourceType = resourcesToPlace[i];
                    territoryToChange.resourceValue = this.generateBalancedResourceValue(resourcesToPlace[i]);
                }
            }
        }
        // Return territoryConfigs implicitly as it's modified by reference
    }

    /**
     * Balances resource access for all players.
     * @param {Array<object>} territoryConfigs - Current territory configurations.
     * @param {number} playerCount - Number of players.
     * @returns {Array<object>} Updated territory configurations.
     */
    balanceResourceAccess(territoryConfigs, playerCount) {
        if (!this.playerStartPositions || this.playerStartPositions.length !== playerCount) {
            console.warn("Player start positions not properly set for balancing resource access.");
            return territoryConfigs;
        }

        this.playerStartPositions.forEach(startData => {
            this.ensureResourceDiversity(territoryConfigs, startData.playerId, startData.position);
        });
        return territoryConfigs;
    }

    /**
     * Validate the generated map setup (internal checks after configuration)
     * @param {number} playerCount 
     */
    validateMapSetup(playerCount) {
        if (this.playerStartPositions.length !== playerCount) {
            console.error('MapGenerator Error: Invalid number of player start positions recorded.');
        }
        
        // Check resource distribution by querying TerritoryManager
        const allTerritories = this.territoryManager.getAllTerritories();
        if (allTerritories.length === 0 && this.hexGrid.getAllHexes().length > 0) {
            console.warn("MapGenerator Warning: No territories in TerritoryManager after generation.");
            return;
        }

        const distribution = {};
        Object.values(RESOURCE_TYPES).forEach(rt => distribution[rt] = 0);

        allTerritories.forEach(t => {
            if (t.resourceType !== RESOURCE_TYPES.NONE) {
                distribution[t.resourceType] = (distribution[t.resourceType] || 0) + 1;
            }
        });
        
        const totalResourceTerritories = allTerritories.filter(t => t.resourceType !== RESOURCE_TYPES.NONE).length;

        for (const [resource, count] of Object.entries(distribution)) {
            if (resource === RESOURCE_TYPES.NONE) continue;
            const percentage = totalResourceTerritories > 0 ? (count / totalResourceTerritories) * 100 : 0;
            if (count === 0 && totalResourceTerritories > 0) { // Only warn if other resources exist
                 console.warn(`MapGenerator: Potentially low or zero ${resource} distribution: ${count} territories (${percentage.toFixed(1)}%).`);
            }
        }
        
        this.validateStartingDistances();
        console.log('MapGenerator: Map setup validation completed.');
    }

    /**
     * Validate that starting positions are appropriately spaced
     */
    validateStartingDistances() {
        for (let i = 0; i < this.playerStartPositions.length; i++) {
            for (let j = i + 1; j < this.playerStartPositions.length; j++) {
                const pos1 = this.playerStartPositions[i].position;
                const pos2 = this.playerStartPositions[j].position;
                const distance = this.hexGrid.getDistance(pos1, pos2);
                
                if (distance < 3) {
                    console.warn(`Players ${i} and ${j} too close: distance ${distance}`);
                }
            }
        }
    }

    /**
     * Get current resource distribution statistics
     * @returns {object} Resource counts
     */
    getResourceDistributionStats(territoryConfigs) {
        const distribution = {};
        Object.values(RESOURCE_TYPES).forEach(rt => distribution[rt] = 0);

        territoryConfigs.forEach(tc => {
            if (tc.resourceType && tc.resourceType !== RESOURCE_TYPES.NONE) {
                distribution[tc.resourceType] = (distribution[tc.resourceType] || 0) + 1;
            }
        });
        return distribution;
    }

    /**
     * Utility to shuffle an array (Fisher-Yates shuffle)
     * @param {Array} array 
     * @returns {Array} Shuffled array
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
