// pageObjects/SteamSignInPage.ts - STREAMLINED VERSION
import { test, expect, type Locator, type Page } from '@playwright/test';
import { logStep, logSuccess, logWarning, logDivider } from '../helpers/logging-helpers';
import { refreshAuthState } from '../helpers/auth-helpers';
import dotenv from 'dotenv';

dotenv.config({ path: 'properties.env' });

/**
 * Streamlined SteamSignInPage - handles Steam auth detection and processing
 */
export class SteamSignInPage {
    readonly page: Page;
    readonly steamUserDisplayName: string;
    readonly verboseLogging: boolean;

    // Steam login page locators (when auth is invalid/missing)
    readonly signInHeading: Locator;
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly signInButton: Locator;
    readonly steamMobileAppText: Locator;

    // Steam signed-in page locators (when auth is valid)
    readonly steamUserID: Locator;
    readonly steamSignInButtonMain: Locator;
    readonly steamUserIDAlt: Locator;
    readonly steamSignInButtonAlt: Locator;

    constructor(page: Page, verboseLogging: boolean = false) {
        this.page = page;
        this.verboseLogging = verboseLogging;
        
        // Load Steam User ID from environment variable with validation
        this.steamUserDisplayName = process.env.STEAM_USER_ID || "";
        if (!this.steamUserDisplayName) {
            throw new Error("❌ STEAM_USER_ID environment variable is required. Please set it in your properties.env file.");
        }
        
        if (this.verboseLogging) {
            console.log(`🔑 Using Steam User ID: ${this.steamUserDisplayName}`);
        }
        
        // Steam login page locators (when we need to sign in)
        this.signInHeading = page.getByText('Sign in', { exact: true }).first();
        this.usernameInput = page
            .locator('form')
            .filter({ hasText: 'Sign in with account' })
            .locator('input[type="text"]');
        this.passwordInput = page.locator('input[type="password"]');
        this.signInButton = page.getByRole('button', { name: 'Sign in' });
        this.steamMobileAppText = page.getByText('Use the Steam Mobile App to confirm your sign in...').first();

        // Steam signed-in page locators (when we're already signed in)
        this.steamUserID = page.locator(".OpenID_loggedInName");
        this.steamSignInButtonMain = page.getByRole("button", { name: "Sign In" });
        this.steamUserIDAlt = page.locator('#openidForm').getByText(this.steamUserDisplayName);
        this.steamSignInButtonAlt = page.getByRole('button', { name: 'Sign In' });
    }

    /**
     * Conditional logging based on verbose flag
     */
    private log(message: string, emoji: string = '📝', level: 'step' | 'success' | 'warning' = 'step'): void {
        if (this.verboseLogging) {
            switch (level) {
                case 'step':
                    logStep(message, emoji);
                    break;
                case 'success':
                    logSuccess(message, emoji);
                    break;
                case 'warning':
                    logWarning(message, emoji);
                    break;
            }
        }
    }

    /**
     * Check Steam page and handle auth accordingly
     */
    async handleSteamAuth(): Promise<void> {
        this.log("Checking Steam page state...", "🔍");

        // Check what type of Steam page we landed on
        const steamPageState = await this.determinePageState();
        
        if (steamPageState === 'needs-signin') {

            this.log("Steam sign-in required - auth is invalid/missing", '🔐', 'warning');
            await this.performFullSignIn();
        } else if (steamPageState === 'already-signed-in') {
            this.log("Already signed in to Steam - auth is valid", '✅', 'success');
            await this.handleAlreadySignedIn();
        } else {
            this.log("Unable to determine Steam page state - proceeding with full sign-in", '❓', 'warning');
            await this.performFullSignIn();
        }

        // Always capture current auth state after Steam interaction
        await this.captureAuthState();
    }

    /**
     * Determine the Steam page state for auth handling
     * Returns 'needs-signin' if auth is invalid/missing
     * Returns 'already-signed-in' if auth is valid
     * Returns 'unknown' if unable to determine state
     */
    private async determinePageState(): Promise<'needs-signin' | 'already-signed-in' | 'unknown'> {
        try {
            this.log("Analyzing Steam page elements...", "🔍");
            
            // Wait a moment for page to fully load
            await this.page.waitForTimeout(2000);
            
            // Check for sign-in elements (indicates auth is invalid)
            const signInVisible = await this.signInHeading.isVisible({ timeout: 3000 }).catch(() => false);
            const usernameVisible = await this.usernameInput.isVisible({ timeout: 3000 }).catch(() => false);
            const passwordVisible = await this.passwordInput.isVisible({ timeout: 3000 }).catch(() => false);
            
            // Check for already-signed-in elements (indicates auth is valid)
            const userIdVisible = await this.steamUserID.isVisible({ timeout: 3000 }).catch(() => false);
            const userIdAltVisible = await this.steamUserIDAlt.isVisible({ timeout: 3000 }).catch(() => false);
            const signInBtnVisible = await this.steamSignInButtonMain.isVisible({ timeout: 3000 }).catch(() => false);
            const signInBtnAltVisible = await this.steamSignInButtonAlt.isVisible({ timeout: 3000 }).catch(() => false);
            
            this.log(`Sign-in elements visible: signIn=${signInVisible}, username=${usernameVisible}, password=${passwordVisible}`, "📊");
            this.log(`User elements visible: userId=${userIdVisible}, userIdAlt=${userIdAltVisible}, signInBtn=${signInBtnVisible}, signInBtnAlt=${signInBtnAltVisible}`, "📊");
            
            // If sign-in elements are present, we need to sign in
            if (signInVisible || usernameVisible || passwordVisible) {
                this.log("Detected sign-in page elements", "🔐");
                return 'needs-signin';
            }
            
            // If user confirmation elements are present, we're already signed in
            if ((userIdVisible || userIdAltVisible) && (signInBtnVisible || signInBtnAltVisible)) {
                this.log("Detected user confirmation elements", "✅");
                return 'already-signed-in';
            }
            
            // If we can't determine the state clearly, log page content for debugging
            this.log("Could not determine page state clearly", "❓", 'warning');
            
            // Log current page URL and title for debugging
            const url = this.page.url();
            const title = await this.page.title().catch(() => 'Unknown');
            this.log(`Current page - URL: ${url}, Title: ${title}`, "🌐");
            
            // Default to unknown, which will trigger full sign-in
            return 'unknown';
            
        } catch (error) {
            this.log(`Error determining page state: ${error}`, "❌", 'warning');
            return 'unknown';
        }
    }

