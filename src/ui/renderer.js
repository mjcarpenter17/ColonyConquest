/**
 * Colony Conquest - UI Renderer
 * Handles the drawing of all UI elements onto the canvas.
 * Manages integration between Phaser UI components and HTML/DOM UI elements.
 */

import { GAME_CONFIG, COLORS, RESOURCE_TYPES, UI_CONSTANTS, ASSETS, OWNERS } from '../utils/constants.js';
import { ResourceDisplayBar, TerritoryInformationPanel, EndTurnButton, ActionButton, TurnDisplay } from './ui-components.js';

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
        // console.log('🎨 Initializing UI Renderer...'); // REMOVED console.log
        
        // Create a Phaser Group to hold UI elements
        this.uiLayer = this.scene.add.group();
        
        // Initialize UI Components
        this.initializeComponents();
        
        // console.log('✅ UI Renderer initialized'); // REMOVED console.log
    }    /**
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
            console.warn('No TurnManager provided to UIRenderer - End Turn button may not function properly'); // Kept warning
            this.components.endTurnButton = new EndTurnButton(this.scene, this.gameState, null);
        }
        
        // Turn Display
        this.components.turnDisplay = new TurnDisplay(this.scene, this.gameState);
        
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
    }    /**
     * Force update on resource display
     */
    updateResourceDisplay() {
        if (this.components.resourceBar) {
            this.components.resourceBar.updateDisplay();
            
            // Debug: Log what's displayed in the UI vs what's in the game state
            // console.group('🔍 DEBUG - UI Resource Display'); // REMOVED console.group
            
            const player = this.gameState.currentPlayer;
            const actualResources = this.gameState.getResources(player);
            const displayedResources = {};
            
            // Get values displayed in UI
            Object.keys(actualResources).forEach(type => {
                const element = document.getElementById(`${type}-count`);
                if (element) {
                    displayedResources[type] = parseInt(element.textContent || '0');
                }
            });
            
            // console.log('📊 Resources in GameState:', actualResources); // REMOVED console.log
            // console.log('📊 Resources in UI Display:', displayedResources); // REMOVED console.log
            
            // Check for mismatches
            let mismatchFound = false;
            Object.keys(actualResources).forEach(type => {
                if (actualResources[type] !== displayedResources[type]) {
                    console.warn(`⚠️ UI Display mismatch for ${type}: GameState=${actualResources[type]}, UI=${displayedResources[type]}`); // Kept warning
                    mismatchFound = true;
                }
            });
            
            if (!mismatchFound) {
                // console.log('✅ UI display matches GameState resources'); // REMOVED console.log
            }
            
            // console.groupEnd(); // REMOVED console.groupEnd
        }
    }
    
    /**
     * Update turn display with current turn and player information
     * @param {number} turn - Current turn number
     * @param {string} player - Current player identifier
     */
    updateTurnDisplay(turn, player) {
        if (this.components.turnDisplay) {
            const data = { turn, player };
            this.components.turnDisplay.updateDisplay(data);
        }
    }

    /**
     * Update phase display (e.g., "Resource Collection", "Action Phase")
     * @param {object} phaseInfo - Information about the current phase
     */
    updatePhaseDisplay(phaseInfo) {
        // console.log('UIRenderer.updatePhaseDisplay called with:', phaseInfo); // REMOVED console.log
        // TODO: Implement actual UI update for phase display
        // For example, update a text element:
        // if (this.components.phaseTextElement) {
        //     this.components.phaseTextElement.setText(`Current Phase: ${phaseInfo.name}`);
        // }
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
        // console.log('🎨 UI Renderer destroyed'); // REMOVED console.log
    }
}
