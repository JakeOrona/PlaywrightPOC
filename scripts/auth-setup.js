// scripts/authSetup.js
const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: 'properties.env' });

/**
 * Simplified Steam Authentication Setup
 * Uses direct Playwright code instead of TypeScript page objects
 */
class AuthSetup {
    constructor() {
        this.browser = null;
        this.page = null;
        this.context = null;
    }

    async log(message, emoji = '🔐') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${emoji} ${message}`);
    }

    /**
     * Check if auth state is valid (less than 7 days old)
     */
    async isAuthStateValid() {
        try {
            const authFile = 'playwright/.auth/user.json';
            const authExists = await fs.access(authFile).then(() => true).catch(() => false);
            if (!authExists) {
                return false;
            }

            const stats = await fs.stat(authFile);
            const fileAge = Date.now() - stats.mtime.getTime();
            const maxAge = 168 * 60 * 60 * 1000; // 7 days in milliseconds
            
            return fileAge < maxAge;
        } catch {
            return false;
        }
    }

    /**
     * Clear existing auth state
     */
    async clearAuthState() {
        try {
            await fs.unlink('playwright/.auth/user.json');
            this.log('🗑️ Cleared existing auth');
        } catch {
            // File doesn't exist, which is fine
        }
    }

    /**
     * Ensure auth directory exists
     */
    async ensureAuthDirectoryExists() {
        try {
            await fs.mkdir('playwright/.auth', { recursive: true });
        } catch {
            // Directory might already exist
        }
    }

    /**
     * Load voting links from file
     */
    async loadVotingLink() {
        try {
            const filePath = path.resolve('test-data/links.txt');
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const lines = fileContent.split('\n');
            
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;
                
                const match = trimmedLine.match(/https?:\/\/[^\s]+/);
                if (match) {
                    return match[0]; // Return first valid URL found
                }
            }
            throw new Error('No valid voting links found in links.txt');
        } catch (error) {
            throw new Error(`Could not load voting links: ${error.message}`);
        }
    }

    /**
     * Main method: Check if auth is needed and set it up if required
     */
    async ensureAuthenticationReady(forceRefresh = false) {
        try {
            this.log('Checking authentication state...');
            
            // Check if we need to authenticate
            const authValid = await this.isAuthStateValid();
            
            if (authValid && !forceRefresh) {
                this.log('✅ Authentication already valid - skipping setup');
                return true;
            }

            if (forceRefresh) {
                this.log('🔄 Force refresh requested - clearing existing auth');
                await this.clearAuthState();
            }

            this.log('🚀 Setting up fresh Steam authentication...');
            
            // Set up browser and perform authentication
            await this.setupBrowser();
            await this.performAuthentication();
            await this.cleanup();
            
            this.log('✅ Authentication setup completed');
            return true;
            
        } catch (error) {
            this.log(`❌ Authentication setup failed: ${error.message}`);
            await this.cleanup();
            throw error;
        }
    }

    /**
     * Set up browser context for authentication
     */
    async setupBrowser() {
        this.log('Setting up browser...');
        
        await this.ensureAuthDirectoryExists();
        
        this.browser = await chromium.launch({ 
            headless: false // Show browser for Steam mobile app approval
        });
        
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();
    }

    /**
     * Perform the actual Steam authentication process
     */
    async performAuthentication() {
        try {
            this.log('Starting Steam authentication...');
            
            // Get a voting URL to trigger Steam auth
            const testVotingUrl = await this.loadVotingLink();

            // Navigate to voting page and trigger Steam auth
            await this.page.goto(testVotingUrl, { timeout: 60000 });

            // Click vote button
            const voteButton = this.page.locator('//a[@class="btn btn-success mr-1 my-1" and @role="button" and @title="Vote"]');
            await voteButton.waitFor({ state: "visible", timeout: 8000 });
            await voteButton.click();

            // Accept terms and click Steam
            const agreeBox = this.page.locator('#accept');
            await agreeBox.waitFor({ state: "visible", timeout: 8000 });
            await agreeBox.check();
            
            const steamLoginButton = this.page.locator('input[type="image"]');
            await steamLoginButton.waitFor({ state: "visible", timeout: 8000 });
            await steamLoginButton.click();

            // Handle Steam authentication (this will save auth state)
            await this.handleSteamAuth();

            this.log('✅ Steam authentication setup completed');

        } catch (error) {
            this.log(`Authentication process failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Handle Steam authentication flow
     */
    async handleSteamAuth() {
        this.log('Processing Steam authentication...');
        
        // Wait a moment for page to load
        await this.page.waitForTimeout(3000);
        
        // Check if we need to sign in or if we're already signed in
        const needsSignIn = await this.checkIfSignInRequired();
        
        if (needsSignIn) {
            this.log('Performing full Steam sign-in...');
            await this.performFullSignIn();
        } else {
            this.log('Already signed in to Steam...');
            await this.handleAlreadySignedIn();
        }
    }

