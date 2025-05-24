// global-teardown.ts
import { printVoteResultsSummary } from './helpers/resultsCollector';
import { logSectionHeader, logCompletionBanner } from './helpers/loggingHelpers';

async function globalTeardown() {
    logSectionHeader('FINAL RESULTS SUMMARY', '📜');
    
    // Print the final vote results summary
    await printVoteResultsSummary();
    
    logCompletionBanner('TEST RUN COMPLETED');
}

export default globalTeardown;