// scripts/smartRunner.js
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const AUTH_FILE_PATH = 'playwright/.auth/user.json';
const AUTH_VALIDITY_HOURS = 36;

/**
 * Checks if the stored authentication state exists and is less than 36 hours old
 * @returns Promise<boolean> - true if auth is valid and recent, false otherwise
 */
async function isAuthStateValid() {
    try {
        // Check if auth file exists
        const authExists = await fs.access(AUTH_FILE_PATH).then(() => true).catch(() => false);
        if (!authExists) {
            console.log('🔍 -No existing authentication state found.');
            return false;
        }

        // Read the auth file stats to get modification time
        const stats = await fs.stat(AUTH_FILE_PATH);
        const fileAge = Date.now() - stats.mtime.getTime();
        const maxAge = AUTH_VALIDITY_HOURS * 60 * 60 * 1000; // Convert hours to milliseconds

        const isValid = fileAge < maxAge;
        const ageInHours = Math.round(fileAge / (60 * 60 * 1000) * 10) / 10;

        if (isValid) {
            console.log(`✅ -Authentication state is valid (${ageInHours} hours old, limit: ${AUTH_VALIDITY_HOURS} hours)`);
        } else {
            console.log(`⏰ -Authentication state is expired (${ageInHours} hours old, limit: ${AUTH_VALIDITY_HOURS} hours)`);
        }

        return isValid;
    } catch (error) {
        console.error('❌ -Error checking authentication state:', error);
        return false;
    }
}

/**
 * Removes the existing auth state file
 */
async function clearAuthState() {
    try {
        await fs.unlink(AUTH_FILE_PATH);
        console.log('🗑️ -Cleared existing authentication state');
    } catch (error) {
        // File might not exist, which is fine
        console.log('🔍 -No existing auth state to clear');
    }
}

/**
 * Smart test runner that ensures authentication and runs all voting tests
 */
async function runSmartTests() {
    try {
        console.log('\n🎯 ══════════════════════════════════════════════════════════════════════════════');
        console.log('║                           SMART TEST RUNNER STARTING                        ║');
        console.log('║                         (Parallel Execution Enabled)                        ║');
        console.log('══════════════════════════════════════════════════════════════════════════════');
        
        const authIsValid = await isAuthStateValid();
        
        if (!authIsValid) {
            console.log('\n🔄 Running authentication setup...');
            execSync('npx playwright test --project=setup', { stdio: 'inherit' });
        } else {
            console.log('\n✅ Authentication is valid, skipping setup');
        }
        
        console.log('\n🚀 Running voting tests...');
        console.log('📌 First server (sequential) → Second & Third servers (parallel)');
        console.log('─'.repeat(80));
        execSync('npx playwright test --project=first-server --project=parallel-servers', { stdio: 'inherit' });
        
        console.log('\n🎉 All tests completed successfully!');
        // Note: Final report will be printed by global teardown
        
    } catch (error) {
        console.error('\n❌ Error running tests:', error);
        process.exit(1);
    }
}

/**
 * Force fresh authentication by clearing existing state and running setup
 */
async function forceAuthentication() {
    try {
        console.log('\n🔄 ══════════════════════════════════════════════════════════════════════════════');
        console.log('║                         FORCING FRESH AUTHENTICATION                           ║');
        console.log('║                         (Parallel Execution Enabled)                           ║');
        console.log('═══════════════════════════════════════════════════════════════════════════════════');
        
        await clearAuthState();
        console.log('\n🗑️ Cleared existing authentication state');
        
        console.log('\n🔄 Running fresh authentication setup...');
        execSync('npx playwright test --project=setup', { stdio: 'inherit' });
        
        console.log('\n🚀 Running voting tests with fresh authentication...');
        console.log('📌 First server (sequential) → Second & Third servers (parallel)');
        console.log('─'.repeat(80));
        execSync('npx playwright test --project=first-server --project=parallel-servers', { stdio: 'inherit' });
        
        console.log('\n✅ All tests completed with fresh authentication!');
        // Note: Final report will be printed by global teardown
        
    } catch (error) {
        console.error('\n❌ Error during forced authentication:', error);
        process.exit(1);
    }
}

// Check command line arguments and execute appropriate function
(function() {
    const command = process.argv[2];
    
    if (command === 'force-auth') {
        forceAuthentication();
    } else {
        runSmartTests();
    }
})();