// tests/first-vote.spec.ts
import { test, expect } from '@playwright/test';
import { VotingAndLinksPage } from '../pageObjects/paradiseIslandLinks';
import { loadVotingLinks } from '../helpers/methods';
import { isAuthStateValid, getAuthFilePath, isFirstVoteCompleted } from '../helpers/authHelpers';
import { addVoteResult } from '../helpers/resultsCollector';
import { logBanner, logStep, logSuccess, logWarning, logInfo } from '../helpers/loggingHelpers';
import path from 'path';

test('vote on first server with authentication handling', async ({ page }) => {
    logBanner('FIRST SERVER VOTING', '🎯');
    
    const votingPage = new VotingAndLinksPage(page);
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
    
    // Navigate to first voting link
    await page.goto(votingLinks[0], { timeout: 60000 });
    logStep(`Opened first voting link: ${votingLinks[0]}`, '🌍');
    
    let voteResult: string;
    let serverName = 'First Server';
    
    // Check authentication and handle accordingly
    const authIsValid = await isAuthStateValid();
    
    if (!authIsValid) {
        logWarning('No valid auth detected, performing full Steam sign-in...');
        // Perform full Steam sign-in and save auth state
        voteResult = await votingPage.signIn(page);
        logSuccess('First server vote completed with fresh authentication');
        
        // Save the authentication state for future tests
        const authFile = getAuthFilePath();
        await page.context().storageState({ path: authFile });
        logStep(`Fresh authentication state saved to: ${authFile}`, '💾');
    } else {
        // If auth is valid, proceed with simplified flow
        logSuccess('Using existing valid authentication');
        
        // Perform voting actions (no sign-in needed due to saved state)
        await votingPage.clickVoteFlow(page);
        logStep(`Vote process started for first server`, '🗳️');
        
        // Verify Steam sign-in and submit vote
        const steamUserDisplayName = process.env.STEAM_USER_ID || '';
        if (!steamUserDisplayName) {
            throw new Error("❌ STEAM_USER_ID environment variable is required.");
        }
        const steamUserID = page.locator('#openidForm').getByText(steamUserDisplayName);
        const steamSignInButton = page.getByRole('button', { name: 'Sign In' });
        
        // Wait for elements and click sign-in
        await expect(steamUserID).toBeVisible({ timeout: 40000 });
        await expect(steamSignInButton).toBeVisible({ timeout: 40000 });
        await steamSignInButton.click({ force: true });
        logStep(`Steam sign-in completed for first server`, '🔑');
        
        // Check vote status and log results
        voteResult = await votingPage.handleVoteStatus(page);
        logSuccess('First server vote completed with stored auth');
    }
    
    // Extract server name from page if possible
    try {
        const heading = await page.locator('h1').first().innerText();
        serverName = heading || 'First Server';
    } catch {
        // Keep default name if extraction fails
    }
    
    // Save result for summary
    await addVoteResult(votingLinks[0], serverName, voteResult);
});