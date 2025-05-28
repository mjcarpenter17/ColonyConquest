/**
 * Colony Conquest - Main Game Scene
 * Handles hex grid rendering, territory selection, and user interactions
 */

import { HexGrid } from '../map/hex-grid.js';
import { GAME_CONFIG, COLORS } from '../utils/constants.js'; // Added COLORS to the import
import { hexToPixel, pixelToHex } from '../utils/math-utils.js';

/**
 * GameScene class - Main gameplay scene for Phaser
 */
export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.hexGrid = null;
        this.hexGraphics = null;
        this.selectedHex = null; // To store the currently selected hex object/data
    }

    /**
     * Initialize the scene
     */
    init(data) {
        console.log('🎮 GameScene initializing...');
        this.sceneData = data || {};
    }

    /**
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
        
        // Create the hex grid
        this.hexGrid = new HexGrid(GAME_CONFIG.GRID_SIZE); // Pass grid size if HexGrid constructor uses it
        this.hexGraphics = this.add.graphics();
        this.renderHexGrid();

        // Setup input handling
        this.input.on('pointerdown', this.handleTileClick, this);
        
        console.log('✅ GameScene created successfully');
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
    }

    /**
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
            console.log(`Selected hex: Q=${clickedHexData.coord.q}, R=${clickedHexData.coord.r}`);
        } else {
            this.selectedHex = null;
            console.log('Clicked outside of any hex, selection cleared.');
        }
        this.renderHexGrid(); // Redraw the grid to reflect selection changes
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
