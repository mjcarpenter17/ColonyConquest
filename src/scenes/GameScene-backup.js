/**
 * Colony Conquest - Main Game Scene
 * Handles hex grid rendering, territory selection, and user interactions
 */

import { HexGrid } from '../map/hex-grid.js';
import { MapGenerator } from '../map/map-generator.js';
import { GameState } from '../core/game-state.js';
import { TurnManager } from '../core/turn-manager.js';
import { ResourceManager } from '../core/resource-manager.js';
import { GAME_CONFIG, COLORS, OWNERS, GAME_STATES } from '../utils/constants.js';
import { pixelToHex, hexToPixel } from '../utils/math-utils.js';

/**
 * GameScene class - Main gameplay scene for Phaser
 */
export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // Core systems
        this.gameState = null;
        this.turnManager = null;
        this.resourceManager = null;
        this.hexGrid = null;
        this.mapGenerator = null;
        
        // Rendering and interaction
        this.hexGraphics = null;
        this.territoryGraphics = null;
        this.highlightGraphics = null;
        this.uiGraphics = null;
        
        // Input state
        this.selectedHex = null;
        this.hoveredHex = null;
        this.isPointerDown = false;
        
        // Camera and viewport
        this.cameraControls = {
            isDragging: false,
            lastPointer: { x: 0, y: 0 },
            zoomLevel: 1
        };
    }

    /**
     * Initialize the scene
     */
    init(data) {
        console.log('🎮 GameScene initializing...');
        this.sceneData = data || {};
    }    /**
     * Preload assets needed for the game scene
     */
    preload() {
        console.log('📦 GameScene preloading assets...');
        
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
        
        // Load tile assets
        this.load.image('tile-default', ASSETS.IMAGES.TILE_DEFAULT);
        this.load.image('tile-gold', ASSETS.IMAGES.TILE_GOLD);
        this.load.image('tile-stone', ASSETS.IMAGES.TILE_STONE);
        this.load.image('tile-trees', ASSETS.IMAGES.TILE_TREES);
        
        // Load UI assets
        this.load.image('rss-gold', ASSETS.IMAGES.RSS_GOLD);
        this.load.image('rss-wood', ASSETS.IMAGES.RSS_WOOD);
        this.load.image('rss-metal', ASSETS.IMAGES.RSS_METAL);
        this.load.image('rss-food', ASSETS.IMAGES.RSS_FOOD);
        
        // Load button assets
        this.load.image('end-turn', ASSETS.IMAGES.END_TURN);
        this.load.image('end-turn-pressed', ASSETS.IMAGES.END_TURN_PRESSED);
        this.load.image('blue-btn', ASSETS.IMAGES.BLUE_BTN);
        this.load.image('green-btn', ASSETS.IMAGES.GREEN_BTN);
        this.load.image('red-btn', ASSETS.IMAGES.RED_BTN);
        
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
            console.log('✅ Assets loaded successfully');
        });
    }

    /**
     * Create the game scene
     */
    create() {
        console.log('🏗️ GameScene creating...');
        
        // Initialize core systems
        this.initializeCoreSystem();
        
        // Initialize graphics layers
        this.initializeGraphics();
        
        // Generate the game map
        this.generateGameMap();
        
        // Set up input handling
        this.setupInputHandling();
        
        // Set up camera controls
        this.setupCameraControls();
        
        // Start the game
        this.startGame();
        
        console.log('✅ GameScene created successfully');
    }

    /**
     * Initialize core game systems
     */    initializeCoreSystem() {
        // Initialize core systems
        this.gameState = new GameState();
        this.turnManager = new TurnManager(this.gameState);
        this.resourceManager = new ResourceManager(this.gameState);
        this.hexGrid = new HexGrid();
        this.mapGenerator = new MapGenerator();
        
        // Set up event listeners
        this.gameState.on('gameStateChanged', this.onGameStateChanged.bind(this));
        this.gameState.on('territoryChanged', this.onTerritoryChanged.bind(this));
        this.turnManager.on('turnChanged', this.onTurnChanged.bind(this));
        this.turnManager.on('phaseChanged', this.onPhaseChanged.bind(this));
    }

    /**
     * Initialize graphics layers
     */
    initializeGraphics() {
        // Create graphics objects for different layers
        this.hexGraphics = this.add.graphics();
        this.territoryGraphics = this.add.graphics();
        this.highlightGraphics = this.add.graphics();
        this.uiGraphics = this.add.graphics();
        
        // Set up layer order (bottom to top)
        this.hexGraphics.setDepth(1);
        this.territoryGraphics.setDepth(2);
        this.highlightGraphics.setDepth(3);
        this.uiGraphics.setDepth(4);
    }

    /**
     * Generate the game map
     */    generateGameMap() {
        console.log('🗺️ Generating game map...');
        
        // Generate map data
        const mapData = this.mapGenerator.generateMap();
        
        // Add territories to game state
        Array.from(mapData.territories.values()).forEach(territory => {
            this.gameState.addTerritory(territory);
        });
        
        // Render the hex grid
        this.renderHexGrid();
        
        console.log(`✅ Generated map with ${mapData.totalTerritories} territories`);
    }    /**
     * Render the hexagonal grid
     */
    renderHexGrid() {
        this.hexGraphics.clear();
        this.territoryGraphics.clear();
        
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Get all hexes
        const hexes = this.hexGrid.getAllHexes();
          hexes.forEach(hexData => {
            const hex = hexData.coord;
            const pixel = hexToPixel(hex, GAME_CONFIG.HEX_SIZE);
            const worldX = centerX + pixel.x;
            const worldY = centerY + pixel.y;
            
            // Get territory data if it exists
            const territoryId = `${hex.q},${hex.r}`;
            const territory = this.gameState.getTerritory(territoryId);
            
            // Draw hex outline
            this.drawHexagon(this.hexGraphics, worldX, worldY, GAME_CONFIG.HEX_SIZE, {
                lineColor: COLORS.HEX_BORDER,
                lineWidth: 2,
                fillColor: COLORS.HEX_BACKGROUND,
                alpha: 0.8
            });
            
            // Draw territory if it exists
            if (territory) {
                this.drawTerritory(territory, worldX, worldY);
            }
        });
    }

    /**
     * Draw a hexagon at the specified position
     */
    drawHexagon(graphics, x, y, size, style = {}) {
        const {
            lineColor = COLORS.HEX_BORDER,
            lineWidth = 2,
            fillColor = COLORS.HEX_BACKGROUND,
            alpha = 1.0
        } = style;
        
        graphics.lineStyle(lineWidth, lineColor, alpha);
        graphics.fillStyle(fillColor, alpha * 0.3);
        
        // Calculate hex vertices
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const vertexX = x + size * Math.cos(angle);
            const vertexY = y + size * Math.sin(angle);
            points.push(vertexX, vertexY);
        }
        
        // Draw the hexagon
        graphics.beginPath();
        graphics.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) {
            graphics.lineTo(points[i], points[i + 1]);
        }
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
    }

    /**
     * Draw territory visualization
     */
    drawTerritory(territory, x, y) {
        const ownerColor = this.getOwnerColor(territory.owner);
        const resourceColor = this.getResourceColor(territory.resourceType);
        
        // Draw ownership indicator
        if (territory.owner !== OWNERS.NEUTRAL) {
            this.territoryGraphics.fillStyle(ownerColor, 0.4);
            this.drawHexagon(this.territoryGraphics, x, y, GAME_CONFIG.HEX_SIZE * 0.8, {
                fillColor: ownerColor,
                lineColor: ownerColor,
                lineWidth: 3,
                alpha: 0.6
            });
        }
        
        // Draw resource indicator
        if (territory.resourceType && territory.resourceType !== 'none') {
            this.territoryGraphics.fillStyle(resourceColor, 0.8);
            this.territoryGraphics.fillCircle(x, y, GAME_CONFIG.HEX_SIZE * 0.3);
            
            // Add resource value text
            this.add.text(x, y, territory.resourceValue.toString(), {
                fontSize: '16px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(5);
        }
    }

    /**
     * Get color for owner
     */
    getOwnerColor(owner) {
        switch (owner) {
            case OWNERS.PLAYER: return COLORS.PLAYER;
            case OWNERS.AI: return COLORS.AI;
            default: return COLORS.NEUTRAL;
        }
    }

    /**
     * Get color for resource type
     */
    getResourceColor(resourceType) {
        switch (resourceType) {
            case 'iron': return 0x8B4513;
            case 'gold': return 0xFFD700;
            case 'food': return 0x90EE90;
            case 'wood': return 0x654321;
            default: return 0x808080;
        }
    }

    /**
     * Set up input handling
     */
    setupInputHandling() {
        // Enable pointer events
        this.input.on('pointerdown', this.onPointerDown.bind(this));
        this.input.on('pointerup', this.onPointerUp.bind(this));
        this.input.on('pointermove', this.onPointerMove.bind(this));
        
        // Enable keyboard input
        this.input.keyboard.on('keydown', this.onKeyDown.bind(this));
        
        console.log('🖱️ Input handling set up');
    }

    /**
     * Set up camera controls
     */
    setupCameraControls() {
        // Enable camera pan and zoom
        this.cameras.main.setBounds(-2000, -2000, 4000, 4000);
        
        // Mouse wheel zoom
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Phaser.Math.Clamp(
                this.cameras.main.zoom * zoomFactor,
                0.5, 3.0
            );
            this.cameras.main.setZoom(newZoom);
        });
        
        console.log('📷 Camera controls set up');
    }

    /**
     * Handle pointer down events
     */
    onPointerDown(pointer) {
        this.isPointerDown = true;
        this.cameraControls.lastPointer = { x: pointer.x, y: pointer.y };
        
        // Check if clicking on a hex
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const hex = this.getHexAtPosition(worldPoint.x, worldPoint.y);
        
        if (hex) {
            this.selectHex(hex);
        }
    }

    /**
     * Handle pointer up events
     */
    onPointerUp(pointer) {
        this.isPointerDown = false;
        this.cameraControls.isDragging = false;
    }

    /**
     * Handle pointer move events
     */
    onPointerMove(pointer) {
        if (this.isPointerDown) {
            // Camera panning
            if (!this.cameraControls.isDragging) {
                this.cameraControls.isDragging = true;
            }
            
            const deltaX = pointer.x - this.cameraControls.lastPointer.x;
            const deltaY = pointer.y - this.cameraControls.lastPointer.y;
            
            this.cameras.main.scrollX -= deltaX / this.cameras.main.zoom;
            this.cameras.main.scrollY -= deltaY / this.cameras.main.zoom;
            
            this.cameraControls.lastPointer = { x: pointer.x, y: pointer.y };
        } else {
            // Hex hovering
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const hex = this.getHexAtPosition(worldPoint.x, worldPoint.y);
            
            if (hex !== this.hoveredHex) {
                this.setHoveredHex(hex);
            }
        }
    }

    /**
     * Handle keyboard input
     */
    onKeyDown(event) {
        switch (event.code) {
            case 'Space':
                this.turnManager.endTurn();
                break;
            case 'Escape':
                this.selectedHex = null;
                this.updateHighlights();
                break;
        }
    }

    /**
     * Get hex at world position
     */
    getHexAtPosition(worldX, worldY) {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
          const localX = worldX - centerX;
        const localY = worldY - centerY;
        
        const hex = pixelToHex({ x: localX, y: localY }, GAME_CONFIG.HEX_SIZE);
        
        // Check if this hex exists in our grid
        if (this.hexGrid.isValidHex(hex.q, hex.r)) {
            return hex;
        }
        
        return null;
    }

    /**
     * Select a hex
     */
    selectHex(hex) {
        this.selectedHex = hex;
        this.updateHighlights();
        
        const territoryId = `${hex.q},${hex.r}`;
        const territory = this.gameState.getTerritory(territoryId);
        
        console.log(`🎯 Selected hex (${hex.q}, ${hex.r})`, territory);
        
        // Emit selection event
        this.gameState.emit('hexSelected', { hex, territory });
    }

    /**
     * Set hovered hex
     */
    setHoveredHex(hex) {
        this.hoveredHex = hex;
        this.updateHighlights();
    }

    /**
     * Update highlight graphics
     */
    updateHighlights() {
        this.highlightGraphics.clear();
        
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Highlight selected hex        if (this.selectedHex) {
            const pixel = hexToPixel(this.selectedHex, GAME_CONFIG.HEX_SIZE);
            const worldX = centerX + pixel.x;
            const worldY = centerY + pixel.y;
            
            this.drawHexagon(this.highlightGraphics, worldX, worldY, GAME_CONFIG.HEX_SIZE, {
                lineColor: COLORS.SELECTED,
                lineWidth: 4,
                fillColor: COLORS.SELECTED,
                alpha: 0.7
            });
        }
          // Highlight hovered hex
        if (this.hoveredHex && this.hoveredHex !== this.selectedHex) {
            const pixel = hexToPixel(this.hoveredHex, GAME_CONFIG.HEX_SIZE);
            const worldX = centerX + pixel.x;
            const worldY = centerY + pixel.y;
            
            this.drawHexagon(this.highlightGraphics, worldX, worldY, GAME_CONFIG.HEX_SIZE, {
                lineColor: COLORS.HOVER,
                lineWidth: 3,
                fillColor: COLORS.HOVER,
                alpha: 0.5
            });
        }
    }

    /**
     * Start the game
     */
    startGame() {
        this.gameState.setGameStatus(GAME_STATES.PLAYING);
        this.turnManager.startGame();
        
        console.log('🎮 Game started!');
    }

    /**
     * Event handlers
     */
    onGameStateChanged(state) {
        console.log('🔄 Game state changed:', state);
        // Update UI based on state changes
    }

    onTerritoryChanged(territory) {
        console.log('🏗️ Territory changed:', territory);
        // Re-render the affected territory
        this.renderHexGrid();
    }

    onTurnChanged(turnData) {
        console.log('🔄 Turn changed:', turnData);
        // Update turn indicators
    }

    onPhaseChanged(phaseData) {
        console.log('⏱️ Phase changed:', phaseData);
        // Update phase indicators
    }

    /**
     * Update loop
     */
    update(time, delta) {
        // Update any continuous animations or effects
    }

    /**
     * Clean up when scene is destroyed
     */
    destroy() {
        console.log('🧹 GameScene cleaning up...');
        
        // Remove event listeners
        if (this.gameState) {
            this.gameState.removeAllListeners();
        }
        if (this.turnManager) {
            this.turnManager.removeAllListeners();
        }
        
        super.destroy();
    }
}