    /**
     * Check if Steam sign-in is required
     */
    async checkIfSignInRequired() {
        try {
            // Check for sign-in elements
            const signInHeading = this.page.getByText('Sign in', { exact: true }).first();
            const usernameInput = this.page.locator('input[type="text"]').first();
            const passwordInput = this.page.locator('input[type="password"]');
            
            const signInVisible = await signInHeading.isVisible({ timeout: 3000 }).catch(() => false);
            const usernameVisible = await usernameInput.isVisible({ timeout: 3000 }).catch(() => false);
            const passwordVisible = await passwordInput.isVisible({ timeout: 3000 }).catch(() => false);
            
            // Check for user confirmation elements
            const steamUserDisplayName = process.env.STEAM_USER_ID || '';
            const userIdElement = this.page.locator('.OpenID_loggedInName');
            const userIdVisible = await userIdElement.isVisible({ timeout: 3000 }).catch(() => false);
            
            this.log(`Sign-in elements: ${signInVisible || usernameVisible || passwordVisible}`);
            this.log(`User elements: ${userIdVisible}`);
            
            // If sign-in elements are visible, we need to sign in
            if (signInVisible || usernameVisible || passwordVisible) {
                return true;
            }
            
            // If user elements are visible, we're already signed in
            if (userIdVisible) {
                return false;
            }
            
            // Default to needing sign-in if unclear
            return true;
            
        } catch (error) {
            this.log(`Error checking sign-in state: ${error.message}`);
            return true; // Default to needing sign-in
        }
    }

    /**
     * Perform full Steam sign-in
     */
    async performFullSignIn() {
        try {
            // Enter credentials
            const userName = process.env.USER_NAME || '';
            const password = process.env.PASSWORD || '';
            
            if (!userName || !password) {
                throw new Error('Steam credentials not found in environment variables');
            }
            
            const usernameInput = this.page.locator('input[type="text"]').first();
            const passwordInput = this.page.locator('input[type="password"]');
            const signInButton = this.page.getByRole('button', { name: 'Sign in' });
            
            await usernameInput.fill(userName);
            await passwordInput.fill(password);
            await signInButton.click();
            
            this.log('✅ Credentials submitted');
            
            // Handle mobile app confirmation
            this.log('⚠️  Steam login detected! Open your phone NOW to approve sign-in. ⚠️');
            
            const steamMobileAppText = this.page.getByText('Use the Steam Mobile App to confirm your sign in...').first();
            await steamMobileAppText.waitFor({ state: 'visible', timeout: 30000 });
            
            // Wait for mobile approval and save auth
            await this.waitForSteamApproval();
            
        } catch (error) {
            throw new Error(`Full sign-in failed: ${error.message}`);
        }
    }

