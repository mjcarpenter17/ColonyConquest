import { Territory } from '../map/territory.js';
import { OWNERS, RESOURCE_TYPES } from '../utils/constants.js'; // Added for default values

export class TerritoryManager {
    constructor(gameEventBus, gameState, hexGrid) { // Added gameEventBus
        if (!gameEventBus) {
            throw new Error("TerritoryManager requires a GameEventBus instance.");
        }
        if (!gameState) {
            throw new Error("TerritoryManager requires a GameState instance.");
        }
        if (!hexGrid) {
            throw new Error("TerritoryManager requires a HexGrid instance.");
        }
        this.gameState = gameState;
        this.hexGrid = hexGrid;
        this.gameEventBus = gameEventBus; // Store gameEventBus

        // Ensures gameState.territories is initialized as a Map
        if (!(this.gameState.territories instanceof Map)) {
            this.gameState.territories = new Map();
        }
    }

    /**
     * Creates a new Territory object, adds it to the GameState, and returns it.
     * If a territory already exists at q,r, it returns the existing one and optionally updates it.
     * @param {number} q - The q coordinate of the territory.
     * @param {number} r - The r coordinate of the territory.
     * @param {object} [initialData={}] - Optional initial data for the territory (e.g., resourceType, resourceValue, owner).
     * @returns {Territory|null} The created or existing Territory object, or null if hex is invalid.
     */
    createOrGetTerritory(q, r, initialData = {}) {
        const hexKey = `${q},${r}`;
        
        if (!this.hexGrid.getHex(q,r)) {
            console.warn(`TerritoryManager: Attempted to create/get territory for non-existent hex: ${q},${r}`);
            return null;
        }

        let territory = this.gameState.getTerritory(hexKey);
        let created = false;

        if (territory) {
            // Territory exists, update it with new data if provided
            if (Object.keys(initialData).length > 0) {
                Object.assign(territory, initialData);
                // Emit an update event if significant properties change
                this.gameEventBus.emit(this.gameEventBus.events.TERRITORY_UPDATED, { territoryId: territory.id, changes: initialData, territoryData: territory });
            }
        } else {
            // Territory does not exist, create a new one
            // The Territory constructor in territory.js is (q, r, s = null)
            // It then self-initializes resourceType and resourceValue.
            // We will override these with initialData if provided.
            territory = new Territory(q, r); // s will be auto-calculated

            const defaults = {
                owner: OWNERS.NEUTRAL,
                // resourceType and resourceValue are now set by Territory constructor by default
                // but can be overridden by initialData
                isHomeBase: false,
                id: hexKey // Ensure ID is set
            };
            
            // Merge defaults, then initialData. initialData takes precedence.
            // The territory object itself (with its generated resources) is the base.
            const finalData = { ...defaults, ...initialData };
            Object.assign(territory, finalData);
            
            // Ensure q, r, s from constructor are not overwritten if initialData accidentally contains them
            territory.q = q;
            territory.r = r;
            territory.s = -q -r;

            this.gameState.addTerritory(territory); // GameState.addTerritory should handle adding to its map
            created = true;
        }

        if (created) {
            this.gameEventBus.emit(this.gameEventBus.events.TERRITORY_CREATED, territory);
        }
        return territory;
    }

    /**
     * Retrieves a territory by its coordinates.
     * @param {number} q - The q coordinate.
     * @param {number} r - The r coordinate.
     * @returns {Territory|null} The Territory object or null if not found.
     */
    getTerritoryAt(q, r) {
        const hexKey = `${q},${r}`;
        return this.gameState.getTerritory(hexKey);
    }

