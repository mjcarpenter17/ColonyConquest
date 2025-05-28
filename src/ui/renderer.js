/**
 * Colony Conquest - UI Renderer
 * Handles the drawing of all UI elements onto the canvas.
 * Manages integration between Phaser UI components and HTML/DOM UI elements.
 */

import { GAME_CONFIG, COLORS, RESOURCE_TYPES, UI_CONSTANTS, ASSETS } from '../utils/constants.js';
import { ResourceDisplayBar, TerritoryInformationPanel, EndTurnButton, ActionButton } from './ui-components.js';

export class UIRenderer {
    constructor(scene, gameState, turnManager = null) {
        this.scene = scene;
        this.gameState = gameState;
        this.turnManager = turnManager;
        this.uiLayer = null; // Phaser Group for UI elements
        this.components = {}; // Store UI component instances
        
        this.initialize();
    }

    /**
     * Initialize the UI layer and create UI components
     */
    initialize() {
        console.log('🎨 Initializing UI Renderer...');
        
        // Create a Phaser Group to hold UI elements
        this.uiLayer = this.scene.add.group();
        
        // Initialize UI Components
        this.initializeComponents();
        
        console.log('✅ UI Renderer initialized');
    }

    /**
     * Initialize UI components
     */
    initializeComponents() {
        // Resource Display (uses existing HTML elements)
        this.components.resourceBar = new ResourceDisplayBar(this.scene, this.gameState);
        
        // Territory Information Panel (uses existing HTML elements)
        this.components.territoryPanel = new TerritoryInformationPanel(this.scene, this.gameState);
        
        // End Turn Button (uses existing HTML button)
        if (this.turnManager) {
            this.components.endTurnButton = new EndTurnButton(this.scene, this.gameState, this.turnManager);
        } else {
            console.warn('No TurnManager provided to UIRenderer - End Turn button may not function properly');
            this.components.endTurnButton = new EndTurnButton(this.scene, this.gameState, null);
        }
        
        // Action buttons can be added as needed
        // this.components.actionButtons = [];
    }
    
    /**
     * Add an action button to the UI
     */
    addActionButton(id, texture, x, y, callback, text = '') {
        const button = new ActionButton(
            this.scene, 
            x, y, 
            texture, 
            callback, 
            text
        );
        
        if (!this.components.actionButtons) {
            this.components.actionButtons = [];
        }
        
        this.components.actionButtons.push({
            id,
            button
        });
        
        return button;
    }
    
    /**
     * Handle territory selection
     */
    onTerritorySelected(territory) {
        if (this.components.territoryPanel) {
            this.components.territoryPanel.updatePanel(territory);
        }
    }

    /**
     * Update UI components (called every frame)
     */
    draw() {
        // Most UI updates now happen through event listeners
        // No need for active redrawing each frame
    }
    
    /**
     * Force update on resource display
     */
    updateResourceDisplay() {
        if (this.components.resourceBar) {
            this.components.resourceBar.updateDisplay();
        }
    }

    /**
     * Clear all UI elements
     */
    clearAll() {
        if (this.uiLayer) {
            this.uiLayer.clear(true, true);
        }
        
        // Clear component references, but DOM elements aren't destroyed
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            } else if (Array.isArray(component)) {
                component.forEach(item => {
                    if (item && item.button && typeof item.button.destroy === 'function') {
                        item.button.destroy();
                    }
                });
            }
        });
        
        this.components = {};
    }

    /**
     * Destroy the UI renderer and all components
     */
    destroy() {
        this.clearAll();
        if (this.uiLayer) {
            this.uiLayer.destroy();
        }
        console.log('🎨 UI Renderer destroyed');
    }
}