    /**
     * Handle already signed in state
     */
    async handleAlreadySignedIn() {
        try {
            const steamUserDisplayName = process.env.STEAM_USER_ID || '';
            
            // Find and click Sign In button
            const signInButton = this.page.getByRole('button', { name: 'Sign In' }).first();
            await signInButton.waitFor({ state: 'visible', timeout: 10000 });
            await signInButton.click();
            
            this.log(`✅ Clicked Steam Sign In for: ${steamUserDisplayName}`);
            
        } catch (error) {
            throw new Error(`Already signed in handling failed: ${error.message}`);
        }
    }

    /**
     * Wait for Steam approval and save auth state
     */
    async waitForSteamApproval() {
        try {
            this.log('Waiting for Steam mobile approval...');
            
            const steamUserDisplayName = process.env.STEAM_USER_ID || '';
            if (!steamUserDisplayName) {
                throw new Error('STEAM_USER_ID not found in environment variables');
            }
            
            // Wait for mobile approval and username to appear
            let attempts = 0;
            const maxAttempts = 60; // 60 seconds total
            
            while (attempts < maxAttempts) {
                // Try multiple ways to find the username
                let usernameFound = false;
                
                // Method 1: Exact text match
                const exactMatch = await this.page.getByText(steamUserDisplayName, { exact: true }).isVisible({ timeout: 1000 }).catch(() => false);
                if (exactMatch) {
                    usernameFound = true;
                }
                
                // Method 2: Partial text match
                if (!usernameFound) {
                    const partialMatch = await this.page.getByText(steamUserDisplayName).isVisible({ timeout: 1000 }).catch(() => false);
                    if (partialMatch) {
                        usernameFound = true;
                    }
                }
                
                // Method 3: Check page content directly
                if (!usernameFound) {
                    const pageContent = await this.page.content().catch(() => '');
                    if (pageContent.includes(steamUserDisplayName)) {
                        usernameFound = true;
                    }
                }
                
                // Method 4: Check common Steam username selectors
                if (!usernameFound) {
                    const steamSelectors = [
                        '.persona_name',
                        '.OpenID_loggedInName',
                        '.username',
                        '.user_name',
                        '.displayname'
                    ];
                    
                    for (const selector of steamSelectors) {
                        try {
                            const element = this.page.locator(selector);
                            const text = await element.textContent({ timeout: 1000 }).catch(() => '');
                            if (text && text.includes(steamUserDisplayName)) {
                                usernameFound = true;
                                break;
                            }
                        } catch {
                            // Continue to next selector
                        }
                    }
                }
                
                if (usernameFound) {
                    this.log(`✅ Steam authentication confirmed for: ${steamUserDisplayName}`);
                    
                    // Auth is good at this point - save the state and exit
                    await this.context.storageState({ path: 'playwright/.auth/user.json' });
                    this.log('💾 Authentication state saved');
                    
                    return; // Exit - auth setup is complete
                }
                
                attempts++;
                await this.page.waitForTimeout(1000);
            }
            
            // If we get here, we timed out
            throw new Error(`Timeout waiting for Steam user "${steamUserDisplayName}" to appear after mobile approval`);
            
        } catch (error) {
            this.log(`❌ Steam approval failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Clean up browser resources
     */
    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

// Command line interface
async function main() {
    const command = process.argv[2];
    const authSetup = new AuthSetup();
    
    try {
        if (command === 'force') {
            await authSetup.ensureAuthenticationReady(true);
        } else if (command === 'check') {
            const isValid = await authSetup.isAuthStateValid();
            console.log(`🔐 Auth state valid: ${isValid}`);
            if (isValid) {
                console.log('✅ Ready for parallel test execution');
            } else {
                console.log('⚠️  Authentication setup required');
            }
        } else {
            await authSetup.ensureAuthenticationReady(false);
        }
    } catch (error) {
        console.error('❌ Auth setup failed:', error);
        process.exit(1);
    }
}

// Export for use in other scripts
module.exports = { AuthSetup };

// Run if called directly
if (require.main === module) {
    main();
}