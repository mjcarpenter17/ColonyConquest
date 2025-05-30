/**
 * Colony Conquest - Menu System Controller
 * Manages the right-side menu buttons and panel switching
 */

import { UI_CONSTANTS } from '../utils/constants.js';

export class MenuSystem {
    constructor(scene, gameState, gameEventBus) {
        this.scene = scene;
        this.gameState = gameState;
        this.gameEventBus = gameEventBus;
        this.activePanel = null;
        this.menuButtons = {};
        this.isVisible = true;
        
        this.initialize();
    }    /**
     * Initialize the menu system
     */
    initialize() {
        this.createMenuContainer();
        this.createMenuButtons();
        this.setupEventListeners();
    }

    /**
     * Create the main menu container
     */
    createMenuContainer() {
        // Create menu container
        this.menuContainer = document.createElement('div');
        this.menuContainer.id = 'right-menu-system';
        this.menuContainer.className = 'menu-system';
        document.getElementById('ui-overlay').appendChild(this.menuContainer);

        // Create button container
        this.buttonContainer = document.createElement('div');
        this.buttonContainer.id = 'menu-buttons';
        this.buttonContainer.className = 'menu-buttons';
        this.menuContainer.appendChild(this.buttonContainer);
    }

    /**
     * Create the four main menu buttons
     */
    createMenuButtons() {
        const buttons = [
            {
                id: 'resource-menu-btn',
                label: 'Resources',
                icon: '🏗️',
                panel: 'resource',
                tooltip: 'Resource Management & Worker Training'
            },
            {
                id: 'army-menu-btn',
                label: 'Army',
                icon: '⚔️',
                panel: 'army',
                tooltip: 'Army Units & Military Operations'
            },
            {
                id: 'diplomacy-menu-btn',
                label: 'Diplomacy',
                icon: '🤝',
                panel: 'diplomacy',
                tooltip: 'Diplomatic Relations & Trade'
            },
            {
                id: 'research-menu-btn',
                label: 'Research',
                icon: '🔬',
                panel: 'research',
                tooltip: 'Technology & Research Tree'
            }
        ];

        buttons.forEach((buttonConfig, index) => {
            const button = this.createMenuButton(buttonConfig, index);
            this.menuButtons[buttonConfig.panel] = button;
        });
    }

    /**
     * Create individual menu button
     */
    createMenuButton(config, index) {
        const button = document.createElement('button');
        button.id = config.id;
        button.className = 'menu-btn';
        button.setAttribute('data-panel', config.panel);
        button.setAttribute('title', config.tooltip);
        
        button.innerHTML = `
            <div class="menu-btn-content">
                <span class="menu-btn-icon">${config.icon}</span>
                <span class="menu-btn-label">${config.label}</span>
            </div>
        `;

        // Add click handler
        button.addEventListener('click', () => this.togglePanel(config.panel));

        // Add keyboard shortcut (1-4 keys)
        const keyNumber = index + 1;
        button.setAttribute('data-key', keyNumber);

        this.buttonContainer.appendChild(button);
        return button;
    }    /**
     * Toggle panel visibility
     */
    togglePanel(panelType) {
        // Get the panel actual visibility status from the sliding panel system
        const slidingPanelsVisible = document.querySelector('.sliding-panels-container')?.style.display === 'flex';
        
        if (this.activePanel === panelType && slidingPanelsVisible) {
            // Close current panel
            this.closeActivePanel();
        } else {
            // Open new panel (regardless of activePanel state)
            this.openPanel(panelType);
        }
    }

    /**
     * Open specific panel
     */
    openPanel(panelType) {
        // Close any active panel first
        this.closeActivePanel();

        // Set new active panel
        this.activePanel = panelType;
        
        // Update button states
        this.updateButtonStates();

        // Hide menu buttons quickly before panel opens
        this.hideButtons();

        // Emit event for panel system to handle
        if (this.gameEventBus) {
            this.gameEventBus.emit('panelRequested', {
                panelType: panelType,
                action: 'open'
            });
        }

        // Close territory info panel if open
        this.closeTerritoryInfo();
    }

