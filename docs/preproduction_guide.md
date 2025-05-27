# Day 1: Colony Conquest - Pre-Production Setup Guide

## 🎯 Today's Objective
Set up the complete development workspace and establish the foundational architecture for Colony Conquest - a turn-based strategy game with hexagonal grid-based territorial conquest.

---

## 📋 Pre-Production Checklist

### **Phase 1: Workspace Setup (30 minutes)**
- [ ] Create new directory: `colony-conquest`  
- [ ] Initialize Git repository  
- [ ] Set up VS Code workspace with recommended extensions  
- [ ] Configure GitHub Copilot integration  
- [ ] Create initial file structure based on design document  
- [ ] Set up package.json for basic build tools (optional)

### **Phase 2: Project Architecture (45 minutes)**
- [ ] Create HTML5 Canvas foundation  
- [ ] Establish modular JavaScript ES6 architecture  
- [ ] Implement basic game state management structure  
- [ ] Set up rendering pipeline foundation  
- [ ] Create basic input handling framework  
- [ ] Establish development server (Live Server or similar)

### **Phase 3: Core Data Structures (60 minutes)**
- [ ] Define hexagonal grid coordinate system  
- [ ] Create territory data structure  
- [ ] Implement resource system foundation  
- [ ] Set up game state object architecture  
- [ ] Create player/faction data structures  
- [ ] Establish turn management framework

### **Phase 4: Basic Rendering (45 minutes)**
- [ ] Implement hex-to-pixel coordinate conversion  
- [ ] Create basic hexagonal territory rendering  
- [ ] Set up color-coded territory visualization  
- [ ] Implement basic UI layout (resource bar, info panel)  
- [ ] Add mouse/touch hex selection detection  
- [ ] Test basic interaction (click to select territory)

---

## 🗂️ Required File Structure

```
colony-conquest/
├── index.html              # Main game page
├── style.css              # UI styling
├── README.md              # Project documentation
├── src/
│   ├── main.js            # Game initialization
│   ├── core/
│   │   ├── game-state.js  # Central game state management
│   │   ├── turn-manager.js # Turn-based game flow
│   │   └── resource-manager.js # Resource tracking
│   ├── map/
│   │   ├── hex-grid.js    # Hexagonal grid mathematics
│   │   ├── map-generator.js # Procedural map creation
│   │   └── territory.js   # Territory data structure
│   ├── ui/
│   │   ├── renderer.js    # Canvas rendering engine
│   │   ├── input-handler.js # Mouse/touch input
│   │   └── ui-components.js # UI elements
│   └── utils/
│       ├── constants.js   # Game constants
│       └── math-utils.js  # Utility functions
├── assets/
│   ├── sounds/           # Audio files (placeholder)
│   └── images/           # Image assets (placeholder)
└── docs/
    ├── design-document.md # Game design reference
    └── development-log.md # Daily progress tracking
```

---

## 🎮 Core Technical Specifications

### **Game Configuration**
- **Grid Size**: 7x7 hexagonal territories (49 total)
- **Resource Types**: Gold, Timber, Iron, Food (4 types)
- **Players**: 2 (Human vs AI for MVP)
- **Target Session**: 15-20 minutes
- **Platform**: Web-based (HTML5 Canvas)

### **Key Technical Requirements**
- Vanilla JavaScript ES6+ (no frameworks)
- HTML5 Canvas for rendering
- Responsive design for mobile/desktop
- 60fps performance target
- < 3 second load time

### **Development Priorities**
1. **Hexagonal grid system** - Foundation for all gameplay
2. **Territory ownership** - Visual feedback and state management  
3. **Resource generation** - Core economic gameplay loop
4. **Basic UI** - Player can see and interact with game state
5. **Turn management** - Structured gameplay phases

