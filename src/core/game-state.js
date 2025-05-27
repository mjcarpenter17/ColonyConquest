/**
 * Colony Conquest - Game State Management
 * Central state management for the entire game
 */

import { GAME_CONFIG, RESOURCE_TYPES, OWNERS, TURN_PHASES, GAME_STATES } from '../utils/constants.js';

/**
 * GameState class - Manages all game data and state transitions
 */
export class GameState {
    constructor() {
        this.initialize();
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
        this.territories = new Map();
        this.selectedTerritory = null;
        
        // Game history and statistics
        this.turnHistory = [];
        this.gameEvents = [];
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
        
        // Event listeners for state changes
        this.listeners = {
            territoryChanged: [],
            resourceChanged: [],
            turnChanged: [],
            gameStateChanged: [],
            victoryConditionMet: []
        };
        
        console.log('🎮 GameState initialized');
    }

    /**
     * Add event listener for state changes
     */
    addEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * Remove event listener
     */
    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    /**
     * Emit event to all listeners
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Add a territory to the game state
     */
    addTerritory(territory) {
        this.territories.set(territory.id, territory);
        this.updateStatistics();
        this.emit('territoryChanged', { action: 'added', territory });
    }

    /**
     * Get territory by ID
     */
    getTerritory(id) {
        return this.territories.get(id);
    }

    /**
     * Get all territories owned by a player
     */
    getTerritoriesByOwner(owner) {
        return Array.from(this.territories.values()).filter(t => t.owner === owner);
    }

    /**
     * Change territory ownership
     */
    setTerritoryOwner(territoryId, newOwner) {
        const territory = this.territories.get(territoryId);
        if (territory) {
            const oldOwner = territory.owner;
            territory.owner = newOwner;
            
            this.updateStatistics();
            this.checkVictoryConditions();
            
            this.emit('territoryChanged', { 
                action: 'ownership_changed', 
                territory, 
                oldOwner, 
                newOwner 
            });
            
            console.log(`🏴 Territory ${territoryId} claimed by ${newOwner}`);
        }
    }

    /**
     * Select a territory
     */
    selectTerritory(territoryId) {
        const territory = this.territories.get(territoryId);
        if (territory) {
            this.selectedTerritory = territory;
            this.emit('territoryChanged', { action: 'selected', territory });
        }
    }

    /**
     * Deselect territory
     */
    deselectTerritory() {
        if (this.selectedTerritory) {
            const territory = this.selectedTerritory;
            this.selectedTerritory = null;
            this.emit('territoryChanged', { action: 'deselected', territory });
        }
    }

    /**
     * Add resources to a player
     */
    addResources(player, resourceType, amount) {
        if (this.resources[player] && this.resources[player][resourceType] !== undefined) {
            this.resources[player][resourceType] += amount;
            this.statistics.resourcesCollected[player][resourceType] += amount;
            
            this.emit('resourceChanged', { 
                player, 
                resourceType, 
                amount, 
                newTotal: this.resources[player][resourceType] 
            });
        }
    }

    /**
     * Spend resources for a player
     */
    spendResources(player, costs) {
        // Check if player has enough resources
        for (const [resourceType, cost] of Object.entries(costs)) {
            if (this.resources[player][resourceType] < cost) {
                return false; // Not enough resources
            }
        }
        
        // Spend the resources
        for (const [resourceType, cost] of Object.entries(costs)) {
            this.resources[player][resourceType] -= cost;
            this.emit('resourceChanged', { 
                player, 
                resourceType, 
                amount: -cost, 
                newTotal: this.resources[player][resourceType] 
            });
        }
        
        return true;
    }

    /**
     * Get player resources
     */
    getResources(player) {
        return { ...this.resources[player] };
    }

    /**
     * Collect resources for a player based on owned territories
     */
    collectResources(player) {
        const ownedTerritories = this.getTerritoriesByOwner(player);
        const collected = { gold: 0, wood: 0, metal: 0, food: 0 };
        
        ownedTerritories.forEach(territory => {
            const resourceType = territory.resourceType;
            const amount = territory.resourceValue;
            
            this.addResources(player, resourceType, amount);
            collected[resourceType] += amount;
        });
        
        console.log(`💰 ${player} collected:`, collected);
        return collected;
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
            this.currentPhase = TURN_PHASES.ACTION_PHASE;
        } else {
            this.currentPlayer = OWNERS.PLAYER;
            this.currentTurn++;
            this.currentPhase = TURN_PHASES.RESOURCE_COLLECTION;
            
            // Collect resources for both players at start of new turn
            this.collectResources(OWNERS.PLAYER);
            this.collectResources(OWNERS.AI);
            
            this.currentPhase = TURN_PHASES.ACTION_PHASE;
        }
        
