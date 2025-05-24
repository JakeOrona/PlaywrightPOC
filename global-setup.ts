// global-setup.ts
import { isAuthStateValid } from './helpers/authHelpers';
import { clearVoteResults } from './helpers/resultsCollector';

async function globalSetup() {
    console.log('🚀 -Running global setup...');
    
    // Clear any previous vote results at the start of a new test run
    await clearVoteResults();
    
    const authIsValid = await isAuthStateValid();
    
    if (authIsValid) {
        console.log('✅ -Existing authentication is valid, tests will use stored state');
        // Set environment variable to indicate we should skip setup
        process.env.SKIP_AUTH_SETUP = 'true';
    } else {
        console.log('🔄 -Authentication setup required');
        // Ensure environment variable is not set
        delete process.env.SKIP_AUTH_SETUP;
    }
}

export default globalSetup;