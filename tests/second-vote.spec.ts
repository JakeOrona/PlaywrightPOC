// tests/second-vote.spec.ts
import { test, expect } from '@playwright/test';
import { VotingAndLinksPage } from '../pageObjects/paradiseIslandLinks';
import { loadVotingLinks } from '../helpers/methods';
import { isAuthStateValid } from '../helpers/authHelpers';
import { addVoteResult } from '../helpers/resultsCollector';
import { logSectionHeader, logStep, logSuccess, logWarning } from '../helpers/loggingHelpers';
import path from 'path';

test('vote on second server using saved authentication', async ({ page }) => {
    logSectionHeader('SECOND SERVER VOTING', '🎯');
    
    const votingPage = new VotingAndLinksPage(page);
    const filePath = path.resolve(__dirname, '../testData/links.txt');
    
    // Load voting links from file
    const votingLinks = await loadVotingLinks(filePath);
    
    if (!votingLinks || votingLinks.length < 2) {
        throw new Error("❌ Need at least 2 voting links for second server test.");
    }
    
    logStep(`Starting second server vote: ${votingLinks[1]}`, '📌');
    
    // Navigate to second voting link
    await page.goto(votingLinks[1], { timeout: 60000 });
    logStep(`Opened second voting link: ${votingLinks[1]}`, '🌍');
    
    let voteResult: string;
    let serverName = 'Second Server';
    
    // Try to use existing auth, fall back to full authentication if needed
    try {
        const authIsValid = await isAuthStateValid();
        
        if (!authIsValid) {
            logWarning('No valid auth detected, performing full Steam sign-in...');
            // Perform full Steam sign-in if auth is invalid
            voteResult = await votingPage.signIn(page);
            logSuccess('Second server vote completed with fresh authentication');
            console.log(voteResult);
        } else {
            // If auth is valid, proceed with simplified flow
            logSuccess('Using existing valid authentication');
            
            // Perform voting actions (no sign-in needed due to saved state)
            await votingPage.clickVoteFlow(page);
            logStep(`Vote process started for second server`, '🗳️');
            
            // Verify Steam sign-in and submit vote
            const steamUserID = page.locator('#openidForm').getByText('Gary_Oak');
            const steamSignInButton = page.getByRole('button', { name: 'Sign In' });
            
            // Wait for elements and click sign-in
            await expect(steamUserID).toBeVisible({ timeout: 40000 });
            await expect(steamSignInButton).toBeVisible({ timeout: 40000 });
            await steamSignInButton.click({ force: true });
            logStep(`Steam sign-in completed for second server`, '🔑');
            
            // Check vote status and log results
            voteResult = await votingPage.handleVoteStatus(page);
            logSuccess('Second server vote completed with stored auth');
            console.log(voteResult);
        }
        
    } catch (error) {
        logWarning('Auth check failed, attempting full authentication...');
        // Fall back to full authentication if anything goes wrong
        voteResult = await votingPage.signIn(page);
        logSuccess('Second server vote completed with fallback authentication');
        console.log(voteResult);
    }
    
    // Extract server name from page if possible
    try {
        const heading = await page.locator('h1').first().innerText();
        serverName = heading || 'Second Server';
    } catch {
        // Keep default name if extraction fails
    }
    
    // Save result for summary
    await addVoteResult(votingLinks[1], serverName, voteResult);
});