/**
 * Main entry point for Colony Conquest game
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Colony Conquest initializing...');
    
    // Initialize the hex grid
    HexGrid.initialize(
        CONSTANTS.MAP_WIDTH, 
        CONSTANTS.MAP_HEIGHT, 
        CONSTANTS.HEX_RADIUS
    );
    
    // Generate the game map
    const territories = MapGenerator.createGameMap(
        CONSTANTS.MAP_WIDTH, 
        CONSTANTS.MAP_HEIGHT
    );
    
    // Initialize game state with territories
    GameState.initialize(territories);
    
    // Initialize UI systems
    Renderer.initialize('game-canvas', CONSTANTS.HEX_RADIUS);
    InputHandler.initialize('game-canvas');
    ResourceManager.initialize();
    TurnManager.initialize();
    UIComponents.initialize();
    
    console.log('Colony Conquest initialized!');
    
    // Display welcome message
    UIComponents.showMessage('Welcome to Colony Conquest! Click on territories to select them.', 'info', 5000);
});

/**
 * Error handling
 */
window.addEventListener('error', function(e) {
    console.error('Game error:', e.message);
    // Display error message to user
    UIComponents.showMessage('An error occurred: ' + e.message, 'error', 10000);
});
