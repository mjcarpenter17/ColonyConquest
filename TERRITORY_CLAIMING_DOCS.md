# Enhanced Territory Claiming System Documentation

## Overview
Comprehensive territory claiming validation system with adjacency requirements, special territory rules, cost calculations, and detailed error handling.

## Validation Layers

### 1. Game State Validation
- **Player Turn Check**: Only current player can claim territories
- **Phase Check**: Can only claim during ACTION_PHASE
- **Game Status Check**: Game must be active

### 2. Territory Ownership Validation
- **Neutral Check**: Territory must be neutral (unowned)
- **Owner Validation**: Prevents claiming already owned territories

### 3. Adjacency Validation
- **First Territory Exception**: Players can claim any territory as their first
- **Adjacent Requirement**: Subsequent territories must be adjacent to owned territories
- **Neighbor Detection**: Uses hex grid neighbor calculation

### 4. Special Territory Rules
- **Home Base Protection**: Home base territories cannot be claimed
- **Strategic Points**: Require minimum 3 owned territories to claim
- **Resource Type Restrictions**: Different rules for different resource types

### 5. Economic Validation
- **Resource Availability**: Must have sufficient resources
- **Cost Calculation**: Dynamic costs based on territory properties
- **Neighbor Discounts**: Adjacent territories provide cost reduction

## Cost Calculation System

### Base Cost Structure
```javascript
TERRITORY_CLAIM_COST: {
    gold: 3,
    wood: 2,
    metal: 1,
    food: 2
}
```

### Cost Modifiers
1. **Resource Type Bonus**: Gold territories cost +1 gold
2. **High Value Territories**: Resource value 3 territories cost 50% more
3. **Neighbor Discount**: -1 resource per adjacent owned territory (max -3)
4. **Contested History**: Previously contested territories cost more

### Difficulty Rating
- **Base Difficulty**: 1.0
- **Resource Value**: +0.3 per resource value point
- **Contest History**: +0.2 per previous contest
- **Strategic Points**: +2.0 difficulty
- **Adjacency Bonus**: -0.2 per adjacent territory

## API Reference

### Enhanced Methods

#### `validateClaimingConditions(player)`
Validates basic game state requirements for claiming.

**Returns:**
```javascript
{
    valid: boolean,
    reason?: string,    // Error identifier
    detail?: string     // Human-readable description
}
```

#### `validateAdjacency(territory, player)`
Validates territory adjacency requirements.

#### `validateSpecialTerritoryRules(territory, player)`
Validates special rules for protected or strategic territories.

#### `getClaimingInfo(territory, player)`
Comprehensive claiming analysis including all validation checks.

**Returns:**
```javascript
{
    canClaim: boolean,           // Overall claim possibility
    cost: object,                // Resource cost breakdown
    canAfford: boolean,          // Affordability check
    difficulty: number,          // Difficulty rating (0.5-5.0)
    validationIssues: array,     // List of validation problems
    neighborBonus: number        // Adjacency discount amount
}
```

#### `getTerritoryDifficulty(territory, player)`
Calculates claiming difficulty rating for strategy AI.

## Error Codes and Messages

| Error Code | Description | User Message |
|------------|-------------|--------------|
| `not_player_turn` | Wrong player turn | "It's not your turn" |
| `invalid_phase` | Wrong turn phase | "Can only claim territories during action phase" |
| `territory_already_owned` | Territory owned | "Territory is already owned by {player}" |
| `not_adjacent` | Not adjacent to owned | "Territory must be adjacent to one you already own" |
| `home_base_protected` | Home base territory | "Home base territories cannot be claimed" |
| `strategic_point_requirements` | Strategic point prereq | "Must own at least 3 territories to claim strategic points" |
| `insufficient_resources` | Not enough resources | "Not enough resources! Need: {cost}" |

## UI Integration

### Claim Button States
1. **Affordable**: Green gradient, clickable
2. **Unaffordable**: Red gradient, disabled with tooltip
3. **Invalid Adjacency**: Orange gradient, disabled
4. **Wrong Phase**: Gray gradient, disabled

### Enhanced Information Display
- **Cost Breakdown**: Resource requirements with formatting
- **Neighbor Discounts**: Green text showing savings
- **Difficulty Rating**: Moderate/Hard indicators
- **Validation Errors**: Red text with specific issues

### Tooltip System
- **Multi-issue Support**: Combines multiple validation problems
- **Resource Breakdown**: Shows exact shortfalls
- **Strategic Guidance**: Hints for adjacency requirements

## Game Balance Considerations

### Adjacency System Benefits
- **Strategic Planning**: Encourages territorial cohesion
- **Natural Boundaries**: Creates organic territory clusters
- **Economic Efficiency**: Neighbor bonuses reward expansion planning

### Cost Scaling
- **Early Game**: Lower costs for initial expansion
- **Mid Game**: Increasing costs and strategic choices
- **Late Game**: High-value territories become premium targets

### Special Territory Protection
- **Home Base Security**: Prevents elimination scenarios
- **Strategic Point Value**: High-risk, high-reward objectives
- **Balanced Accessibility**: Requirements prevent early game domination

## Testing and Validation

Use the enhanced test suite (`test-enhanced-validation.js`) to verify:
- All validation layers function correctly
- Error messages are appropriate
- Cost calculations are accurate
- UI feedback matches validation state

## Future Enhancements

1. **Siege Mechanics**: Multi-turn territory claiming
2. **Diplomatic Claims**: Negotiated territory transfers
3. **Temporary Claims**: Limited-time territorial control
4. **Alliance Adjacency**: Allied territories count as adjacent
5. **Dynamic Costs**: Market-based resource pricing

## Integration Notes

- **Backward Compatible**: Works with existing resource system
- **Event Driven**: Emits detailed claiming events
- **Extensible**: Easy to add new validation rules
- **Performance Optimized**: Caches expensive calculations
