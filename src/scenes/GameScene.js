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

        allHexes.forEach(hexData => { // Assuming hexData contains the coordinate as hexData.coord
            const hexCoord = hexData.coord; 
            const pixelPos = hexToPixel(hexCoord, hexSize); // hexToPixel should handle origin if needed, or apply here
            const worldX = origin.x + pixelPos.x;
            const worldY = origin.y + pixelPos.y;

            // Generate a random color for each hex
            const randomFillColor = Phaser.Display.Color.RandomRGB(100, 200).color; // Generates a color with R,G,B components between 100 and 200

            // Use random color for fill, and a defined border color from constants
            this.drawHexagon(this.hexGraphics, worldX, worldY, hexSize, randomFillColor, COLORS.HEX_BORDER);
        });
        console.log(`🎨 Rendered ${allHexes.length} hexes with varied colors.`);
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

        // Convert pointer coordinates to world space relative to grid origin
        const clickX = pointer.x - origin.x;
        const clickY = pointer.y - origin.y;

        // Convert pixel coordinates to hex coordinates (axial)
        // This requires a pixelToHex function, assuming it exists in math-utils.js
        // and that it correctly handles the pointy-top orientation and hex size.
        const { q, r } = pixelToHex({ x: clickX, y: clickY }, hexSize);

        // Find the clicked hex in our grid data
        const clickedHex = this.hexGrid.getHex(q, r);

        if (clickedHex) {
            console.log(`Clicked on hex: Q=${q}, R=${r}`);
            // TODO: Implement territory selection logic
            // - Check if a territory is already selected
            // - If so, and clicked hex is a valid target, perform action
            // - If not, select this territory
            // - Update visual feedback (highlighting)

            // For now, just re-render with a different color to show selection
            const pixelPos = hexToPixel(clickedHex.coord, hexSize);
            const worldX = origin.x + pixelPos.x;
            const worldY = origin.y + pixelPos.y;
            
            // Clear previous single hex highlight (if any)
            // A more robust system would track the selected hex and its original color
            this.hexGraphics.clear(); // Simple clear for now, will redraw all
            this.renderHexGrid(); // Redraw all hexes

            // Highlight the clicked hex
            this.drawHexagon(this.hexGraphics, worldX, worldY, hexSize, COLORS.HEX_HIGHLIGHT, COLORS.HEX_BORDER_SELECTED);
            console.log(`Highlighted hex: ${q},${r}`);
        } else {
            console.log('Clicked outside of any hex.');
        }
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
