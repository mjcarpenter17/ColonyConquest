/**
 * Colony Conquest - UI Renderer
 * Handles the drawing of all UI elements onto the canvas.
 * Manages integration between Phaser UI components and HTML/DOM UI elements.
 */

import { GAME_CONFIG, COLORS, RESOURCE_TYPES, UI_CONSTANTS, ASSETS, OWNERS } from '../utils/constants.js';
import { ResourceDisplayBar, TerritoryInformationPanel, EndTurnButton, ActionButton, TurnDisplay } from './ui-components.js';
import { MenuSystem } from './menu-system.js';
import { SlidingPanels } from './sliding-panels.js';
import { ResourcePanel } from './panel-components.js';

export class UIRenderer {
    constructor(scene, gameState, turnManager = null, gameEventBus = null, territoryManager = null) { // Added gameEventBus and territoryManager
        this.scene = scene;
        this.gameState = gameState;
        this.turnManager = turnManager;
        this.gameEventBus = gameEventBus; // Store gameEventBus
        this.territoryManager = territoryManager; // Store territoryManager
        this.uiLayer = null; // Phaser Group for UI elements
        this.components = {}; // Store UI component instances
        
        this.initialize();
        this._subscribeToEvents(); // Subscribe to relevant events
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
        this.components.territoryPanel = new TerritoryInformationPanel(this.scene, this.gameState, this.gameEventBus, this.territoryManager);
        
        // End Turn Button (uses existing HTML button)
        if (this.turnManager) {
            this.components.endTurnButton = new EndTurnButton(this.scene, this.gameState, this.turnManager);
        } else {
            console.warn('No TurnManager provided to UIRenderer - End Turn button may not function properly'); // Kept warning
            this.components.endTurnButton = new EndTurnButton(this.scene, this.gameState, null);
        }
        
        // Turn Display
        this.components.turnDisplay = new TurnDisplay(this.scene, this.gameState);
        
        // Menu System - Right-side menu controller
        this.components.menuSystem = new MenuSystem(this.scene, this.gameState, this.gameEventBus);
        
        // Sliding Panels - Panel animation and content system
        this.components.slidingPanels = new SlidingPanels(this.scene, this.gameState, this.gameEventBus);
        
        // Resource Panel Component - Enhanced resource management
        this.components.resourcePanel = new ResourcePanel(this.scene, this.gameState, this.gameEventBus);
        
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
      _subscribeToEvents() {
        if (!this.gameEventBus) return;

        this.gameEventBus.on(this.gameEventBus.events.TERRITORY_SELECTED, this.onTerritorySelected, this);
        this.gameEventBus.on(this.gameEventBus.events.TERRITORY_DESELECTED, this.onTerritoryDeselected, this);
        
        // Listen for panel events to update resource panel content
        this.gameEventBus.on('panelRequested', this.onPanelRequested, this);
    }

    /**
     * Handle panel requests
     */
    onPanelRequested(data) {
        if (data.action === 'open' && data.panelType === 'resource') {
            // Update resource panel content when it opens
            if (this.components.resourcePanel) {
                this.components.resourcePanel.show();
            }
        } else if (data.action === 'close' && data.panelType === 'resource') {
            // Hide resource panel when it closes
            if (this.components.resourcePanel) {
                this.components.resourcePanel.hide();
            }
        }
    }

    /**
     * Handle territory selection
     */
    onTerritorySelected(eventData) { // Changed parameter to eventData
        const territory = eventData.territory; // Extract territory from eventData
        if (this.components.territoryPanel) {
            this.components.territoryPanel.updatePanel(territory);
        }
    }

    /**
     * Handle territory deselection
     */
    onTerritoryDeselected() {
        if (this.components.territoryPanel) {
            this.components.territoryPanel.clearPanel();
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
