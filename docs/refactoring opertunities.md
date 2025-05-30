Looking at your Colony Conquest game, I'm impressed with the solid foundation you've built! The hex grid system, modular architecture, and turn-based mechanics show excellent planning. Here are the key refactoring opportunities I see:
Major Refactoring Opportunities
1. Territory System Inconsistency 🎯
Your biggest issue is having two different territory systems that aren't properly integrated:
Current Problem:

HexGrid stores basic hex data with minimal properties
Territory class exists but isn't being used in the main game loop
GameState expects territories with specific properties that don't match hex data

Refactor Solution:
javascript// In GameScene.js, replace the current territory assignment with:
assignTestTerritoriesToPlayer() {
    const testPositions = [
        { q: 0, r: 0, resourceType: RESOURCE_TYPES.GOLD, resourceValue: 2 },
        { q: 1, r: -1, resourceType: RESOURCE_TYPES.WOOD, resourceValue: 3 },
        { q: -1, r: 2, resourceType: RESOURCE_TYPES.METAL, resourceValue: 1 }
    ];
    
    testPositions.forEach(pos => {
        const hexKey = `${pos.q},${pos.r}`;
        const territory = new Territory(pos.q, pos.r); // Use actual Territory class
        territory.owner = OWNERS.PLAYER;
        territory.resourceType = pos.resourceType;
        territory.resourceValue = pos.resourceValue;
        
        // Add to both systems
        this.gameState.addTerritory(territory);
        // Update hex grid to reference the territory
        const hexData = this.hexGrid.getHex(pos.q, pos.r);
        if (hexData) {
            hexData.territory = territory;
        }
    });
}
2. Event System Consolidation 🔄
Current Problem:

Multiple event systems: GameState events, Phaser events, DOM events
Inconsistent event naming and handling

Refactor Solution:
javascript// Create a unified EventBus
export class EventBus {
    constructor() {
        this.events = new Map();
    }
    
    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => callback(data));
        }
    }
    
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) callbacks.splice(index, 1);
        }
    }
}
3. Resource Manager Integration 💎
Current Issue:

ResourceManager has sophisticated logic but isn't fully integrated
Territory claiming doesn't use the proper cost calculation

Refactor:
javascript// In GameScene.js, add territory claiming logic:
handleTerritoryClaimAttempt(territory) {
    if (territory.owner === null && this.turnManager.canPlayerAct()) {
        const result = this.resourceManager.claimTerritory(territory.id, OWNERS.PLAYER);
        
        if (result.success) {
            this.notificationManager.show(
                `Territory claimed for ${Object.entries(result.cost)
                    .map(([type, amount]) => `${amount} ${type}`)
                    .join(', ')}`, 
                'success'
            );
            this.renderHexGrid(); // Update visuals
        } else {
            this.notificationManager.show(result.reason, 'warning');
        }
    }
}
4. UI Component Architecture 🎨
Current Issue:

UI components mix DOM and Phaser approaches inconsistently
Some components do too much (ResourceDisplayBar handles both display and notifications)

Refactor Strategy:
javascript// Separate concerns more clearly
export class ResourceDisplay extends UIComponent {
    // Only handles display
}

export class ResourceNotificationHandler {
    // Only handles notifications
}

export class UIComponentManager {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
        this.components = new Map();
    }
    
    registerComponent(name, component) {
        this.components.set(name, component);
    }
    
    updateAll() {
        this.components.forEach(component => {
            if (component.update) component.update();
        });
    }
}
5. Constants and Configuration ⚙️
Current Issue:

Some constants are duplicated or inconsistent
Magic numbers scattered throughout code

Refactor:
javascript// Add to constants.js
export const GAME_BALANCE = {
    TERRITORY_CLAIM_COSTS: {
        BASE: { gold: 3, wood: 2, metal: 1, food: 2 },
        CONTESTED_MULTIPLIER: 1.2,
        HIGH_VALUE_MULTIPLIER: 1.5
    },
    
    RESOURCE_PRODUCTION: {
        MIN_VALUES: { gold: 1, wood: 2, metal: 1, food: 2 },
        MAX_VALUES: { gold: 2, wood: 4, metal: 3, food: 5 }
    }
};
Immediate Action Plan
Phase 1: Fix Territory System (High Priority)

Replace hex data properties with proper Territory instances
Update GameState to work with Territory objects
Ensure resource collection works with the new system

Phase 2: Streamline Event Handling

Create unified EventBus
Migrate existing events to use consistent naming
Remove duplicate event listeners

Phase 3: Complete Resource Integration

Implement territory claiming with proper costs
Add visual feedback for resource spending
Connect MapGenerator to create proper territories

Positive Aspects to Maintain
✅ Excellent modular architecture - Your separation of concerns is well thought out
✅ Comprehensive constants system - Makes the game easily configurable
✅ Solid hex grid mathematics - The foundation is mathematically sound
✅ Professional error handling - Good use of try/catch and validation
✅ Mobile-responsive design - CSS shows good responsive practices
Code Quality Score: B+
Your code shows strong architectural thinking and good practices. The main issues are integration gaps between well-designed individual systems rather than fundamental design problems. With the territory system refactor, this could easily become an A-level codebase.