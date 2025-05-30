/**
 * Test script to verify the menu system is working
 * Run this in the browser console after the game loads
 */

// Test if menu system elements exist
function testMenuSystem() {
    console.log('🧪 Testing Menu System...');
    
    // Check if menu container exists
    const menuContainer = document.querySelector('.menu-system');
    console.log('Menu container found:', !!menuContainer);
    
    // Check if menu buttons exist
    const menuButtons = document.querySelectorAll('.menu-btn');
    console.log('Number of menu buttons found:', menuButtons.length);
    
    // List button IDs
    menuButtons.forEach((btn, index) => {
        console.log(`Button ${index + 1}: ${btn.id}`);
    });
    
    // Check if panel container exists
    const panelContainer = document.querySelector('.sliding-panels');
    console.log('Panel container found:', !!panelContainer);
    
    // Test keyboard shortcuts
    console.log('Testing keyboard shortcuts...');
    
    // Simulate pressing key '1' for Resources panel
    const event1 = new KeyboardEvent('keydown', {
        key: '1',
        code: 'Digit1',
        keyCode: 49
    });
    document.dispatchEvent(event1);
    
    setTimeout(() => {
        const activePanel = document.querySelector('.sliding-panel.active');
        console.log('Panel opened after pressing "1":', !!activePanel);
        if (activePanel) {
            console.log('Active panel ID:', activePanel.id);
        }
        
        // Close panel with ESC
        const escEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27
        });
        document.dispatchEvent(escEvent);
        
        setTimeout(() => {
            const activePanelAfterEsc = document.querySelector('.sliding-panel.active');
            console.log('Panel closed after pressing ESC:', !activePanelAfterEsc);
        }, 500);
        
    }, 500);
}

// Run test when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testMenuSystem);
} else {
    testMenuSystem();
}
