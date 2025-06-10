// tests/first-vote.spec.ts
import { test } from '@playwright/test';
import { VotingOnlyHandler } from '../page-objects/voting-only-handler';
import { loadVotingLink } from '../helpers/methods';
import { addVoteResult } from '../helpers/results-collector';
import { logBanner, logStep } from '../helpers/logging-helpers';

test('vote on first server (auth pre-established)', async ({ page }) => {
    logBanner('FIRST SERVER VOTING', '🎯');
    
    const votingHandler = new VotingOnlyHandler(page); 
    const links = 'links.txt';
    
    // Load voting links from file
    const votingLink = await loadVotingLink(links, 0);
    
    if (!votingLink) {
        throw new Error("❌ Need at least 1 voting link for first server test.");
    }
    
    logStep(`Starting first server vote: ${votingLink}`, '📌');
    
    // Use simplified voting flow (auth already established in Phase 1)
    const voteResult = await votingHandler.performVote(votingLink);
    
    // Extract server name and save results
    let serverName = 'First Server';
    try {
        serverName = await votingHandler.getPageTitle() || 'First Server';
    } catch {
        // Keep default name if extraction fails
    }
    
    // Save result for summary
    await addVoteResult(votingLink, serverName, voteResult);
});