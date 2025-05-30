/**
 * Colony Conquest - Game State Management
 * Central state management for the entire game
 */

import { GAME_CONFIG, RESOURCE_TYPES, OWNERS, TURN_PHASES, GAME_STATES } from '../utils/constants.js';

/**
 * GameState class - Manages all game data and state transitions
 */
export class GameState {
    constructor(gameEventBus) { // Added gameEventBus
        if (!gameEventBus) {
            // console.warn("GameState: GameEventBus not provided during construction. Some event-driven functionalities might not work.");
            // In a strict setup, you might throw an error:
            throw new Error("GameState requires a GameEventBus instance.");
        }
        this.gameEventBus = gameEventBus;
        this.initialize();
        this._territoryManager = null; // To be set by GameScene
        this._hexGrid = null; // To be set by GameScene
        this._resourceManager = null; // To be set by GameScene

        this._subscribeToEvents(); // Call to subscribe to game events
    }

    // Add setter for HexGrid
    setHexGrid(hexGrid) {
        this._hexGrid = hexGrid;
    }

    // Add setter for TerritoryManager
    setTerritoryManager(territoryManager) {
        this._territoryManager = territoryManager;
    }

    // Add setter for ResourceManager
    setResourceManager(resourceManager) {
        this._resourceManager = resourceManager;
    }

    /**
     * Initialize the game state with default values
     */
    initialize() {
        this.gameStatus = GAME_STATES.LOADING;
        this.currentTurn = 1;
        this.currentPlayer = OWNERS.PLAYER;
        this.currentPhase = TURN_PHASES.ACTION_PHASE;
        
        // Player resources
        this.resources = {
            [OWNERS.PLAYER]: { ...GAME_CONFIG.INITIAL_RESOURCES },
            [OWNERS.AI]: { ...GAME_CONFIG.INITIAL_RESOURCES }
        };
        
        // Territory management
        this.territories = new Map(); // This map will be managed by TerritoryManager
        this.selectedTerritory = null;
        
        // Game history and statistics
        this.turnHistory = [];
        this.gameEvents = []; // This might be for logging, distinct from GameEventBus
        this.statistics = {
            territoriesOwned: {
                [OWNERS.PLAYER]: 0,
                [OWNERS.AI]: 0,
                [OWNERS.NEUTRAL]: 0
            },
            resourcesCollected: {
                [OWNERS.PLAYER]: { gold: 0, wood: 0, metal: 0, food: 0 },
                [OWNERS.AI]: { gold: 0, wood: 0, metal: 0, food: 0 }
            }
        };
        
        // Victory conditions tracking
        this.victoryProgress = {
            territorialDominance: {
                [OWNERS.PLAYER]: 0,
                [OWNERS.AI]: 0
            },
            economicProgress: {
                [OWNERS.PLAYER]: 0,
                [OWNERS.AI]: 0
            },
            strategicPointsHeld: {
                [OWNERS.PLAYER]: 0,
                [OWNERS.AI]: 0,
                turnsHeld: 0
            }
        };
        
        // Legacy event system listeners property removed
    }

    _subscribeToEvents() {
        if (!this.gameEventBus) return;

        this.gameEventBus.on(this.gameEventBus.events.TERRITORY_SELECTED, this._handleTerritorySelected, this);
        this.gameEventBus.on(this.gameEventBus.events.TERRITORY_DESELECTED, this._handleTerritoryDeselected, this);
        
        // Events that might trigger statistic updates or other state changes
        this.gameEventBus.on(this.gameEventBus.events.TERRITORY_CREATED, this._handleTerritoryChange, this);
        this.gameEventBus.on(this.gameEventBus.events.TERRITORY_UPDATED, this._handleTerritoryChange, this);
        this.gameEventBus.on(this.gameEventBus.events.TERRITORY_CLAIMED, this._handleTerritoryChange, this);
        // If TERRITORY_OWNERSHIP_CHANGED is emitted and distinct logic is needed:
        // this.gameEventBus.on(this.gameEventBus.events.TERRITORY_OWNERSHIP_CHANGED, this._handleTerritoryChange, this);
        this.gameEventBus.on(this.gameEventBus.events.MAP_INITIALIZED, this._handleMapInitialized, this);

        // Example for resource changes if GameState needs to react directly
        // this.gameEventBus.on(this.gameEventBus.events.RESOURCES_CHANGED, this._handleResourceChange, this);
    }

