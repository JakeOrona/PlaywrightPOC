// scripts/smart-runner.js
const { execSync } = require('child_process');
const fs = require('fs').promises;
const { AuthSetup } = require('./auth-setup');

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
 * Two-phase test runner: Auth setup first, then parallel voting
 */
async function runSmartTests() {
    try {
        console.log('\n🎯 ══════════════════════════════════════════════════════════════════════════════');
        console.log('║                     SMART TWO-PHASE TEST RUNNER STARTING                    ║');
        console.log('══════════════════════════════════════════════════════════════════════════════');
        
        // Clear results from any previous run
        await clearVoteResults();
        
        // PHASE 1: Ensure authentication is ready
        console.log('\n📋 PHASE 1: Authentication Setup');
        console.log('─'.repeat(50));
        
        const authSetup = new AuthSetup();
        await authSetup.ensureAuthenticationReady(false); // Don't force refresh
        
        console.log('✅ Authentication ready - proceeding to voting tests');
        
        // PHASE 2: Run voting tests in parallel
        console.log('\n📋 PHASE 2: Parallel Voting Tests');
        console.log('─'.repeat(50));
        console.log('🚀 Running all voting tests in parallel with established auth!');
        console.log('📌 All tests will use the authenticated session');
        console.log('📌 No additional Steam approvals needed');
        console.log('─'.repeat(80));
        
        // Run all three voting tests in parallel
        execSync('npx playwright test --project=first-server --project=second-server --project=third-server', { 
            stdio: 'inherit' 
        });
        
        console.log('\n🎉 All voting tests completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Error running smart tests:', error);
        process.exit(1);
    }
}

/**
 * Force fresh authentication and run tests
 */
async function forceAuthentication() {
    try {
        console.log('\n🔄 ══════════════════════════════════════════════════════════════════════════════');
        console.log('║                      FORCING FRESH AUTHENTICATION                           ║');
        console.log('══════════════════════════════════════════════════════════════════════════════');
        
        // Clear results
        await clearVoteResults();
        
        // PHASE 1: Force fresh authentication
        console.log('\n📋 PHASE 1: Fresh Authentication Setup');
        console.log('─'.repeat(50));
        
        const authSetup = new AuthSetup();
        await authSetup.ensureAuthenticationReady(true); // Force refresh
        
        console.log('✅ Fresh authentication completed - proceeding to voting tests');
        
        // PHASE 2: Run voting tests in parallel
        console.log('\n📋 PHASE 2: Parallel Voting Tests');
        console.log('─'.repeat(50));
        console.log('🚀 Running all voting tests with fresh authentication!');
        console.log('📌 All tests will use the newly authenticated session');
        console.log('─'.repeat(80));
        
        // Run all three tests with fresh auth
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
 * Run individual test (auth will be set up automatically if needed)
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
        
        // Ensure auth is ready before running individual test
        console.log('📋 Checking authentication before individual test...');
        const authSetup = new AuthSetup();
        await authSetup.ensureAuthenticationReady(false);
        
        execSync(`npx playwright test --project=${project}`, { stdio: 'inherit' });
        
    } catch (error) {
        console.error(`\n❌ Error running ${testName} test:`, error);
        process.exit(1);
    }
}

/**
 * Check authentication status
 */
async function checkAuthStatus() {
    try {
        console.log('\n🔍 Checking authentication status...');
        execSync('node scripts/auth-setup.js check', { stdio: 'inherit' });
    } catch (error) {
        console.error('\n❌ Error checking auth status:', error);
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
    } else if (command === 'auth-status') {
        checkAuthStatus();
    } else if (command === 'help') {
        console.log('\n📖 Smart Runner Usage (Two-Phase Approach):');
        console.log('   node scripts/smart-runner.js                  - Run all tests (auto auth setup)');
        console.log('   node scripts/smart-runner.js force-auth       - Force fresh auth + run tests');
        console.log('   node scripts/smart-runner.js test first       - Run first test only');
        console.log('   node scripts/smart-runner.js test second      - Run second test only');
        console.log('   node scripts/smart-runner.js test third       - Run third test only');
        console.log('   node scripts/smart-runner.js auth-status      - Check current auth status');
        console.log('   node scripts/smart-runner.js help             - Show this help');
        console.log('\n🔄 Two-Phase Process:');
        console.log('   📋 Phase 1: Authentication setup (once, if needed)');
        console.log('   📋 Phase 2: Parallel voting tests (no auth race conditions)');
        console.log('\n✅ Benefits:');
        console.log('   • Single Steam mobile app approval (not 3 separate ones)');
        console.log('   • No auth race conditions in parallel execution');
        console.log('   • Faster overall execution');
        console.log('   • More reliable authentication handling');
    } else {
        runSmartTests();
    }
})();