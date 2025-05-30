/**
 * Colony Conquest - Base Panel Components
 * Base classes for management panels that can be extended for specific functionality
 */

import { RESOURCE_TYPES, OWNERS } from '../utils/constants.js';

/**
 * Base Panel Class
 * Base class for all management panels
 */
export class BasePanel {
    constructor(scene, gameState, gameEventBus, panelType) {
        this.scene = scene;
        this.gameState = gameState;
        this.gameEventBus = gameEventBus;
        this.panelType = panelType;
        this.isVisible = false;
        this.element = null;
        
        this.initialize();
    }

    /**
     * Initialize the panel
     */
    initialize() {
        this.createElement();
        this.setupEventListeners();
    }

    /**
     * Create the panel DOM element (to be overridden)
     */
    createElement() {
        // Base implementation - override in subclasses
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (this.gameEventBus) {
            this.gameEventBus.on('gameStateChanged', this.onGameStateChanged, this);
            this.gameEventBus.on('resourcesChanged', this.onResourcesChanged, this);
        }
    }

    /**
     * Handle game state changes
     */
    onGameStateChanged(data) {
        if (this.isVisible) {
            this.updateContent();
        }
    }

    /**
     * Handle resource changes
     */
    onResourcesChanged(data) {
        if (this.isVisible) {
            this.updateContent();
        }
    }

    /**
     * Show the panel
     */
    show() {
        this.isVisible = true;
        this.updateContent();
    }

    /**
     * Hide the panel
     */
    hide() {
        this.isVisible = false;
    }

    /**
     * Update panel content (to be overridden)
     */
    updateContent() {
        // Base implementation - override in subclasses
    }

