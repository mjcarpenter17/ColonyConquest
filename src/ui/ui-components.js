import { COLORS, UI_CONSTANTS, RESOURCE_TYPES, ASSETS, OWNERS, TURN_PHASES } from '../utils/constants.js';

/**
 * Base UI Component Class
 * Base class for all UI components
 */
class UIComponent {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.phaserObjects = []; // To keep track of Phaser game objects for easy cleanup
        this.domElements = []; // To keep track of DOM elements if applicable
    }

    // Basic methods to be overridden by subclasses
    show() {
        this.phaserObjects.forEach(obj => obj.setVisible(true));
        this.domElements.forEach(elem => {
            if (elem && elem.classList) {
                elem.classList.remove('hidden');
            }
        });
    }

    hide() {
        this.phaserObjects.forEach(obj => obj.setVisible(false));
        this.domElements.forEach(elem => {
            if (elem && elem.classList) {
                elem.classList.add('hidden');
            }
        });
    }

    destroy() {
        this.phaserObjects.forEach(obj => obj.destroy());
        this.phaserObjects = [];
        // DOM elements are not destroyed here as they might be reused
    }

    // Helper to add Phaser objects to this component for tracking
    addPhaserObject(obj) {
        this.phaserObjects.push(obj);
        return obj; // Return the object for chaining or further manipulation
    }

    // Helper to add DOM elements to this component for tracking
    addDomElement(elem) {
        if (elem) {
            this.domElements.push(elem);
        }
        return elem;
    }
}

/**
 * ResourceDisplayBar Class
 * Displays the player's current resources.
 * This implementation works with the existing HTML/DOM resource bar.
 */
export class ResourceDisplayBar extends UIComponent {
    constructor(scene, gameState) {
        super(scene, UI_CONSTANTS.RESOURCE_BAR_X, UI_CONSTANTS.RESOURCE_BAR_Y);
        this.gameState = gameState;
        this.resourceElements = {}; // Stores references to DOM elements

        // Find existing DOM elements
        this.containerElement = this.addDomElement(document.getElementById('resource-bar'));
        
        // Map resource types to their respective DOM element IDs
        const resourceElementMap = {
            [RESOURCE_TYPES.GOLD]: 'gold-count',
            [RESOURCE_TYPES.WOOD]: 'wood-count',
            [RESOURCE_TYPES.METAL]: 'metal-count',
            [RESOURCE_TYPES.FOOD]: 'food-count'
        };

        // Store references to DOM elements for each resource
        for (const [type, elementId] of Object.entries(resourceElementMap)) {
            this.resourceElements[type.toLowerCase()] = this.addDomElement(document.getElementById(elementId));
        }

        // Update initial values
        this.updateDisplay();

        // Set up event listener for resource updates using GameEventBus
        if (this.gameState && this.gameState.gameEventBus && this.gameState.gameEventBus.events.RESOURCES_CHANGED) {
            this.gameState.gameEventBus.on(
                this.gameState.gameEventBus.events.RESOURCES_CHANGED, 
                this.updateDisplay, // The updateDisplay method will be called with eventData
                this // Context for the callback
            );
        } else {
            console.warn('ResourceDisplayBar: GameState, GameEventBus, or RESOURCES_CHANGED event not available.');
        }
    }    /**
     * Update the resource display with current values
     * @param {Object} resourceChangeData - Optional data about resource changes for notifications
     */
    updateDisplay(resourceChangeData = null) {
        const resources = this.gameState.resources[this.gameState.currentPlayer] || {};
        
        // Update resource counts
        for (const [type, element] of Object.entries(this.resourceElements)) {
            if (element && resources[type] !== undefined) {
                element.textContent = resources[type];
                
                // If this update is from a resource collection, show a visual notification
                if (resourceChangeData && 
                    resourceChangeData.action === 'collected' && 
                    resourceChangeData.amounts && 
                    resourceChangeData.amounts[type] > 0) {
                    
                    this.showResourceGainNotification(type, resourceChangeData.amounts[type], element);
                }
            }
        }
    }
    