    _handleTerritorySelected(eventData) {
        // eventData from GameScene is { territory, previousSelection }
        // eventData from GameEventBus.emitTerritorySelected is { territory, previousSelection }
        if (eventData && eventData.territory) {
            this.selectedTerritory = eventData.territory;
            // console.log('GameState: Territory selected:', this.selectedTerritory.id);
        }
    }

    _handleTerritoryDeselected(eventData) {
        // eventData from GameScene is { deselectedTerritory }
        // eventData from GameEventBus.emitTerritoryDeselected is { territory }
         if (this.selectedTerritory && eventData && eventData.territory && this.selectedTerritory.id === eventData.territory.id) {
            this.selectedTerritory = null;
            // console.log('GameState: Territory deselected.');
        } else if (eventData && eventData.deselectedTerritory && this.selectedTerritory && this.selectedTerritory.id === eventData.deselectedTerritory.id) {
            // Handling the structure from GameScene's direct emission if it differs
            this.selectedTerritory = null;
        }
    }

    _handleTerritoryChange(eventData) {
        // Generic handler for territory changes that might affect statistics
        // eventData contains { territory, territoryId, changes, newOwner, oldOwner, etc. }
        // console.log('GameState: Detected territory change, updating statistics.', eventData);
        this.updateStatistics();
        this.checkVictoryConditions(); // Ownership changes can affect victory
    }

    _handleMapInitialized(eventData) {
        // console.log('GameState: Map initialized, updating statistics.', eventData);
        this.updateStatistics();
        this.checkVictoryConditions();
    }
    
    // REMOVE OLD EVENT SYSTEM METHODS
    // addEventListener, removeEventListener, emit methods are fully removed.

    /**
     * Add a territory to the game state - Now primarily called by TerritoryManager.
     * GameState.territories map is managed by TerritoryManager using this method.
     */
    addTerritory(territory) {
        if (!this._territoryManager && !(this.territories instanceof Map)) {
            // This case should ideally not happen if TerritoryManager is always present
            // and initializes gameState.territories.
            console.warn("GameState: TerritoryManager not set AND territories not a Map. Initializing territories map.");
            this.territories = new Map();
        }
        
        // TerritoryManager is responsible for creating the Territory object.
        // GameState just stores it in its map.
        if (territory && territory.id) {
            if (!this.territories.has(territory.id)) {
                this.territories.set(territory.id, territory);
            } else {
                // If territory exists, TerritoryManager's createOrGetTerritory might update it,
                // and then this addTerritory might be redundant or simply ensure it's the latest ref.
                // For now, let's assume TM handles updates before calling addTerritory if it's an existing one.
                this.territories.set(territory.id, territory); // Ensure it's the latest reference
            }
        } else {
            console.warn("GameState: addTerritory called with invalid territory object.", territory);
            return;
        }

        // Statistics and victory conditions are updated via event listeners for
        // TERRITORY_CREATED, TERRITORY_UPDATED, etc., emitted by TerritoryManager.
        // So, no direct call to updateStatistics() here is needed if addTerritory
        // is only part of the creation flow handled by TerritoryManager.
        // However, if addTerritory could be called outside TM's initial creation,
        // then updateStatistics() might be relevant.
        // For now, assuming TM emits TERRITORY_CREATED which triggers _handleTerritoryChange.
        // this.updateStatistics(); // Re-evaluate if needed here.
        // REMOVE: this.emit('territoryChanged', { action: 'added', territory });
    }

    /**
     * Get territory by ID - Defers to TerritoryManager if available, but TM uses this.territories.
     */
    getTerritory(id) {
        // TerritoryManager uses gameState.territories directly, so this is fine.
        return this.territories.get(id);
    }

    /**
     * Get all territories owned by a player - Defers to TerritoryManager if available
     */
    getTerritoriesByOwner(owner) {
        if (!this._territoryManager) {
            console.warn("GameState: TerritoryManager not set. Getting territories by owner from GameState.territories (legacy).");
            // Fallback to direct iteration if TM not set, though this should be rare.
            const ownedTerritories = [];
            for (const territory of this.territories.values()) {
                if (territory.owner === owner) {
                    ownedTerritories.push(territory);
                }
            }
            return ownedTerritories;
        }
        // Preferred way: TerritoryManager has the most up-to-date logic
        return this._territoryManager.getTerritoriesByOwner(owner);
    }

