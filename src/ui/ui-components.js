import { COLORS, UI_CONSTANTS, RESOURCE_TYPES, ASSETS, OWNERS } from '../utils/constants.js';

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
        this.updateDisplay();        // Set up event listener for resource updates
        if (this.gameState.addEventListener) {
            this.gameState.addEventListener('resourceChanged', (data) => this.updateDisplay(data));
        } else if (this.gameState.on) {
            this.gameState.on('resourceChanged', this.updateDisplay, this);
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
}

/**
 * TerritoryInformationPanel Class
 * Displays information about the selected territory.
 * This implementation works with the existing HTML/DOM territory info panel.
 */
export class TerritoryInformationPanel extends UIComponent {
    constructor(scene, gameState) {
        super(scene, UI_CONSTANTS.INFO_PANEL_X, UI_CONSTANTS.INFO_PANEL_Y);
        this.gameState = gameState;
        
        // Find existing DOM elements
        this.panelElement = this.addDomElement(document.getElementById('territory-info'));
        this.detailsElement = this.addDomElement(document.getElementById('territory-details'));
        
        // Initially hide the panel if no territory is selected
        if (!this.gameState.selectedTerritory) {
            this.hide();
        } else {
            this.updatePanel(this.gameState.selectedTerritory);
        }

        // Set up event listeners
        if (this.gameState.addEventListener) {
            this.gameState.addEventListener('territoryChanged', (data) => {
                if (data.action === 'selected' || data.action === 'deselected') {
                    this.updatePanel(data.action === 'selected' ? data.territory : null);
                }
            });
        }
        
        // Listen for selection changes in GameScene
        this.scene.events.on('territorySelected', (territory) => {
            this.updatePanel(territory);
        });
    }

    /**
     * Update the territory panel with information about the selected territory
     */
    updatePanel(territory) {
        if (territory) {
            const ownerText = territory.owner ? `Player ${territory.owner}` : 'Neutral';
            const resourceText = territory.resourceType ? 
                `${territory.resourceType.charAt(0).toUpperCase() + territory.resourceType.slice(1)} (${territory.resourceValue})` : 
                'None';
            
            if (this.detailsElement) {
                this.detailsElement.innerHTML = `
                    <p><strong>Coordinates:</strong> Q:${territory.coord.q}, R:${territory.coord.r}</p>
                    <p><strong>Owner:</strong> ${ownerText}</p>
                    <p><strong>Resource:</strong> ${resourceText}</p>
                    ${territory.influence ? `<p><strong>Influence:</strong> ${territory.influence}</p>` : ''}
                `;
            }
            this.show();
        } else {
            if (this.detailsElement) {
                this.detailsElement.innerHTML = '<p>No territory selected</p>';
            }
            this.hide();
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
