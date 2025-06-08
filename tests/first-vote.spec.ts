// tests/first-vote.spec.ts
import { test, expect } from '@playwright/test';
import { VotingHandler } from '../page-objects/voting-handler';
import { loadVotingLink } from '../helpers/methods';
import { addVoteResult } from '../helpers/results-collector';
import { logBanner, logStep, logSuccess, logWarning, logInfo } from '../helpers/logging-helpers';
import path from 'path';

test('vote on first server with authentication handling', async ({ page }) => {
    logBanner('FIRST SERVER VOTING', '🎯');
    
    const votingHandler = new VotingHandler(page); 
    const links = 'links.txt';
    
    // Load voting links from file
    const votingLink = await loadVotingLink(links, 0);
    
    if (!votingLink) {
        throw new Error("❌ Need at least 1 voting link for first server test.");
    }
    
    logStep(`Starting first server vote: ${votingLink}`, '📌');
    
    const voteResult = await votingHandler.performStreamlinedVote(votingLink);
    
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