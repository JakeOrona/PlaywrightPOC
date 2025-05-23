// tests/first-vote.spec.ts
import { test, expect } from '@playwright/test';
import { VotingAndLinksPage } from '../pageObjects/paradiseIslandLinks';
import { loadVotingLinks } from '../helpers/methods';
import { isAuthStateValid, getAuthFilePath } from '../helpers/authHelpers';
import path from 'path';

test('vote on first server with authentication handling', async ({ page }) => {
    const votingPage = new VotingAndLinksPage(page);
    const filePath = path.resolve(__dirname, '../testData/links.txt');
    
    // Load voting links from file
    const votingLinks = await loadVotingLinks(filePath);
    
    if (!votingLinks || votingLinks.length < 1) {
        throw new Error("❌ -Need at least 1 voting link for first server test.");
    }
    
    console.log(`📌 -Starting first server vote: ${votingLinks[0]}`);
    
    // Navigate to first voting link
    await page.goto(votingLinks[0], { timeout: 60000 });
    console.log(`🌍 -Opened first voting link: ${votingLinks[0]}`);
    
    // Check authentication and handle accordingly
    const authIsValid = await isAuthStateValid();
    
    if (!authIsValid) {
        console.log('⚠️ -No valid auth detected, performing full Steam sign-in...');
        // Perform full Steam sign-in and save auth state
        const voteResult = await votingPage.signIn(page);
        console.log('✅ -First server vote completed with fresh authentication:');
        console.log(voteResult);
        
        // Save the authentication state for future tests
        const authFile = getAuthFilePath();
        await page.context().storageState({ path: authFile });
        console.log(`💾 -Fresh authentication state saved to: ${authFile}`);
        return;
    }
    
    // If auth is valid, proceed with simplified flow
    console.log('✅ -Using existing valid authentication');
    
    // Perform voting actions (no sign-in needed due to saved state)
    await votingPage.clickVoteFlow(page);
    console.log(`🗳️ -Vote process started for first server`);
    
    // Verify Steam sign-in and submit vote
    const steamUserID = page.locator('#openidForm').getByText('Gary_Oak');
    const steamSignInButton = page.getByRole('button', { name: 'Sign In' });
    
    // Wait for elements and click sign-in
    await expect(steamUserID).toBeVisible({ timeout: 40000 });
    await expect(steamSignInButton).toBeVisible({ timeout: 40000 });
    await steamSignInButton.click({ force: true });
    console.log(`🔑 -Steam sign-in completed for first server`);
    
    // Check vote status and log results
    const voteResult = await votingPage.handleVoteStatus(page);
    console.log('✅ -First server vote completed with stored auth:');
    console.log(voteResult);
});