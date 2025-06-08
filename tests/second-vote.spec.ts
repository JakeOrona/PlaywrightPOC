// tests/second-vote.spec.ts
import { test } from '@playwright/test';
import { VotingHandler } from '../page-objects/voting-handler';
import { loadVotingLink } from '../helpers/methods';
import { addVoteResult } from '../helpers/results-collector';
import { logBanner, logStep } from '../helpers/logging-helpers';
import path from 'path';

test('vote on second server with streamlined flow', async ({ page }) => {
    logBanner('SECOND SERVER VOTING', '🎯');
    
    const votingHandler = new VotingHandler(page);
    const links = 'links.txt';

    // Load voting links from file
    const votingLink = await loadVotingLink(links, 1);
    
    if (!votingLink) {
        throw new Error("❌ Need at least 2 voting links for second server test.");
    }
    
    logStep(`Starting second server vote: ${votingLink}`, '📌');
    
    const voteResult = await votingHandler.performStreamlinedVote(votingLink);
    
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