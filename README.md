# Colony Conquest

A turn-based strategy game with hexagonal grid-based territorial conquest.

## Game Overview

Colony Conquest is a turn-based territorial strategy game that features:
- Hexagonal grid map (7x7 = 49 territories)
- Resource management (Gold, Timber, Iron, Food)
- 15-minute gameplay sessions
- Player vs AI opponent
- Unique "Influence Web" diplomacy system

## Getting Started

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/mjcarpenter17/ColonyConquest.git
   ```

2. Navigate to the project directory:
   ```
   cd ColonyConquest
   ```

3. Install dependencies:
   ```
   npm install
   ```

### Running the Game

1. Start the development server:
   ```
   node server.js
   ```
   This will start the server on port 3000 by default.

2. Alternatively, specify a custom port:
   ```
   node server.js 3001
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
   (or the custom port you specified)

### How to Play

1. Click on territories to select them
2. Manage your resources (Gold, Timber, Iron, Food)
3. Expand your influence across the map
4. End your turn when ready using the "End Turn" button
5. Win by achieving one of the victory conditions

## Project Structure

```
colony-conquest/
├── index.html              # Main game page
├── style.css               # UI styling
├── README.md               # Project documentation
├── src/
│   ├── main.js             # Game initialization
│   ├── core/
│   │   ├── game-state.js   # Central game state management
│   │   ├── turn-manager.js # Turn-based game flow
│   │   └── resource-manager.js # Resource tracking
│   ├── map/
│   │   ├── hex-grid.js     # Hexagonal grid mathematics
│   │   ├── map-generator.js # Procedural map creation
│   │   └── territory.js    # Territory data structure
│   ├── ui/
│   │   ├── renderer.js     # Canvas rendering engine
│   │   ├── input-handler.js # Mouse/touch input
│   │   └── ui-components.js # UI elements
│   └── utils/
│       ├── constants.js    # Game constants
│       └── math-utils.js   # Utility functions
├── assets/
│   ├── sounds/             # Audio files
│   └── images/             # Image assets
└── docs/
    ├── design-document.md  # Game design reference
    └── development-log.md  # Daily progress tracking
```

## Technical Stack

- Vanilla JavaScript ES6+ (no frameworks)
- HTML5 Canvas for rendering
- CSS3 for styling
- Mobile-responsive design

## Game Configuration

- **Grid Size**: 7x7 hexagonal territories (49 total)
- **Resource Types**: Gold, Timber, Iron, Food
- **Players**: 2 (Human vs AI)
- **Target Session**: 15-20 minutes
- **Platform**: Web-based (HTML5 Canvas)

## Victory Conditions

1. **Territorial Dominance**: Control 80% of map
2. **Economic Victory**: Accumulate 100 of each resource
3. **Influence Victory**: Control all Strategic Points for 5 turns

## Development Status

Currently in early development phase.
