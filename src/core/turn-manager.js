/**
 * Colony Conquest - Turn Manager
 * Manages turn-based game flow and phase transitions
 */

import { TURN_PHASES, OWNERS } from '../utils/constants.js';

/**
 * TurnManager class - Handles turn sequence and phase management
 */
export class TurnManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.phaseActions = new Map();
        this.turnStartCallbacks = [];
        this.turnEndCallbacks = [];
        this.phaseChangeCallbacks = [];
        
        this.initializePhases();
        console.log('🔄 TurnManager initialized');
    }

    /**
     * Initialize phase handlers
     */
    initializePhases() {
        // Resource Collection Phase
        this.phaseActions.set(TURN_PHASES.RESOURCE_COLLECTION, {
            enter: () => this.enterResourceCollection(),
            execute: () => this.executeResourceCollection(),
            exit: () => this.exitResourceCollection(),
            duration: 1000 // 1 second for automatic progression
        });

        // Action Phase  
        this.phaseActions.set(TURN_PHASES.ACTION_PHASE, {
            enter: () => this.enterActionPhase(),
            execute: () => this.executeActionPhase(),
            exit: () => this.exitActionPhase(),
            duration: null // Player-controlled
        });

        // Resolution Phase
        this.phaseActions.set(TURN_PHASES.RESOLUTION, {
            enter: () => this.enterResolution(),
            execute: () => this.executeResolution(),
            exit: () => this.exitResolution(),
            duration: 1500 // 1.5 seconds for animations
        });

        // AI Turn Phase
        this.phaseActions.set(TURN_PHASES.AI_TURN, {
            enter: () => this.enterAITurn(),
            execute: () => this.executeAITurn(),
            exit: () => this.exitAITurn(),
            duration: 3000 // 3 seconds for AI decisions
        });
    }

    /**
     * Add callback for turn start
     */
    onTurnStart(callback) {
        this.turnStartCallbacks.push(callback);
    }

    /**
     * Add callback for turn end
     */
    onTurnEnd(callback) {
        this.turnEndCallbacks.push(callback);
    }

    /**
     * Add callback for phase changes
     */
    onPhaseChange(callback) {
        this.phaseChangeCallbacks.push(callback);
    }

    /**
     * Start a new turn
     */
    startTurn() {
        console.log(`🎯 Starting turn ${this.gameState.currentTurn} for ${this.gameState.currentPlayer}`);
        
        // Notify turn start callbacks
        this.turnStartCallbacks.forEach(callback => {
            callback({
                turn: this.gameState.currentTurn,
                player: this.gameState.currentPlayer
            });
        });

        // Begin with appropriate phase
        if (this.gameState.currentPlayer === OWNERS.PLAYER) {
            this.changePhase(TURN_PHASES.RESOURCE_COLLECTION);
        } else {
            this.changePhase(TURN_PHASES.AI_TURN);
        }
    }

    /**
     * End current turn and advance to next
     */
    endTurn() {
        console.log(`🏁 Ending turn for ${this.gameState.currentPlayer}`);
        
        // Notify turn end callbacks
        this.turnEndCallbacks.forEach(callback => {
            callback({
                turn: this.gameState.currentTurn,
                player: this.gameState.currentPlayer
            });
        });

        // Advance to next turn
        this.gameState.nextTurn();
        
        // Start the next turn
        this.startTurn();
    }

    /**
     * Change to a new phase
     */
    changePhase(newPhase) {
        const oldPhase = this.gameState.currentPhase;
        
        // Exit current phase
        if (oldPhase && this.phaseActions.has(oldPhase)) {
            this.phaseActions.get(oldPhase).exit();
        }
        
        // Update game state
        this.gameState.currentPhase = newPhase;
        
        // Notify phase change
        this.phaseChangeCallbacks.forEach(callback => {
            callback({ oldPhase, newPhase });
        });
        
        console.log(`📋 Phase changed: ${oldPhase} → ${newPhase}`);
        
        // Enter new phase
        if (this.phaseActions.has(newPhase)) {
            const phaseHandler = this.phaseActions.get(newPhase);
            phaseHandler.enter();
            phaseHandler.execute();
            
            // Auto-advance phases with duration
            if (phaseHandler.duration) {
                setTimeout(() => {
                    this.advancePhase();
                }, phaseHandler.duration);
            }
        }
    }

    /**
     * Advance to the next logical phase
     */
    advancePhase() {
        const currentPhase = this.gameState.currentPhase;
        const currentPlayer = this.gameState.currentPlayer;
        
        switch (currentPhase) {
            case TURN_PHASES.RESOURCE_COLLECTION:
                this.changePhase(TURN_PHASES.ACTION_PHASE);
                break;
                
            case TURN_PHASES.ACTION_PHASE:
                if (currentPlayer === OWNERS.PLAYER) {
                    this.changePhase(TURN_PHASES.RESOLUTION);
                } else {
                    this.endTurn();
                }
                break;
                
            case TURN_PHASES.RESOLUTION:
                this.endTurn();
                break;
                
            case TURN_PHASES.AI_TURN:
                this.endTurn();
                break;
                
            default:
                console.warn(`⚠️ Unknown phase: ${currentPhase}`);
        }
    }

    /**
     * Force end the current player's turn
     */
    forceEndTurn() {
        if (this.gameState.currentPlayer === OWNERS.PLAYER) {
            this.changePhase(TURN_PHASES.RESOLUTION);
        } else {
            this.endTurn();
        }
    }

    // Phase Implementation Methods

    /**
     * Resource Collection Phase - Enter
     */
    enterResourceCollection() {
        console.log('💰 Entering Resource Collection Phase');
        // UI: Show resource collection animation
    }

    /**
     * Resource Collection Phase - Execute
     */
    executeResourceCollection() {
        const player = this.gameState.currentPlayer;
        const collected = this.gameState.collectResources(player);
        
        // Trigger UI updates to show resource gains
        this.gameState.emit('resourceChanged', {
            player,
            action: 'collected',
            amounts: collected
        });
    }

    /**
     * Resource Collection Phase - Exit
     */
    exitResourceCollection() {
        console.log('✅ Resource Collection Phase complete');
    }

    /**
     * Action Phase - Enter
     */
    enterActionPhase() {
        console.log('⚡ Entering Action Phase');
        const player = this.gameState.currentPlayer;
        
        if (player === OWNERS.PLAYER) {
            // Enable player controls
            this.gameState.emit('gameStateChanged', {
                phase: TURN_PHASES.ACTION_PHASE,
                message: 'Your turn - Click territories to claim them!'
            });
        }
    }

    /**
     * Action Phase - Execute
     */
    executeActionPhase() {
        // Action phase is controlled by player input or AI logic
        // No automatic execution needed here
    }

    /**
     * Action Phase - Exit
     */
    exitActionPhase() {
        console.log('⚡ Action Phase complete');
        // Disable player controls if it was player's turn
        if (this.gameState.currentPlayer === OWNERS.PLAYER) {
            this.gameState.deselectTerritory();
        }
    }

    /**
     * Resolution Phase - Enter
     */
    enterResolution() {
        console.log('🎲 Entering Resolution Phase');
        // Apply any end-of-turn effects
    }

    /**
     * Resolution Phase - Execute
     */
    executeResolution() {
        // Process any pending actions
        // Apply influence changes
        // Check for random events
        this.processInfluenceChanges();
        this.checkRandomEvents();
    }

    /**
     * Resolution Phase - Exit
     */
    exitResolution() {
        console.log('🎲 Resolution Phase complete');
    }

    /**
     * AI Turn Phase - Enter
     */
    enterAITurn() {
        console.log('🤖 AI Turn begins');
        this.gameState.emit('gameStateChanged', {
            phase: TURN_PHASES.AI_TURN,
            message: 'AI is thinking...'
        });
    }

    /**
     * AI Turn Phase - Execute
     */
    executeAITurn() {
        // AI logic will be implemented here
        // For now, just simulate some AI activity
        this.simulateAIActions();
    }

    /**
     * AI Turn Phase - Exit
     */
    exitAITurn() {
        console.log('🤖 AI Turn complete');
    }

    // Helper Methods

    /**
     * Process influence changes between territories
     */
    processInfluenceChanges() {
        // Implementation for influence system
        // This will be expanded when influence mechanics are added
        console.log('🌀 Processing influence changes...');
    }

    /**
     * Check for and trigger random events
     */
    checkRandomEvents() {
        const [minTurns, maxTurns] = [3, 7]; // From constants
        const shouldTriggerEvent = Math.random() < 0.3; // 30% chance per turn
        
        if (shouldTriggerEvent && this.gameState.currentTurn > 2) {
            this.triggerRandomEvent();
        }
    }

    /**
     * Trigger a random event
     */
    triggerRandomEvent() {
        const events = [
            {
                name: 'Resource Boom',
                description: 'All players gain +2 resources of each type',
                effect: () => {
                    [OWNERS.PLAYER, OWNERS.AI].forEach(player => {
                        Object.keys(this.gameState.resources[player]).forEach(resource => {
                            this.gameState.addResources(player, resource, 2);
                        });
                    });
                }
            },
            {
                name: 'Trade Winds',
                description: 'Resource production increased this turn',
                effect: () => {
                    // Temporary boost effect
                    console.log('🌪️ Trade winds boost resource production');
                }
            },
            {
                name: 'Market Fluctuation',
                description: 'Territory claiming costs reduced by 1',
                effect: () => {
                    console.log('📈 Market fluctuation reduces claiming costs');
                }
            }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        console.log(`🎲 Random Event: ${event.name} - ${event.description}`);
        
        event.effect();
        
        this.gameState.gameEvents.push({
            turn: this.gameState.currentTurn,
            event: event.name,
            description: event.description
        });
        
        this.gameState.emit('gameStateChanged', {
            event: event,
            message: `Random Event: ${event.name}`
        });
    }

    /**
     * Simulate AI actions (placeholder for actual AI implementation)
     */
    simulateAIActions() {
        console.log('🤖 AI is making decisions...');
        
        // Simple AI: Try to claim a random neutral territory
        const neutralTerritories = this.gameState.getTerritoriesByOwner(null);
        
        if (neutralTerritories.length > 0) {
            const randomTerritory = neutralTerritories[Math.floor(Math.random() * neutralTerritories.length)];
            
            // Check if AI can afford to claim this territory
            const claimCost = { gold: 3, wood: 2, metal: 1, food: 2 };
            
            if (this.gameState.spendResources(OWNERS.AI, claimCost)) {
                this.gameState.setTerritoryOwner(randomTerritory.id, OWNERS.AI);
                console.log(`🤖 AI claimed territory: ${randomTerritory.id}`);
            } else {
                console.log('🤖 AI doesn\'t have enough resources to claim territory');
            }
        } else {
            console.log('🤖 AI found no neutral territories to claim');
        }
    }

    /**
     * Check if current player can perform actions
     */
    canPlayerAct() {
        return this.gameState.currentPhase === TURN_PHASES.ACTION_PHASE;
    }

    /**
     * Get current phase information
     */
    getCurrentPhaseInfo() {
        return {
            phase: this.gameState.currentPhase,
            player: this.gameState.currentPlayer,
            turn: this.gameState.currentTurn,
            canAct: this.canPlayerAct()
        };
    }
}
