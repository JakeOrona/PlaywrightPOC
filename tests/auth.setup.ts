// tests/auth.setup.ts
import { test as setup } from '@playwright/test';
import { VotingAndLinksPage } from '../pageObjects/paradiseIslandLinks';
import { loadVotingLinks } from '../helpers/methods';
import { isAuthStateValid, ensureAuthDirectoryExists, clearAuthState, getAuthFilePath, markFirstVoteCompleted } from '../helpers/authHelpers';
import path from 'path';

setup('ensure valid authentication state', async ({ page }) => {
    console.log('🔐 -Checking authentication state...');
    
    // Ensure auth directory exists
    await ensureAuthDirectoryExists();
    
    // Check if existing auth is valid
    const authIsValid = await isAuthStateValid();
    
    if (authIsValid) {
        console.log('✅ -Existing authentication state is valid, no setup needed');
        return;
    }
    
    console.log('🔄 -Authentication state is invalid or missing, performing fresh login...');
    
    // Clear any existing auth state
    await clearAuthState();
    
    const votingPage = new VotingAndLinksPage(page);
    const filePath = path.resolve(__dirname, '../testData/links.txt');
    
    // Load voting links from file
    const votingLinks = await loadVotingLinks(filePath);
    
    if (!votingLinks || votingLinks.length === 0) {
        throw new Error("❌ -No voting links loaded for authentication setup.");
    }
    
    console.log(`📌 -Performing authentication using first server: ${votingLinks[0]}`);
    
    // Navigate to first voting link for authentication only
    await page.goto(votingLinks[0], { timeout: 60000 });
    console.log(`🌍 -Opened first voting link for authentication: ${votingLinks[0]}`);
    
    // Perform Steam sign-in and vote (needed to complete the auth flow)
    const voteResult = await votingPage.signIn(page);
    console.log('✅ -Authentication completed. Vote result from auth setup:');
    console.log(voteResult);
    
    // Save the authentication state
    const authFile = getAuthFilePath();
    await page.context().storageState({ path: authFile });
    console.log(`💾 -Authentication state saved to: ${authFile}`);
    
    // Mark that first vote was completed during authentication
    await markFirstVoteCompleted();
    console.log('🎯 -Authentication setup complete. First server vote completed during auth setup.');
});