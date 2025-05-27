/**
 * Colony Conquest - Main Game Initialization
 * Phaser configuration and game startup
 */

import { GAME_CONFIG, COLORS, ASSETS } from './utils/constants.js';
import { GameScene } from './scenes/GameScene.js';

/**
 * Phaser Game Configuration
 */
const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: GAME_CONFIG.CANVAS_HEIGHT,
    parent: 'phaser-game',
    backgroundColor: GAME_CONFIG.BACKGROUND_COLOR,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 800,
            height: 600
        },
        max: {
            width: 1600,
            height: 1200
        }
    },
    scene: [GameScene],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

/**
 * Global Game Variables
 */
let game;
let hexGrid = [];
let selectedTile = null;
let gameState = null;

/**
 * Initialize the game
 */
function initGame() {
    console.log('🎮 Colony Conquest - Initializing...');
    
    // Create Phaser game instance
    game = new Phaser.Game(config);
    
    // Initialize game state
    gameState = {
        currentTurn: 1,
        currentPlayer: 'player',
        phase: 'action_phase',
        resources: {
            player: { ...GAME_CONFIG.INITIAL_RESOURCES },
            ai: { ...GAME_CONFIG.INITIAL_RESOURCES }
        },
        territories: new Map(),
        selectedTerritory: null
    };
    
    console.log('✅ Game initialized successfully');
}

/**
 * Preload game assets
 */
function preload() {
    console.log('📦 Loading assets...');
    
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
        text: 'Loading...',
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
 * Create game scene
 */
function create() {
    console.log('🏗️ Creating game scene...');
    
    // Store scene reference globally
    window.gameScene = this;
    
    // Create hex grid
    createHexGrid.call(this);
    
    // Set up input handling
    this.input.on('pointerdown', onTileClick, this);
    this.input.on('pointermove', onTileHover, this);
    
    // Update UI
    updateResourceDisplay();
    
    console.log('✅ Game scene created successfully');
    console.log(`🎯 Grid generated with ${hexGrid.length} territories`);
}

/**
 * Create the hexagonal grid
 */
function createHexGrid() {
    console.log('🗺️ Generating hex grid...');
    
    const scene = this;
    const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
    const centerY = GAME_CONFIG.CANVAS_HEIGHT / 2;
    const hexSize = GAME_CONFIG.HEX_SIZE;
    const gridSize = GAME_CONFIG.GRID_SIZE;
    
    // Clear existing grid
    hexGrid = [];
    
    // Generate grid in a hexagonal pattern
    const radius = Math.floor(gridSize / 2);
    
    for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);
        
        for (let r = r1; r <= r2; r++) {
            const s = -q - r;
            
            // Convert hex coordinates to pixel position
            const x = hexSize * (3/2 * q) + centerX;
            const y = hexSize * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r) + centerY;
            
            // Determine resource type randomly
            const resourceTypes = ['gold', 'wood', 'metal', 'food'];
            const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            
            // Create territory object
            const territory = {
                id: `hex_${q}_${r}`,
                q: q,
                r: r,
                s: s,
                x: x,
                y: y,
                owner: null,
                resourceType: resourceType,
                resourceValue: Math.floor(Math.random() * 3) + 1, // 1-3
                influence: 0,
                sprite: null
            };
            
            // Create hex sprite
            const hexSprite = createHexSprite.call(scene, territory);
            territory.sprite = hexSprite;
            
            // Add to grid
            hexGrid.push(territory);
            gameState.territories.set(territory.id, territory);
        }
    }
    
    console.log(`✅ Created ${hexGrid.length} hex territories`);
}

/**
 * Create a hexagon sprite for a territory
 */
