/**
 * Map Generator
 * Generates balanced hexagonal maps with strategic resource distribution
 */

import { HexGrid } from './hex-grid.js';
import { Territory } from './territory.js';
import { GAME_CONFIG, RESOURCE_TYPES, OWNERS } from '../utils/constants.js';

export class MapGenerator {
    constructor() {
        this.grid = null;
        this.territories = new Map(); // Key: "q,r" -> Territory
        this.playerStartPositions = [];
    }

    /**
     * Generate a complete game map
     * @param {number} playerCount - Number of players (2-4)
     * @param {number} mapSize - Map radius (default: 3 for 7x7 grid)
     * @returns {object} Generated map data
     */
    generateMap(playerCount = 2, mapSize = 3) {
        this.validateInput(playerCount, mapSize);
        
        // Initialize hex grid
        this.grid = new HexGrid(mapSize);
        this.territories.clear();
        this.playerStartPositions = [];
        
        // Generate territories
        this.createTerritories(mapSize);
        
        // Distribute resources strategically
        this.distributeResources();
        
        // Set player starting positions
        this.setPlayerStartPositions(playerCount);
        
        // Balance resource accessibility
        this.balanceResourceAccess(playerCount);
        
        // Final validation
        this.validateMap(playerCount);
        
        return this.getMapData();
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
        if (mapSize < 2 || mapSize > 5) {
            throw new Error('Map size must be between 2 and 5');
        }
    }

    /**
     * Create territory objects for all grid positions
     * @param {number} mapSize 
     */
    createTerritories(mapSize) {
        const hexPositions = this.grid.generateGridPositions();
        
        for (const [q, r] of hexPositions) {
            const territory = new Territory(q, r);
            const key = `${q},${r}`;
            this.territories.set(key, territory);
        }
        
        console.log(`Generated ${this.territories.size} territories`);
    }

