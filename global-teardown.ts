// global-teardown.ts
import { printVoteResultsSummary } from './helpers/resultsCollector';

async function globalTeardown() {
    console.log('\n🏁 -Running global teardown...');
    
    // Print the final vote results summary
    await printVoteResultsSummary();
    
    console.log('🎉 -Test run completed!\n');
}

export default globalTeardown;