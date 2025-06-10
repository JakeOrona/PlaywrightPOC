// tests/second-vote.spec.ts
import { test } from '@playwright/test';
import { VotingOnlyHandler } from '../page-objects/voting-only-handler';
import { loadVotingLink } from '../helpers/methods';
import { addVoteResult } from '../helpers/results-collector';
import { logBanner, logStep } from '../helpers/logging-helpers';

test('vote on second server (auth pre-established)', async ({ page }) => {
    logBanner('SECOND SERVER VOTING', '🎯');
    
    const votingHandler = new VotingOnlyHandler(page);
    const links = 'links.txt';

    // Load voting links from file
    const votingLink = await loadVotingLink(links, 1);
    
    if (!votingLink) {
        throw new Error("❌ Need at least 2 voting links for second server test.");
    }
    
    logStep(`Starting second server vote: ${votingLink}`, '📌');
    
    // Use simplified voting flow (auth already established in Phase 1)
    const voteResult = await votingHandler.performVote(votingLink);
    
    // Extract server name and save results
    let serverName = 'Second Server';
    try {
        serverName = await votingHandler.getPageTitle() || 'Second Server';
    } catch {
        // Keep default name if extraction fails
    }
    
    // Save result for summary
    await addVoteResult(votingLink, serverName, voteResult);
});