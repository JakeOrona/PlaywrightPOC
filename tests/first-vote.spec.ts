// tests/first-vote.spec.ts
import { test, expect } from '@playwright/test';
import { VotingHandler } from '../page-objects/voting-handler';
import { loadVotingLinks } from '../helpers/methods';
import { isFirstVoteCompleted } from '../helpers/auth-helpers';
import { addVoteResult } from '../helpers/results-collector';
import { logBanner, logStep, logSuccess, logWarning, logInfo } from '../helpers/logging-helpers';
import path from 'path';

test('vote on first server with authentication handling', async ({ page }) => {
    logBanner('FIRST SERVER VOTING', '🎯');
    
    const votingHandler = new VotingHandler(page, true); // Enable verbose logging
    const filePath = path.resolve(__dirname, '../testData/links.txt');
    
    // Load voting links from file
    const votingLinks = await loadVotingLinks(filePath);
    
    if (!votingLinks || votingLinks.length < 1) {
        throw new Error("❌ Need at least 1 voting link for first server test.");
    }
    
    // Check if first vote was already completed during auth setup
    const firstVoteAlreadyCompleted = await isFirstVoteCompleted();
    
    if (firstVoteAlreadyCompleted) {
        logInfo('First server vote was already completed during authentication setup');
        logSuccess('Skipping first server test - result already saved during auth');
        // Don't save any results here - auth setup already did it
        return;
    }
    
    logStep(`Starting first server vote: ${votingLinks[0]}`, '📌');
    
    // THIS IS THE MAGIC: All the complex logic is now just one simple call
    // The method will:
    // 1. Navigate to vote page
    // 2. Click vote button
    // 3. Accept terms and click Steam button
    // 4. Check what Steam page we're on and handle accordingly
    // 5. Always capture fresh auth state
    // 6. Process and return vote results
    const voteResult = await votingHandler.performStreamlinedVote(votingLinks[0]);
    
    // Extract server name and save results
    let serverName = 'First Server';
    try {
        serverName = await votingHandler.getPageTitle() || 'First Server';
    } catch {
        // Keep default name if extraction fails
    }
    
    // Save result for summary
    await addVoteResult(votingLinks[0], serverName, voteResult);
});