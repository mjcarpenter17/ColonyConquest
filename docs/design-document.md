# Colony Conquest - Game Design Document

## Game Overview

Colony Conquest is a turn-based strategy game centered around hexagonal grid-based territorial conquest. Players compete against an AI opponent to control territories, manage resources, and achieve victory through multiple possible conditions.

## Core Systems

### Hexagonal Grid
- 7x7 hex grid (49 total territories)
- Each territory has:
  - A primary resource type (Gold, Timber, Iron, Food)
  - A resource production value (1-3)
  - An owner (Player, AI, or Neutral)
  - Influence values from different factions

### Resource System
- Four resource types: Gold, Timber, Iron, Food
- Resources are collected at the beginning of each turn
- Used for claiming territories, influencing neighbors, and recruiting units
- Each territory produces its resource type based on its value

### Influence Web
- Each territory exerts influence on neighboring territories
- Influence determines territory ownership
- When influences meet, creates dynamic diplomatic effects
- Creates neutral zones and contested borders

### Territory Types
- Resource Node: Specialized in single resource production
- Mixed Zone: Produces two different resources
- Strategic Point: Special victory-relevant territories

### Turn-Based Gameplay
- Player and AI alternate turns
- Each turn consists of:
  1. Resource collection phase
  2. Action phase (spend resources, claim territories)
  3. Resolution phase
- Random events occur every 3-7 turns

### Victory Conditions
1. Territorial Dominance: Control 80% of map
2. Economic Victory: Accumulate 100 of each resource
3. Influence Victory: Control all Strategic Points for 5 turns

### AI Personality System
- Industrialist: Economy-focused, trade-oriented
- Warlord: Militaristic, expansion-focused
- AI adapts strategy based on player actions

## UI/UX
- Resource bar at the top of the screen
- Territory information panel
- End turn button
- Selected territory highlighting
- Color-coding for resources and ownership

## Development Roadmap
- Phase 1: Foundation & Core Systems
- Phase 2: Gameplay Mechanics
- Phase 3: AI & Advanced Features
- Phase 4: Polish & Optimization