    /**
     * Performs full sign-in when auth is invalid/missing
     */
    private async performFullSignIn(): Promise<void> {
        // Enter login info and perform manual sign in
        await test.step("Enter Steam credentials", async () => {
            const userName = process.env.USER_NAME || "";
            const password = process.env.PASSWORD || "";
            
            if (!userName || !password) {
                throw new Error("❌ Steam credentials not found in environment variables");
            }
            
            await this.usernameInput.fill(userName);
            await this.passwordInput.fill(password);
            await this.signInButton.click();
            this.log("Credentials entered and submitted", '🔑');
        });

        // Handle mobile app confirmation
        await test.step("Handle mobile app confirmation", async () => {
            logDivider('⚠', 60);
            console.log("\x1b[33m⚠️  Steam login detected! Open your phone NOW to approve sign-in. ⚠️\x1b[0m");
            logDivider('⚠', 60);
            
            await expect(this.steamMobileAppText).toBeVisible({ timeout: 30000 });
        });

        // Verify successful signed-in locators and click button
        await this.verifyAndClickSignIn();
    }

    /**
     * Handles case when already signed in to Steam
     */
    private async handleAlreadySignedIn(): Promise<void> {
        // Verify successful signed-in locators and click button
        await this.verifyAndClickSignIn();
    }

    /**
     * Verify successful signed-in locators and click button to progress
     */
    private async verifyAndClickSignIn(): Promise<void> {
        await test.step("Verify Steam user and click Sign In", async () => {
            await this.page.waitForTimeout(3000);
            
            try {
                // Try main locators first
                this.log("Attempting to verify Steam user with main locators...", "🔍");
                await expect(this.steamUserID).toBeVisible({ timeout: 10000 });
                await expect(this.steamUserID).toHaveText(this.steamUserDisplayName, { timeout: 5000 });
                await expect(this.steamSignInButtonMain).toBeVisible({ timeout: 10000 });
                await this.steamSignInButtonMain.click();
                this.log(`Verified Steam ID and clicked Sign In: ${this.steamUserDisplayName}`, '✅', 'success');
                
            } catch (mainError) {
                this.log("Main locators failed, trying alternative approach...", '🔄', 'warning');
                
                try {
                    // Try alternative locators
                    this.log("Attempting to verify Steam user with alternative locators...", "🔍");
                    await expect(this.steamUserIDAlt).toBeVisible({ timeout: 10000 });
                    await expect(this.steamSignInButtonAlt).toBeVisible({ timeout: 10000 });
                    await this.steamSignInButtonAlt.click({ force: true });
                    this.log(`Alternative Steam sign-in completed`, '✅', 'success');
                    
                } catch (altError) {
                    // Last resort: try to find any Sign In button
                    this.log("Alternative locators also failed, trying fallback approach...", '🔄', 'warning');
                    
                    // Log page content for debugging
                    const pageContent = await this.page.content();
                    this.log(`Current page URL: ${this.page.url()}`, "🌐");
                    
                    // Try to find any button with "Sign In" text
                    const anySignInButton = this.page.getByRole('button').filter({ hasText: /Sign In/i }).first();
                    if (await anySignInButton.isVisible({ timeout: 5000 })) {
                        await anySignInButton.click();
                        this.log("Clicked fallback Sign In button", '⚡', 'success');
                    } else {
                        // If we still can't find anything, throw a more descriptive error
                        throw new Error(`❌ Could not find Steam user confirmation elements. Expected user: ${this.steamUserDisplayName}. Current URL: ${this.page.url()}`);
                    }
                }
            }
        });
    }

    /**
     * Capture valid auth storage state
     */
    private async captureAuthState(): Promise<void> {
        await test.step("Capture current auth state", async () => {
            await refreshAuthState(this.page);
            this.log("Auth state captured successfully", '💾', 'success');
        });
    }
}