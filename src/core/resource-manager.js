/**
 * Colony Conquest - Resource Manager
 * Handles resource calculations, validation, and management
 */

import { RESOURCE_TYPES, GAME_CONFIG, OWNERS } from '../utils/constants.js';

/**
 * ResourceManager class - Manages all resource-related operations
 */
export class ResourceManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.resourceMultipliers = new Map();
        this.temporaryBoosts = new Map();
        this.resourceHistory = [];
        
        this.initializeMultipliers();
    }

    /**
     * Initialize default resource multipliers
     */
    initializeMultipliers() {
        // Base multiplier for each resource type (can be modified by events)
        Object.values(RESOURCE_TYPES).forEach(resourceType => {
            this.resourceMultipliers.set(resourceType, 1.0);
        });
    }

    /**
     * Calculate total resource production for a player
     */
    calculateResourceProduction(player) {
        const ownedTerritories = this.gameState.getTerritoriesByOwner(player);
        const production = {
            [RESOURCE_TYPES.GOLD]: 0,
            [RESOURCE_TYPES.WOOD]: 0,
            [RESOURCE_TYPES.METAL]: 0,
            [RESOURCE_TYPES.FOOD]: 0
        };
        
        ownedTerritories.forEach(territory => {
            const resourceType = territory.resourceType;
            const baseValue = territory.resourceValue;
            const multiplier = this.getResourceMultiplier(resourceType);
            const boost = this.getTemporaryBoost(player, resourceType);
            
            production[resourceType] += Math.floor(baseValue * multiplier + boost);
        });
        
        return production;
    }

    /**
     * Get current resource multiplier for a resource type
     */
    getResourceMultiplier(resourceType) {
        return this.resourceMultipliers.get(resourceType) || 1.0;
    }

    /**
     * Set resource multiplier (for events/upgrades)
     */
    setResourceMultiplier(resourceType, multiplier, duration = null) {
        this.resourceMultipliers.set(resourceType, multiplier);
        
        // Auto-reset after duration if specified
        if (duration) {
            setTimeout(() => {
                this.resourceMultipliers.set(resourceType, 1.0);
            }, duration);
        }
    }

    /**
     * Get temporary boost for a player and resource type
     */
    getTemporaryBoost(player, resourceType) {
        const key = `${player}_${resourceType}`;
        return this.temporaryBoosts.get(key) || 0;
    }

    /**
     * Apply temporary resource boost
     */
    applyTemporaryBoost(player, resourceType, amount, duration) {
        const key = `${player}_${resourceType}`;
        const currentBoost = this.temporaryBoosts.get(key) || 0;
        this.temporaryBoosts.set(key, currentBoost + amount);
        
        // Remove boost after duration
        setTimeout(() => {
            const newBoost = (this.temporaryBoosts.get(key) || 0) - amount;
            if (newBoost <= 0) {
                this.temporaryBoosts.delete(key);
            } else {
                this.temporaryBoosts.set(key, newBoost);
            }
        }, duration);
    }

    /**
     * Validate if player can afford a cost
     */
    canAfford(player, cost) {
        const playerResources = this.gameState.getResources(player);
        
        for (const [resourceType, amount] of Object.entries(cost)) {
            if (playerResources[resourceType] < amount) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Calculate territory claiming cost
     */
    getTerritoryClaimCost(territory, player) {
        const baseCost = { ...GAME_CONFIG.TERRITORY_CLAIM_COST };
        
        // Modify cost based on territory properties
        if (territory.resourceType === RESOURCE_TYPES.GOLD) {
            baseCost.gold += 1; // Gold territories cost more gold
        }
        
        if (territory.resourceValue === 3) {
            // High-value territories cost 50% more
            Object.keys(baseCost).forEach(resource => {
                baseCost[resource] = Math.ceil(baseCost[resource] * 1.5);
            });
        }
        
        // Check for neighboring territories (influence system)
        const neighborBonus = this.calculateNeighborBonus(territory, player);
        if (neighborBonus > 0) {
            // Reduce costs if player has neighboring territories
            Object.keys(baseCost).forEach(resource => {
                baseCost[resource] = Math.max(1, baseCost[resource] - neighborBonus);
            });
        }
        
        return baseCost;
    }

    /**
     * Calculate neighbor bonus for territory claiming
     */    calculateNeighborBonus(territory, player) {
        // Calculate discount based on adjacent owned territories
        let bonus = 0;
        const hexGrid = this.gameState.getHexGrid();
        
        if (hexGrid && territory.q !== undefined && territory.r !== undefined) {
            const neighbors = hexGrid.getNeighbors(territory.q, territory.r);
            let adjacentOwned = 0;
            
            neighbors.forEach(neighbor => {
                if (neighbor && neighbor.owner === player) {
                    adjacentOwned++;
                }
            });
            
            // Grant 1 resource discount per adjacent territory (max 3)
            bonus = Math.min(3, adjacentOwned);
        }
        
        return bonus;
    }    /**
     * Spend resources for a player with validation and transaction logging
     */
    spendResources(player, cost) {
        // Validate inputs
        if (!player || typeof player !== 'string') {
            return { success: false, reason: 'invalid_player' };
        }
        
        if (!cost || typeof cost !== 'object') {
            return { success: false, reason: 'invalid_cost' };
        }
        
        // Check if player exists
        if (!this.gameState.getResources(player)) {
            return { success: false, reason: 'player_not_found' };
        }
        
        // Check if player can afford the cost
        if (!this.canAfford(player, cost)) {
            return { 
                success: false, 
                reason: 'insufficient_resources',
                cost: cost,
                available: this.gameState.getResources(player)
            };
        }
        
        // Get resources before spending (for logging)
        const beforeResources = { ...this.gameState.getResources(player) };
        
        // Deduct resources using GameState method
        const spendSuccess = this.gameState.spendResources(player, cost);
        
        if (!spendSuccess) {
            return { success: false, reason: 'failed_to_spend' };
        }
        
        // Get resources after spending
        const afterResources = this.gameState.getResources(player);
        
        // Record transaction in history
        this.recordTransaction(player, 'spend', cost, beforeResources, afterResources);
        
        // Emit event for UI updates
        this.gameState.emit('resourceChanged', {
            player,
            action: 'spent',
            amounts: cost,
            before: beforeResources,
            after: afterResources,
            details: { transaction: 'resource_spending' }
        });
        
        return { success: true, cost, after: afterResources };
    }

    /**
     * Record a resource transaction in history
     */
    recordTransaction(player, action, amounts, beforeResources, afterResources) {
        this.resourceHistory.push({
            turn: this.gameState.currentTurn,
            player: player,
            action: action,
            amounts: amounts,
            before: beforeResources,
            after: afterResources,
            timestamp: Date.now()
        });
    }

    /**
     * Process resource collection for a player
     */
    collectResources(player) {
        const production = this.calculateResourceProduction(player);
        const beforeResources = this.gameState.getResources(player);
        const ownedTerritories = this.gameState.getTerritoriesByOwner(player);
        
        // Log individual territory production
        // ownedTerritories.forEach(territory => { // REMOVED block
        //     if (territory.resourceType && territory.resourceValue) {
        //         console.log(`📊 Territory at (${territory.coord?.q},${territory.coord?.r}) produces ${territory.resourceValue} ${territory.resourceType}`);
        //     }
        // });
        
        // Add produced resources
        Object.entries(production).forEach(([resourceType, amount]) => {
            if (amount > 0) {
                this.gameState.addResources(player, resourceType, amount);
                // console.log(`📊 Added ${amount} ${resourceType} to ${player}`); // REMOVED console.log
            }
        });
        
        const afterResources = this.gameState.getResources(player);
        
        // Record in history
        this.resourceHistory.push({
            turn: this.gameState.currentTurn,
            player: player,
            before: beforeResources,
            production: production,
            after: afterResources,
            timestamp: Date.now()
        });
        
        return production;
    }    /**
     * Attempt to claim a territory
     */
    claimTerritory(territoryId, player) {
        const territory = this.gameState.getTerritory(territoryId);
        
        if (!territory) {
            return { success: false, reason: 'Territory not found' };
        }
        
        if (territory.owner !== null && territory.owner !== OWNERS.NEUTRAL) {
            return { success: false, reason: 'Territory already owned' };
        }
        
        const cost = this.getTerritoryClaimCost(territory, player);
        
        // Use the enhanced spending system
        const spendResult = this.spendResources(player, cost);
        
        if (!spendResult.success) {
            return spendResult; // Return the detailed spending result
        }
        
        // Claim the territory
        this.gameState.setTerritoryOwner(territoryId, player);
        
        // Emit territory claimed event
        this.gameState.emit('territoryChanged', { 
            action: 'claimed', 
            territory, 
            player,
            cost
        });
        
        return {
            success: true,
            territory: territory,
            cost: cost,
            resourcesAfter: spendResult.after
        };
    }

    /**
     * Get resource efficiency for a player
     */
    getResourceEfficiency(player) {
        const territories = this.gameState.getTerritoriesByOwner(player);
        const resources = this.gameState.getResources(player);
        const totalProduction = this.calculateResourceProduction(player);
        
        const efficiency = {
            territoryCount: territories.length,
            totalProduction: Object.values(totalProduction).reduce((sum, val) => sum + val, 0),
            resourceBalance: this.calculateResourceBalance(resources),
            productionRatio: this.calculateProductionRatio(totalProduction)
        };
        
        return efficiency;
    }

    /**
     * Calculate resource balance (how evenly distributed resources are)
     */
    calculateResourceBalance(resources) {
        const values = Object.values(resources);
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
        
        // Lower variance = better balance (0-1 scale, 1 = perfectly balanced)
        return Math.max(0, 1 - (variance / (average * average + 1)));
    }

    /**
     * Calculate production ratio for different resource types
     */
    calculateProductionRatio(production) {
        const total = Object.values(production).reduce((sum, val) => sum + val, 0);
        
        if (total === 0) return { gold: 0, wood: 0, metal: 0, food: 0 };
        
        return {
            [RESOURCE_TYPES.GOLD]: production[RESOURCE_TYPES.GOLD] / total,
            [RESOURCE_TYPES.WOOD]: production[RESOURCE_TYPES.WOOD] / total,
            [RESOURCE_TYPES.METAL]: production[RESOURCE_TYPES.METAL] / total,
            [RESOURCE_TYPES.FOOD]: production[RESOURCE_TYPES.FOOD] / total
        };
    }

    /**
     * Get resource recommendations for a player
     */
    getResourceRecommendations(player) {
        const efficiency = this.getResourceEfficiency(player);
        const resources = this.gameState.getResources(player);
        const production = this.calculateResourceProduction(player);
        
        const recommendations = [];
        
        // Check for resource shortages
        Object.entries(resources).forEach(([resourceType, amount]) => {
            if (amount < 5) {
                recommendations.push({
                    type: 'shortage',
                    resource: resourceType,
                    message: `Low ${resourceType} reserves (${amount}). Consider claiming ${resourceType} territories.`
                });
            }
        });
        
        // Check for production imbalances
        const prodRatio = efficiency.productionRatio;
        Object.entries(prodRatio).forEach(([resourceType, ratio]) => {
            if (ratio < 0.15 && efficiency.territoryCount > 3) {
                recommendations.push({
                    type: 'production',
                    resource: resourceType,
                    message: `Low ${resourceType} production (${Math.round(ratio * 100)}%). Diversify territory claims.`
                });
            }
        });
        
        // Check for excess resources
        Object.entries(resources).forEach(([resourceType, amount]) => {
            if (amount > 50) {
                recommendations.push({
                    type: 'excess',
                    resource: resourceType,
                    message: `High ${resourceType} reserves (${amount}). Good time for expansion.`
                });
            }
        });
        
        return recommendations;
    }

    /**
     * Get resource history for a player
     */
    getResourceHistory(player, turns = 5) {
        return this.resourceHistory
            .filter(entry => entry.player === player)
            .slice(-turns);
    }

    /**
     * Get current resource status summary
     */
    getResourceSummary(player) {
        return {
            current: this.gameState.getResources(player),
            production: this.calculateResourceProduction(player),
            efficiency: this.getResourceEfficiency(player),
            recommendations: this.getResourceRecommendations(player),
            multipliers: Object.fromEntries(this.resourceMultipliers),
            boosts: Object.fromEntries(
                Array.from(this.temporaryBoosts.entries())
                    .filter(([key]) => key.startsWith(player))
            )
        };
    }

    /**
     * Reset all temporary effects
     */
    resetTemporaryEffects() {
        this.temporaryBoosts.clear();
        this.initializeMultipliers();
    }

    /**
     * Apply global resource event
     */
    applyGlobalResourceEvent(event) {
        switch (event.type) {
            case 'resource_boom':
                [OWNERS.PLAYER, OWNERS.AI].forEach(player => {
                    Object.values(RESOURCE_TYPES).forEach(resourceType => {
                        this.gameState.addResources(player, resourceType, event.amount || 2);
                    });
                });
                break;
                
            case 'resource_drought':
                Object.values(RESOURCE_TYPES).forEach(resourceType => {
                    this.setResourceMultiplier(resourceType, 0.5, event.duration || 30000);
                });
                break;
                
            case 'trade_winds':
                Object.values(RESOURCE_TYPES).forEach(resourceType => {
                    this.setResourceMultiplier(resourceType, 1.5, event.duration || 15000);
                });
                break;
                
            default:
                console.warn(`Unknown resource event type: ${event.type}`);
        }
    }
}
