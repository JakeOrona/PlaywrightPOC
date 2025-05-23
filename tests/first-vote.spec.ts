// tests/first-vote.spec.ts
import { test, expect } from '@playwright/test';
import { VotingAndLinksPage } from '../pageObjects/paradiseIslandLinks';
import { loadVotingLinks } from '../helpers/methods';
import { isAuthStateValid, isFirstVoteCompleted, markFirstVoteCompleted } from '../helpers/authHelpers';
import path from 'path';

test('vote on first server using saved authentication', async ({ page }) => {
    const votingPage = new VotingAndLinksPage(page);
    const filePath = path.resolve(__dirname, '../testData/links.txt');
    
    // Load voting links from file
    const votingLinks = await loadVotingLinks(filePath);
    
    if (!votingLinks || votingLinks.length < 1) {
        throw new Error("❌ -Need at least 1 voting link for first server test.");
    }
    
    console.log(`📌 -Checking first server vote status: ${votingLinks[0]}`);
    
    // Check if first vote was already completed during authentication setup in this test run
    const firstVoteCompleted = await isFirstVoteCompleted();
    
    if (firstVoteCompleted) {
        console.log('✅ -First server vote was already completed during authentication setup in this run');
        console.log('🎯 -Skipping redundant first server vote');
        return;
    }
    
    console.log('🗳️ -First server vote not yet completed in this run, proceeding with vote...');
    
    // Navigate to first voting link
    await page.goto(votingLinks[0], { timeout: 60000 });
    console.log(`🌍 -Opened first voting link: ${votingLinks[0]}`);
    
    // Try to use existing auth, fall back to full authentication if needed
    try {
        const authIsValid = await isAuthStateValid();
        
        if (!authIsValid) {
            console.log('⚠️ -No valid auth detected, performing full Steam sign-in...');
            // Perform full Steam sign-in if auth is invalid
            const voteResult = await votingPage.signIn(page);
            console.log('✅ -First server vote completed with fresh authentication:');
            console.log(voteResult);
            
            // Mark that first vote is completed
            await markFirstVoteCompleted();
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
        
        // Mark that first vote is completed
        await markFirstVoteCompleted();
        
    } catch (error) {
        console.log('⚠️ -Auth check failed, attempting full authentication...');
        // Fall back to full authentication if anything goes wrong
        const voteResult = await votingPage.signIn(page);
        console.log('✅ -First server vote completed with fallback authentication:');
        console.log(voteResult);
        
        // Mark that first vote is completed
        await markFirstVoteCompleted();
    }
});