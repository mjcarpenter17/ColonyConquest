/*
==============================================================================
COLONY CONQUEST - GITHUB COPILOT PROJECT CONTEXT
==============================================================================

PROJECT: Turn-Based Hexagonal Strategy Game
TIMELINE: 4-week development sprint with AI assistance
CURRENT PHASE: Day 1 - Pre-production & Foundation Setup

==============================================================================
GAME DESIGN OVERVIEW
==============================================================================

CORE CONCEPT:
- Territory control
- Turn-based strategy with hexagonal grid (7x7 = 49 territories)
- Resource management: Gold, Timber, Iron, Food
- Target session length: 15-20 minutes

VICTORY CONDITIONS:
1. Territorial Dominance: Control 80% of map

PSYCHOLOGICAL HOOKS:
- Variable reward schedule (random events every 3-7 turns)
- Near-miss psychology (70-90% battle success rates)
- Momentum system for consecutive victories
- Emergent diplomatic narratives

==============================================================================
TECHNICAL SPECIFICATIONS
==============================================================================

TECH STACK:
- JavaScript with Phaser Framework
- HTML5 Canvas for rendering
- CSS3 for UI styling
- Target: 60fps performance, <3s load time
- Mobile-first responsive design

ARCHITECTURE PATTERNS:
- Modular ES6 structure with clear separation of concerns
- Observer pattern for game state changes
- Factory pattern for territory/unit generation
- State machine for turn management

FILE STRUCTURE:
src/
├── core/           # Game state, turn management, resources
├── map/            # Hex grid, map generation, territories
├── units/          # Unit types, combat system
├── ai/             # AI decision making, personalities
├── influence/      # Influence calculation, diplomacy
├── ui/             # Rendering, input handling, UI components
└── utils/          # Constants, math utilities, helpers

==============================================================================
KEY SYSTEMS & DATA STRUCTURES
==============================================================================

HEXAGONAL GRID SYSTEM:
- Coordinate system: Offset coordinates (row/col)
- Conversion functions: hex-to-pixel, pixel-to-hex
- Neighbor detection for influence flow
- Pathfinding for unit movement

TERRITORY STRUCTURE:
{
    id: 'hex_3_4',
    coordinates: {x: 3, y: 4},
    owner: null,                    // null, 'player', 'ai'
    resourceType: 'gold',           // 'gold', 'timber', 'iron', 'food'
    resourceValue: 3,               // Base production per turn
    secondaryResource: 'timber',    // Secondary resource type
    secondaryValue: 1,              // Secondary production
    influence: {                    // Influence from each faction
        player: 0,
        ai: 0,
        neutral: 5
    },
    territoryType: 'resource_node', // 'resource_node', 'mixed_zone', 'strategic_point'
    units: [],                      // Units stationed here
    isContested: false,             // True if multiple influences present
    lastCaptured: null              // Turn number when ownership changed
}

RESOURCE SYSTEM:
{
    gold: 10,     // For unit recruitment, trade
    timber: 10,   // For archer recruitment, construction
    iron: 10,     // For knight/infantry recruitment
    food: 10      // For infantry recruitment, unit maintenance
}

GAME STATE MANAGEMENT:
{
    currentTurn: 1,
    phase: 'player_turn',           // 'player_turn', 'ai_turn', 'resolution'
    activePlayer: 'player',
    territories: new Map(),          // Territory ID -> Territory Object
    players: {
        player: {
            resources: {gold: 10, timber: 10, iron: 10, food: 10},
            units: [],
            momentum: 0,             // Combat momentum (-50 to +50)
            influencePoints: 0,      // For diplomatic actions
            personality: null        // Player doesn't have AI personality
        },
        ai: {
            resources: {gold: 10, timber: 10, iron: 10, food: 10},
            units: [],
            momentum: 0,
            influencePoints: 0,
            personality: 'industrialist' // 'industrialist' or 'warlord'
        }
    },
    actionQueue: [],                 // Queued actions for turn resolution
    randomEventTimer: 3,             // Turns until next random event
    victoryProgress: {               // Track progress toward victory conditions
        territorial: 0,              // Percentage of map controlled
        economic: false,             // Has economic victory been achieved
        influence: 0                 // Turns controlling strategic points
    }
}

==============================================================================
UNIT SYSTEM (Rock-Paper-Scissors Plus)
==============================================================================

UNIT TYPES:
- Infantry: Strong vs Archers, weak vs Knights (costs Food + Iron)
- Archers: Strong vs Knights, weak vs Infantry (costs Timber + Gold)  
- Knights: Strong vs Infantry, weak vs Archers (costs Gold + Iron)

COMBAT SYSTEM:
- Pre-calculated odds display before battle
- Momentum system: +10% per consecutive win (max +50%)
- Battle resolution: 2-3 second animation
- Clear win/loss feedback with reasoning

==============================================================================
AI PERSONALITY SYSTEM
==============================================================================

INDUSTRIALIST AI:
- Prioritizes economic expansion over military
- Offers beneficial trades 70% of the time
- Builds defensive positions
- Responds to threats with diplomacy first

WARLORD AI:
- Aggressive territorial expansion
- Military unit production priority
- Opportunistic attacking
- Uses diplomacy as deception tool

BEHAVIOR TRIGGERS:
- Opportunity recognition (weak borders)
- Threat response (defensive buildup)
- Personality drift (adapts to player strategy)
- Emotional memory (remembers betrayals/favors)

==============================================================================
DEVELOPMENT PRIORITIES - DAY 1
==============================================================================

CRITICAL PATH:
1. Hexagonal grid mathematics and rendering
2. Territory data structure and visualization
3. Basic resource system implementation
4. Mouse/touch input handling for hex selection
5. Game state initialization and management

CODING STANDARDS:
- Use const/let appropriately 
- Arrow functions for callbacks
- Template literals for string interpolation
- Destructuring for object/array access
- Modern async/await for any async operations
- Comprehensive JSDoc comments for all functions
- Performance-focused: avoid unnecessary object creation in render loops

PERFORMANCE TARGETS:
- 60fps rendering on mobile devices
- <100ms response time for user interactions
- <3 second initial load time
- Memory usage <100MB

==============================================================================
CURRENT TASK: HEXAGONAL GRID FOUNDATION
==============================================================================

IMMEDIATE GOALS:
1. Implement hex coordinate system with proper math
2. TBD
3. Build territory rendering system with color coding
4. Add mouse/touch interaction for territory selection
5. Establish basic game loop structure

EXPECTED COPILOT ASSISTANCE:
- Hexagonal mathematics (coordinate conversion, neighbor detection)
- Canvas rendering optimizations
- Event handling patterns
- Data structure implementations
- Performance optimization suggestions

==============================================================================
*/

// Example function signatures that Copilot should understand:

/**
 * Convert hexagonal grid coordinates to pixel coordinates for rendering
 * @param {number} hexX - Hex grid X coordinate
 * @param {number} hexY - Hex grid Y coordinate
 * @param {number} hexRadius - Radius of hexagon in pixels
 * @returns {{x: number, y: number}} Pixel coordinates
 */
function hexToPixel(hexX, hexY, hexRadius) {
    // Copilot should implement hex coordinate math here
}

/**
 * Convert mouse/touch pixel coordinates to hex grid coordinates
 * @param {number} pixelX - Screen X coordinate
 * @param {number} pixelY - Screen Y coordinate
 * @param {number} hexRadius - Radius of hexagon in pixels
 * @returns {{x: number, y: number}} Hex grid coordinates
 */
function pixelToHex(pixelX, pixelY, hexRadius) {
    // Copilot should implement reverse hex coordinate math here
}

/**
 * Generate initial game map with procedural territory distribution
 * @param {number} width - Map width in hexes
 * @param {number} height - Map height in hexes
 * @returns {Map<string, Territory>} Generated territories
 */
function generateGameMap(width, height) {
    // Copilot should create balanced map generation logic
}

// This context should prime Copilot for the entire project scope