/**
 * Territory Data Structure
 * Manages individual hexagonal territory properties and state
 */

import { CONSTANTS } from '../utils/constants.js';

export class Territory {
    constructor(q, r, s = null) {
        // Hex coordinates (cube coordinates)
        this.q = q;
        this.r = r;
        this.s = s !== null ? s : -q - r; // Auto-calculate s if not provided
        
        // Territory properties
        this.owner = null; // null = neutral, 0+ = player ID
        this.resourceType = this.generateResourceType();
        this.resourceValue = this.generateResourceValue();
        this.isHomeBase = false;
        
        // Visual state
        this.isSelected = false;
        this.isHighlighted = false;
        this.isTargeted = false;
        
        // Gameplay state
        this.structures = []; // Future: buildings, defenses, etc.
        this.unitCount = 0; // Number of units stationed
        this.fortificationLevel = 0; // Defense bonus
        
        // History tracking
        this.turnClaimed = null;
        this.previousOwner = null;
        this.timesContested = 0;
    }

    /**
     * Generate a random resource type for this territory
     * @returns {string} Resource type
     */
    generateResourceType() {
        const types = Object.keys(CONSTANTS.RESOURCES);
        const weights = {
            'food': 30,
            'wood': 25,
            'stone': 20,
            'iron': 15,
            'gold': 10
        };
        
        const random = Math.random() * 100;
        let cumulative = 0;
        
        for (const [type, weight] of Object.entries(weights)) {
            cumulative += weight;
            if (random <= cumulative) {
                return type;
            }
        }
        
        return 'food'; // Fallback
    }

    /**
     * Generate resource value based on type
     * @returns {number} Resource production value
     */
    generateResourceValue() {
        const baseValues = {
            'food': { min: 2, max: 5 },
            'wood': { min: 2, max: 4 },
            'stone': { min: 1, max: 3 },
            'iron': { min: 1, max: 2 },
            'gold': { min: 1, max: 2 }
        };
        
        const range = baseValues[this.resourceType] || { min: 1, max: 3 };
        return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    }

    /**
     * Change territory ownership
     * @param {number|null} newOwner - Player ID or null for neutral
     * @param {number} turnNumber - Current turn number
     */
    changeOwnership(newOwner, turnNumber) {
        if (this.owner !== newOwner) {
            this.previousOwner = this.owner;
            this.owner = newOwner;
            this.turnClaimed = turnNumber;
            this.timesContested++;
            
            // Reset visual states
            this.isSelected = false;
            this.isHighlighted = false;
            this.isTargeted = false;
        }
    }

    /**
     * Check if territory is neutral (unowned)
     * @returns {boolean}
     */
    isNeutral() {
        return this.owner === null;
    }

    /**
     * Check if territory is owned by a specific player
     * @param {number} playerId - Player ID to check
     * @returns {boolean}
     */
    isOwnedBy(playerId) {
        return this.owner === playerId;
    }

    /**
     * Get territory claim cost based on current state
     * @returns {object} Resource costs
     */
    getClaimCost() {
        let baseCost = CONSTANTS.CLAIMING.BASE_COST;
        
        // Increase cost if previously owned
        if (this.timesContested > 0) {
            baseCost *= (1 + (this.timesContested * 0.2));
        }
        
        // Increase cost based on resource value
        baseCost *= (1 + (this.resourceValue * 0.1));
        
        return {
            food: Math.floor(baseCost),
            wood: Math.floor(baseCost * 0.5)
        };
    }

    /**
     * Set this territory as a home base
     * @param {number} playerId - Owner player ID
     */
    setAsHomeBase(playerId) {
        this.owner = playerId;
        this.isHomeBase = true;
        this.fortificationLevel = 1;
        this.resourceValue = Math.max(this.resourceValue, 2); // Minimum value for home base
        this.turnClaimed = 0;
    }

    /**
     * Get territory defense value
     * @returns {number} Total defense value
     */
    getDefenseValue() {
        let defense = this.fortificationLevel;
        
        // Home base bonus
        if (this.isHomeBase) {
            defense += 2;
        }
        
        // Unit count bonus
        defense += Math.floor(this.unitCount * 0.5);
        
        return defense;
    }

    /**
     * Get visual state for rendering
     * @returns {object} Visual properties
     */
    getVisualState() {
        return {
            q: this.q,
            r: this.r,
            s: this.s,
            owner: this.owner,
            resourceType: this.resourceType,
            resourceValue: this.resourceValue,
            isHomeBase: this.isHomeBase,
            isSelected: this.isSelected,
            isHighlighted: this.isHighlighted,
            isTargeted: this.isTargeted,
            fortificationLevel: this.fortificationLevel,
            unitCount: this.unitCount
        };
    }

    /**
     * Update visual state
     * @param {object} state - New visual state
     */
    updateVisualState(state) {
        if (state.isSelected !== undefined) this.isSelected = state.isSelected;
        if (state.isHighlighted !== undefined) this.isHighlighted = state.isHighlighted;
        if (state.isTargeted !== undefined) this.isTargeted = state.isTargeted;
    }

    /**
     * Reset all visual states
     */
    resetVisualState() {
        this.isSelected = false;
        this.isHighlighted = false;
        this.isTargeted = false;
    }

    /**
     * Get territory information for UI display
     * @returns {object} Display information
     */
    getDisplayInfo() {
        return {
            coordinates: `(${this.q}, ${this.r})`,
            owner: this.owner !== null ? `Player ${this.owner + 1}` : 'Neutral',
            resource: `${this.resourceType} (${this.resourceValue})`,
            defense: this.getDefenseValue(),
            claimCost: this.getClaimCost(),
            isHomeBase: this.isHomeBase,
            contested: this.timesContested > 1
        };
    }

    /**
     * Serialize territory for save/load
     * @returns {object} Serialized data
     */
    serialize() {
        return {
            q: this.q,
            r: this.r,
            s: this.s,
            owner: this.owner,
            resourceType: this.resourceType,
            resourceValue: this.resourceValue,
            isHomeBase: this.isHomeBase,
            structures: this.structures,
            unitCount: this.unitCount,
            fortificationLevel: this.fortificationLevel,
            turnClaimed: this.turnClaimed,
            previousOwner: this.previousOwner,
            timesContested: this.timesContested
        };
    }

    /**
     * Deserialize territory from save data
     * @param {object} data - Serialized data
     * @returns {Territory} Restored territory
     */
    static deserialize(data) {
        const territory = new Territory(data.q, data.r, data.s);
        
        territory.owner = data.owner;
        territory.resourceType = data.resourceType;
        territory.resourceValue = data.resourceValue;
        territory.isHomeBase = data.isHomeBase;
        territory.structures = data.structures || [];
        territory.unitCount = data.unitCount || 0;
        territory.fortificationLevel = data.fortificationLevel || 0;
        territory.turnClaimed = data.turnClaimed;
        territory.previousOwner = data.previousOwner;
        territory.timesContested = data.timesContested || 0;
        
        return territory;
    }
}
