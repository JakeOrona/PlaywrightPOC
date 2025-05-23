// tests/third-vote.spec.ts
import { test, expect } from '@playwright/test';
import { VotingAndLinksPage } from '../pageObjects/paradiseIslandLinks';
import { loadVotingLinks } from '../helpers/methods';
import { isAuthStateValid } from '../helpers/authHelpers';
import path from 'path';

test('vote on third server using saved authentication', async ({ page }) => {
    const votingPage = new VotingAndLinksPage(page);
    const filePath = path.resolve(__dirname, '../testData/links.txt');
    
    // Load voting links from file
    const votingLinks = await loadVotingLinks(filePath);
    
    if (!votingLinks || votingLinks.length < 3) {
        throw new Error("❌ -Need at least 3 voting links for third server test.");
    }
    
    console.log(`📌 -Starting third server vote: ${votingLinks[2]}`);
    
    // Navigate to third voting link
    await page.goto(votingLinks[2], { timeout: 60000 });
    console.log(`🌍 -Opened third voting link: ${votingLinks[2]}`);
    
    // Try to use existing auth, fall back to full authentication if needed
    try {
        const authIsValid = await isAuthStateValid();
        
        if (!authIsValid) {
            console.log('⚠️ -No valid auth detected, performing full Steam sign-in...');
            // Perform full Steam sign-in if auth is invalid
            const voteResult = await votingPage.signIn(page);
            console.log('✅ -Third server vote completed with fresh authentication:');
            console.log(voteResult);
            return;
        }
        
        // If auth is valid, proceed with simplified flow
        console.log('✅ -Using existing valid authentication');
        
        // Perform voting actions (no sign-in needed due to saved state)
        await votingPage.clickVoteFlow(page);
        console.log(`🗳️ -Vote process started for third server`);
        
        // Verify Steam sign-in and submit vote
        const steamUserID = page.locator('#openidForm').getByText('Gary_Oak');
        const steamSignInButton = page.getByRole('button', { name: 'Sign In' });
        
        // Wait for elements and click sign-in
        await expect(steamUserID).toBeVisible({ timeout: 40000 });
        await expect(steamSignInButton).toBeVisible({ timeout: 40000 });
        await steamSignInButton.click({ force: true });
        console.log(`🔑 -Steam sign-in completed for third server`);
        
        // Check vote status and log results
        const voteResult = await votingPage.handleVoteStatus(page);
        console.log('✅ -Third server vote completed with stored auth:');
        console.log(voteResult);
        
    } catch (error) {
        console.log('⚠️ -Auth check failed, attempting full authentication...');
        // Fall back to full authentication if anything goes wrong
        const voteResult = await votingPage.signIn(page);
        console.log('✅ -Third server vote completed with fallback authentication:');
        console.log(voteResult);
    }
});