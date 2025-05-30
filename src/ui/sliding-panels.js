/**
 * Colony Conquest - Sliding Panels System
 * Manages panel animations and content switching for the right-side menu system
 */

export class SlidingPanels {
    constructor(scene, gameState, gameEventBus) {
        this.scene = scene;
        this.gameState = gameState;
        this.gameEventBus = gameEventBus;
        this.panels = {};
        this.activePanel = null;
        this.isAnimating = false;
        
        this.initialize();
    }

    /**
     * Initialize the sliding panels system
     */    initialize() {
        this.createPanelContainer();
        this.createPanelComponents();
        this.setupEventListeners();
    }

    /**
     * Create the main panel container
     */
    createPanelContainer() {
        this.panelContainer = document.createElement('div');
        this.panelContainer.id = 'sliding-panels-container';
        this.panelContainer.className = 'sliding-panels-container';
        document.getElementById('ui-overlay').appendChild(this.panelContainer);

        // Create panel backdrop for click-to-close
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'panel-backdrop';
        this.backdrop.addEventListener('click', () => this.closeActivePanel());
        this.panelContainer.appendChild(this.backdrop);

        // Create the sliding panel wrapper
        this.panelWrapper = document.createElement('div');
        this.panelWrapper.className = 'panel-wrapper';
        this.panelContainer.appendChild(this.panelWrapper);
    }

    /**
     * Create panel components
     */
    createPanelComponents() {
        // Import panel classes
        this.createResourcePanel();
        this.createArmyPanel();
        this.createDiplomacyPanel();
        this.createResearchPanel();
    }

