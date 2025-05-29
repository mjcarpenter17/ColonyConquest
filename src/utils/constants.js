/**
 * Colony Conquest - Game Constants
 * Central configuration and constant values
 */

// Game Configuration
export const GAME_CONFIG = {
    // Canvas and Display
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    BACKGROUND_COLOR: 0x1a252f,
    
    // Grid Configuration
    GRID_SIZE: 7,           // 7x7 hex grid (49 territories)
    HEX_SIZE: 45,           // Radius of hexagons in pixels
    HEX_SPACING: 0,         // Space between hexagons (set to 0 for touching edges)
    HEX_LINE_THICKNESS: 2,  // Thickness of the hex border lines
    
    // Game Rules
    INITIAL_RESOURCES: {
        gold: 10,
        wood: 10,
        metal: 5,
        food: 15
    },
    
    TERRITORY_CLAIM_COST: {
        gold: 3,
        wood: 2,
        metal: 1,
        food: 2
    },
    
    VICTORY_CONDITIONS: {
        TERRITORIAL_DOMINANCE: 0.8,  // 80% of territories
        ECONOMIC_VICTORY: 100,       // 100 of each resource
        STRATEGIC_POINTS_TURNS: 5    // Hold strategic points for 5 turns
    },
    
    // Turn Configuration
    MAX_TURNS: 100,
    RANDOM_EVENT_FREQUENCY: [3, 7], // Between 3-7 turns
    
    // AI Configuration
    AI_DIFFICULTY: {
        EASY: 0.3,
        MEDIUM: 0.6,
        HARD: 0.9
    }
};

// Resource Types
export const RESOURCE_TYPES = {
    GOLD: 'gold',
    WOOD: 'wood', 
    METAL: 'metal',
    FOOD: 'food'
};

// Territory Types
export const TERRITORY_TYPES = {
    RESOURCE_NODE: 'resource_node',      // Specialized single resource
    MIXED_ZONE: 'mixed_zone',            // Two different resources
    STRATEGIC_POINT: 'strategic_point'    // Special victory-relevant
};

// Territory Ownership
export const OWNERS = {
    NEUTRAL: null,
    PLAYER: 'player',
    AI: 'ai'
};

// Hex Grid Mathematics Constants
export const HEX_CONSTANTS = {
    // Cube coordinate directions (for neighbor finding)
    DIRECTIONS: [
        { q: 1, r: 0, s: -1 },   // East
        { q: 0, r: 1, s: -1 },   // Southeast
        { q: -1, r: 1, s: 0 },   // Southwest
        { q: -1, r: 0, s: 1 },   // West
        { q: 0, r: -1, s: 1 },   // Northwest
        { q: 1, r: -1, s: 0 }    // Northeast
    ],
    
    // Conversion constants
    SQRT_3: Math.sqrt(3),
    SQRT_3_2: Math.sqrt(3) / 2,
    
    // Layout orientation (pointy-top hexagons)
    ORIENTATION: {
        f0: Math.sqrt(3),
        f1: Math.sqrt(3) / 2,
        f2: 0,
        f3: 3 / 2,
        b0: Math.sqrt(3) / 3,
        b1: -1 / 3,
        b2: 0,
        b3: 2 / 3,
        start_angle: 0.5
    }
};

// Color Schemes
export const COLORS = {
    // Territory Colors by Resource Type
    TERRITORIES: {
        [RESOURCE_TYPES.GOLD]: 0xf1c40f,      // Gold yellow
        [RESOURCE_TYPES.WOOD]: 0x27ae60,      // Forest green
        [RESOURCE_TYPES.METAL]: 0x95a5a6,     // Steel gray
        [RESOURCE_TYPES.FOOD]: 0xe67e22,      // Orange
        NEUTRAL: 0x7f8c8d,                    // Neutral gray
        STRATEGIC: 0x9b59b6                   // Purple for strategic points
    },
    
    // Ownership Colors
    OWNERSHIP: {
        [OWNERS.PLAYER]: 0x3498db,            // Blue
        [OWNERS.AI]: 0xe74c3c,                // Red
        [OWNERS.NEUTRAL]: 0x95a5a6            // Gray
    },    // UI Colors
    UI: {
        SELECTION: 0xf39c12,                  // Orange selection
        HOVER: 0x1abc9c,                      // Teal hover
        BORDER: 0x2c3e50,                     // Dark border
        TEXT: 0xecf0f1,                       // Light text
        BACKGROUND: 0x34495e                  // Dark background
    },
    
    // Hex Grid Colors
    HEX_BORDER: 0x34495e,                     // Dark hex borders
    HEX_BACKGROUND: 0x2c3e50,                 // Dark hex background
    HEX_HIGHLIGHT: 0xf1c40f,    // Highlight color (yellow)
    HEX_BORDER_SELECTED: 0xe67e22, // Border for selected hex (orange)
    
    // Player/AI Colors
    PLAYER: 0x3498db,                         // Blue for player
    AI: 0xe74c3c,                            // Red for AI
    NEUTRAL: 0x95a5a6,                       // Gray for neutral
    
    // Selection/Interaction Colors
    SELECTED: 0xf39c12,                       // Orange for selected hex
    HOVER: 0x1abc9c                          // Teal for hovered hex
};

