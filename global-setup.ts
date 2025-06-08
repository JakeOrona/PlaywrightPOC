// global-setup.ts - STREAMLINED VERSION
import { clearVoteResults } from './helpers/results-collector';

async function globalSetup() {
    console.log('🚀 -Running streamlined global setup...');
    // Only clear results if this is the start of a new test run
    // (not if we're continuing from a partial run)
    if (!process.env.CONTINUING_FROM_AUTH) {
        await clearVoteResults();
        console.log('🗑️ -Cleared previous vote results for fresh run');
    } else {
        console.log('🔄 -Continuing from previous run, preserving existing results');
    }
    
    console.log('✅ -Global setup completed - tests will handle auth automatically');
}

export default globalSetup;