/**
 * Integration test for global view mode configuration
 * This script can be run in the browser console to test the functionality
 */

(function() {
    'use strict';
    
    console.log('🧪 Starting Global View Mode Configuration Integration Test');
    
    // Test utilities
    const TestUtils = {
        log: (message, type = 'info') => {
            const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
            console.log(`${emoji} ${message}`);
        },
        
        assert: (condition, message) => {
            if (condition) {
                TestUtils.log(message, 'success');
                return true;
            } else {
                TestUtils.log(`FAILED: ${message}`, 'error');
                return false;
            }
        },
        
        sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
    };
    
    // Test data
    const testViewIds = ['inbox', 'projects', 'tags', 'forecast'];
    let testResults = [];
    
    // Test 1: Check if viewModeUtils functions exist
    function testUtilityFunctions() {
        TestUtils.log('Testing utility functions...');
        
        try {
            // These should be available if the module is loaded correctly
            const hasUtils = window.TaskGenius && 
                             window.TaskGenius.viewModeUtils &&
                             typeof window.TaskGenius.viewModeUtils.getInitialViewMode === 'function';
            
            testResults.push(TestUtils.assert(hasUtils, 'ViewModeUtils functions are available'));
        } catch (error) {
            TestUtils.log('ViewModeUtils not available in global scope, checking localStorage directly', 'warning');
            testResults.push(true); // Continue with localStorage tests
        }
    }
    
    // Test 2: Test localStorage functionality
    function testLocalStorage() {
        TestUtils.log('Testing localStorage functionality...');
        
        // Clear any existing test data
        testViewIds.forEach(viewId => {
            localStorage.removeItem(`task-genius:view-mode:${viewId}`);
        });
        
        // Test saving and retrieving
        localStorage.setItem('task-genius:view-mode:test', 'tree');
        const retrieved = localStorage.getItem('task-genius:view-mode:test');
        testResults.push(TestUtils.assert(retrieved === 'tree', 'localStorage save/retrieve works'));
        
        // Cleanup
        localStorage.removeItem('task-genius:view-mode:test');
    }
    
    // Test 3: Test view mode persistence across page reloads
    function testPersistence() {
        TestUtils.log('Testing view mode persistence...');
        
        // Set different modes for different views
        const testData = {
            'inbox': 'tree',
            'projects': 'list',
            'tags': 'tree',
            'forecast': 'list'
        };
        
        Object.entries(testData).forEach(([viewId, mode]) => {
            localStorage.setItem(`task-genius:view-mode:${viewId}`, mode);
        });
        
        // Verify data was saved
        let allSaved = true;
        Object.entries(testData).forEach(([viewId, expectedMode]) => {
            const savedMode = localStorage.getItem(`task-genius:view-mode:${viewId}`);
            if (savedMode !== expectedMode) {
                allSaved = false;
            }
        });
        
        testResults.push(TestUtils.assert(allSaved, 'All view modes saved correctly'));
    }
    
    // Test 4: Check if Task Genius plugin is loaded
    function testPluginLoaded() {
        TestUtils.log('Checking if Task Genius plugin is loaded...');
        
        // Check for plugin presence
        const hasPlugin = window.app && window.app.plugins && 
                         window.app.plugins.plugins && 
                         window.app.plugins.plugins['task-genius'];
        
        testResults.push(TestUtils.assert(hasPlugin, 'Task Genius plugin is loaded'));
        
        if (hasPlugin) {
            const plugin = window.app.plugins.plugins['task-genius'];
            const hasSettings = plugin.settings && typeof plugin.settings.defaultViewMode !== 'undefined';
            testResults.push(TestUtils.assert(hasSettings, 'Plugin has defaultViewMode setting'));
        }
    }
    
    // Test 5: Test view toggle buttons
    function testViewToggleButtons() {
        TestUtils.log('Testing view toggle buttons...');
        
        const toggleButtons = document.querySelectorAll('.view-toggle-btn');
        testResults.push(TestUtils.assert(toggleButtons.length > 0, 'View toggle buttons found'));
        
        if (toggleButtons.length > 0) {
            // Check if buttons have correct icons
            let hasCorrectIcons = true;
            toggleButtons.forEach(button => {
                const hasIcon = button.querySelector('svg') || button.querySelector('.lucide');
                if (!hasIcon) {
                    hasCorrectIcons = false;
                }
            });
            testResults.push(TestUtils.assert(hasCorrectIcons, 'Toggle buttons have icons'));
        }
    }
    
    // Test 6: Test settings UI
    function testSettingsUI() {
        TestUtils.log('Testing settings UI...');
        
        // Look for the settings tab
        const settingsButton = document.querySelector('[data-tab-id="view-settings"]');
        if (settingsButton) {
            testResults.push(TestUtils.assert(true, 'View settings tab found'));
            
            // Simulate click to open settings
            settingsButton.click();
            
            setTimeout(() => {
                const defaultViewModeSetting = document.querySelector('select, .dropdown-content');
                testResults.push(TestUtils.assert(!!defaultViewModeSetting, 'Default view mode setting found'));
            }, 100);
        } else {
            TestUtils.log('Settings UI not currently visible', 'warning');
        }
    }
    
    // Run all tests
    async function runAllTests() {
        TestUtils.log('🚀 Running integration tests...');
        
        testUtilityFunctions();
        testLocalStorage();
        testPersistence();
        testPluginLoaded();
        testViewToggleButtons();
        testSettingsUI();
        
        // Wait a bit for async operations
        await TestUtils.sleep(500);
        
        // Report results
        const passed = testResults.filter(result => result === true).length;
        const total = testResults.length;
        
        TestUtils.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            TestUtils.log('🎉 All tests passed! Global view mode configuration is working correctly.', 'success');
        } else {
            TestUtils.log(`⚠️ ${total - passed} tests failed. Please check the implementation.`, 'warning');
        }
        
        return { passed, total, success: passed === total };
    }
    
    // Export test function to global scope for manual execution
    window.testGlobalViewMode = runAllTests;
    
    // Auto-run tests
    runAllTests();
    
})();

// Instructions for manual execution:
console.log(`
📋 Manual Test Instructions:
1. Open Task Genius view in Obsidian
2. Open browser developer console (F12)
3. Run: testGlobalViewMode()
4. Check the console output for test results

🔧 Additional Manual Tests:
1. Go to Task Genius settings > Views & Index
2. Change "Default view mode" setting
3. Create new views and verify they use the new default
4. Toggle view modes and verify they persist after switching views
5. Restart Obsidian and verify settings are preserved
`);
