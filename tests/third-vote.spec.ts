// tests/third-vote.spec.ts
import { test, expect } from '@playwright/test';
import { VotingAndLinksPage } from '../pageObjects/paradiseIslandLinks';
import { loadVotingLinks } from '../helpers/methods';
import { isAuthStateValid } from '../helpers/authHelpers';
import { addVoteResult } from '../helpers/resultsCollector';
import { logBanner, logStep, logSuccess, logWarning } from '../helpers/loggingHelpers';
import path from 'path';

test('vote on third server using saved authentication', async ({ page }) => {
    logBanner('THIRD SERVER VOTING', '🎯');
    
    const votingPage = new VotingAndLinksPage(page);
    const filePath = path.resolve(__dirname, '../testData/links.txt');
    
    // Load voting links from file
    const votingLinks = await loadVotingLinks(filePath);
    
    if (!votingLinks || votingLinks.length < 3) {
        throw new Error("❌ Need at least 3 voting links for third server test.");
    }
    
    logStep(`Starting third server vote: ${votingLinks[2]}`, '📌');
    
    // Navigate to third voting link
    await page.goto(votingLinks[2], { timeout: 60000 });
    logStep(`Opened third voting link: ${votingLinks[2]}`, '🌍');
    
    let voteResult: string;
    let serverName = 'Third Server';
    
    // Try to use existing auth, fall back to full authentication if needed
    try {
        const authIsValid = await isAuthStateValid();
        
        if (!authIsValid) {
            logWarning('No valid auth detected, performing full Steam sign-in...');
            // Perform full Steam sign-in if auth is invalid
            voteResult = await votingPage.signIn(page);
            logSuccess('Third server vote completed with fresh authentication');
        } else {
            // If auth is valid, proceed with simplified flow
            logSuccess('Using existing valid authentication');
            
            // Perform voting actions (no sign-in needed due to saved state)
            await votingPage.clickVoteFlow(page);
            logStep(`Vote process started for third server`, '🗳️');
            
            // Verify Steam sign-in and submit vote
            const steamUserID = page.locator('#openidForm').getByText('Gary_Oak');
            const steamSignInButton = page.getByRole('button', { name: 'Sign In' });
            
            // Wait for elements and click sign-in
            await expect(steamUserID).toBeVisible({ timeout: 40000 });
            await expect(steamSignInButton).toBeVisible({ timeout: 40000 });
            await steamSignInButton.click({ force: true });
            logStep(`Steam sign-in completed for third server`, '🔑');
            
            // Check vote status and log results
            voteResult = await votingPage.handleVoteStatus(page);
            logSuccess('Third server vote completed with stored auth');
        }
        
    } catch (error) {
        logWarning('Auth check failed, attempting full authentication...');
        // Fall back to full authentication if anything goes wrong
        voteResult = await votingPage.signIn(page);
        logSuccess('Third server vote completed with fallback authentication');
    }
    
    // Extract server name from page if possible
    try {
        const heading = await page.locator('h1').first().innerText();
        serverName = heading || 'Third Server';
    } catch {
        // Keep default name if extraction fails
    }
    
    // Save result for summary (don't display here)
    await addVoteResult(votingLinks[2], serverName, voteResult);
});