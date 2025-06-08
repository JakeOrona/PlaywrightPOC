// scripts/smartRunner.js - STREAMLINED VERSION
const { execSync } = require('child_process');
const fs = require('fs').promises;

const RESULTS_FILE_PATH = 'test-results/vote-results.json';

/**
 * Clears all vote results (call at start of new test run)
 */
async function clearVoteResults() {
    try {
        await fs.unlink(RESULTS_FILE_PATH);
        console.log('🗑️ -Cleared previous vote results');
    } catch {
        // File doesn't exist, which is fine
        console.log('🔍 -No previous vote results to clear');
    }
}

/**
 * Streamlined test runner that lets each test handle its own auth
 * No more pre-checking auth state - the voting flow handles it dynamically
 */
async function runStreamlinedTests() {
    try {
        console.log('\n🎯 ══════════════════════════════════════════════════════════════════════════════');
        console.log('║                        STREAMLINED TEST RUNNER STARTING                     ║');
        console.log('══════════════════════════════════════════════════════════════════════════════');
        
        // Clear results from any previous run
        await clearVoteResults();
        
        console.log('\n🚀 Running all voting tests with streamlined flow!');
        console.log('📌 Each test will automatically detect and handle Steam auth as needed');
        console.log('📌 First test with invalid auth will perform full sign-in automatically');
        console.log('📌 Subsequent tests will use the refreshed auth state');
        console.log('─'.repeat(80));
        
        // Run all three voting tests in parallel
        // No need for conditional logic - each test handles its own auth
        execSync('npx playwright test --project=first-server --project=second-server --project=third-server', { 
            stdio: 'inherit' 
        });
        
        console.log('\n🎉 All tests completed successfully!');
        // Note: Final report will be printed by global teardown
        
    } catch (error) {
        console.error('\n❌ Error running tests:', error);
        process.exit(1);
    }
}

/**
 * Force fresh authentication by clearing auth state and running tests
 * Even simpler now - just clear auth and let tests handle the rest
 */
async function forceAuthentication() {
    try {
        console.log('\n🔄 ══════════════════════════════════════════════════════════════════════════════');
        console.log('║                         FORCING FRESH AUTHENTICATION                        ║');
        console.log('══════════════════════════════════════════════════════════════════════════════');
        
        // Clear results and auth state
        await clearVoteResults();
        
        // Clear auth state to force fresh sign-in
        try {
            await fs.unlink('playwright/.auth/user.json');
            console.log('🗑️ -Cleared existing authentication state');
        } catch {
            console.log('🔍 -No existing auth state to clear');
        }
        
        // Clear first vote flag to allow fresh voting
        try {
            await fs.unlink('playwright/.auth/first-vote-completed.flag');
            console.log('🗑️ -Cleared first vote completion flag');
        } catch {
            console.log('🔍 -No first vote flag to clear');
        }
        
        console.log('\n🚀 Running all voting tests with forced fresh authentication!');
        console.log('📌 First test will automatically perform full Steam sign-in');
        console.log('📌 Subsequent tests will use the fresh auth state');
        console.log('─'.repeat(80));
        
        // Run all three tests - first one will automatically do full auth
        execSync('npx playwright test --project=first-server --project=second-server --project=third-server', { 
            stdio: 'inherit' 
        });
        
        console.log('\n✅ All tests completed with fresh authentication!');
        
    } catch (error) {
        console.error('\n❌ Error during forced authentication:', error);
        process.exit(1);
    }
}

/**
 * Optional: Run individual test (for debugging)
 */
async function runIndividualTest(testName) {
    try {
        console.log(`\n🔍 Running individual test: ${testName}`);
        
        const projectMap = {
            'first': 'first-server',
            'second': 'second-server', 
            'third': 'third-server',
            '1': 'first-server',
            '2': 'second-server',
            '3': 'third-server'
        };
        
        const project = projectMap[testName];
        if (!project) {
            console.log('❌ Invalid test name. Use: first, second, third (or 1, 2, 3)');
            return;
        }
        
        execSync(`npx playwright test --project=${project}`, { stdio: 'inherit' });
        
    } catch (error) {
        console.error(`\n❌ Error running ${testName} test:`, error);
        process.exit(1);
    }
}

// Check command line arguments and execute appropriate function
(function() {
    const command = process.argv[2];
    const testName = process.argv[3];
    
    if (command === 'force-auth') {
        forceAuthentication();
    } else if (command === 'test' && testName) {
        runIndividualTest(testName);
    } else if (command === 'help') {
        console.log('\n📖 Streamlined Smart Runner Usage:');
        console.log('   node scripts/smartRunner.js              - Run all tests (auto auth handling)');
        console.log('   node scripts/smartRunner.js force-auth   - Clear auth and run all tests');
        console.log('   node scripts/smartRunner.js test first   - Run first test only');
        console.log('   node scripts/smartRunner.js test second  - Run second test only');
        console.log('   node scripts/smartRunner.js test third   - Run third test only');
        console.log('   node scripts/smartRunner.js help         - Show this help');
    } else {
        runStreamlinedTests();
    }
})();