    /**
     * Show a visual notification when resources are gained
     * @param {string} resourceType - Type of resource gained
     * @param {number} amount - Amount of resource gained
     * @param {HTMLElement} element - The DOM element to animate
     */
    showResourceGainNotification(resourceType, amount, element) {
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.className = 'resource-notification';
        notification.textContent = `+${amount}`;
        
        // Position it near the resource counter
        element.parentNode.style.position = 'relative';
        element.parentNode.appendChild(notification);
        
        // Animate the notification
        setTimeout(() => {
            notification.classList.add('fadeout');
            setTimeout(() => notification.remove(), 1000);
        }, 50);
    }

    destroy() {
        if (this.gameState.removeEventListener) {
            this.gameState.removeEventListener('resourceChanged', this.updateDisplay);
        } else if (this.gameState.off) {
            this.gameState.off('resourceChanged', this.updateDisplay, this);
        }
        // Don't actually destroy the DOM elements
        this.domElements = [];
        super.destroy();
    }

    /**
     * Show resource spending animation
     */
    showSpendingAnimation(cost) {
        Object.entries(cost).forEach(([resourceType, amount]) => {
            if (amount > 0) {
                const resourceElement = document.getElementById(`${resourceType}-count`);
                if (resourceElement) {
                    // Create spending indicator
                    const spendIndicator = document.createElement('div');
                    spendIndicator.className = 'resource-spend-indicator';
                    spendIndicator.textContent = `-${amount}`;
                    spendIndicator.style.cssText = `
                        position: absolute;
                        color: #ff4444;
                        font-weight: bold;
                        font-size: 14px;
                        pointer-events: none;
                        z-index: 1000;
                        animation: spendFloat 1.5s ease-out forwards;
                    `;
                    
                    // Position relative to the resource element
                    const rect = resourceElement.getBoundingClientRect();
                    spendIndicator.style.left = `${rect.left + rect.width + 5}px`;
                    spendIndicator.style.top = `${rect.top}px`;
                    
                    document.body.appendChild(spendIndicator);
                    
                    // Remove after animation
                    setTimeout(() => {
                        if (spendIndicator.parentNode) {
                            spendIndicator.parentNode.removeChild(spendIndicator);
                        }
                    }, 1500);
                }
            }
        });
    }
}

/**
 * TerritoryInformationPanel Class
 * Displays information about the selected territory.
 * This implementation works with the existing HTML/DOM territory info panel.
 */
export class TerritoryInformationPanel extends UIComponent {
    constructor(scene, gameState, gameEventBus, territoryManager) { // Added gameEventBus and territoryManager
        super(scene, UI_CONSTANTS.INFO_PANEL_X, UI_CONSTANTS.INFO_PANEL_Y);
        this.gameState = gameState;
        this.gameEventBus = gameEventBus; // Store gameEventBus
        this.territoryManager = territoryManager; // Store territoryManager
        
        // Find existing DOM elements
        this.panelElement = this.addDomElement(document.getElementById('territory-info'));
        this.detailsElement = this.addDomElement(document.getElementById('territory-details'));
        
        // Initially hide the panel if no territory is selected
        if (!this.gameState.selectedTerritory) {
            this.hide();
        } else {
            this.updatePanel(this.gameState.selectedTerritory);
        }

        // Event listeners are now handled by UIRenderer, no need to duplicate here
        // if (this.gameState.addEventListener) { ... }
        // this.scene.events.on('territorySelected', ...); // This is a Phaser scene event, not GameEventBus
    }

    /**
     * Update the territory panel with information about the selected territory
     */
    updatePanel(territory) {
        if (territory) {
            // Ensure territory.coord is available, if not, try to get it from TerritoryManager or q/r directly
            let q = territory.q;
            let r = territory.r;
            if (territory.coord) {
                q = territory.coord.q;
                r = territory.coord.r;
            }

            const ownerText = territory.owner ? `Player ${territory.owner}` : 'Neutral';
            const resourceText = territory.resourceType && territory.resourceType !== RESOURCE_TYPES.NONE ? 
                `${territory.resourceType.charAt(0).toUpperCase() + territory.resourceType.slice(1)} (${territory.resourceValue})` : 
                'None';
            
            if (this.detailsElement) {
                this.detailsElement.innerHTML = `
                    <p><strong>ID:</strong> ${territory.id}</p>
                    <p><strong>Coordinates:</strong> Q:${q}, R:${r}</p>
                    <p><strong>Owner:</strong> ${ownerText}</p>
                    <p><strong>Resource:</strong> ${resourceText}</p>
                    ${territory.isHomeBase ? '<p><strong>Status:</strong> Home Base</p>' : ''}
                    ${territory.influence ? `<p><strong>Influence:</strong> ${territory.influence}</p>` : ''}
                `;
                
                this.addClaimButton(territory);
            }
            this.show();
        } else {
            this.clearPanel();
        }
    }