    /**
     * Initializes all territories based on configurations, typically from MapGenerator.
     * Clears existing territories in GameState before populating.
     * @param {Array<object>} territoryConfigs - Array of {q, r, resourceType, resourceValue, owner, etc.}
     */
    initializeTerritories(territoryConfigs = []) {
        this.gameState.territories.clear(); // Clear any existing territories
        this.gameEventBus.emit(this.gameEventBus.events.TERRITORIES_CLEARED); // Notify that territories are being reset

        // First, create territories for all hexes in the grid with default values
        this.hexGrid.getAllHexes().forEach(hexData => {
            // hexData from hexGrid.getAllHexes() is an object like:
            // { coord: {q, r, s}, key: "q,r", neighbors: Array, pixelPos: Object, corners: Array }
            // We need to extract q and r from hexData.coord
            if (hexData && hexData.coord) {
                const { q, r } = hexData.coord;
                // Create a basic territory if no specific config exists yet
                // This ensures all hexes on the grid have a corresponding territory object
                if (!this.getTerritoryAt(q, r)) { 
                     this.createOrGetTerritory(q, r, { id: `${q},${r}` }); 
                }
            } else {
                console.warn("TerritoryManager: hexData or hexData.coord is undefined in initializeTerritories for a hex.", hexData);
            }
        });
        
        // Then, apply specific configurations from MapGenerator
        territoryConfigs.forEach(config => {
            // Ensure config has q and r
            if (config.q === undefined || config.r === undefined) {
                console.warn("TerritoryManager: territoryConfig missing q or r", config);
                return;
            }
            const territory = this.createOrGetTerritory(config.q, config.r, config); 

            if (territory && typeof config.isHomeBaseFor === 'string' && config.isHomeBaseFor !== OWNERS.NONE) {
                 territory.owner = config.isHomeBaseFor; 
                 territory.isHomeBase = true;
                 // An update event is already emitted by createOrGetTerritory if initialData is present
                 // Or a created event is emitted. If specific home base update is needed, emit here.
                 // For now, relying on the event from createOrGetTerritory.
            }
        });

        console.log(`TerritoryManager initialized/updated ${this.gameState.territories.size} territories.`);
        this.gameEventBus.emit(this.gameEventBus.events.MAP_INITIALIZED, { territoryCount: this.gameState.territories.size });
    }

    getAllTerritories() {
        return Array.from(this.gameState.territories.values());
    }

    /**
     * Retrieves all territories belonging to a specific owner.
     * @param {string} ownerId - The ID of the owner (e.g., OWNERS.PLAYER).
     * @returns {Array<Territory>} An array of Territory objects.
     */
    getTerritoriesByOwner(ownerId) {
        if (!ownerId) return [];
        const allTerritories = this.getAllTerritories();
        return allTerritories.filter(territory => territory.owner === ownerId);
    }

    /**
     * Updates specific properties of a territory and emits an event.
     * @param {string} territoryId - The ID of the territory to update.
     * @param {object} updates - An object containing the properties to update.
     * @returns {Territory|null} The updated territory or null if not found.
     */
    updateTerritoryData(territoryId, updates) {
        const territory = this.gameState.getTerritory(territoryId);
        if (territory) {
            Object.assign(territory, updates);
            this.gameEventBus.emit(this.gameEventBus.events.TERRITORY_UPDATED, { territoryId: territory.id, changes: updates, territoryData: territory });
            // GameState now listens to TERRITORY_UPDATED via GameEventBus, so direct notification might be redundant.
            // this.gameState.notifyTerritoryChange({ action: 'updated', territoryId: territory.id, data: updates }); 
            return territory;
        }
        console.warn(`TerritoryManager: Attempted to update non-existent territory: ${territoryId}`);
        return null;
    }

    /**
     * Claims a territory for a player if it's neutral or belongs to another player (combat rules would apply here later).
     * @param {string} territoryId - The ID of the territory to claim.
     * @param {string} playerId - The ID of the player claiming the territory.
     * @param {object} cost - The cost of claiming the territory (for event/notification purposes).
     * @returns {boolean} True if successfully claimed, false otherwise.
     */
    claimTerritory(territoryId, playerId, cost) {
        const territory = this.gameState.getTerritory(territoryId);
        if (territory) {
            if (territory.owner === OWNERS.NEUTRAL || territory.owner !== playerId) { // Basic claim logic
                const oldOwner = territory.owner;
                territory.owner = playerId;
                territory.isHomeBase = false; // Claiming usually removes home base status unless specifically set
                
                const eventData = {
                    action: 'claimed', // Kept for compatibility if some systems look for this
                    territoryId: territory.id,
                    newOwner: playerId,
                    oldOwner: oldOwner,
                    cost: cost, // Pass cost through for notifications
                    territoryData: territory // Pass the full territory object
                };
                // Emit specific event for claiming
                this.gameEventBus.emit(this.gameEventBus.events.TERRITORY_CLAIMED, eventData);
                
                // Emit a general ownership changed event as well, if systems listen for this specifically
                // This might be redundant if TERRITORY_CLAIMED is sufficient for all listeners (like GameState)
                this.gameEventBus.emit(this.gameEventBus.events.TERRITORY_OWNERSHIP_CHANGED, {
                    territory: territory, // Pass the territory object
                    newOwner: playerId,
                    oldOwner: oldOwner
                });

                // GameState now listens to TERRITORY_CLAIMED via GameEventBus.
                // this.gameState.notifyTerritoryChange(eventData); 

                console.log(`Territory ${territoryId} claimed by ${playerId}`);
                return true;
            }
            console.warn(`Territory ${territoryId} cannot be claimed by ${playerId}. Current owner: ${territory.owner}`);
            return false;
        }
        console.warn(`TerritoryManager: Attempted to claim non-existent territory: ${territoryId}`);
        return false;
    }
}
