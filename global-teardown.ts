// global-teardown.ts
import { printVoteResultsSummary } from './helpers/resultsCollector';
import { logSectionHeader, logCompletionBanner } from './helpers/loggingHelpers';

async function globalTeardown() {
    // Check if this is the auth setup run by looking at the projects being executed
    // If we're running only the setup project, skip the final summary
    const isSetupOnly = process.argv.includes('--project=setup') && 
                            process.argv.filter(arg => arg.startsWith('--project=')).length === 1;
    
    if (isSetupOnly) {
        // Skip teardown summary for auth setup only
        return;
    }
    
    logSectionHeader('FINAL RESULTS SUMMARY', '📜');
    
    // Print the final vote results summary
    await printVoteResultsSummary();
    
    logCompletionBanner('TEST RUN COMPLETED');
}

export default globalTeardown;