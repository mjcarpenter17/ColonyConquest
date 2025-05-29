/**
 * Colony Conquest - Main Game Scene
 * Handles hex grid rendering, territory selection, and user interactions
 */

import { HexGrid } from '../map/hex-grid.js';
import { GAME_CONFIG, COLORS, OWNERS, RESOURCE_TYPES } from '../utils/constants.js';
import { hexToPixel, pixelToHex } from '../utils/math-utils.js';
import { GameState } from '../core/game-state.js'; // Added GameState import
import { UIRenderer } from '../ui/renderer.js'; // Added UIRenderer import
import InputHandler from '../ui/input-handler.js'; // Added InputHandler import
import { TurnManager } from '../core/turn-manager.js'; // Import TurnManager
import { ResourceManager } from '../core/resource-manager.js'; // Import ResourceManager
import { NotificationManager } from '../ui/notification.js'; // Import NotificationManager

/**
 * GameScene class - Main gameplay scene for Phaser
 */
export class GameScene extends Phaser.Scene {    constructor() {
        super({ key: 'GameScene' });
        this.hexGrid = null;
        this.hexGraphics = null;
        this.selectedHex = null;
        this.gameState = null; // Initialized gameState
        this.resourceManager = null; // Resource manager for handling resource operations
        this.turnManager = null; // Turn manager for handling turn sequences
        this.uiRenderer = null; // Initialized uiRenderer
        this.inputHandler = null; // Initialized inputHandler
        this.notificationManager = null; // Notification system
    }

    /**
     * Initialize the scene
     */
    init(data) {
        this.sceneData = data || {};
    }

    /**
     * Preload assets needed for the game scene
     */
    preload() {
        // Set loading progress bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222);
        progressBox.fillRect(240, 270, 320, 50);
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading Colony Conquest...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);
        
