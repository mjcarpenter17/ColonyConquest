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

/**
 * Initialize the game
 */
function initGame() {
    console.log('🎮 Colony Conquest - Initializing...');
    
    // Create Phaser game instance
    game = new Phaser.Game(config);
    
    console.log('✅ Game initialized successfully');
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
    getGame: () => game,
    getGameScene: () => game?.scene?.getScene('GameScene'),
    restartGame: () => {
        if (game) {
            game.destroy(true);
            initGame();
        }
    }
};