    /**
     * Clears the territory information panel.
     */
    clearPanel() {
        if (this.detailsElement) {
            this.detailsElement.innerHTML = '<p>No territory selected</p>';
            // Remove claim button if it exists
            const existingButton = document.getElementById('claim-territory-btn');
            if (existingButton) {
                existingButton.remove();
            }
        }
        this.hide();
    }

    /**
     * Add claim territory button if applicable
     */
    addClaimButton(territory) {
        // Remove existing claim button if any
        const existingButton = document.getElementById('claim-territory-btn');
        if (existingButton) {
            existingButton.remove();
        }

        // Only show claim button for neutral territories during player's action phase
        if (territory.owner === null || territory.owner === OWNERS.NEUTRAL) {
            if (this.gameState.currentPlayer === OWNERS.PLAYER && 
                this.gameState.currentPhase === TURN_PHASES.ACTION_PHASE) {
                
                const resourceManager = this.gameState.getResourceManager();
                if (resourceManager) {
                    const cost = resourceManager.getTerritoryClaimCost(territory, OWNERS.PLAYER);
                    const canAfford = resourceManager.canAfford(OWNERS.PLAYER, cost);
                    
                    // Create claim button
                    const claimButton = document.createElement('button');
                    claimButton.id = 'claim-territory-btn';
                    claimButton.className = canAfford ? 'claim-btn affordable' : 'claim-btn unaffordable';
                    claimButton.innerHTML = `
                        <div class="claim-btn-content">
                            <span>Claim Territory</span>
                            <div class="cost-display">
                                <small>Costs: ${this.formatCost(cost)}</small>
                            </div>
                        </div>
                    `;
                    
                    if (canAfford) {
                        claimButton.addEventListener('click', () => this.claimTerritory(territory));
                    } else {
                        claimButton.disabled = true;
                        claimButton.title = 'Insufficient resources';
                    }
                    
                    // Add button to the territory details panel
                    this.detailsElement.appendChild(claimButton);
                }
            }
        }
    }

    /**
     * Format resource cost for display
     */
    formatCost(cost) {
        return Object.entries(cost)
            .filter(([type, amount]) => amount > 0)
            .map(([type, amount]) => `${amount} ${type}`)
            .join(', ');
    }