        // Update progress bar
        this.load.on('progress', function (value) {
            progressBar.clear();
            progressBar.fillStyle(0xffffff);
            progressBar.fillRect(250, 280, 300 * value, 30);
        });
        
        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });
        
        // Load UI assets
        // Resource icons
        this.load.image('rss_info_gold', 'assets/images/RSS_Info_Gold.png');
        this.load.image('rss_info_wood', 'assets/images/RSS_Info_Wood.png');
        this.load.image('rss_info_metal', 'assets/images/RSS_Info_Metal.png');
        this.load.image('rss_info_food', 'assets/images/RSS_Info_Food.png');
        
        // Button assets
        this.load.image('end_turn_button', 'assets/images/endTurn_02.png');
        this.load.image('end_turn_pressed', 'assets/images/endTurn_02_Pressed.png');
        this.load.image('blue_btn', 'assets/images/Blue_Btn.png');
        this.load.image('green_btn', 'assets/images/Green_Btn.png');
        this.load.image('red_btn', 'assets/images/Red_Btn.png');
    }

    /**
     * Create the game scene
     */
    create() {
        // Initialize GameState
        this.gameState = new GameState();
        
        // Initialize ResourceManager and connect it to the GameState
        this.resourceManager = new ResourceManager(this.gameState);
        this.gameState.setResourceManager(this.resourceManager);
        
        // Initialize TurnManager
        this.turnManager = new TurnManager(this.gameState);
        
        // Create the hex grid
        this.hexGrid = new HexGrid(GAME_CONFIG.GRID_SIZE);
        this.hexGraphics = this.add.graphics();
        this.renderHexGrid();        // Setup input handling
        this.input.on('pointerdown', this.handleTileClick, this);        // Initialize Notification Manager
        this.notificationManager = new NotificationManager(this);

        // Initialize UI Renderer with the turn manager
        this.uiRenderer = new UIRenderer(this, this.gameState, this.turnManager);        // Initialize Input Handler
        this.inputHandler = new InputHandler(this, this.gameState, this.uiRenderer);
        
        // Set up turn event listeners
        this.setupTurnEventHandlers();
          // Set up test territories for resource collection testing
        this.assignTestTerritoriesToPlayer();
        
        // Add keyboard shortcut for testing end turn
        this.input.keyboard.on('keydown-T', () => {
            if (this.turnManager) {
                this.turnManager.endTurn();
            } else {
                console.warn("⚠️ TurnManager not available");
            }
        });
        
        // Start the game
        this.startGame();
    }
    
    /**
     * Set up event handlers for turn and phase changes
     */
    setupTurnEventHandlers() {        // Listen for turn start events
        this.turnManager.onTurnStart((data) => {
            // Update UI for new turn
            if (this.uiRenderer) {
                this.uiRenderer.updateTurnDisplay(data.turn, data.player);
                // Force update the resource display
                this.uiRenderer.updateResourceDisplay();
            }
        });
        
        // Listen for turn end events
        this.turnManager.onTurnEnd((data) => {
        });
        
        // Listen for phase changes
        this.turnManager.onPhaseChange((data) => {
            // Update UI for new phase
            if (this.uiRenderer) {
                this.uiRenderer.updatePhaseDisplay(data.newPhase);
            }
        });
          // Listen for resource changes
        this.gameState.addEventListener('resourceChanged', (data) => {
            // Show notification if resources were collected
            if (data.action === 'collected' && this.notificationManager) {
                const territoryCount = data.details?.territories || 
                  this.gameState.getTerritoriesByOwner(data.player).length;
                
                // Display notification for resource collection
                this.notificationManager.showResourceCollection(data.amounts, data.player);
                
                // Show a summary notification with territory count
                if (territoryCount > 0) {
                    this.notificationManager.show(
                        `Resources collected from ${territoryCount} territories`, 
                        'info', 
                        2500
                    );
                }
            }
        });
    }
      /**
     * Start the game and first turn
     */
    startGame() {
        this.turnManager.startTurn();
    }
    
    /**
     * Render the hexagonal grid
     */
    renderHexGrid() {
        if (!this.hexGrid) {
            console.error('HexGrid not initialized!');
            return;
        }
        if (this.hexGraphics) {
            this.hexGraphics.clear(); // Clear previous graphics
        } else {
            this.hexGraphics = this.add.graphics();
        }

        const allHexes = this.hexGrid.getAllHexes();
        const hexSize = GAME_CONFIG.HEX_SIZE;
        const origin = { x: this.cameras.main.width / 2, y: this.cameras.main.height / 2 };

        allHexes.forEach(hexData => {
            const hexCoord = hexData.coord;
            const pixelPos = hexToPixel(hexCoord, hexSize);
            const worldX = origin.x + pixelPos.x;
            const worldY = origin.y + pixelPos.y;

            let fillColor = COLORS.HEX_FILL;
            let borderColor = COLORS.HEX_BORDER;

            if (this.selectedHex && this.selectedHex.coord.q === hexCoord.q && this.selectedHex.coord.r === hexCoord.r) {
                fillColor = COLORS.HEX_HIGHLIGHT;
                borderColor = COLORS.HEX_BORDER_SELECTED;
            }

            this.drawHexagon(this.hexGraphics, worldX, worldY, hexSize, fillColor, borderColor);
        });
        // console.log(`🎨 Rendered ${allHexes.length} hexes.`); // Adjusted log
    }

    /**
     * Draw a hexagon at the specified position
     */
    drawHexagon(graphics, x, y, size, fillColor, lineColor) {
        graphics.lineStyle(GAME_CONFIG.HEX_LINE_THICKNESS, lineColor, 1.0);
        graphics.fillStyle(fillColor, 1.0); // Using full opacity for fill now
        const points = [];
        for (let i = 0; i < 6; i++) {
            // Adjusted angle for pointy-top hexagons
            // The first point is at the top-right for i=0 (30 degrees or PI/6)
            const angle = (Math.PI / 3) * i + Math.PI / 6; 
            points.push(x + size * Math.cos(angle), y + size * Math.sin(angle));
        }
        graphics.beginPath();
        graphics.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) {
            graphics.lineTo(points[i], points[i + 1]);
        }
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
    }    /**
     * Handle tile click/touch input
     * @param {Phaser.Input.Pointer} pointer 
     */
    handleTileClick(pointer) {
        const hexSize = GAME_CONFIG.HEX_SIZE;
        const origin = { x: this.cameras.main.width / 2, y: this.cameras.main.height / 2 };

        const clickX = pointer.x - origin.x;
        const clickY = pointer.y - origin.y;

        const { q, r } = pixelToHex({ x: clickX, y: clickY }, hexSize);
        const clickedHexData = this.hexGrid.getHex(q, r); // Assuming getHex returns the hex data object or null

        if (clickedHexData) {
            this.selectedHex = clickedHexData;
            
            // Update the gameState's selectedTerritory if it supports it
            if (this.gameState.selectTerritory && typeof this.gameState.selectTerritory === 'function') {
                this.gameState.selectTerritory(clickedHexData.id);
            } else {
                // Store directly in gameState as a fallback
                this.gameState.selectedTerritory = clickedHexData;
            }
            
            // Emit an event that UI components can listen for
            this.events.emit('territorySelected', clickedHexData);
            
            // Notify the UI renderer if it has a handler
            if (this.uiRenderer && this.uiRenderer.onTerritorySelected) {
                this.uiRenderer.onTerritorySelected(clickedHexData);
            }
        } else {
            this.selectedHex = null;
            
            // Clear selected territory in gameState
            if (this.gameState.deselectTerritory && typeof this.gameState.deselectTerritory === 'function') {
                this.gameState.deselectTerritory();
            } else {
                // Clear directly in gameState as a fallback
                this.gameState.selectedTerritory = null;
            }
            
            // Emit a selection cleared event
            this.events.emit('territorySelected', null);
            
            // Notify the UI renderer if it has a handler
            if (this.uiRenderer && this.uiRenderer.onTerritorySelected) {
                this.uiRenderer.onTerritorySelected(null);
            }
        }
        
        this.renderHexGrid(); // Redraw the grid to reflect selection changes
    }

    /**
     * Update loop
     */
    update(time, delta) {
        // Update any continuous animations or effects
        if (this.uiRenderer) {
            this.uiRenderer.draw(); // Call UI Renderer's draw method
        }
    }    /**
     * Clean up when scene is destroyed
     */
    destroy() {
        if (this.uiRenderer) {
            this.uiRenderer.destroy(); // Destroy UI Renderer
        }
        if (this.inputHandler) { // Destroy Input Handler
            this.inputHandler.destroy();
        }
        if (this.notificationManager) {
            this.notificationManager.destroy(); // Destroy Notification Manager
        }
        // Remove event listeners
        if (this.gameState) {
            this.gameState.removeAllListeners();
        }
        if (this.turnManager) {
            this.turnManager.removeAllListeners();
        }
        
        super.destroy();
    }
    
    /**
     * Assign test territories to the player for testing resource collection
     */
    assignTestTerritoriesToPlayer() {
        // Get a few territories at different positions to assign to the player
        const testPositions = [
            { q: 0, r: 0 },    // Center - gold territory
            { q: 1, r: -1 },   // Northeast - wood territory
            { q: -1, r: 2 }    // Southwest - metal territory
        ];
        
        testPositions.forEach((pos, index) => {
            // Generate hex key based on coordinates
            const hexKey = `${pos.q},${pos.r}`;
            let territory = this.hexGrid.getHex(pos.q, pos.r);
            
            if (territory) {
                // Assign to player
                territory.owner = OWNERS.PLAYER;
                
                // Set different resource types and values for testing
                switch (index) {
                    case 0:
                        territory.resourceType = RESOURCE_TYPES.GOLD;
                        territory.resourceValue = 2;
                        break;
                    case 1:
                        territory.resourceType = RESOURCE_TYPES.WOOD;
                        territory.resourceValue = 3;
                        break;
                    case 2:
                        territory.resourceType = RESOURCE_TYPES.METAL;
                        territory.resourceValue = 1;
                        break;
                }
                
                // Add territory to game state if it's not already there
                if (this.gameState && !this.gameState.territories.has(hexKey)) {
                    this.gameState.territories.set(hexKey, territory);
                }
            } else {
                console.warn(`⚠️ Could not find territory at ${hexKey}`);
            }
        });
        
        // Re-render the grid to show the player's territories
        this.renderHexGrid();
    }
}