    /**
     * Create Resource Management Panel
     */
    createResourcePanel() {
        const panel = document.createElement('div');
        panel.id = 'resource-panel';
        panel.className = 'management-panel';
        panel.setAttribute('data-panel-type', 'resource');
        
        panel.innerHTML = `
            <div class="panel-header">
                <h2>Resource Management</h2>
                <button class="panel-close-btn" data-action="close">×</button>
            </div>
            <div class="panel-content">
                <div class="section">
                    <h3>Resource Overview</h3>
                    <div class="resource-summary">
                        <div class="resource-item-detailed">
                            <img src="assets/images/RSS_Info_Gold.png" alt="Gold" class="resource-icon-large">
                            <div class="resource-info">
                                <span class="resource-name">Gold</span>
                                <span class="resource-amount" id="panel-gold-count">0</span>
                                <span class="resource-rate" id="panel-gold-rate">+0/turn</span>
                            </div>
                        </div>
                        <div class="resource-item-detailed">
                            <img src="assets/images/RSS_Info_Wood.png" alt="Wood" class="resource-icon-large">
                            <div class="resource-info">
                                <span class="resource-name">Wood</span>
                                <span class="resource-amount" id="panel-wood-count">0</span>
                                <span class="resource-rate" id="panel-wood-rate">+0/turn</span>
                            </div>
                        </div>
                        <div class="resource-item-detailed">
                            <img src="assets/images/RSS_Info_Metal.png" alt="Metal" class="resource-icon-large">
                            <div class="resource-info">
                                <span class="resource-name">Metal</span>
                                <span class="resource-amount" id="panel-metal-count">0</span>
                                <span class="resource-rate" id="panel-metal-rate">+0/turn</span>
                            </div>
                        </div>
                        <div class="resource-item-detailed">
                            <img src="assets/images/RSS_Info_Food.png" alt="Food" class="resource-icon-large">
                            <div class="resource-info">
                                <span class="resource-name">Food</span>
                                <span class="resource-amount" id="panel-food-count">0</span>
                                <span class="resource-rate" id="panel-food-rate">+0/turn</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>Worker Training</h3>
                    <div class="worker-training">
                        <div class="worker-type">
                            <span class="worker-name">Woodcutters</span>
                            <div class="worker-controls">
                                <button class="worker-btn decrease" data-worker="woodcutter" data-action="decrease">-</button>
                                <span class="worker-count" id="woodcutter-count">0</span>
                                <button class="worker-btn increase" data-worker="woodcutter" data-action="increase">+</button>
                            </div>
                            <span class="worker-cost">Cost: 2 Food</span>
                        </div>
                        <div class="worker-type">
                            <span class="worker-name">Miners</span>
                            <div class="worker-controls">
                                <button class="worker-btn decrease" data-worker="miner" data-action="decrease">-</button>
                                <span class="worker-count" id="miner-count">0</span>
                                <button class="worker-btn increase" data-worker="miner" data-action="increase">+</button>
                            </div>
                            <span class="worker-cost">Cost: 2 Food</span>
                        </div>
                        <div class="worker-type">
                            <span class="worker-name">Farmers</span>
                            <div class="worker-controls">
                                <button class="worker-btn decrease" data-worker="farmer" data-action="decrease">-</button>
                                <span class="worker-count" id="farmer-count">0</span>
                                <button class="worker-btn increase" data-worker="farmer" data-action="increase">+</button>
                            </div>
                            <span class="worker-cost">Cost: 1 Gold</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.panelWrapper.appendChild(panel);
        this.panels.resource = panel;
        
        // Add event listeners for worker training
        this.setupWorkerTrainingListeners(panel);
    }

    /**
     * Create Army Management Panel
     */
    createArmyPanel() {
        const panel = document.createElement('div');
        panel.id = 'army-panel';
        panel.className = 'management-panel';
        panel.setAttribute('data-panel-type', 'army');
        
        panel.innerHTML = `
            <div class="panel-header">
                <h2>Army Management</h2>
                <button class="panel-close-btn" data-action="close">×</button>
            </div>
            <div class="panel-content">
                <div class="section">
                    <h3>Military Units</h3>
                    <div class="army-summary">
                        <p>Army management features will be implemented in Phase 4.</p>
                        <div class="placeholder-content">
                            <div class="unit-type">
                                <span>Infantry Units: 0</span>
                            </div>
                            <div class="unit-type">
                                <span>Cavalry Units: 0</span>
                            </div>
                            <div class="unit-type">
                                <span>Siege Units: 0</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>Recruitment</h3>
                    <div class="recruitment-area">
                        <p>Unit recruitment will be available soon.</p>
                    </div>
                </div>
            </div>
        `;
        
        this.panelWrapper.appendChild(panel);
        this.panels.army = panel;
    }

    /**
     * Create Diplomacy Panel
     */
    createDiplomacyPanel() {
        const panel = document.createElement('div');
        panel.id = 'diplomacy-panel';
        panel.className = 'management-panel';
        panel.setAttribute('data-panel-type', 'diplomacy');
        
        panel.innerHTML = `
            <div class="panel-header">
                <h2>Diplomacy</h2>
                <button class="panel-close-btn" data-action="close">×</button>
            </div>
            <div class="panel-content">
                <div class="section">
                    <h3>Relations</h3>
                    <div class="diplomacy-summary">
                        <p>Diplomatic features will be implemented in Phase 4.</p>
                        <div class="placeholder-content">
                            <div class="relation-item">
                                <span>AI Player: Neutral</span>
                            </div>
                            <div class="relation-item">
                                <span>Trade Status: None</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>Trade</h3>
                    <div class="trade-area">
                        <p>Trade agreements will be available soon.</p>
                    </div>
                </div>
            </div>
        `;
        
        this.panelWrapper.appendChild(panel);
        this.panels.diplomacy = panel;
    }

    /**
     * Create Research Panel
     */
    createResearchPanel() {
        const panel = document.createElement('div');
        panel.id = 'research-panel';
        panel.className = 'management-panel';
        panel.setAttribute('data-panel-type', 'research');
        
        panel.innerHTML = `
            <div class="panel-header">
                <h2>Research & Technology</h2>
                <button class="panel-close-btn" data-action="close">×</button>
            </div>
            <div class="panel-content">
                <div class="section">
                    <h3>Technology Tree</h3>
                    <div class="research-summary">
                        <p>Research system will be implemented in Phase 4.</p>
                        <div class="placeholder-content">
                            <div class="tech-item">
                                <span>Agriculture: Available</span>
                            </div>
                            <div class="tech-item">
                                <span>Mining: Available</span>
                            </div>
                            <div class="tech-item">
                                <span>Military Tactics: Locked</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>Active Research</h3>
                    <div class="research-area">
                        <p>No active research projects.</p>
                    </div>
                </div>
            </div>
        `;
        
        this.panelWrapper.appendChild(panel);
        this.panels.research = panel;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for panel requests from menu system
        if (this.gameEventBus) {
            this.gameEventBus.on('panelRequested', (data) => {
                if (data.action === 'open') {
                    this.openPanel(data.panelType);
                } else if (data.action === 'close') {
                    this.closePanel(data.panelType);
                }
            });
        }

        // Setup close button listeners for all panels
        Object.values(this.panels).forEach(panel => {
            const closeBtn = panel.querySelector('.panel-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeActivePanel());
            }
        });
    }

    /**
     * Setup worker training button listeners
     */
    setupWorkerTrainingListeners(panel) {
        const workerButtons = panel.querySelectorAll('.worker-btn');
        workerButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const workerType = event.target.getAttribute('data-worker');
                const action = event.target.getAttribute('data-action');
                this.handleWorkerTraining(workerType, action);
            });
        });
    }

    /**
     * Handle worker training actions
     */
    handleWorkerTraining(workerType, action) {
        // Placeholder for worker training logic
        console.log(`Worker training: ${action} ${workerType}`);
        
        // This will be connected to actual resource/worker management in future phases
        if (this.gameEventBus) {
            this.gameEventBus.emit('workerTrainingRequested', {
                workerType: workerType,
                action: action
            });
        }
    }    /**
     * Open a panel with animation
     */
    openPanel(panelType) {
        if (this.isAnimating || !this.panels[panelType]) return;
        
        this.isAnimating = true;
        this.activePanel = panelType;
        
        // Hide all panels first
        Object.values(this.panels).forEach(panel => {
            panel.style.display = 'none';
        });
        
        // Show container and backdrop
        this.panelContainer.style.display = 'flex';
        
        // Show the requested panel
        const panel = this.panels[panelType];
        panel.style.display = 'block';
        
        // Trigger animation - use a small delay to allow menu buttons to start hiding
        setTimeout(() => {
            requestAnimationFrame(() => {
                this.panelContainer.classList.add('panel-visible');
                panel.classList.add('panel-slide-in');
                
                setTimeout(() => {
                    this.isAnimating = false;
                    this.updatePanelContent(panelType);
                }, 300);
            });
        }, 150); // Small delay to coordinate with menu button hide animation
    }    /**
     * Close specific panel
     */
    closePanel(panelType) {
        if (this.activePanel === panelType) {
            this.closeActivePanel();
        }
    }/**
     * Close currently active panel
     */
    closeActivePanel() {
        if (!this.activePanel || this.isAnimating) return;
        
        this.isAnimating = true;
        const panel = this.panels[this.activePanel];
        
        // Start close animation
        panel.classList.remove('panel-slide-in');
        panel.classList.add('panel-slide-out');
        this.panelContainer.classList.remove('panel-visible');
        
        setTimeout(() => {
            // Hide container
            this.panelContainer.style.display = 'none';
            
            // Reset panel states
            panel.classList.remove('panel-slide-out');
            panel.style.display = 'none';
            
            this.activePanel = null;
            this.isAnimating = false;
            
            // Show menu buttons after panel is closed
            this.showMenuButtons();
        }, 300);
    }
      /**
     * Show the menu buttons after panel closes
     */
    showMenuButtons() {
        if (this.gameEventBus) {
            // Emit an event to show menu buttons AND notify menu system that panel is closed
            this.gameEventBus.emit('panelClosed');
            this.gameEventBus.emit('showMenuButtons');
        }
    }

    /**
     * Update panel content with current game state
     */
    updatePanelContent(panelType) {
        if (panelType === 'resource') {
            this.updateResourcePanelContent();
        }
        // Other panel updates will be added in future phases
    }

    /**
     * Update resource panel with current resource values
     */
    updateResourcePanelContent() {
        const resources = this.gameState.resources[this.gameState.currentPlayer] || {};
        
        // Update resource amounts
        Object.entries(resources).forEach(([type, amount]) => {
            const element = document.getElementById(`panel-${type}-count`);
            if (element) {
                element.textContent = amount;
            }
        });
        
        // Update resource rates (placeholder for now)
        ['gold', 'wood', 'metal', 'food'].forEach(type => {
            const rateElement = document.getElementById(`panel-${type}-rate`);
            if (rateElement) {
                // This will be calculated from actual production in future phases
                rateElement.textContent = '+1/turn';
            }
        });
    }

    /**
     * Get currently active panel
     */
    getActivePanel() {
        return this.activePanel;
    }

    /**
     * Check if panels are animating
     */
    isAnimating() {
        return this.isAnimating;
    }

    /**
     * Destroy the panels system
     */
    destroy() {
        if (this.panelContainer && this.panelContainer.parentNode) {
            this.panelContainer.parentNode.removeChild(this.panelContainer);
        }
        
        this.panels = {};
        this.activePanel = null;
        this.isAnimating = false;
    }
}
