/**
 * TurnManager module for handling game turn flow and sequencing
 */

const TurnManager = (function() {
    // Private variables
    let _isTransitioning = false;
    
    /**
     * Initialize the turn manager
     */
    function initialize() {
        // Set up event handlers
        const endTurnButton = document.getElementById('end-turn-btn');
        if (endTurnButton) {
            endTurnButton.addEventListener('click', handleEndTurn);
        }
        
        // Subscribe to game state changes
        GameState.subscribe('turnChanged', updateTurnDisplay);
        GameState.subscribe('phaseChanged', handlePhaseChanged);
        
        // Initial update
        updateTurnDisplay({
            currentTurn: GameState.getCurrentTurn(),
            activePlayer: GameState.getActivePlayer()
        });
    }
    
    /**
     * Handle the end turn button click
     */
    function handleEndTurn() {
        if (_isTransitioning) return;
        
        _isTransitioning = true;
        
        // Disable end turn button during transition
        const endTurnButton = document.getElementById('end-turn-btn');
        if (endTurnButton) {
            endTurnButton.disabled = true;
        }
        
        // Execute any pending actions
        executeTurnEndActions().then(() => {
            // End the current turn
            GameState.endTurn();
            
            // If it's AI's turn, handle AI turn automatically
            if (GameState.getActivePlayer() === CONSTANTS.PLAYERS.AI) {
                setTimeout(handleAITurn, 1000); // Delay AI turn for better UX
            } else {
                // Re-enable button for player's turn
                if (endTurnButton) {
                    endTurnButton.disabled = false;
                }
                _isTransitioning = false;
            }
        });
    }
    
    /**
     * Execute any actions that should happen at the end of a turn
     * 
     * @returns {Promise} - Promise that resolves when all actions are complete
     */
    function executeTurnEndActions() {
        // This could include animations, delayed effects, etc.
        return new Promise(resolve => {
            setTimeout(resolve, 500);
        });
    }
    
    /**
     * Handle AI turn automatically
     */
    function handleAITurn() {
        // In a real implementation, this would be more complex AI decision-making
        console.log('AI is taking its turn...');
        
        // Simple example: Small delay then end turn
        setTimeout(() => {
            GameState.endTurn();
            _isTransitioning = false;
            
            // Re-enable end turn button
            const endTurnButton = document.getElementById('end-turn-btn');
            if (endTurnButton) {
                endTurnButton.disabled = false;
            }
        }, 1500);
    }
    
    /**
     * Update turn display in the UI
     * 
     * @param {object} data - Turn data
     */
    function updateTurnDisplay(data) {
        const turnNumber = document.getElementById('turn-number');
        const activePlayer = document.getElementById('active-player');
        
        if (turnNumber) {
            turnNumber.textContent = data.currentTurn;
        }
        
        if (activePlayer) {
            activePlayer.textContent = data.activePlayer === CONSTANTS.PLAYERS.PLAYER 
                ? 'Player' 
                : 'AI';
        }
    }
    
    /**
     * Handle phase changes
     * 
     * @param {object} data - Phase data
     */
    function handlePhaseChanged(data) {
        // Update UI based on current phase
        const endTurnButton = document.getElementById('end-turn-btn');
        
        if (endTurnButton) {
            // Only enable button during player's turn
            endTurnButton.disabled = data.phase !== CONSTANTS.PHASES.PLAYER_TURN;
        }
    }
    
    // Public API
    return {
        initialize,
        handleEndTurn
    };
})();
