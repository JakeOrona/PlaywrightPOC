// tests/auth.setup.ts
import { test as setup } from '@playwright/test';
import { VotingAndLinksPage } from '../pageObjects/paradiseIslandLinks';
import { loadVotingLinks } from '../helpers/methods';
import { isAuthStateValid, ensureAuthDirectoryExists, clearAuthState, getAuthFilePath, markFirstVoteCompleted } from '../helpers/authHelpers';
// REMOVED: import { addVoteResult } from '../helpers/resultsCollector';
import path from 'path';

setup('ensure valid authentication state', async ({ page }) => {
    console.log('🔐 Authentication setup');
    
    // Ensure auth directory exists
    await ensureAuthDirectoryExists();
    
    // Check if existing auth is valid
    const authIsValid = await isAuthStateValid();
    
    if (authIsValid) {
        console.log('✅ Authentication setup skipped - existing state is valid');
        return;
    }
    
    console.log('🔄 Performing fresh authentication...');
    
    // Clear any existing auth state
    await clearAuthState();
    
    // Use non-verbose logging for cleaner auth setup output
    const votingPage = new VotingAndLinksPage(page, false);
    const filePath = path.resolve(__dirname, '../testData/links.txt');
    
    // Load voting links from file
    const votingLinks = await loadVotingLinks(filePath);
    
    if (!votingLinks || votingLinks.length === 0) {
        throw new Error("❌ -No voting links loaded for authentication setup.");
    }
    
    // Navigate to first voting link for authentication only
    await page.goto(votingLinks[0], { timeout: 60000 });
    
    // Perform Steam sign-in and vote (needed to complete the auth flow)
    const voteResult = await votingPage.signIn(page);
    
    // Save the authentication state
    const authFile = getAuthFilePath();
    await page.context().storageState({ path: authFile });
    
    // Mark that first vote was completed during authentication
    await markFirstVoteCompleted();
    console.log('✅ Authentication setup completed - First server vote completed during auth');
});