---
```javascript
/*
COLONY CONQUEST - Turn-Based Strategy Game
Project Context for GitHub Copilot:

GAME OVERVIEW:
- Turn-based territorial conquest strategy game
- Hexagonal grid map (7x7 = 49 territories)
- Resource management (Gold, Timber, Iron, Food)
- 15-minute gameplay sessions
- Player vs AI opponent

TECHNICAL STACK:
- Vanilla JavaScript ES6+
- HTML5 Canvas rendering
- No external frameworks
- Mobile-responsive design

KEY SYSTEMS TO IMPLEMENT:
1. Hexagonal grid mathematics and rendering
2. Territory ownership and visualization
3. Resource generation and management
4. Turn-based game state management
5. Mouse/touch input handling
6. AI opponent decision making
7. Influence system for diplomacy

CODING PREFERENCES:
- Clean, readable ES6+ syntax
- Modular architecture with clear separation of concerns
- Performance-optimized for 60fps
- Mobile-first responsive design
- Extensive comments for complex algorithms

CURRENT TASK: Setting up project foundation and hexagonal grid system
*/

// Example data structures for reference:
const Territory = {
    id: 'hex_3_4',
    x: 3, y: 4,           // Grid coordinates
    owner: null,          // null, 'player', 'ai'
    resourceType: 'gold', // 'gold', 'timber', 'iron', 'food'
    resourceValue: 3,     // Base production per turn
    influence: 0,         // Influence points from neighboring territories
    units: []            // Array of units stationed here
};

const GameState = {
    currentTurn: 1,
    activePlayer: 'player', // 'player' or 'ai'
    territories: new Map(),  // Map of territory objects
    players: {
        player: { resources: {gold: 10, timber: 10, iron: 10, food: 10} },
        ai: { resources: {gold: 10, timber: 10, iron: 10, food: 10} }
    }
};
```

---

## 🚀 Day 1 Development Tasks

### **Task 1: Project Foundation (60 minutes)**
1. Create the file structure above
2. Set up basic HTML5 page with canvas element
3. Initialize Git repository and make first commit
4. Configure VS Code workspace settings
5. Test GitHub Copilot integration

### **Task 2: Hexagonal Grid System (90 minutes)**
**This is the most critical system - everything builds on this**

Key functions to implement:
- `generateHexGrid(width, height)` - Create hex coordinate system
- `hexToPixel(hexX, hexY)` - Convert grid coords to screen pixels
- `pixelToHex(pixelX, pixelY)` - Convert mouse clicks to hex coords
- `getHexNeighbors(hexX, hexY)` - Find adjacent territories
- `drawHexagon(ctx, x, y, radius)` - Render individual hex

### **Task 3: Basic Territory System (60 minutes)**
- Create Territory class/object structure
- Implement territory ownership tracking
- Add basic resource type assignment
- Create visual representation (colored hexagons)

### **Task 4: Input & Interaction (30 minutes)**
- Set up mouse/touch event handlers
- Implement hex selection (click to highlight)
- Add basic territory information display
- Test interaction responsiveness

---

## ✅ Success Criteria for Day 1

By end of day, you should have:
1. **Playable hex grid** - Click on territories to select them
2. **Visual territory system** - Different colored hexes for different resources
3. **Basic UI** - Resource display and territory information
4. **Clean codebase** - Well-organized, commented, and Git-tracked
5. **Mobile-responsive** - Works on both desktop and mobile browsers

---

## 🔧 Recommended VS Code Extensions

- **GitHub Copilot** (Essential for AI assistance)
- **Live Server** (For development server)
- **JavaScript (ES6) code snippets**
- **Bracket Pair Colorizer** (Code readability)
- **GitLens** (Git integration)
- **Thunder Client** (API testing if needed)

---

## 📝 Development Notes

### **Performance Considerations**
- Cache hex-to-pixel calculations
- Use requestAnimationFrame for smooth rendering
- Optimize canvas redraw operations
- Consider object pooling for frequent operations

### **Mobile Optimization**
- Touch targets minimum 44px
- Responsive canvas sizing
- Touch gesture support
- Performance optimization for mobile browsers

### **Git Workflow**
- Commit frequently (every 30-60 minutes)
- Use descriptive commit messages
- Tag major milestones
- Push to GitHub daily for backup

---

## 🎯 Tomorrow's Preview (Day 2)

Day 2 will focus on:
- Procedural map generation
- Resource system implementation
- Basic game state management
- Territory ownership mechanics

**End-of-Day Goal**: Have a clickable hex map with different territory types and basic resource visualization.