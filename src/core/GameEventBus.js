/**
 * GameEventBus class
 * A centralized event emitter for game-wide events.
 * Extends Phaser.Events.EventEmitter for compatibility and robustness.
 */
class GameEventBus extends Phaser.Events.EventEmitter {
    constructor() {
        super();

        // Define common game event keys for consistency
        this.events = {
            // Territory Events
            TERRITORY_SELECTED: 'territorySelected',
            TERRITORY_DESELECTED: 'territoryDeselected',
            TERRITORY_CLAIMED: 'territoryClaimed',
            TERRITORY_OWNERSHIP_CHANGED: 'territoryOwnershipChanged',
            TERRITORY_UPDATED: 'territoryUpdated', // For general updates like resource value changes

            // Resource Events
            RESOURCES_CHANGED: 'resourcesChanged', // Generic, can specify player and amounts
            RESOURCES_COLLECTED: 'resourcesCollected',
            RESOURCES_SPENT: 'resourcesSpent',

            // Turn and Phase Events
            TURN_START: 'turnStart',
            TURN_END: 'turnEnd',
            PHASE_CHANGED: 'phaseChanged',

            // Game State Events
            GAME_STATUS_CHANGED: 'gameStatusChanged', // e.g., loading, active, paused, victory
            GAME_STATE_LOADED: 'gameStateLoaded',
            GAME_MESSAGE: 'gameMessage', // For general notifications or logs

            // UI Events (can be more specific if needed)
            UI_UPDATE_REQUESTED: 'uiUpdateRequest', // Generic request to refresh UI components
            SHOW_NOTIFICATION: 'showNotification',

            // AI Events
            AI_ACTION_TAKEN: 'aiActionTaken',

            // Victory Condition Events
            VICTORY_CONDITION_MET: 'victoryConditionMet',
        };
    }

    // --- Territory Event Emitters ---
    emitTerritorySelected(territory, previousSelection = null) {
        this.emit(this.events.TERRITORY_SELECTED, { territory, previousSelection });
    }

    emitTerritoryDeselected(deselectedTerritory) {
        this.emit(this.events.TERRITORY_DESELECTED, { territory: deselectedTerritory });
    }

    emitTerritoryClaimed(territory, player, cost) {
        this.emit(this.events.TERRITORY_CLAIMED, { territory, player, cost });
    }

    emitTerritoryOwnershipChanged(territory, newOwner, oldOwner) {
        this.emit(this.events.TERRITORY_OWNERSHIP_CHANGED, { territory, newOwner, oldOwner });
    }

    emitTerritoryUpdated(territory, changes) {
        this.emit(this.events.TERRITORY_UPDATED, { territory, changes });
    }

    // --- Resource Event Emitters ---
    emitResourcesChanged(player, changedResources, reason = 'unknown') {
        // changedResources could be an object like { food: 10, wood: -5 }
        this.emit(this.events.RESOURCES_CHANGED, { player, changedResources, reason });
    }

    emitResourcesCollected(player, collectedAmounts, territoryCount) {
        this.emit(this.events.RESOURCES_COLLECTED, { player, collectedAmounts, territoryCount });
        this.emitResourcesChanged(player, collectedAmounts, 'collection');
    }

    emitResourcesSpent(player, spentAmounts, purpose = 'unknown') {
        const negativeAmounts = {};
        for (const type in spentAmounts) {
            negativeAmounts[type] = -spentAmounts[type];
        }
        this.emit(this.events.RESOURCES_SPENT, { player, spentAmounts, purpose });
        this.emitResourcesChanged(player, negativeAmounts, purpose);
    }

    // --- Turn and Phase Event Emitters ---
    emitTurnStart(turnNumber, currentPlayer) {
        this.emit(this.events.TURN_START, { turnNumber, currentPlayer });
    }

    emitTurnEnd(turnNumber, endingPlayer) {
        this.emit(this.events.TURN_END, { turnNumber, endingPlayer });
    }

    emitPhaseChanged(newPhase, oldPhase, currentPlayer) {
        this.emit(this.events.PHASE_CHANGED, { newPhase, oldPhase, currentPlayer });
    }

    // --- Game State Event Emitters ---
    emitGameStatusChanged(newStatus, oldStatus) {
        this.emit(this.events.GAME_STATUS_CHANGED, { newStatus, oldStatus });
    }

    emitGameStateLoaded(gameStateSummary) {
        this.emit(this.events.GAME_STATE_LOADED, { gameStateSummary });
    }

    emitGameMessage(message, type = 'info', duration = 3000) {
        this.emit(this.events.GAME_MESSAGE, { message, type, duration });
        // This can also be directly tied to showNotification if preferred
        this.emitShowNotification(message, type, duration);
    }

    // --- UI Event Emitters ---
    emitUiUpdateRequest(componentKey = 'all') {
        this.emit(this.events.UI_UPDATE_REQUESTED, { componentKey });
    }

    emitShowNotification(message, type = 'info', duration = 3000, details = null) {
        this.emit(this.events.SHOW_NOTIFICATION, { message, type, duration, details });
    }

    // --- AI Event Emitters ---
    emitAiActionTaken(player, actionType, details) {
        this.emit(this.events.AI_ACTION_TAKEN, { player, actionType, details });
    }

    // --- Victory Condition Event Emitters ---
    emitVictoryConditionMet(winner, condition, details) {
        this.emit(this.events.VICTORY_CONDITION_MET, { winner, condition, details });
        this.emitGameStatusChanged('victory', 'active'); // Assuming 'active' was the previous state
    }
}

// Create a singleton instance of the GameEventBus
const gameEventBus = new GameEventBus();

export { gameEventBus, GameEventBus }; // Export both instance and class