    // REMOVE setTerritoryOwner - This logic is now in TerritoryManager.claimTerritory or updateTerritoryData
    /*
    setTerritoryOwner(territoryId, newOwner) {
        const territory = this.getTerritory(territoryId); 
        if (territory) {
            const oldOwner = territory.owner;
            territory.owner = newOwner;
            
            this.updateStatistics();
            this.checkVictoryConditions();
            
            // OLD EMIT: this.emit('territoryChanged', { 
            //     action: 'ownership_changed', 
            //     territory, 
            //     oldOwner, 
            //     newOwner 
            // });
            // GameEventBus will handle this via TERRITORY_CLAIMED or TERRITORY_UPDATED from TerritoryManager
        }
    }
    */

    /**
     * Select a territory - This method is now effectively deprecated for external calls.
     * GameState listens to GameEventBus.TERRITORY_SELECTED to update its internal state.
     * Kept for potential internal use or if direct state manipulation is needed, but without event emission.
     */
    selectTerritory(territory) { 
        let territoryObj = null;
        if (typeof territory === 'string') {
            territoryObj = this.getTerritory(territory);
        } else {
            territoryObj = territory;
        }

        if (territoryObj) {
            this.selectedTerritory = territoryObj;
            // DO NOT EMIT: this.emit('territoryChanged', { action: 'selected', territory: territoryObj });
            // GameScene emits to GameEventBus, GameState listens.
        }
    }

    /**
     * Deselect territory - This method is now effectively deprecated for external calls.
     * GameState listens to GameEventBus.TERRITORY_DESELECTED.
     */
    deselectTerritory() {
        if (this.selectedTerritory) {
            // const territory = this.selectedTerritory; // Keep for reference if needed
            this.selectedTerritory = null;
            // DO NOT EMIT: this.emit('territoryChanged', { action: 'deselected', territory });
        }
    }

    /**
     * Add resources to a player
     */
    addResources(player, resourceType, amount) {
        if (this.resources[player] && this.resources[player][resourceType] !== undefined) {
            this.resources[player][resourceType] += amount;
            if (this.statistics.resourcesCollected[player] && this.statistics.resourcesCollected[player][resourceType] !== undefined) {
                 this.statistics.resourcesCollected[player][resourceType] += amount;
            } else if (this.statistics.resourcesCollected[player]) {
                this.statistics.resourcesCollected[player][resourceType] = amount; // Initialize if type not present
            }


            // Emit to GameEventBus instead of internal system
            if (this.gameEventBus) { // Corrected: Added parentheses
                this.gameEventBus.emitResourcesChanged(player, {[resourceType]: amount}, 'added');
            }
            // OLD EMIT: this.emit('resourceChanged', { 
            //     player, 
            //     resourceType, 
            //     amount, 
            //     newTotal: this.resources[player][resourceType] 
            // });
        }
    }

    /**
     * Spend resources for a player
     */
    spendResources(player, costs) {
        // Check if player has enough resources
        for (const [resourceType, cost] of Object.entries(costs)) {
            if (!this.resources[player] || this.resources[player][resourceType] === undefined || this.resources[player][resourceType] < cost) {
                console.warn(`Player ${player} does not have enough ${resourceType}. Has: ${this.resources[player]?.[resourceType]}, Needs: ${cost}`);
                return false; // Not enough resources
            }
        }
        
        // Spend the resources
        for (const [resourceType, cost] of Object.entries(costs)) {
            this.resources[player][resourceType] -= cost;
            // Emit to GameEventBus instead of internal system
            if (this.gameEventBus) { // Corrected: Added parentheses
                this.gameEventBus.emitResourcesChanged(player, {[resourceType]: -cost}, 'spent');
            }
            // OLD EMIT: this.emit('resourceChanged', { 
            //     player, 
            //     resourceType, 
            //     amount: -cost, 
            //     newTotal: this.resources[player][resourceType] 
            // });
        }
        
        return true;
    }    /**
     * Get player resources
     */
    getResources(player) {
        return { ...this.resources[player] };
    }
    
    /**
     * Get reference to the ResourceManager (to be set by the game)
     */
    getResourceManager() {
        return this._resourceManager;
    }
    
    /**
     * Set reference to the ResourceManager
     */
    setResourceManager(resourceManager) {
        this._resourceManager = resourceManager;
    }

    /**
     * Collect resources for a player based on owned territories
     * This method is called by TurnManager.
     */
    collectResourcesForPlayer(player) { // Renamed to avoid conflict with a potential ResourceController method
        if (!this._resourceManager) {
            console.warn("GameState: ResourceManager not set. Cannot collect resources.");
            return { collected: {}, details: { territories: 0, success: false, reason: 'resource_manager_not_set' } };
        }
        return this._resourceManager.collectResourcesForPlayer(player);
    }

