/**
 * Main entry point for Colony Conquest game
 */

// Make GameState globally available for debugging
window.GameState = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Colony Conquest initializing...');
    
    // Initialize debug console if in debug mode
    if (CONSTANTS && CONSTANTS.DEBUG_MODE) {
        DebugConsole.initialize(true);
        console.log('Debug mode enabled');
    }
    
    try {
        console.log('Checking modules:');
        console.log('CONSTANTS:', typeof CONSTANTS);
        console.log('MathUtils:', typeof MathUtils);
        console.log('HexGrid:', typeof HexGrid);
        console.log('MapGenerator:', typeof MapGenerator);
        console.log('GameState:', typeof GameState);
        console.log('Renderer:', typeof Renderer);
        console.log('InputHandler:', typeof InputHandler);
        console.log('ResourceManager:', typeof ResourceManager);
        console.log('TurnManager:', typeof TurnManager);
        console.log('UIComponents:', typeof UIComponents);
        
        // Add links for testing
        if (CONSTANTS.DEBUG_MODE) {
            const debugLinks = document.createElement('div');
            debugLinks.style.cssText = 'position: fixed; top: 0; right: 0; background: rgba(0,0,0,0.7); padding: 10px;';
            debugLinks.innerHTML = `
                <a href="hex-test.html" style="color: white; margin-right: 10px;" target="_blank">Hex Test Page</a>
            `;
            document.body.appendChild(debugLinks);
        }
        
        // Make GameState available globally for debugging
        window.GameState = GameState;
        
        // Initialize the hex grid
        console.log('Initializing hex grid...');
        HexGrid.initialize(
            CONSTANTS.MAP_WIDTH, 
            CONSTANTS.MAP_HEIGHT, 
            CONSTANTS.HEX_RADIUS
        );
          // Generate the game map
        console.log('Generating game map...');
        const territories = MapGenerator.createGameMap(
            CONSTANTS.MAP_WIDTH, 
            CONSTANTS.MAP_HEIGHT
        );
        
        // Add territories to hex grid
        console.log('Adding territories to hex grid...');
        if (territories) {
            console.log(`Generated ${territories.size} territories`);
            territories.forEach((territory, id) => {
                HexGrid.addHex(id, territory);
            });
        } else {
            console.error('No territories were generated!');
        }
        
        // Initialize game state with territories
        console.log('Initializing game state...');
        GameState.initialize(territories);
        
        // Initialize UI systems
        console.log('Initializing UI systems...');
        Renderer.initialize('game-canvas', CONSTANTS.HEX_RADIUS);
        InputHandler.initialize('game-canvas');
        ResourceManager.initialize();
        TurnManager.initialize();
        UIComponents.initialize();
      console.log('Colony Conquest initialized!');
    
    // Display welcome message
    UIComponents.showMessage('Welcome to Colony Conquest! Click on territories to select them.', 'info', 5000);
    } catch (err) {
        console.error('Error during initialization:', err);
        alert('Failed to initialize game: ' + err.message);
    }
});

/**
 * Error handling
 */
window.addEventListener('error', function(e) {
    console.error('Game error:', e.message);
    // Display error message to user
    alert('An error occurred: ' + e.message);
    UIComponents.showMessage('An error occurred: ' + e.message, 'error', 10000);
});
