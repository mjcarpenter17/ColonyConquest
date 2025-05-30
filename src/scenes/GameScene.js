/**
 * Colony Conquest - Main Game Scene
 * Handles hex grid rendering, territory selection, and user interactions
 */

import { HexGrid } from '../map/hex-grid.js';
import { GAME_CONFIG, COLORS, OWNERS, RESOURCE_TYPES } from '../utils/constants.js';
import { hexToPixel, pixelToHex } from '../utils/math-utils.js';
import { GameState } from '../core/game-state.js';
import { UIRenderer } from '../ui/renderer.js';
import InputHandler from '../ui/input-handler.js';
import { TurnManager } from '../core/turn-manager.js';
import { ResourceManager } from '../core/resource-manager.js';
import { NotificationManager } from '../ui/notification.js';
import { Territory } from '../map/territory.js'; // Import the Territory class
import { TerritoryManager } from '../core/TerritoryManager.js';
import { MapGenerator } from '../map/map-generator.js';
import { GameEventBus } from '../core/GameEventBus.js';

/**
 * GameScene class - Main gameplay scene for Phaser
 */
export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.hexGrid = null;
        this.hexGraphics = null;
        this.gameState = null;
        this.resourceManager = null;
        this.turnManager = null;
        this.uiRenderer = null;
        this.inputHandler = null;
        this.notificationManager = null;
        this.territoryManager = null;
        this.mapGenerator = null;
        this.gameEventBus = null;
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
        this.load.image('rss_info_metal', 'assets/images/RSS_Info_Metal.png'); // Corresponds to IRON
        this.load.image('rss_info_food', 'assets/images/RSS_Info_Food.png');
        this.load.image('rss_info_stone', 'assets/images/RSS_Info_Stone.png'); // New icon for STONE

        // Define a mapping for resource types to icon keys
        this.resourceIconKeys = {
            [RESOURCE_TYPES.GOLD]: 'rss_info_gold',
            [RESOURCE_TYPES.WOOD]: 'rss_info_wood',
            [RESOURCE_TYPES.IRON]: 'rss_info_metal', // Assuming 'metal' icon is for IRON
            [RESOURCE_TYPES.FOOD]: 'rss_info_food',
            [RESOURCE_TYPES.STONE]: 'rss_info_stone'
        };
        
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
        // Initialize GameEventBus first
        this.gameEventBus = new GameEventBus();

        // Initialize GameState
        this.gameState = new GameState(this.gameEventBus);
        
        // Initialize HexGrid
        this.hexGrid = new HexGrid(GAME_CONFIG.GRID_SIZE);
        this.gameState.setHexGrid(this.hexGrid); 

        // Initialize TerritoryManager
        // It needs the event bus for broadcasting, game state for context, and hexGrid for validation
        this.territoryManager = new TerritoryManager(this.gameEventBus, this.gameState, this.hexGrid);
        this.gameState.setTerritoryManager(this.territoryManager);

        // Initialize ResourceManager
        this.resourceManager = new ResourceManager(this.gameState, this.gameEventBus, this.territoryManager);
        this.gameState.setResourceManager(this.resourceManager);
        
        // Initialize TurnManager
        this.turnManager = new TurnManager(this.gameState, this.gameEventBus);
        
        // Initialize MapGenerator - it will use TerritoryManager to create territories
        this.mapGenerator = new MapGenerator(this.hexGrid, this.territoryManager);

        // Initialize the game map (generate territories)
        this.initializeMap();

        // Graphics for hex grid
        this.hexGraphics = this.add.graphics();
        this.renderHexGrid();

        // Setup input handling
        this.input.on('pointerdown', this.handleTileClick, this);

        // Initialize Notification Manager
        this.notificationManager = new NotificationManager(this);

        // Initialize UI Renderer
        this.uiRenderer = new UIRenderer(this, this.gameState, this.turnManager, this.gameEventBus, this.territoryManager);
        
        // Initialize Input Handler
        this.inputHandler = new InputHandler(this, this.gameState, this.uiRenderer, this.gameEventBus, this.territoryManager);
        
        // Set up event listeners
        this.setupEventHandlers();
        
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
     * Initialize the game map by generating territories.
     */
    initializeMap() {
        if (!this.mapGenerator) {
            console.error("MapGenerator not initialized!");
            return;
        }
        // The MapGenerator's generateBalancedMap method should now directly use
        // territoryManager.createTerritory or a similar method to populate territories.
        // It might return the raw generated data or simply confirm completion.
        // For this example, let's assume generateBalancedMap tells TerritoryManager what to do.
        this.mapGenerator.generateBalancedMap(2); // Generates a map for 2 players

        console.log(`🗺️ Game map initialized via MapGenerator and TerritoryManager.`);
        
        // Optional: Log a simple preview of the map to the console
        // this.logMapPreview(); 
    }

    /**
     * Set up event handlers for game events
     */
    setupEventHandlers() { 
        // Clear any old listeners from GameState if they weren't removed during its refactor
        // (GameState's old event system should be gone, but this is a safeguard if any remnants existed)

        // --- Turn Manager Events (Phaser Emitter based) ---
        if (this.turnManager) {
            this.turnManager.onTurnStart((data) => {
                if (this.uiRenderer) {
                    this.uiRenderer.updateTurnDisplay(data.turn, data.player);
                    this.uiRenderer.updateResourceDisplay();
                }
            });
            this.turnManager.onTurnEnd((data) => {
                // Handle turn end UI if needed
            });
            this.turnManager.onPhaseChange((data) => {
                if (this.uiRenderer) {
                    this.uiRenderer.updatePhaseDisplay(data.newPhase);
                }
            });
        }

        // --- GameEventBus Events ---
        if (this.gameEventBus) {
            // Territory Selection/Deselection
            this.gameEventBus.on(this.gameEventBus.events.TERRITORY_SELECTED, (eventData) => {
                // GameState._handleTerritorySelected will update gameState.selectedTerritory
                // We just need to re-render.
                this.renderHexGrid();
                // console.log('GameScene: TERRITORY_SELECTED event processed, re-rendering grid.', eventData.territory ? eventData.territory.id : 'None');
            });
            this.gameEventBus.on(this.gameEventBus.events.TERRITORY_DESELECTED, (eventData) => {
                // GameState._handleTerritoryDeselected will update gameState.selectedTerritory
                this.renderHexGrid();
                // console.log('GameScene: TERRITORY_DESELECTED event processed, re-rendering grid.');
            });

            // Territory Data Changes (triggers re-render)
            this.gameEventBus.on(this.gameEventBus.events.TERRITORY_CREATED, (territory) => {
                this.renderHexGrid();
            });
            this.gameEventBus.on(this.gameEventBus.events.TERRITORY_UPDATED, (eventData) => {
                // eventData: { territoryId, changes, territoryData }
                this.renderHexGrid();
                // Potentially show notification for specific updates if needed
            });
            this.gameEventBus.on(this.gameEventBus.events.TERRITORY_CLAIMED, (eventData) => {
                // eventData: { action, territoryId, newOwner, oldOwner, cost, territoryData }
                this.renderHexGrid();
                if (this.notificationManager && eventData.cost) {
                    this.notificationManager.show(
                        `${eventData.territoryData.id} claimed by ${eventData.newOwner} for ${this.formatCost(eventData.cost)}!`,
                        'success',
                        3000
                    );
                }
            });
            this.gameEventBus.on(this.gameEventBus.events.TERRITORY_OWNERSHIP_CHANGED, (eventData) => {
                // eventData: { territory, newOwner, oldOwner }
                // This might be redundant if TERRITORY_CLAIMED or TERRITORY_UPDATED already cause a re-render
                // and handle notifications. However, if direct ownership changes can happen outside of claims/updates,
                // this listener is useful.
                this.renderHexGrid();
            });

            // Map Initialization (triggers re-render)
            this.gameEventBus.on(this.gameEventBus.events.MAP_INITIALIZED, (eventData) => {
                // eventData: { territoryCount }
                this.renderHexGrid();
                console.log(`GameScene: MAP_INITIALIZED event received, ${eventData.territoryCount} territories. Grid re-rendered.`);
            });
            this.gameEventBus.on(this.gameEventBus.events.TERRITORIES_CLEARED, () => {
                this.renderHexGrid(); // Render an empty grid or default state
            });

            // Resource Changes
            this.gameEventBus.on(this.gameEventBus.events.RESOURCES_CHANGED, (eventData) => {
                // eventData: { player, changedResources, reason }
                if (this.uiRenderer) {
                    this.uiRenderer.updateResourceDisplay(); // General UI update
                }

                const player = eventData.player;
                const changedResources = eventData.changedResources;
                const reason = eventData.reason;

                if (this.notificationManager) {
                    if (reason === 'collection') {
                        // ResourceManager now emits RESOURCES_COLLECTED which includes amounts and territory count
                        // This specific 'collection' reason might be redundant if we listen to RESOURCES_COLLECTED directly
                        // For now, let's assume RESOURCES_CHANGED with reason 'collection' is primary.
                        // We need the actual amounts collected, which are in changedResources.
                        const collectedAmounts = changedResources; // These are positive values
                        this.notificationManager.showResourceCollection(collectedAmounts, player);
                        
                        // To get territory count, we might need it passed in eventData or query TM
                        // const territoryCount = this.territoryManager.getTerritoriesByOwner(player).filter(t => t.resourceType !== RESOURCE_TYPES.NONE).length;
                        // if (territoryCount > 0) {
                        //     this.notificationManager.show(
                        //         `Resources collected from ${territoryCount} producing territories`,
                        //         'info',
                        //         2500
                        //     );
                        // }
                    } else if (reason === 'spent' && this.uiRenderer && this.uiRenderer.components.resourceBar) {
                        // changedResources here will have negative values for spending
                        const spentAmounts = {};
                        for (const type in changedResources) {
                            spentAmounts[type] = -changedResources[type]; // Make positive for display
                        }
                        this.uiRenderer.components.resourceBar.showSpendingAnimation(spentAmounts);
                    }
                }
            });
            
            this.gameEventBus.on(this.gameEventBus.events.RESOURCES_COLLECTED, (eventData) => {
                // eventData: { player, collectedAmounts, territoryCount }
                if (this.notificationManager) {
                    this.notificationManager.showResourceCollection(eventData.collectedAmounts, eventData.player);
                    if (eventData.territoryCount > 0) {
                         this.notificationManager.show(
                            `Resources collected from ${eventData.territoryCount} territories`,
                            'info',
                            2500
                        );
                    }
                }
                // uiRenderer.updateResourceDisplay() is already called by RESOURCES_CHANGED, which is also emitted.
            });

        }

        // REMOVE OLD LISTENERS
        // this.gameState.removeEventListener('resourceChanged', ...); // Example, ensure all old listeners are gone
        // this.gameEventBus.off('TERRITORY_CHANGED', ...); // If any old string-based listeners were on gameEventBus
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
        if (!this.hexGrid || !this.territoryManager || !this.gameState) {
            console.error('HexGrid, TerritoryManager, or GameState not initialized for rendering!');
            return;
        }
        this.hexGraphics.clear();

        // Clear previous resource icons before re-rendering
        if (this.resourceIconsGroup) {
            this.resourceIconsGroup.clear(true, true); // Destroy children
        }

        const allHexCoords = this.hexGrid.getAllHexes(); 
        const hexSize = GAME_CONFIG.HEX_SIZE;
        const origin = { x: this.cameras.main.width / 2, y: this.cameras.main.height / 2 };

        allHexCoords.forEach(hexCoordData => {
            const { q, r } = hexCoordData.coord; // Correctly access q, r from hexCoordData.coord
            const pixelPos = hexToPixel({ q, r }, hexSize);
            const worldX = origin.x + pixelPos.x;
            const worldY = origin.y + pixelPos.y;

            let fillColor = COLORS.HEX_EMPTY_FILL; 
            let borderColor = COLORS.HEX_BORDER;
            let borderWidth = GAME_CONFIG.HEX_LINE_THICKNESS;

            const territory = this.territoryManager.getTerritoryAt(q, r);

            if (territory) { 
                switch (territory.owner) {
                    case OWNERS.PLAYER:
                        fillColor = COLORS.PLAYER_TERRITORY;
                        break;
                    case OWNERS.AI: // Assuming a single AI for now, or use specific AI IDs
                        fillColor = COLORS.AI_TERRITORY; // Ensure this is defined in constants
                        break;
                    case OWNERS.NEUTRAL:
                        fillColor = COLORS.NEUTRAL_TERRITORY;
                        break;
                    default: 
                        fillColor = COLORS.NEUTRAL_TERRITORY; 
                        break;
                }

                if (territory.isHomeBase) {
                    borderColor = COLORS.HOME_BASE_BORDER; 
                    borderWidth = GAME_CONFIG.HEX_LINE_THICKNESS * 2; // Thicker border for home bases
                }
                
                // Highlight if selected - use gameState.selectedTerritory
                if (this.gameState.selectedTerritory && this.gameState.selectedTerritory.id === territory.id) {
                    fillColor = COLORS.HEX_HIGHLIGHT; 
                    borderColor = COLORS.HEX_BORDER_SELECTED;
                    borderWidth = GAME_CONFIG.HEX_LINE_THICKNESS * 1.5;
                }

                this.drawHexagon(this.hexGraphics, worldX, worldY, hexSize, fillColor, borderColor, borderWidth);

                // Add visual indicators for resources (e.g., small icons)
                if (territory.resourceType && territory.resourceType !== RESOURCE_TYPES.NONE) {
                    this.drawResourceIcon(worldX, worldY, territory.resourceType, territory.resourceValue);
                }

            } else {
                fillColor = COLORS.HEX_OUT_OF_BOUNDS; 
                this.drawHexagon(this.hexGraphics, worldX, worldY, hexSize, fillColor, borderColor, borderWidth);
            }

        });
    }

    /**
     * Draw a resource icon on a territory
     * @param {number} x - Center X position of the hex
     * @param {number} y - Center Y position of the hex
     * @param {string} resourceType - Type of resource (e.g., RESOURCE_TYPES.WOOD)
     * @param {number} resourceValue - Value of the resource
     */
    drawResourceIcon(x, y, resourceType, resourceValue) {
        const iconKey = this.resourceIconKeys[resourceType];
        if (iconKey && this.textures.exists(iconKey)) {
            // Remove previous icon if it exists for this hex (q,r) to prevent stacking
            // This requires a way to track icons, e.g., storing them in a group or map
            // For simplicity, we'll assume for now that re-rendering clears them or they are part of a container.
            // A more robust solution would be to manage these icons as Phaser GameObjects.

            const iconScale = 0.3; // Adjust as needed
            const icon = this.add.image(x, y - GAME_CONFIG.HEX_SIZE * 0.3, iconKey).setScale(iconScale);
            
            // Add text for resource value
            const valueText = this.add.text(x, y + GAME_CONFIG.HEX_SIZE * 0.1, resourceValue.toString(), {
                font: '10px Arial',
                fill: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);

            // Group them or add to a specific layer if needed for z-ordering or management
            // For now, they are added directly to the scene.
            // Consider adding to a Phaser Group that can be cleared/updated in renderHexGrid.
            if (!this.resourceIconsGroup) {
                this.resourceIconsGroup = this.add.group();
            }
            this.resourceIconsGroup.add(icon);
            this.resourceIconsGroup.add(valueText);


        } else {
            console.warn(`GameScene: Icon key '${iconKey}' for resource type '${resourceType}' not found or texture does not exist.`);
        }
    }

    /**
     * Draw a hexagon at the specified position
     */
    drawHexagon(graphics, x, y, size, fillColor, lineColor, lineWidth = GAME_CONFIG.HEX_LINE_THICKNESS) { // Added lineWidth parameter
        graphics.lineStyle(lineWidth, lineColor, 1.0);
        graphics.fillStyle(fillColor, 1.0); 
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
        
        const clickedHexData = this.hexGrid.getHex(q, r);
        let clickedTerritory = null;

        if (clickedHexData) { 
            clickedTerritory = this.territoryManager.getTerritoryAt(q, r);

            if (clickedTerritory) {
                // If this territory is already selected, deselect it.
                // Otherwise, select it.
                if (this.gameState.selectedTerritory && this.gameState.selectedTerritory.id === clickedTerritory.id) {
                    this.gameEventBus.emitTerritoryDeselected(clickedTerritory); 
                } else {
                    this.gameEventBus.emitTerritorySelected(clickedTerritory, this.gameState.selectedTerritory);
                }
            } else {
                // Clicked on a valid hex in the grid, but no territory data.
                // Deselect any currently selected territory.
                if (this.gameState.selectedTerritory) {
                    this.gameEventBus.emitTerritoryDeselected(this.gameState.selectedTerritory);
                }
                console.log(`Empty hex selected: Q: ${q}, R: ${r}. No territory data.`);
                // Optionally, emit an event for empty hex click if needed by other systems
                // this.gameEventBus.emit('EMPTY_HEX_CLICKED', { q, r });
            }
        } else { 
            // Click is outside the defined hex grid. Deselect any currently selected territory.
            if (this.gameState.selectedTerritory) {
                this.gameEventBus.emitTerritoryDeselected(this.gameState.selectedTerritory);
            }
            console.log('Clicked outside of defined grid.');
        }
        
        // No direct call to renderHexGrid() here. 
        // The event handlers for TERRITORY_SELECTED/DESELECTED will trigger the re-render.
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
        // This method is DEPRECATED. 
        // Initial territory setup, ownership, and resources are now handled by
        // MapGenerator in conjunction with TerritoryManager during the initializeMap() phase.
        console.warn("DEPRECATED: assignTestTerritoriesToPlayer() called. Map generation handles this.");
        
        /*
        // If you need to MANUALLY override or assign specific territories for DEBUGGING
        // AFTER the initial map generation, you could do something like this:
        
        const debugAssignments = [
            { q: 0, r: 0, owner: OWNERS.PLAYER, resourceType: RESOURCE_TYPES.GOLD, resourceValue: 5, isHomeBase: true },
            { q: 1, r: -1, owner: OWNERS.AI_1, resourceType: RESOURCE_TYPES.WOOD, resourceValue: 3, isHomeBase: true },
        ];

        debugAssignments.forEach(config => {
            let territory = this.territoryManager.getTerritoryAt(config.q, config.r);
            if (territory) {
                territory.owner = config.owner;
                territory.resourceType = config.resourceType;
                territory.resourceValue = config.resourceValue;
                territory.isHomeBase = config.isHomeBase || false;
                
                // Important: Notify systems of this manual change if TerritoryManager doesn't do it automatically
                this.gameEventBus.emit('TERRITORY_CHANGED', { 
                    action: 'manual_override', 
                    territoryId: territory.id, 
                    data: territory 
                });
                console.log(`DEBUG: Manually updated territory ${territory.id} at ${config.q},${config.r}`);
            } else {
                // You might need to create it if it doesn't exist, though this is less ideal for overrides
                // this.territoryManager.createTerritory(config.q, config.r, config.owner, config.resourceType, config.resourceValue, config.isHomeBase);
                console.warn(`DEBUG: Territory at ${config.q},${config.r} not found for manual override.`);
            }
        });
        
        this.renderHexGrid(); // Re-render to show debug changes
        */
    }
    
    /**
     * Format resource cost for display in notifications
     */
    formatCost(cost) {
        return Object.entries(cost)
            .filter(([type, amount]) => amount > 0)
            .map(([type, amount]) => `${amount} ${type}`)
            .join(', ');
    }
}