    /**
     * Handle territory claiming
     */
    claimTerritory(territory) {
        // Ensure we have the correct TerritoryManager instance
        const territoryManagerInstance = this.territoryManager || (this.gameState ? this.gameState._territoryManager : null);
        const resourceManagerInstance = this.gameState ? this.gameState.getResourceManager() : null;

        if (!territoryManagerInstance) {
            console.warn('TerritoryManager not available for claiming.');
            if (this.scene.notificationManager) {
                this.scene.notificationManager.show('Error: Territory system unavailable.', 'error');
            }
            return;
        }
        if (!resourceManagerInstance) {
            console.warn('ResourceManager not available for claiming cost calculation/deduction.');
            if (this.scene.notificationManager) {
                this.scene.notificationManager.show('Error: Resource system unavailable.', 'error');
            }
            return;
        }

        const territoryId = territory.id || `${territory.q || territory.coord.q},${territory.r || territory.coord.r}`;
        const player = OWNERS.PLAYER; // Assuming player is claiming

        // 1. Get the cost from ResourceManager
        const cost = resourceManagerInstance.getTerritoryClaimCost(territory, player);

        // 2. Check if player can afford (ResourceManager can do this, or GameState)
        if (!resourceManagerInstance.canAfford(player, cost)) {
            if (this.scene.notificationManager) {
                this.scene.notificationManager.show(`Not enough resources! Need: ${this.formatCost(cost)}`, 'error', 3000);
            }
            return;
        }

        // 3. Spend resources (via ResourceManager, which should use GameState and emit events)
        const spendResult = resourceManagerInstance.spendResources(player, cost);
        if (!spendResult.success) {
            if (this.scene.notificationManager) {
                this.scene.notificationManager.show(`Failed to spend resources: ${spendResult.reason}`, 'error', 3000);
            }
            return;
        }

        // 4. Claim the territory (via TerritoryManager, which should emit events)
        // The TerritoryManager.claimTerritory method itself should handle emitting TERRITORY_CLAIMED
        const claimSuccessful = territoryManagerInstance.claimTerritory(territoryId, player, cost); // Pass cost for event data

        if (claimSuccessful) {
            // Notification for successful claim (GameScene listens to TERRITORY_CLAIMED for this)
            // The panel will update via the TERRITORY_SELECTED or TERRITORY_UPDATED event chain.
            // GameScene's renderHexGrid will also update due to TERRITORY_CLAIMED.
            // So, no direct calls to updatePanel or renderHexGrid here are strictly necessary if events are wired correctly.
            // However, to ensure immediate feedback on the panel if events are slightly delayed or for robustness:
            const updatedTerritory = territoryManagerInstance.getTerritoryAt(territory.q || territory.coord.q, territory.r || territory.coord.r);
            this.updatePanel(updatedTerritory); 

        } else {
            // This case should ideally be caught by checks within claimTerritory (e.g., not neutral)
            // If claimTerritory returns false, it means an internal rule prevented it.
            if (this.scene.notificationManager) {
                this.scene.notificationManager.show('Failed to claim territory (already owned or other rule).', 'error', 3000);
            }
            // Revert resources if spend was successful but claim failed (if necessary, depends on transaction atomicity)
            // For now, assume spendResources and claimTerritory are part of a sequence that should succeed together.
        }
    }
}

/**
 * ActionButton Class
 * A generic button for UI actions.
 * This can be implemented using either Phaser graphics or DOM elements.
 */
export class ActionButton extends UIComponent {
    constructor(scene, x, y, texture, callback, text = '', textStyle = { font: '16px Arial', fill: '#fff' }) {
        super(scene, x, y);
        this.callback = callback;
        this.texture = texture;

        // Create button using Phaser
        const buttonImage = this.scene.add.image(x, y, texture).setInteractive({ useHandCursor: true });
        buttonImage.on('pointerdown', () => this.handleClick());
        buttonImage.on('pointerover', () => this.handleHover(true));
        buttonImage.on('pointerout', () => this.handleHover(false));
        this.addPhaserObject(buttonImage);

        if (text) {
            const buttonText = this.scene.add.text(x, y, text, textStyle).setOrigin(0.5);
            this.addPhaserObject(buttonText);
        }
    }

    handleClick() {
        // Simple button press effect
        const buttonImage = this.phaserObjects[0];
        if (buttonImage) {
            this.scene.tweens.add({
                targets: buttonImage,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: () => {
                    if (this.callback) this.callback();
                }
            });
        } else if (this.callback) {
            this.callback();
        }
    }

    handleHover(isOver) {
        // Simple hover effect
        const buttonImage = this.phaserObjects[0];
        if (buttonImage) {
            buttonImage.setTint(isOver ? 0xdddddd : 0xffffff);
        }
    }
}

/**
 * EndTurnButton Class
 * Specific button for ending the current player's turn.
 * This implementation works with the existing HTML/DOM end turn button.
 */
export class EndTurnButton extends UIComponent {
    constructor(scene, gameState, turnManager) {
        super(scene, UI_CONSTANTS.END_TURN_BUTTON_X, UI_CONSTANTS.END_TURN_BUTTON_Y);
        this.gameState = gameState;
        this.turnManager = turnManager;
        
        // Find existing DOM button
        this.buttonElement = this.addDomElement(document.getElementById('end-turn-btn'));
        
        // Set up event listener for button click
        if (this.buttonElement) {
            this.buttonElement.addEventListener('click', () => this.endTurn());
        }
        
        // Optional: create a Phaser button as well if needed
        // this.phaserButton = this.createPhaserButton();
    }