function createHexSprite(territory) {
    const scene = this;
    const hexSize = GAME_CONFIG.HEX_SIZE;
    
    // Create hexagon graphics
    const hexagon = scene.add.graphics();
    
    // Set fill color based on resource type
    let fillColor = COLORS.TERRITORIES.NEUTRAL;
    switch (territory.resourceType) {
        case 'gold':
            fillColor = COLORS.TERRITORIES.gold;
            break;
        case 'wood':
            fillColor = COLORS.TERRITORIES.wood;
            break;
        case 'metal':
            fillColor = COLORS.TERRITORIES.metal;
            break;
        case 'food':
            fillColor = COLORS.TERRITORIES.food;
            break;
    }
    
    hexagon.fillStyle(fillColor, 0.8);
    hexagon.lineStyle(2, COLORS.UI.BORDER, 1);
    
    // Draw hexagon shape
    hexagon.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = hexSize * Math.cos(angle);
        const y = hexSize * Math.sin(angle);
        
        if (i === 0) {
            hexagon.moveTo(x, y);
        } else {
            hexagon.lineTo(x, y);
        }
    }
    hexagon.closePath();
    hexagon.fillPath();
    hexagon.strokePath();
    
    // Position the hexagon
    hexagon.x = territory.x;
    hexagon.y = territory.y;
    
    // Store territory reference
    hexagon.territoryData = territory;
    
    // Make interactive
    hexagon.setInteractive(new Phaser.Geom.Circle(0, 0, hexSize), Phaser.Geom.Circle.Contains);
    
    return hexagon;
}

/**
 * Handle tile click events
 */
function onTileClick(pointer, currentlyOver) {
    if (currentlyOver.length > 0) {
        const clickedObject = currentlyOver[0];
        
        if (clickedObject.territoryData) {
            selectTerritory(clickedObject.territoryData);
        }
    }
}

/**
 * Handle tile hover events
 */
function onTileHover(pointer, currentlyOver) {
    // Reset all hex tints
    hexGrid.forEach(territory => {
        if (territory.sprite && territory !== selectedTile) {
            territory.sprite.clearTint();
        }
    });
    
    // Highlight hovered hex
    if (currentlyOver.length > 0) {
        const hoveredObject = currentlyOver[0];
        if (hoveredObject.territoryData && hoveredObject.territoryData !== selectedTile) {
            hoveredObject.setTint(COLORS.UI.HOVER);
        }
    }
}

/**
 * Select a territory
 */
function selectTerritory(territory) {
    console.log(`🎯 Selected territory: ${territory.id} (${territory.resourceType})`);
    
    // Clear previous selection
    if (selectedTile && selectedTile.sprite) {
        selectedTile.sprite.clearTint();
    }
    
    // Set new selection
    selectedTile = territory;
    gameState.selectedTerritory = territory;
    
    // Highlight selected territory
    if (territory.sprite) {
        territory.sprite.setTint(COLORS.UI.SELECTION);
    }
    
    // Update territory info panel
    updateTerritoryInfo(territory);
}

/**
 * Update territory information panel
 */
function updateTerritoryInfo(territory) {
    const infoPanel = document.getElementById('territory-info');
    const detailsDiv = document.getElementById('territory-details');
    
    if (territory) {
        const ownerText = territory.owner || 'Neutral';
        const resourceText = territory.resourceType.charAt(0).toUpperCase() + territory.resourceType.slice(1);
        
        detailsDiv.innerHTML = `
            <p><strong>Territory:</strong> ${territory.id}</p>
            <p><strong>Owner:</strong> ${ownerText}</p>
            <p><strong>Resource:</strong> ${resourceText} (${territory.resourceValue})</p>
            <p><strong>Influence:</strong> ${territory.influence}</p>
        `;
        
        infoPanel.classList.remove('hidden');
    } else {
        infoPanel.classList.add('hidden');
    }
}

/**
 * Update resource display in UI
 */
function updateResourceDisplay() {
    const playerResources = gameState.resources.player;
    
    document.getElementById('gold-count').textContent = playerResources.gold;
    document.getElementById('wood-count').textContent = playerResources.wood;
    document.getElementById('metal-count').textContent = playerResources.metal;
    document.getElementById('food-count').textContent = playerResources.food;
}

/**
 * Game update loop
 */
function update(time, delta) {
    // Game update logic will be added here
    // For now, this is just a placeholder
}

/**
 * Start the game when page loads
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, starting Colony Conquest...');
    initGame();
});

// Global functions for debugging
window.gameDebug = {
    getGameState: () => gameState,
    getHexGrid: () => hexGrid,
    getSelectedTile: () => selectedTile,
    selectTerritoryById: (id) => {
        const territory = gameState.territories.get(id);
        if (territory) selectTerritory(territory);
    }
};