        this.checkVictoryConditions();
        this.emit('turnChanged', {
            turn: this.currentTurn,
            player: this.currentPlayer,
            phase: this.currentPhase
        });
        
        console.log(`🔄 Turn ${this.currentTurn} - ${this.currentPlayer}'s turn`);
    }

    /**
     * Update game statistics
     */
    updateStatistics() {
        // Count territories by owner
        this.statistics.territoriesOwned = {
            [OWNERS.PLAYER]: 0,
            [OWNERS.AI]: 0,
            [OWNERS.NEUTRAL]: 0
        };
        
        this.territories.forEach(territory => {
            const owner = territory.owner || OWNERS.NEUTRAL;
            this.statistics.territoriesOwned[owner]++;
        });
        
        // Update victory progress
        const totalTerritories = this.territories.size;
        this.victoryProgress.territorialDominance[OWNERS.PLAYER] = 
            this.statistics.territoriesOwned[OWNERS.PLAYER] / totalTerritories;
        this.victoryProgress.territorialDominance[OWNERS.AI] = 
            this.statistics.territoriesOwned[OWNERS.AI] / totalTerritories;
    }

    /**
     * Check victory conditions
     */
    checkVictoryConditions() {
        // Territorial Dominance (80% of territories)
        if (this.victoryProgress.territorialDominance[OWNERS.PLAYER] >= GAME_CONFIG.VICTORY_CONDITIONS.TERRITORIAL_DOMINANCE) {
            this.triggerVictory(OWNERS.PLAYER, 'territorial_dominance');
            return;
        }
        if (this.victoryProgress.territorialDominance[OWNERS.AI] >= GAME_CONFIG.VICTORY_CONDITIONS.TERRITORIAL_DOMINANCE) {
            this.triggerVictory(OWNERS.AI, 'territorial_dominance');
            return;
        }
        
        // Economic Victory (100 of each resource)
        const economicThreshold = GAME_CONFIG.VICTORY_CONDITIONS.ECONOMIC_VICTORY;
        if (this.checkEconomicVictory(OWNERS.PLAYER, economicThreshold)) {
            this.triggerVictory(OWNERS.PLAYER, 'economic');
            return;
        }
        if (this.checkEconomicVictory(OWNERS.AI, economicThreshold)) {
            this.triggerVictory(OWNERS.AI, 'economic');
            return;
        }
    }

    /**
     * Check if player has achieved economic victory
     */
    checkEconomicVictory(player, threshold) {
        const resources = this.resources[player];
        return Object.values(resources).every(amount => amount >= threshold);
    }

    /**
     * Trigger victory condition
     */
    triggerVictory(winner, condition) {
        this.gameStatus = GAME_STATES.VICTORY;
        this.emit('victoryConditionMet', { winner, condition });
        console.log(`🏆 Victory! ${winner} wins by ${condition}`);
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
     * Save game state to JSON
     */
    saveState() {
        return JSON.stringify({
            ...this.getStateSummary(),
            territories: Array.from(this.territories.entries()),
            turnHistory: this.turnHistory,
            gameEvents: this.gameEvents
        });
    }

    /**
     * Load game state from JSON
     */
    loadState(jsonState) {
        try {
            const state = JSON.parse(jsonState);
            
            this.currentTurn = state.turn;
            this.currentPlayer = state.player;
            this.currentPhase = state.phase;
            this.gameStatus = state.status;
            this.resources = state.resources;
            this.victoryProgress = state.victoryProgress;
            this.turnHistory = state.turnHistory || [];
            this.gameEvents = state.gameEvents || [];
            
            // Restore territories
            this.territories.clear();
            if (state.territories) {
                state.territories.forEach(([id, territory]) => {
                    this.territories.set(id, territory);
                });
            }
            
            this.updateStatistics();
            this.emit('gameStateChanged', this.getStateSummary());
            
            console.log('📥 Game state loaded successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to load game state:', error);
            return false;
        }
    }
}