    /**
     * Distribute resources across the map with strategic balance    */
    distributeResources() {
        const territories = Array.from(this.territories.values());
        const resourceTypes = Object.values(RESOURCE_TYPES);
        
        // Calculate target distribution
        const totalTerritories = territories.length;
        const targetDistribution = {
            'food': Math.ceil(totalTerritories * 0.35), // 35% food (most common)
            'wood': Math.ceil(totalTerritories * 0.25), // 25% wood
            'stone': Math.ceil(totalTerritories * 0.20), // 20% stone
            'iron': Math.ceil(totalTerritories * 0.12),  // 12% iron
            'gold': Math.ceil(totalTerritories * 0.08)   // 8% gold (rarest)
        };
        
        // Assign resources based on target distribution
        const shuffledTerritories = this.shuffleArray([...territories]);
        let resourceIndex = 0;
        
        for (const [resourceType, count] of Object.entries(targetDistribution)) {
            for (let i = 0; i < count && resourceIndex < shuffledTerritories.length; i++) {
                const territory = shuffledTerritories[resourceIndex];
                territory.resourceType = resourceType;
                territory.resourceValue = this.generateBalancedResourceValue(resourceType);
                resourceIndex++;
            }
        }
        
        console.log('Resource distribution:', this.getResourceDistribution());
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
    setPlayerStartPositions(playerCount) {
        const startPositions = this.calculateOptimalStartPositions(playerCount);
        
        for (let i = 0; i < playerCount; i++) {
            const position = startPositions[i];
            const key = `${position.q},${position.r}`;
            const territory = this.territories.get(key);
            
            if (territory) {
                territory.setAsHomeBase(i);
                this.playerStartPositions.push({
                    playerId: i,
                    position: position,
                    territory: territory
                });
            }
        }
        
        console.log(`Set ${playerCount} player start positions`);
    }

    /**
     * Calculate optimal starting positions for maximum balance
     * @param {number} playerCount 
     * @returns {Array} Starting positions
     */
    calculateOptimalStartPositions(playerCount) {
        const centerHex = { q: 0, r: 0 };
        const positions = [];
        
        switch (playerCount) {
            case 2:
                // Opposite corners for 2 players
                positions.push({ q: -2, r: 2 });   // Southwest
                positions.push({ q: 2, r: -2 });   // Northeast
                break;
                
            case 3:
                // Triangle formation for 3 players
                positions.push({ q: -2, r: 2 });   // Southwest
                positions.push({ q: 2, r: -2 });   // Northeast
                positions.push({ q: 0, r: -2 });   // North
                break;
                
            case 4:
                // Square formation for 4 players
                positions.push({ q: -2, r: 1 });   // West
                positions.push({ q: 1, r: -2 });   // North
                positions.push({ q: 2, r: -1 });   // East
                positions.push({ q: -1, r: 2 });   // South
                break;
        }
        
        return positions;
    }

    /**
     * Balance resource accessibility around each player's starting position
     * @param {number} playerCount 
     */
    balanceResourceAccess(playerCount) {
        for (const startData of this.playerStartPositions) {
            const { position, playerId } = startData;
            const nearbyTerritories = this.grid.getHexesInRange(position, 2);
            
            this.ensureResourceDiversity(nearbyTerritories, playerId);
        }
    }

    /**
     * Ensure each player has access to diverse resources
     * @param {Array} nearbyTerritories 
     * @param {number} playerId 
     */    ensureResourceDiversity(nearbyTerritories, playerId) {
        const resourceTypes = Object.values(RESOURCE_TYPES);
        const nearbyResources = new Set();
        
        // Check what resources are available nearby
        for (const hexPos of nearbyTerritories) {
            const key = `${hexPos.q},${hexPos.r}`;
            const territory = this.territories.get(key);
            if (territory && !territory.isHomeBase) {
                nearbyResources.add(territory.resourceType);
            }
        }
        
        // Ensure at least 3 different resource types are accessible
        const missingResources = resourceTypes.filter(type => !nearbyResources.has(type));
        
        if (nearbyResources.size < 3 && missingResources.length > 0) {
            // Replace some random nearby territories with missing resources
            const availableForChange = nearbyTerritories.filter(hexPos => {
                const key = `${hexPos.q},${hexPos.r}`;
                const territory = this.territories.get(key);
                return territory && !territory.isHomeBase;
            });
            
            const resourcesToAdd = missingResources.slice(0, 3 - nearbyResources.size);
            
            for (let i = 0; i < resourcesToAdd.length && i < availableForChange.length; i++) {
                const hexPos = availableForChange[i];
                const key = `${hexPos.q},${hexPos.r}`;
                const territory = this.territories.get(key);
                
                if (territory) {
                    territory.resourceType = resourcesToAdd[i];
                    territory.resourceValue = this.generateBalancedResourceValue(resourcesToAdd[i]);
                }
            }
        }
    }

    /**
     * Validate the generated map meets quality standards
     * @param {number} playerCount 
     */
    validateMap(playerCount) {
        // Check player start positions
        if (this.playerStartPositions.length !== playerCount) {
            throw new Error('Invalid number of player start positions');
        }
        
        // Check resource distribution
        const distribution = this.getResourceDistribution();
        const totalTerritories = this.territories.size;
        
        for (const [resource, count] of Object.entries(distribution)) {
            const percentage = (count / totalTerritories) * 100;
            if (percentage < 5) { // Each resource should be at least 5% of map
                console.warn(`Low ${resource} distribution: ${percentage.toFixed(1)}%`);
            }
        }
        
        // Check starting position distances
        this.validateStartingDistances();
        
        console.log('Map validation completed successfully');
    }

    /**
     * Validate that starting positions are appropriately spaced
     */
    validateStartingDistances() {
        for (let i = 0; i < this.playerStartPositions.length; i++) {
            for (let j = i + 1; j < this.playerStartPositions.length; j++) {
                const pos1 = this.playerStartPositions[i].position;
                const pos2 = this.playerStartPositions[j].position;
                const distance = this.grid.getDistance(pos1, pos2);
                
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
    getResourceDistribution() {
        const distribution = {};
        
        for (const territory of this.territories.values()) {
            const resource = territory.resourceType;
            distribution[resource] = (distribution[resource] || 0) + 1;
        }
        
        return distribution;
    }

    /**
     * Get complete map data
     * @returns {object} Map data for game initialization
     */
    getMapData() {
        return {
            grid: this.grid,
            territories: this.territories,
            playerStartPositions: this.playerStartPositions,
            mapSize: this.grid.radius,
            totalTerritories: this.territories.size,
            resourceDistribution: this.getResourceDistribution()
        };
    }

    /**
     * Utility: Shuffle array in place
     * @param {Array} array 
     * @returns {Array}
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Generate a preview of the map for testing
     * @returns {string} ASCII representation
     */
    generateMapPreview() {
        let preview = '\n=== MAP PREVIEW ===\n';
        
        // Resource distribution
        preview += 'Resources:\n';
        const distribution = this.getResourceDistribution();
        for (const [resource, count] of Object.entries(distribution)) {
            const percentage = ((count / this.territories.size) * 100).toFixed(1);
            preview += `  ${resource}: ${count} (${percentage}%)\n`;
        }
        
        // Player positions
        preview += '\nPlayer Start Positions:\n';
        for (const startData of this.playerStartPositions) {
            const { playerId, position, territory } = startData;
            preview += `  Player ${playerId + 1}: (${position.q}, ${position.r}) - ${territory.resourceType}\n`;
        }
        
        preview += '\n==================\n';
        return preview;
    }
}
