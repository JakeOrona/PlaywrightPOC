// tests/third-vote.spec.ts
import { test } from '@playwright/test';
import { VotingHandler } from '../page-objects/voting-handler';
import { loadVotingLink } from '../helpers/methods';
import { addVoteResult } from '../helpers/results-collector';
import { logBanner, logStep } from '../helpers/logging-helpers';
import path from 'path';

test('vote on third server with streamlined flow', async ({ page }) => {
    logBanner('THIRD SERVER VOTING', '🎯');
    
    const votingHandler = new VotingHandler(page);
    const links = 'links.txt'

    // Load third voting link from file
    const votingLink = await loadVotingLink(links, 2);
    
    if (!votingLink) {
        throw new Error("❌ Need at least 3 voting links for third server test.");
    }
    
    logStep(`Starting third server vote: ${votingLink}`, '📌');
    
    const voteResult = await votingHandler.performStreamlinedVote(votingLink);
    
    // Extract server name and save results
    let serverName = 'Second Server';
    try {
        serverName = await votingHandler.getPageTitle() || 'Third Server';
    } catch {
        // Keep default name if extraction fails
    }
    
    // Save result for summary
    await addVoteResult(votingLink, serverName, voteResult);
});