    /**
     * Advance to next turn
     */
    nextTurn() {
        // Save current turn state
        this.turnHistory.push({
            turn: this.currentTurn,
            player: this.currentPlayer,
            phase: this.currentPhase,
            resources: JSON.parse(JSON.stringify(this.resources)),
            territories: this.getStateSummary()
        });
        
        if (this.currentPlayer === OWNERS.PLAYER) {
            this.currentPlayer = OWNERS.AI;
            this.currentPhase = TURN_PHASES.ACTION_PHASE;        } else {
            this.currentPlayer = OWNERS.PLAYER;            
            this.currentTurn++;
            this.currentPhase = TURN_PHASES.RESOURCE_COLLECTION;
            
            // Note: Resource collection will be handled by the TurnManager
            // during the RESOURCE_COLLECTION phase, not here
        }
        
        this.checkVictoryConditions();
        // REMOVE old event emission: this.emit('turnChanged', { ... });
        // Turn changes are now primarily signaled by TurnManager via its own events
        // or through GameEventBus if specific GameState updates need to be broadcast.
        // For now, relying on TurnManager's existing event mechanisms.
    }

    /**
     * Update game statistics based on current state (e.g., territories owned)
     * This should be called whenever a change occurs that affects statistics.
     * Now primarily triggered by event handlers.
     */
    updateStatistics() {
        if (!this.territories) return;

        const newTerritoriesOwned = {
            [OWNERS.PLAYER]: 0,
            [OWNERS.AI]: 0,
            [OWNERS.NEUTRAL]: 0
        };

        for (const territory of this.territories.values()) {
            if (territory.owner && newTerritoriesOwned[territory.owner] !== undefined) {
                newTerritoriesOwned[territory.owner]++;
            } else if (territory.owner === undefined || territory.owner === null || territory.owner === OWNERS.NONE) {
                newTerritoriesOwned[OWNERS.NEUTRAL]++; // Count unowned/neutral
            }
        }
        this.statistics.territoriesOwned = newTerritoriesOwned;

        // Potentially update other stats here if needed
        // console.log('GameState: Statistics updated.', this.statistics);
    }

    /**
     * Check victory conditions based on current game state.
     * This should be called after significant state changes (e.g., territory capture, turn end).
     */
    checkVictoryConditions() {
        // Placeholder for victory condition logic
        // Example: Check for territorial dominance
        const playerTerritories = this.statistics.territoriesOwned[OWNERS.PLAYER];
        const aiTerritories = this.statistics.territoriesOwned[OWNERS.AI];
        const totalTerritories = this.territories.size;

        if (totalTerritories > 0) {
            this.victoryProgress.territorialDominance[OWNERS.PLAYER] = (playerTerritories / totalTerritories) * 100;
            this.victoryProgress.territorialDominance[OWNERS.AI] = (aiTerritories / totalTerritories) * 100;

            // Example: Victory if player owns > 60% of territories
            if (this.victoryProgress.territorialDominance[OWNERS.PLAYER] > GAME_CONFIG.VICTORY_CONDITIONS.TERRITORIAL_DOMINANCE_PERCENTAGE) {
                // this.gameEventBus.emit(this.gameEventBus.events.VICTORY_CONDITION_MET, { player: OWNERS.PLAYER, condition: 'territorialDominance' });
                // console.log("Player has met territorial dominance victory condition!");
            }
        }
        // Add other victory condition checks (economic, strategic points)
    }

    /**
     * Get current game state summary
     */
    getStateSummary() {
        return {
            turn: this.currentTurn,
            player: this.currentPlayer,
            phase: this.currentPhase,
            status: this.gameStatus,
            territories: this.statistics.territoriesOwned,
            resources: this.resources,
            victoryProgress: this.victoryProgress
        };
    }