    /**
     * Destroy the panel
     */
    destroy() {
        if (this.gameEventBus) {
            this.gameEventBus.off('gameStateChanged', this.onGameStateChanged, this);
            this.gameEventBus.off('resourcesChanged', this.onResourcesChanged, this);
        }
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

/**
 * Resource Panel Class
 * Manages resource display and worker training
 */
export class ResourcePanel extends BasePanel {
    constructor(scene, gameState, gameEventBus) {
        super(scene, gameState, gameEventBus, 'resource');
        this.workerCounts = {
            woodcutter: 0,
            miner: 0,
            farmer: 0
        };
    }

    /**
     * Setup event listeners specific to resource panel
     */
    setupEventListeners() {
        super.setupEventListeners();
        
        if (this.gameEventBus) {
            this.gameEventBus.on('workerTrainingRequested', this.onWorkerTrainingRequested, this);
        }
    }

    /**
     * Handle worker training requests
     */
    onWorkerTrainingRequested(data) {
        const { workerType, action } = data;
        
        if (action === 'increase') {
            this.trainWorker(workerType);
        } else if (action === 'decrease') {
            this.dismissWorker(workerType);
        }
    }

    /**
     * Train a worker (increase count)
     */
    trainWorker(workerType) {
        const cost = this.getWorkerCost(workerType);
        const player = this.gameState.currentPlayer;
        
        // Check if player can afford the cost
        const resourceManager = this.gameState.getResourceManager();
        if (resourceManager && resourceManager.canAfford(player, cost)) {
            // Spend resources
            const spendResult = resourceManager.spendResources(player, cost);
            if (spendResult.success) {
                // Increase worker count
                this.workerCounts[workerType]++;
                this.updateWorkerDisplay(workerType);
                
                // Show notification
                if (this.scene.notificationManager) {
                    this.scene.notificationManager.show(
                        `Trained ${workerType}! Cost: ${this.formatCost(cost)}`,
                        'success',
                        2000
                    );
                }
            }
        } else {
            // Show insufficient resources notification
            if (this.scene.notificationManager) {
                this.scene.notificationManager.show(
                    `Insufficient resources to train ${workerType}! Need: ${this.formatCost(cost)}`,
                    'error',
                    3000
                );
            }
        }
    }

    /**
     * Dismiss a worker (decrease count)
     */
    dismissWorker(workerType) {
        if (this.workerCounts[workerType] > 0) {
            this.workerCounts[workerType]--;
            this.updateWorkerDisplay(workerType);
            
            // Show notification
            if (this.scene.notificationManager) {
                this.scene.notificationManager.show(
                    `Dismissed ${workerType}`,
                    'info',
                    1500
                );
            }
        }
    }

    /**
     * Get the cost to train a specific worker type
     */
    getWorkerCost(workerType) {
        const costs = {
            woodcutter: { [RESOURCE_TYPES.FOOD]: 2 },
            miner: { [RESOURCE_TYPES.FOOD]: 2 },
            farmer: { [RESOURCE_TYPES.GOLD]: 1 }
        };
        
        return costs[workerType] || {};
    }

    /**
     * Format cost for display
     */
    formatCost(cost) {
        return Object.entries(cost)
            .filter(([type, amount]) => amount > 0)
            .map(([type, amount]) => `${amount} ${type}`)
            .join(', ');
    }

    /**
     * Update worker count display
     */
    updateWorkerDisplay(workerType) {
        const element = document.getElementById(`${workerType}-count`);
        if (element) {
            element.textContent = this.workerCounts[workerType];
        }
    }

    /**
     * Update panel content with current resource values
     */
    updateContent() {
        if (!this.isVisible) return;
        
        const player = this.gameState.currentPlayer;
        const resources = this.gameState.resources[player] || {};
        
        // Update resource amounts in panel
        Object.entries(resources).forEach(([type, amount]) => {
            const element = document.getElementById(`panel-${type}-count`);
            if (element) {
                element.textContent = amount;
            }
        });
        
        // Update resource production rates (placeholder)
        ['gold', 'wood', 'metal', 'food'].forEach(type => {
            const rateElement = document.getElementById(`panel-${type}-rate`);
            if (rateElement) {
                const baseRate = 1;
                const workerBonus = this.getWorkerProductionBonus(type);
                const totalRate = baseRate + workerBonus;
                rateElement.textContent = `+${totalRate}/turn`;
            }
        });
        
        // Update all worker displays
        Object.keys(this.workerCounts).forEach(workerType => {
            this.updateWorkerDisplay(workerType);
        });
    }

    /**
     * Get production bonus from workers
     */
    getWorkerProductionBonus(resourceType) {
        switch (resourceType) {
            case 'wood':
                return this.workerCounts.woodcutter * 2;
            case 'metal':
                return this.workerCounts.miner * 2;
            case 'food':
                return this.workerCounts.farmer * 3;
            case 'gold':
                return Math.floor((this.workerCounts.woodcutter + this.workerCounts.miner) * 0.5);
            default:
                return 0;
        }
    }

    /**
     * Destroy the resource panel
     */
    destroy() {
        if (this.gameEventBus) {
            this.gameEventBus.off('workerTrainingRequested', this.onWorkerTrainingRequested, this);
        }
        super.destroy();
    }
}

/**
 * Army Panel Class
 * Manages army units and military operations (placeholder)
 */
export class ArmyPanel extends BasePanel {
    constructor(scene, gameState, gameEventBus) {
        super(scene, gameState, gameEventBus, 'army');
        this.unitCounts = {
            infantry: 0,
            cavalry: 0,
            siege: 0
        };
    }

    /**
     * Update panel content
     */
    updateContent() {
        if (!this.isVisible) return;
        
        // Placeholder implementation
        // This will be expanded in future phases
    }
}

/**
 * Diplomacy Panel Class
 * Manages diplomatic relations and trade (placeholder)
 */
export class DiplomacyPanel extends BasePanel {
    constructor(scene, gameState, gameEventBus) {
        super(scene, gameState, gameEventBus, 'diplomacy');
        this.relations = {
            [OWNERS.AI_1]: 'neutral'
        };
    }

    /**
     * Update panel content
     */
    updateContent() {
        if (!this.isVisible) return;
        
        // Placeholder implementation
        // This will be expanded in future phases
    }
}

/**
 * Research Panel Class
 * Manages technology research and upgrades (placeholder)
 */
export class ResearchPanel extends BasePanel {
    constructor(scene, gameState, gameEventBus) {
        super(scene, gameState, gameEventBus, 'research');
        this.technologies = {
            agriculture: { unlocked: true, researched: false },
            mining: { unlocked: true, researched: false },
            military: { unlocked: false, researched: false }
        };
    }

    /**
     * Update panel content
     */
    updateContent() {
        if (!this.isVisible) return;
        
        // Placeholder implementation
        // This will be expanded in future phases
    }
}
