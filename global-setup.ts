// global-setup.ts
import { isAuthStateValid } from './helpers/authHelpers';
import { clearVoteResults } from './helpers/resultsCollector';

async function globalSetup() {
    console.log('🚀 -Running global setup...');
    
    const authIsValid = await isAuthStateValid();
    
    if (authIsValid) {
        console.log('✅ -Existing authentication is valid, tests will use stored state');
        // Set environment variable to indicate we should skip setup
        process.env.SKIP_AUTH_SETUP = 'true';
        
        // Only clear results if this is the start of a new complete test run
        // (not if we're continuing from auth setup)
        if (!process.env.CONTINUING_FROM_AUTH) {
            await clearVoteResults();
            console.log('🗑️ -Cleared previous vote results for fresh run');
        } else {
            console.log('🔄 -Continuing from auth setup, preserving existing results');
        }
    } else {
        console.log('🔄 -Authentication setup required');
        // DON'T clear results here - let smartRunner handle it
        // This prevents clearing results between auth setup and remaining tests
        // Ensure environment variable is not set
        delete process.env.SKIP_AUTH_SETUP;
    }
}

export default globalSetup;