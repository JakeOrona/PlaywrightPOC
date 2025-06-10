// tests/third-vote.spec.ts
import { test } from '@playwright/test';
import { VotingOnlyHandler } from '../page-objects/voting-only-handler';
import { loadVotingLink } from '../helpers/methods';
import { addVoteResult } from '../helpers/results-collector';
import { logBanner, logStep } from '../helpers/logging-helpers';

test('vote on third server (auth pre-established)', async ({ page }) => {
    logBanner('THIRD SERVER VOTING', '🎯');
    
    const votingHandler = new VotingOnlyHandler(page);
    const links = 'links.txt';

    // Load third voting link from file
    const votingLink = await loadVotingLink(links, 2);
    
    if (!votingLink) {
        throw new Error("❌ Need at least 3 voting links for third server test.");
    }
    
    logStep(`Starting third server vote: ${votingLink}`, '📌');
    
    // Use simplified voting flow (auth already established in Phase 1)
    const voteResult = await votingHandler.performVote(votingLink);
    
    // Extract server name and save results
    let serverName = 'Third Server';
    try {
        serverName = await votingHandler.getPageTitle() || 'Third Server';
    } catch {
        // Keep default name if extraction fails
    }
    
    // Save result for summary
    await addVoteResult(votingLink, serverName, voteResult);
});