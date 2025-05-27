/**
 * GameState module for central game state management
 */

const GameState = (function() {
    // Private game state
    const _state = {
        currentTurn: 1,
        phase: CONSTANTS.PHASES.PLAYER_TURN,
        activePlayer: CONSTANTS.PLAYERS.PLAYER,
        territories: new Map(),
        players: {
            [CONSTANTS.PLAYERS.PLAYER]: {
                resources: {
                    [CONSTANTS.RESOURCE_TYPES.GOLD]: 10,
                    [CONSTANTS.RESOURCE_TYPES.TIMBER]: 10,
                    [CONSTANTS.RESOURCE_TYPES.IRON]: 10,
                    [CONSTANTS.RESOURCE_TYPES.FOOD]: 10
                },
                units: [],
                momentum: 0,
                influencePoints: 0,
                personality: null
            },
            [CONSTANTS.PLAYERS.AI]: {
                resources: {
                    [CONSTANTS.RESOURCE_TYPES.GOLD]: 10,
                    [CONSTANTS.RESOURCE_TYPES.TIMBER]: 10,
                    [CONSTANTS.RESOURCE_TYPES.IRON]: 10,
                    [CONSTANTS.RESOURCE_TYPES.FOOD]: 10
                },
                units: [],
                momentum: 0,
                influencePoints: 0,
                personality: "industrialist" // Default AI personality
            },
            [CONSTANTS.PLAYERS.NEUTRAL]: {
                resources: {
                    [CONSTANTS.RESOURCE_TYPES.GOLD]: 0,
                    [CONSTANTS.RESOURCE_TYPES.TIMBER]: 0,
                    [CONSTANTS.RESOURCE_TYPES.IRON]: 0,
                    [CONSTANTS.RESOURCE_TYPES.FOOD]: 0
                },
                units: [],
                momentum: 0,
                influencePoints: 0,
                personality: null
            }
        },
        actionQueue: [],
        randomEventTimer: 3, // Turns until next random event
        victoryProgress: {
            territorial: 0,
            economic: false,
            influence: 0
        },
        selectedTerritory: null
    };
    
    // Event system for state changes
    const _events = {
        stateChanged: [],
        territorySelected: [],
        resourcesChanged: [],
        turnChanged: [],
        phaseChanged: []
    };
    
    /**
     * Subscribe to an event
     * 
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     * @returns {function} - Unsubscribe function
     */
    function subscribe(event, callback) {
        if (!_events[event]) {
            _events[event] = [];
        }
        
        _events[event].push(callback);
        
        // Return unsubscribe function
        return function() {
            _events[event] = _events[event].filter(cb => cb !== callback);
        };
    }
    
    /**
     * Emit an event to all subscribers
     * 
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    function emit(event, data) {
        if (_events[event]) {
            _events[event].forEach(callback => callback(data));
        }
    }
    
    /**
     * Initialize game state with generated territories
     * 
     * @param {Map} territories - Map of territories
     */
    function initialize(territories) {
        _state.territories = territories;
        _state.currentTurn = 1;
        _state.phase = CONSTANTS.PHASES.PLAYER_TURN;
        _state.activePlayer = CONSTANTS.PLAYERS.PLAYER;
        _state.selectedTerritory = null;
        
        // Reset player resources
        Object.values(CONSTANTS.PLAYERS).forEach(player => {
            if (_state.players[player]) {
                _state.players[player].resources = {
                    [CONSTANTS.RESOURCE_TYPES.GOLD]: 10,
                    [CONSTANTS.RESOURCE_TYPES.TIMBER]: 10,
                    [CONSTANTS.RESOURCE_TYPES.IRON]: 10,
                    [CONSTANTS.RESOURCE_TYPES.FOOD]: 10
                };
                _state.players[player].units = [];
                _state.players[player].momentum = 0;
                _state.players[player].influencePoints = 0;
            }
        });
        
        // Notify subscribers
        emit('stateChanged', _state);
    }
    
    /**
     * End the current player's turn
     */
    function endTurn() {
        // Toggle active player
        _state.activePlayer = _state.activePlayer === CONSTANTS.PLAYERS.PLAYER 
            ? CONSTANTS.PLAYERS.AI 
            : CONSTANTS.PLAYERS.PLAYER;
        
        // If we've gone through all players, advance to the next turn
        if (_state.activePlayer === CONSTANTS.PLAYERS.PLAYER) {
            _state.currentTurn++;
            
            // Decrement random event timer
            _state.randomEventTimer--;
            
            // Check for random event
            if (_state.randomEventTimer <= 0) {
                // TODO: Trigger random event
                
                // Reset timer to random value between 3-7 turns
                _state.randomEventTimer = Math.floor(Math.random() * 5) + 3;
            }
            
            // Update territory production
            updateResourceProduction();
            
            // Check victory conditions
            checkVictoryConditions();
        }
        
        // Update phase
        _state.phase = _state.activePlayer === CONSTANTS.PLAYERS.PLAYER 
            ? CONSTANTS.PHASES.PLAYER_TURN 
            : CONSTANTS.PHASES.AI_TURN;
        
        // Notify subscribers
        emit('turnChanged', {
            currentTurn: _state.currentTurn,
            activePlayer: _state.activePlayer
        });
        
        emit('phaseChanged', {
            phase: _state.phase
        });
    }
    
    /**
     * Select a territory
     * 
     * @param {string} territoryId - Territory ID
     * @returns {boolean} - Whether selection was successful
     */
    function selectTerritory(territoryId) {
        // Clear previous selection
        if (_state.selectedTerritory) {
            const prevTerritory = _state.territories.get(_state.selectedTerritory);
            if (prevTerritory) {
                prevTerritory.setSelected(false);
            }
        }
        
        // Set new selection
        const territory = _state.territories.get(territoryId);
        if (territory) {
            _state.selectedTerritory = territoryId;
            territory.setSelected(true);
            emit('territorySelected', territory);
            return true;
        }
        
        _state.selectedTerritory = null;
        emit('territorySelected', null);
        return false;
    }
    
    /**
     * Clear territory selection
     */
    function clearSelection() {
        if (_state.selectedTerritory) {
            const territory = _state.territories.get(_state.selectedTerritory);
            if (territory) {
                territory.setSelected(false);
            }
            _state.selectedTerritory = null;
            emit('territorySelected', null);
        }
    }
    
    /**
     * Update resource production from territories
     */
    function updateResourceProduction() {
        // Only produce resources at the beginning of player turn
        // To avoid double production
        if (_state.activePlayer !== CONSTANTS.PLAYERS.PLAYER) {
            return;
        }
        
        // Initialize production tracking
        const production = {
            [CONSTANTS.PLAYERS.PLAYER]: {
                [CONSTANTS.RESOURCE_TYPES.GOLD]: 0,
                [CONSTANTS.RESOURCE_TYPES.TIMBER]: 0,
                [CONSTANTS.RESOURCE_TYPES.IRON]: 0,
                [CONSTANTS.RESOURCE_TYPES.FOOD]: 0
            },
            [CONSTANTS.PLAYERS.AI]: {
                [CONSTANTS.RESOURCE_TYPES.GOLD]: 0,
                [CONSTANTS.RESOURCE_TYPES.TIMBER]: 0,
                [CONSTANTS.RESOURCE_TYPES.IRON]: 0,
                [CONSTANTS.RESOURCE_TYPES.FOOD]: 0
            }
        };
        
        // Calculate production from each territory
        _state.territories.forEach(territory => {
            if (territory.owner !== CONSTANTS.PLAYERS.NEUTRAL) {
                const territoryProduction = territory.getProduction();
                
                // Add production to the appropriate player
                Object.keys(territoryProduction).forEach(resourceType => {
                    production[territory.owner][resourceType] += territoryProduction[resourceType];
                });
            }
        });
        
        // Add production to player resources
        Object.keys(production).forEach(player => {
            Object.keys(production[player]).forEach(resourceType => {
                _state.players[player].resources[resourceType] += production[player][resourceType];
            });
        });
        
        // Notify subscribers
        emit('resourcesChanged', {
            playerResources: _state.players[CONSTANTS.PLAYERS.PLAYER].resources,
            aiResources: _state.players[CONSTANTS.PLAYERS.AI].resources,
            production: production
        });
    }
    
    /**
     * Check if any victory conditions are met
     * 
     * @returns {object|null} - Victory data if condition met, null otherwise
     */
    function checkVictoryConditions() {
        // Calculate territorial control
        let playerTerritories = 0;
        let aiTerritories = 0;
        let totalTerritories = 0;
        
        _state.territories.forEach(territory => {
            totalTerritories++;
            if (territory.owner === CONSTANTS.PLAYERS.PLAYER) {
                playerTerritories++;
            } else if (territory.owner === CONSTANTS.PLAYERS.AI) {
                aiTerritories++;
            }
        });
        
        const playerTerritorialPercent = playerTerritories / totalTerritories;
        const aiTerritorialPercent = aiTerritories / totalTerritories;
        
        _state.victoryProgress.territorial = playerTerritorialPercent;
        
        // Check for territorial victory
        if (playerTerritorialPercent >= CONSTANTS.VICTORY.TERRITORIAL_THRESHOLD) {
            return {
                victor: CONSTANTS.PLAYERS.PLAYER,
                type: "territorial"
            };
        }
        
        if (aiTerritorialPercent >= CONSTANTS.VICTORY.TERRITORIAL_THRESHOLD) {
            return {
                victor: CONSTANTS.PLAYERS.AI,
                type: "territorial"
            };
        }
        
        // Check for economic victory
        const playerResources = _state.players[CONSTANTS.PLAYERS.PLAYER].resources;
        const aiResources = _state.players[CONSTANTS.PLAYERS.AI].resources;
        
        const playerEconomicVictory = Object.values(playerResources).every(
            value => value >= CONSTANTS.VICTORY.ECONOMIC_THRESHOLD
        );
        
        const aiEconomicVictory = Object.values(aiResources).every(
            value => value >= CONSTANTS.VICTORY.ECONOMIC_THRESHOLD
        );
        
        _state.victoryProgress.economic = playerEconomicVictory;
        
        if (playerEconomicVictory) {
            return {
                victor: CONSTANTS.PLAYERS.PLAYER,
                type: "economic"
            };
        }
        
        if (aiEconomicVictory) {
            return {
                victor: CONSTANTS.PLAYERS.AI,
                type: "economic"
            };
        }
        
        // Check for influence victory (strategic points)
        let playerStrategicPoints = 0;
        let aiStrategicPoints = 0;
        let totalStrategicPoints = 0;
        
        _state.territories.forEach(territory => {
            if (territory.territoryType === CONSTANTS.TERRITORY_TYPES.STRATEGIC_POINT) {
                totalStrategicPoints++;
                if (territory.owner === CONSTANTS.PLAYERS.PLAYER) {
                    playerStrategicPoints++;
                } else if (territory.owner === CONSTANTS.PLAYERS.AI) {
                    aiStrategicPoints++;
                }
            }
        });
        
        // If player controls all strategic points, increment counter
        if (playerStrategicPoints === totalStrategicPoints && totalStrategicPoints > 0) {
            _state.victoryProgress.influence++;
            
            // Check if player has controlled strategic points for enough turns
            if (_state.victoryProgress.influence >= CONSTANTS.VICTORY.INFLUENCE_TURNS) {
                return {
                    victor: CONSTANTS.PLAYERS.PLAYER,
                    type: "influence"
                };
            }
        } else {
            // Reset counter if player loses control
            _state.victoryProgress.influence = 0;
        }
        
        // If AI controls all strategic points, they win
        if (aiStrategicPoints === totalStrategicPoints && totalStrategicPoints > 0) {
            return {
                victor: CONSTANTS.PLAYERS.AI,
                type: "influence"
            };
        }
        
        // No victory condition met
        return null;
    }
    
    /**
     * Get the current game state
     * 
     * @returns {object} - Copy of game state
     */
    function getState() {
        return { ..._state };
    }
    
    /**
     * Get the current turn number
     * 
     * @returns {number} - Turn number
     */
    function getCurrentTurn() {
        return _state.currentTurn;
    }
    
    /**
     * Get the active player
     * 
     * @returns {string} - Active player ID
     */
    function getActivePlayer() {
        return _state.activePlayer;
    }
    
    /**
     * Get the player resources
     * 
     * @param {string} player - Player ID
     * @returns {object} - Player resources
     */
    function getResources(player) {
        return { ..._state.players[player].resources };
    }
    
    /**
     * Get the selected territory
     * 
     * @returns {object|null} - Selected territory or null
     */
    function getSelectedTerritory() {
        if (!_state.selectedTerritory) {
            return null;
        }
        return _state.territories.get(_state.selectedTerritory);
    }
    
    // Public API
    return {
        initialize,
        endTurn,
        selectTerritory,
        clearSelection,
        getState,
        getCurrentTurn,
        getActivePlayer,
        getResources,
        getSelectedTerritory,
        subscribe,
        emit
    };
})();
