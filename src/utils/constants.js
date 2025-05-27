/**
 * Game Constants for Colony Conquest
 */

const CONSTANTS = {
    // Debug Mode
    DEBUG_MODE: true,
    // Map Configuration
    MAP_WIDTH: 7,
    MAP_HEIGHT: 7,
    HEX_RADIUS: 50, // Base hex radius in pixels
    
    // Resources
    RESOURCE_TYPES: {
        GOLD: 'gold',
        TIMBER: 'timber',
        IRON: 'iron',
        FOOD: 'food'
    },
    
    // Territory Types
    TERRITORY_TYPES: {
        RESOURCE_NODE: 'resource_node',
        MIXED_ZONE: 'mixed_zone',
        STRATEGIC_POINT: 'strategic_point'
    },
    
    // Player Identifiers
    PLAYERS: {
        PLAYER: 'player',
        AI: 'ai',
        NEUTRAL: 'neutral'
    },
    
    // Game Phases
    PHASES: {
        PLAYER_TURN: 'player_turn',
        AI_TURN: 'ai_turn',
        RESOLUTION: 'resolution'
    },
    
    // Victory Conditions
    VICTORY: {
        TERRITORIAL_THRESHOLD: 0.8, // 80% of territories
        ECONOMIC_THRESHOLD: 100,    // 100 of each resource
        INFLUENCE_TURNS: 5          // Control strategic points for 5 turns
    },
    
    // Resource Values
    BASE_RESOURCE_VALUE: {
        LOW: 1,
        MEDIUM: 2,
        HIGH: 3
    },
    
    // Colors (matching CSS variables)
    COLORS: {
        GOLD: '#FFD700',
        TIMBER: '#8B4513',
        IRON: '#708090',
        FOOD: '#32CD32',
        PLAYER: '#4169E1',
        AI: '#DC143C',
        NEUTRAL: '#A9A9A9',
        BACKGROUND: '#2C3E50',
        PANEL: '#34495E',
        TEXT: '#ECF0F1',
        HEX_STROKE: '#1A2530',
        SELECTION: '#FFFFFF'
    }
};

// Prevent modifications to the constants
Object.freeze(CONSTANTS);
Object.freeze(CONSTANTS.RESOURCE_TYPES);
Object.freeze(CONSTANTS.TERRITORY_TYPES);
Object.freeze(CONSTANTS.PLAYERS);
Object.freeze(CONSTANTS.PHASES);
Object.freeze(CONSTANTS.VICTORY);
Object.freeze(CONSTANTS.BASE_RESOURCE_VALUE);
Object.freeze(CONSTANTS.COLORS);
