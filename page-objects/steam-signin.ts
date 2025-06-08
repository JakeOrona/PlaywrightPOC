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
     * Step 4: Check Steam page and handle auth accordingly
     * This is the main method that implements your streamlined logic
     */
    async handleSteamAuth(): Promise<void> {
        this.log("Checking Steam page state...", "🔍");

        // Check what type of Steam page we landed on
        const needsSignIn = await this.checkIfSignInRequired();
        
        if (needsSignIn) {
            this.log("Steam sign-in required - auth is invalid/missing", '🔐', 'warning');
            await this.performFullSignIn();
        } else {
            this.log("Already signed in to Steam - auth is valid", '✅', 'success');
            await this.handleAlreadySignedIn();
        }

        // Always capture current auth state after Steam interaction
        await this.captureAuthState();
    }

    /**
     * Checks if Steam sign-in is required by looking for sign-in locators
     */
    private async checkIfSignInRequired(): Promise<boolean> {
        try {
            // Check if any sign-in elements are visible (indicates auth is invalid)
            const signInVisible = await this.signInHeading.isVisible({ timeout: 3000 }).catch(() => false);
            const usernameVisible = await this.usernameInput.isVisible({ timeout: 3000 }).catch(() => false);
            const passwordVisible = await this.passwordInput.isVisible({ timeout: 3000 }).catch(() => false);
            
            return signInVisible || usernameVisible || passwordVisible;
        } catch {
            return false;
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
            try {
                await expect(this.steamUserID).toBeVisible({ timeout: 10000 });
                await expect(this.steamUserID).toHaveText(this.steamUserDisplayName, { timeout: 5000 });
                await expect(this.steamSignInButtonMain).toBeVisible({ timeout: 10000 });
                await this.steamSignInButtonMain.click();
                this.log(`Verified Steam ID and clicked Sign In: ${this.steamUserDisplayName}`, '✅', 'success');
            } catch {
                // Fallback to alternative locators
                this.log("Trying alternative Steam locators...", '🔄');
                await expect(this.steamUserIDAlt).toBeVisible({ timeout: 10000 });
                await expect(this.steamSignInButtonAlt).toBeVisible({ timeout: 10000 });
                await this.steamSignInButtonAlt.click({ force: true });
                this.log(`Alternative Steam sign-in completed`, '✅', 'success');
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