    /**
     * Load game state from JSON
     */
    loadState(jsonState) {
        try {
            const state = JSON.parse(jsonState);
            
            this.currentTurn = state.currentTurn || 1;
            this.currentPlayer = state.currentPlayer || OWNERS.PLAYER;
            this.currentPhase = state.currentPhase || TURN_PHASES.ACTION_PHASE;
            const oldStatus = this.gameStatus;
            this.gameStatus = state.gameStatus || GAME_STATES.LOADING;
            this.resources = state.resources || {
                [OWNERS.PLAYER]: { ...GAME_CONFIG.INITIAL_RESOURCES },
                [OWNERS.AI]: { ...GAME_CONFIG.INITIAL_RESOURCES }
            };
            this.victoryProgress = state.victoryProgress || { /* initial structure */ };
            this.turnHistory = state.turnHistory || [];
            this.gameEvents = state.gameEvents || [];
            this.statistics = state.statistics || { /* initial structure */ };
            
            // Territories will be loaded by TerritoryManager via GameScene
            // For now, clear and potentially load if _territoryManager is not yet set
            this.territories.clear();
            if (state.territoryData && Array.isArray(state.territoryData)) { // Assuming territoryData is an array of [id, data]
                state.territoryData.forEach(([id, territoryObj]) => {
                    // This is a simplified load; Territory objects might need proper instantiation
                    // For a full load, this should likely go through TerritoryManager to create/update Territory instances
                    const territory = new Territory(territoryObj.q, territoryObj.r); // Assuming Territory is available here
                    Object.assign(territory, territoryObj);
                    this.territories.set(id, territory);
                });
            }
            
            this.updateStatistics(); // Recalculate stats based on loaded territories

            // Emit events through GameEventBus
            if (this.gameEventBus) {
                // Assuming GameEventBus has methods like emitGameLoaded, emitNewTurn
                // If not, these might need to be added to GameEventBus or mapped to existing events.
                this.gameEventBus.emit(this.gameEventBus.events.GAME_LOADED || 'gameLoaded', { newStatus: this.gameStatus, oldStatus });
                this.gameEventBus.emit(this.gameEventBus.events.NEW_TURN || 'newTurn', { turn: this.currentTurn, player: this.currentPlayer, phase: this.currentPhase });
                this.gameEventBus.emitResourcesChanged(null, this.resources, 'state_loaded');
            }


            console.log("GameState loaded successfully.");
            return true;
        } catch (error) {
            console.error('❌ Failed to load game state:', error);
            this.initialize(); // Reset to a clean state on error
            return false;
        }
    }

    /**
     * Save game state to JSON
     */
    saveState() {
        const territoryData = this._territoryManager 
            ? this._territoryManager.getAllTerritories().map(t => [t.id, t.toJSON ? t.toJSON() : { ...t }])
            : Array.from(this.territories.entries()).map(([id, t]) => [id, t.toJSON ? t.toJSON() : { ...t }]);

        return JSON.stringify({
            currentTurn: this.currentTurn,
            currentPlayer: this.currentPlayer,
            currentPhase: this.currentPhase,
            gameStatus: this.gameStatus,
            resources: this.resources,
            victoryProgress: this.victoryProgress,
            statistics: this.statistics,
            turnHistory: this.turnHistory,
            gameEvents: this.gameEvents,
            territoryData: territoryData, // Use the serialized territory data
        });
    }


    // Phaser.Events.EventEmitter compatibility (basic implementation)
    // These will be replaced by a dedicated GameEventBus instance
    on(event, fn, context) {
        this.addEventListener(event, context ? fn.bind(context) : fn);
        return this;
    }

    off(event, fn, context, once) {
        // This basic version doesn't fully match Phaser's .off() signature
        // but will work for simple cases.
        // A more robust solution would store the original fn to remove it correctly.
        this.removeEventListener(event, fn);
        return this;
    }
    
    removeAllListeners(event) {
        if (event && this.listeners[event]) {
            this.listeners[event] = [];
        } else if (!event) {
            for (const key in this.listeners) {
                this.listeners[key] = [];
            }
        }
    }

    // Method to be called by TerritoryManager to notify of changes that GameState itself doesn't directly cause via its own methods
    // but needs to be aware of for statistics or other internal logic if not covered by event subscriptions.
    // This is effectively a more direct way for TM to tell GS to update itself if events are too indirect.
    notifyTerritoryChange(eventData) {
        // This method could be used if TerritoryManager needs to explicitly tell GameState
        // to update its statistics or check victory conditions after a change.
        // However, with GameState subscribing to TERRITORY_UPDATED, TERRITORY_CLAIMED, etc.,
        // this might be redundant if those event handlers cover all necessary actions.
        // console.log('GameState.notifyTerritoryChange called with:', eventData);
        // For now, let's assume _handleTerritoryChange and _handleMapInitialized cover this.
        // If specific logic is needed here that isn't covered by those, it can be added.
        // Example: if (eventData.action === 'claimed' || eventData.action === 'updated') {
        //     this.updateStatistics();
        //     this.checkVictoryConditions();
        // }
    }
}