    /**
     * Close active panel
     */
    closeActivePanel() {
        if (this.activePanel) {
            const previousPanel = this.activePanel;
            this.activePanel = null;
            
            // Update button states
            this.updateButtonStates();

            // Emit event for panel system to handle
            if (this.gameEventBus) {
                this.gameEventBus.emit('panelRequested', {
                    panelType: previousPanel,
                    action: 'close'
                });
            }
        }
    }

    /**
     * Update button visual states
     */
    updateButtonStates() {
        Object.entries(this.menuButtons).forEach(([panelType, button]) => {
            if (this.activePanel === panelType) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    /**
     * Close territory info panel when menu is opened
     */
    closeTerritoryInfo() {
        const territoryInfo = document.getElementById('territory-info');
        if (territoryInfo && !territoryInfo.classList.contains('hidden')) {
            territoryInfo.classList.add('hidden');
            
            // Emit territory deselected event
            if (this.gameEventBus) {
                this.gameEventBus.emit('territoryDeselected');
            }
        }
    }    /**
     * Setup keyboard shortcuts and other event listeners
     */
    setupEventListeners() {
        // Keyboard shortcuts (1-4 keys)
        document.addEventListener('keydown', (event) => {
            const key = event.key;
            if (['1', '2', '3', '4'].includes(key) && !event.ctrlKey && !event.altKey) {
                const panelIndex = parseInt(key) - 1;
                const panels = ['resource', 'army', 'diplomacy', 'research'];
                if (panels[panelIndex]) {
                    this.togglePanel(panels[panelIndex]);
                    event.preventDefault();
                }
            }
            
            // ESC key to close active panel
            if (key === 'Escape' && this.activePanel) {
                this.closeActivePanel();
                event.preventDefault();
            }
        });        // Listen for territory selection to close menu panels
        if (this.gameEventBus) {
            this.gameEventBus.on('territorySelected', () => {
                this.closeActivePanel();
            });
            
            // Listen for showMenuButtons event from sliding panels system
            this.gameEventBus.on('showMenuButtons', () => {
                this.showButtons();
            });
            
            // Listen for panelClosed event from sliding panels system
            // This ensures menu system state stays in sync when panel is closed via X button or backdrop
            this.gameEventBus.on('panelClosed', () => {
                this.activePanel = null;
                this.updateButtonStates();
            });
        }
    }

    /**
     * Show/hide the entire menu system
     */
    setVisible(visible) {
        this.isVisible = visible;
        if (this.menuContainer) {
            this.menuContainer.style.display = visible ? 'block' : 'none';
        }
        
        if (!visible) {
            this.closeActivePanel();
        }
    }

    /**
     * Get currently active panel
     */
    getActivePanel() {
        return this.activePanel;
    }

    /**
     * Hide menu buttons with a quick fade-out animation
     */
    hideButtons() {
        if (this.buttonContainer) {
            this.buttonContainer.classList.add('menu-buttons-hidden');
        }
    }

    /**
     * Show menu buttons with a slide-in animation
     */
    showButtons() {
        if (this.buttonContainer) {
            this.buttonContainer.classList.add('menu-buttons-entering');
            this.buttonContainer.classList.remove('menu-buttons-hidden');
            
            // Remove the entering class after animation completes
            setTimeout(() => {
                this.buttonContainer.classList.remove('menu-buttons-entering');
            }, 300);
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Remove event listeners
        document.removeEventListener('keydown', this.keydownHandler);
        
        // Remove DOM elements
        if (this.menuContainer && this.menuContainer.parentNode) {
            this.menuContainer.parentNode.removeChild(this.menuContainer);
        }
        
        this.menuButtons = {};
        this.activePanel = null;
    }
}
