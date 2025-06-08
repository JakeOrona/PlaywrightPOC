// tests/third-vote.spec.ts
import { test } from '@playwright/test';
import { VotingHandler } from '../page-objects/voting-handler';
import { loadVotingLinks } from '../helpers/methods';
import { addVoteResult } from '../helpers/results-collector';
import { logBanner, logStep } from '../helpers/logging-helpers';
import path from 'path';

test('vote on third server with streamlined flow', async ({ page }) => {
    logBanner('THIRD SERVER VOTING', '🎯');
    
    const votingHandler = new VotingHandler(page);
    const filePath = path.resolve(__dirname, '../testData/links.txt');
    
    // Load voting links from file
    const votingLinks = await loadVotingLinks(filePath);
    
    if (!votingLinks || votingLinks.length < 3) {
        throw new Error("❌ Need at least 3 voting links for third server test.");
    }
    
    logStep(`Starting third server vote: ${votingLinks[2]}`, '📌');
    
    const voteResult = await votingHandler.performStreamlinedVote(votingLinks[2]);
    
    // Extract server name and save results
    let serverName = 'Second Server';
    try {
        serverName = await votingHandler.getPageTitle() || 'Third Server';
    } catch {
        // Keep default name if extraction fails
    }
    
    // Save result for summary
    await addVoteResult(votingLinks[2], serverName, voteResult);
});