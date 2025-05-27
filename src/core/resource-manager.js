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
        console.log('💰 ResourceManager initialized');
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
        
        console.log(`📈 ${resourceType} multiplier set to ${multiplier}x`);
        
        // Auto-reset after duration if specified
        if (duration) {
            setTimeout(() => {
                this.resourceMultipliers.set(resourceType, 1.0);
                console.log(`📉 ${resourceType} multiplier reset to 1.0x`);
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
        
        console.log(`⚡ ${player} gains +${amount} ${resourceType} boost for ${duration}ms`);
        
        // Remove boost after duration
        setTimeout(() => {
            const newBoost = (this.temporaryBoosts.get(key) || 0) - amount;
            if (newBoost <= 0) {
                this.temporaryBoosts.delete(key);
            } else {
                this.temporaryBoosts.set(key, newBoost);
            }
            console.log(`⏰ ${player}'s ${resourceType} boost expired`);
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
     */
    calculateNeighborBonus(territory, player) {
        // This will be expanded when hex neighbor detection is implemented
        // For now, return 0
        return 0;
    }

    /**
     * Process resource collection for a player
     */
    collectResources(player) {
        const production = this.calculateResourceProduction(player);
        const beforeResources = this.gameState.getResources(player);
        
        // Add produced resources
        Object.entries(production).forEach(([resourceType, amount]) => {
            if (amount > 0) {
                this.gameState.addResources(player, resourceType, amount);
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
        
        console.log(`💰 ${player} resource collection:`, production);
        return production;
    }

    /**
     * Attempt to claim a territory
     */
    claimTerritory(territoryId, player) {
        const territory = this.gameState.getTerritory(territoryId);
        
        if (!territory) {
            return { success: false, reason: 'Territory not found' };
        }
        
        if (territory.owner !== null) {
            return { success: false, reason: 'Territory already owned' };
        }
        
        const cost = this.getTerritoryClaimCost(territory, player);
        
        if (!this.canAfford(player, cost)) {
            return { 
                success: false, 
                reason: 'Insufficient resources',
                cost: cost,
                available: this.gameState.getResources(player)
            };
        }
        
        // Spend resources and claim territory
        if (this.gameState.spendResources(player, cost)) {
            this.gameState.setTerritoryOwner(territoryId, player);
            
            console.log(`🏴 ${player} claimed ${territoryId} for`, cost);
            
            return {
                success: true,
                territory: territory,
                cost: cost
            };
        }
        
        return { success: false, reason: 'Failed to spend resources' };
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
        console.log('🔄 All temporary resource effects reset');
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