// Asset Paths
export const ASSETS = {
    IMAGES: {
        // Territory Tiles
        TILE_DEFAULT: 'assets/images/Tile_01.png',
        TILE_GOLD: 'assets/images/Tile_gold.png',
        TILE_STONE: 'assets/images/Tile_stone.png',
        TILE_TREES: 'assets/images/Tile_trees.png',
        
        // Resource UI
        RSS_GOLD: 'assets/images/RSS_Info_Gold.png',
        RSS_WOOD: 'assets/images/RSS_Info_Wood.png',
        RSS_METAL: 'assets/images/RSS_Info_Metal.png',
        RSS_FOOD: 'assets/images/RSS_Info_Food.png',
        
        // Buttons
        END_TURN: 'assets/images/endTurn_02.png',
        END_TURN_PRESSED: 'assets/images/endTurn_02_Pressed.png',
        BLUE_BTN: 'assets/images/Blue_Btn.png',
        GREEN_BTN: 'assets/images/Green_Btn.png',
        RED_BTN: 'assets/images/Red_Btn.png',
        
        // Resource Icons
        GOLD_BAR: 'assets/images/GoldBar.png',
        WOOD_ICON: 'assets/images/Wood.png',
        METAL_BAR: 'assets/images/MetalBar.png',
        
        // Action Buttons
        ATTACK: 'assets/images/Attack.png',
        ATTACK_PRESSED: 'assets/images/Attack_Presed.png',
        TRAIN: 'assets/images/Train.png',
        PLUS: 'assets/images/plus.png',
        PLUS_PRESSED: 'assets/images/plus_pressed.png',
        SUBTRACT: 'assets/images/subtract.png',
        SUBTRACT_PRESSED: 'assets/images/subtract_pressed.png'
    },
    
    SOUNDS: {
        // Placeholder for future audio assets
        CLICK: 'assets/sounds/click.mp3',
        SELECT: 'assets/sounds/select.mp3',
        TURN_END: 'assets/sounds/turn_end.mp3'
    }
};

// Input Constants
export const INPUT = {
    MOUSE_BUTTONS: {
        LEFT: 0,
        MIDDLE: 1,
        RIGHT: 2
    },
    
    TOUCH_THRESHOLD: 10, // Pixels for touch/drag detection
    DOUBLE_CLICK_TIME: 300 // Milliseconds
};

// UI Constants
export const UI_CONSTANTS = {
    // Resource Bar
    RESOURCE_BAR_X: 20,
    RESOURCE_BAR_Y: 20,
    RESOURCE_BAR_PADDING: 10,
    RESOURCE_ICON_SIZE: 32,
    RESOURCE_SPACING: 120,
    
    // Territory Info Panel
    INFO_PANEL_X: 20,
    INFO_PANEL_Y: GAME_CONFIG.CANVAS_HEIGHT - 150,
    INFO_PANEL_WIDTH: 250,
    INFO_PANEL_HEIGHT: 120,
    INFO_PANEL_PADDING: 10,
    
    // End Turn Button
    END_TURN_BUTTON_X: GAME_CONFIG.CANVAS_WIDTH - 100,
    END_TURN_BUTTON_Y: GAME_CONFIG.CANVAS_HEIGHT - 50,
    
    // Turn Display
    TURN_DISPLAY_X: GAME_CONFIG.CANVAS_WIDTH - 200,
    TURN_DISPLAY_Y: 20,
    
    // Action Buttons
    ACTION_BUTTON_SPACING: 15
};

// Game States
export const GAME_STATES = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// Turn Phases
export const TURN_PHASES = {
    RESOURCE_COLLECTION: 'resource_collection',
    ACTION_PHASE: 'action_phase',
    RESOLUTION: 'resolution',
    AI_TURN: 'ai_turn'
};

// AI Personalities
export const AI_PERSONALITIES = {
    INDUSTRIALIST: {
        name: 'Industrialist',
        economyFocus: 0.8,
        expansionFocus: 0.4,
        tradeFocus: 0.9
    },
    WARLORD: {
        name: 'Warlord',
        economyFocus: 0.3,
        expansionFocus: 0.9,
        tradeFocus: 0.2
    }
};

// Debug Configuration
export const DEBUG = {
    SHOW_COORDINATES: false,
    SHOW_FPS: false,
    LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
    GRID_OVERLAY: false
};
