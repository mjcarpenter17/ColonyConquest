// Enhanced Territory Claiming Validation Test

function testEnhancedClaimingValidation() {
    console.log('=== Testing Enhanced Territory Claiming Validation ===');
    
    // Get game components
    const gameScene = window.game?.currentScene;
    if (!gameScene) {
        console.error('Game scene not found');
        return;
    }
    
    const gameState = gameScene.gameState;
    const resourceManager = gameState.getResourceManager();
    
    if (!resourceManager) {
        console.error('Resource manager not found');
        return;
    }
    
    const currentPlayer = gameState.getCurrentPlayer();
    console.log('Testing validation for player:', currentPlayer);
    
    // Test 1: Get first neutral territory
    const territories = Array.from(gameState.territories.values());
    const neutralTerritory = territories.find(t => t.owner === null);
    
    if (neutralTerritory) {
        console.log('Found neutral territory:', neutralTerritory);
        
        // Test claiming info
        const claimInfo = resourceManager.getClaimingInfo(neutralTerritory, currentPlayer);
        console.log('Claiming info:', claimInfo);
        
        console.log('Can claim:', claimInfo.canClaim ? '✓' : '✗');
        console.log('Cost:', claimInfo.cost);
        console.log('Can afford:', claimInfo.canAfford ? '✓' : '✗');
        console.log('Difficulty:', claimInfo.difficulty);
        console.log('Neighbor bonus:', claimInfo.neighborBonus);
        console.log('Validation issues:', claimInfo.validationIssues.length);
        
        if (claimInfo.validationIssues.length > 0) {
            claimInfo.validationIssues.forEach((issue, index) => {
                console.log(`  Issue ${index + 1}: ${issue.reason} - ${issue.detail}`);
            });
        }
    }
    
    // Test 2: Test validation methods directly
    console.log('\n--- Testing Validation Methods ---');
    
    const gameStateValidation = resourceManager.validateClaimingConditions(currentPlayer);
    console.log('Game state validation:', gameStateValidation.valid ? '✓' : '✗', gameStateValidation.detail || '');
    
    if (neutralTerritory) {
        const adjacencyValidation = resourceManager.validateAdjacency(neutralTerritory, currentPlayer);
        console.log('Adjacency validation:', adjacencyValidation.valid ? '✓' : '✗', adjacencyValidation.detail || '');
        
        const specialValidation = resourceManager.validateSpecialTerritoryRules(neutralTerritory, currentPlayer);
        console.log('Special rules validation:', specialValidation.valid ? '✓' : '✗', specialValidation.detail || '');
        
        const difficulty = resourceManager.getTerritoryDifficulty(neutralTerritory, currentPlayer);
        console.log('Territory difficulty:', difficulty);
    }
    
    // Test 3: Test error scenarios
    console.log('\n--- Testing Error Scenarios ---');
    
    // Test invalid player
    const invalidPlayerResult = resourceManager.validateClaimingConditions('invalid_player');
    console.log('Invalid player test:', !invalidPlayerResult.valid ? '✓' : '✗');
    
    // Test claiming already owned territory
    const ownedTerritory = territories.find(t => t.owner === currentPlayer);
    if (ownedTerritory) {
        const ownedTerritoryResult = resourceManager.claimTerritory(ownedTerritory.id, currentPlayer);
        console.log('Already owned territory test:', !ownedTerritoryResult.success ? '✓' : '✗');
        console.log('  Reason:', ownedTerritoryResult.reason);
    }
    
    console.log('=== Enhanced Validation Test Complete ===');
}

// Auto-run test when loaded
if (typeof window !== 'undefined') {
    // Wait for game to load
    setTimeout(() => {
        if (window.game) {
            testEnhancedClaimingValidation();
        } else {
            console.log('Game not loaded yet. Run testEnhancedClaimingValidation() manually.');
        }
    }, 2000);
}