    /*
    createPhaserButton() {
        const button = this.scene.add.image(this.x, this.y, ASSETS.IMAGES.END_TURN)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.endTurn());
        return this.addPhaserObject(button);
    }
    */    /**
     * Handle the end turn action
     */
    endTurn() {
        console.log('🎮 End Turn button clicked - advancing turn...');
        
        // Add visual feedback that the button was clicked
        if (this.buttonElement) {
            this.buttonElement.classList.add('clicked');
            setTimeout(() => {
                this.buttonElement.classList.remove('clicked');
            }, 200);
        }
        
        if (this.turnManager) {
            console.log('🎮 Using turnManager to end turn');
            
            // Prefer endTurn over nextTurn method
            if (typeof this.turnManager.endTurn === 'function') {
                this.turnManager.endTurn();
                console.log('🎮 Turn ended successfully');
            } else if (typeof this.turnManager.nextTurn === 'function') {
                this.turnManager.nextTurn();
                console.log('🎮 Advanced to next turn');
            } else {
                console.warn('⚠️ TurnManager does not have nextTurn or endTurn methods');
            }
        } else {
            console.warn('⚠️ TurnManager not available for EndTurnButton');
            
            // Fallback: directly update gameState if TurnManager is not available
            if (this.gameState && typeof this.gameState.nextTurn === 'function') {
                console.log('🎮 Using gameState.nextTurn() as fallback');
                this.gameState.nextTurn();
            }
        }
    }

    destroy() {
        // Remove event listener
        if (this.buttonElement) {
            this.buttonElement.removeEventListener('click', () => this.endTurn());
        }
        this.domElements = []; // Clear references, but don't remove DOM elements
        super.destroy();
    }
}

/**
 * TurnDisplay Class
 * Shows the current turn number and player
 */
export class TurnDisplay extends UIComponent {
    constructor(scene, gameState) {
        super(scene, UI_CONSTANTS.TURN_DISPLAY_X, UI_CONSTANTS.TURN_DISPLAY_Y);
        this.gameState = gameState;
        
        // Create container for the turn display
        const container = document.createElement('div');
        container.id = 'turn-display';
        container.className = 'turn-display';
        document.body.appendChild(container);
        this.addDomElement(container);
        
        // Create elements to show turn number and current player
        this.turnNumberElement = document.createElement('div');
        this.turnNumberElement.className = 'turn-number';
        container.appendChild(this.turnNumberElement);
        
        this.playerElement = document.createElement('div');
        this.playerElement.className = 'turn-player';
        container.appendChild(this.playerElement);
        
        // Initial update
        this.updateDisplay();
        
        // Listen for turn changes
        if (this.gameState.addEventListener) {
            this.gameState.addEventListener('turnChanged', (data) => this.updateDisplay(data));
        }
    }
    
    /**
     * Update the turn display
     */
    updateDisplay(data) {
        const currentTurn = this.gameState.currentTurn || 1;
        const currentPlayer = this.gameState.currentPlayer || OWNERS.PLAYER;
        
        // Update turn number with animation
        if (data && data.turn !== undefined) {
            // Add change animation
            this.turnNumberElement.classList.add('turn-changed');
            setTimeout(() => {
                this.turnNumberElement.classList.remove('turn-changed');
            }, 1000);
        }
        
        this.turnNumberElement.textContent = `Turn: ${currentTurn}`;
        this.playerElement.textContent = `Player: ${currentPlayer}`;
        
        // Set different styles based on the current player
        if (currentPlayer === OWNERS.PLAYER) {
            this.playerElement.style.color = '#3498db'; // blue
        } else if (currentPlayer === OWNERS.AI) {
            this.playerElement.style.color = '#e74c3c'; // red
        }
    }
    
    /**
     * Clean up the component
     */
    destroy() {
        if (this.gameState.removeEventListener) {
            this.gameState.removeEventListener('turnChanged', this.updateDisplay);
        }
        super.destroy();
    }
}

// Export the components
export default {
    ResourceDisplayBar,
    TerritoryInformationPanel,
    ActionButton,
    EndTurnButton,
    TurnDisplay
};

console.log('UIComponents module loaded');
