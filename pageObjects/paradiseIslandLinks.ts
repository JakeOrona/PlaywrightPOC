import {test, expect, type Locator, type Page } from '@playwright/test';
import dotenv from 'dotenv';
import { loadVotingLinks, handleVoteFormatting } from '../helpers/methods';
import { logBanner, logSubsectionHeader, logStep, logSuccess, logWarning, logDivider } from '../helpers/loggingHelpers';

dotenv.config({ path: 'properties.env' });

export class VotingAndLinksPage {
    readonly page: Page;
    votingLinks: string[];
    voteButton: Locator;
    agreeBox: Locator;
    steamImage: Locator;
    signInText: Locator;
    usernameInput: Locator;
    passwordInput: Locator;
    signInButton: Locator;
    steamMobileAppText: Locator;
    steamSignInButton: Locator;
    steamUserID: Locator;
    voteConfirmation: Locator;
    infoWarningLocator: Locator;
    verboseLogging: boolean;

    constructor(page: Page, verboseLogging: boolean = false) {
        this.page = page;
        this.votingLinks = [];
        this.verboseLogging = verboseLogging;
        this.voteButton = page.locator('//a[@class="btn btn-success mr-1 my-1" and @role="button" and @title="Vote"]');
        this.agreeBox = page.locator('#accept');
        this.steamImage = page.locator('input[type="image"]');
        this.signInText = page.locator('div.g5L61o-ZrHHmwLEugLjLI:has-text("Sign in")');
        this.usernameInput = page
            .locator('form')
            .filter({ hasText: 'Sign in with account' })
            .locator('input[type="text"]');
        this.passwordInput = page.locator('input[type="password"]');
        this.signInButton = page.locator('button.DjSvCZoKKfoNSmarsEcTS[type="submit"]');
        this.steamMobileAppText = page.locator('div._2WgwHabhUV3cP6dHQPybw8:has-text("Use the Steam Mobile App to confirm your sign in...")');
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
     * Loads voting links from a file into the votingLinks array.
     * @param filePath - The path to the text file.
     */
    async loadLinksFromFile(filePath: string): Promise<void> {
        this.log(`Loading voting links from: ${filePath}`, '📂');
        this.votingLinks = await loadVotingLinks(filePath);
        this.log(`Successfully loaded ${this.votingLinks.length} voting links`, '📩', 'success');
    }

    /**
     * Navigates to the specified URL or a default voting page.
     * @param url Optional URL to navigate to.
     */
    async goToHomePage(url?: string): Promise<void> {
        const targetUrl = url || "https://google.com";
        this.log(`Navigating to homepage: ${targetUrl}`, '🌍');
        await test.step(`Navigate to ${targetUrl}`, async () => {
            await this.page.goto(targetUrl, { timeout: 60000 });
        });
        this.log(`Successfully loaded: ${targetUrl}`, '✅', 'success');
    }

    /**
     * Performs the common voting actions:
     * - Clicks the vote button
     * - Checks the acceptance checkbox
     * - Clicks the Steam sign-in image
     * @param tab - The page (or tab) where these actions occur.
     */
    async clickVoteFlow(tab: Page): Promise<void> {
        const voteButton = tab.locator('//a[@class="btn btn-success mr-1 my-1" and @role="button" and @title="Vote"]');
        const agreeBox = tab.locator("#accept");
        const steamImage = tab.locator('input[type="image"]');

        this.log("Initiating vote flow...", "🔹");

        await test.step("Click the vote button", async () => {
            await voteButton.waitFor({ state: "visible", timeout: 8000 });
            await voteButton.click();
            this.log("Vote button clicked", "🗳️");
        });

        await test.step("Accept voting terms", async () => {
            await agreeBox.waitFor({ state: "visible", timeout: 8000 });
            await agreeBox.check();
            this.log("Accepted voting terms", "✔️");
        });

        await test.step("Click Steam sign-in image", async () => {
            await steamImage.waitFor({ state: "visible", timeout: 8000 });
            await steamImage.click();
            this.log("Clicked Steam sign-in image", "👇");
        });

        this.log("Vote flow completed successfully", '✅', 'success');
    }

    /**
     * Handles the sign-in flow on the provided tab.
     * @param tab - The page where sign-in is performed.
     */
    async signIn(tab: Page): Promise<string> {
        let steamUserID: Locator;
        let steamSignInButton: Locator;

        if (this.verboseLogging) {
            logBanner("Steam Authentication Process", "🔐");
        }

        // Perform the common voting actions first.
        await test.step("Perform voting actions", async () => {
            await this.clickVoteFlow(tab);
        });

        // Wait for the sign-in form to be visible.
        await test.step("Wait for Steam sign-in page", async () => {
            await expect(this.signInText).toBeVisible({ timeout: 8000 });
            this.log("Steam sign-in page is visible", '✅', 'success');
        });

        // Fill in Steam credentials and sign in.
        await test.step("Enter Steam credentials and sign in", async () => {
            const userName = process.env.USER_NAME || "";
            const password = process.env.PASSWORD || "";
            await this.usernameInput.fill(userName);
            await this.passwordInput.fill(password);
            await this.signInButton.waitFor({ state: "visible", timeout: 8000 });
            await this.signInButton.click();
            this.log("Credentials entered and submitted", '✅', 'success');
        });

        // Wait for Steam Mobile App confirmation text.
        await test.step("Wait for Steam Mobile login", async () => {
            // Always show Steam mobile app warning regardless of verbose setting
            logDivider('⚠', 60);
            console.log("\x1b[33m⚠️  Steam Mobile App login detected! Open your phone NOW to approve sign-in. ⚠️\x1b[0m");
            logDivider('⚠', 60);
            await expect(this.steamMobileAppText).toBeVisible({ timeout: 40000 });
        });

        // Get Steam User ID and Sign-in Button
        await test.step("Locate Steam user ID and sign-in button selectors", async () => {
            steamUserID = tab.locator(".OpenID_loggedInName");
            steamSignInButton = tab.getByRole("button", { name: "Sign In" });
            this.log("Steam user ID and sign-in button selectors located", "🗺️");
        });

        // Click Steam sign-in button.
        await test.step("Complete Steam sign-in", async () => {
            this.log("Steam Mobile App confirmation detected", "🤳");
            await expect(steamSignInButton).toBeVisible({ timeout: 40000 });
            this.log("Steam user ID and sign-in button are visible", "🙋‍♂️");
            await expect(steamUserID).toHaveText("Gary_Oak", { timeout: 45000 });
            this.log("Verified Steam ID is correct", '✅', 'success');
            await steamSignInButton.click();
            this.log("Clicked Steam Sign-In button", "👇");
        });

        // Check vote status.
        return await test.step("Check vote status", async () => {
            this.log("Checking vote status...", "🔎");
            return await this.handleVoteStatus(tab);
        });
    }

    /**
     * Opens the voting links from a file, handles the Steam sign-in on the first link,
     * and then repeats the voting steps for subsequent links in new tabs.
     */
    async processVotingLinks(): Promise<string[]> {
        const voteResults: string[] = [];

        if (!this.votingLinks || this.votingLinks.length === 0) {
            throw new Error("❌ -No voting links loaded.");
        }

        this.log(`Starting voting process for ${this.votingLinks.length} links`, '📌');
        
        // Open the first voting link to perform sign-in.
        await test.step(`Navigate to first voting link: ${this.votingLinks[0]}`, async () => {
            await this.page.goto(this.votingLinks[0], { timeout: 60000 });
            this.log(`Opened first voting link: ${this.votingLinks[0]}`, '🌍');
        });

        const firstTab = this.page;
        await test.step("Sign in through Steam on the first voting page", async () => {
            const firstResult = await this.signIn(firstTab);
            voteResults.push(firstResult);
            this.log("First vote completed", '✅', 'success');
        });

        // Process the remaining voting links.
        for (let i = 1; i < this.votingLinks.length; i++) {
            const link = this.votingLinks[i];
            let newTab = await this.page.context().newPage();

            // Create a new tab (page) for each additional link.
            await test.step(`Open new tab and navigate to: ${link}`, async () => {
                await newTab.goto(link, { waitUntil: 'load', timeout: 60000 });
                this.log(`Opened new tab for voting: ${link}`, '🌍');
            });

            await test.step("Perform voting actions", async () => {
                // Perform the common voting actions.
                await this.clickVoteFlow(newTab);
                this.log(`Vote process started for: ${link}`, '🗳️');
            });

            await test.step("Verify Steam sign-in and submit vote", async () => {
                // Dynamically create and assign locators for new tabs
                const steamUserID = newTab.locator('#openidForm').getByText('Gary_Oak');
                const steamSignInButton = newTab.getByRole('button', { name: 'Sign In' });

                // Assertions before clicking
                await expect(steamUserID).toBeVisible({ timeout: 40000 });
                await expect(steamSignInButton).toBeVisible({ timeout: 40000 });
                await steamSignInButton.click({ force: true });
                this.log("Steam sign-in completed", '🔑');
            });

            await test.step("Check vote status and store results", async () => {
                // Print vote results
                const formattedResults = await this.handleVoteStatus(newTab);
                voteResults.push(formattedResults);
                this.log(`Vote status recorded for: ${link}`, '📊');
            });
        }

        this.log("All voting links processed successfully", '✅', 'success');
        return voteResults;
    }

    /**
     * Handles different vote statuses on the provided tab:
     * - Checks for an error message and refreshes if necessary.
     * - Confirms successful voting.
     * - Logs informational warnings about voting cooldowns.
     * @param tab - The page/tab where the vote status should be checked.
     */
    async handleVoteStatus(tab: Page): Promise<string> {
        let headingText: string = await test.step("Extract page heading", async () => {
            const extractedHeading = await tab.locator('h1').first().innerText();
            this.log(`Extracted Heading: ${extractedHeading}`, '📌');
            return extractedHeading;
        });

        let voteConfirmed: boolean = await test.step("Check vote confirmation", async () => {
            const isConfirmed = await tab.locator('h1:has-text("Vote Confirmation")').isVisible();
            this.log(`Vote Confirmed: ${isConfirmed}`, '🗳️');
            return isConfirmed;
        });

        let dailyLimitText: string | undefined = undefined;
        let nextVoteText: string | undefined = undefined;

        const dailyVoteLimitLocator = tab.getByText("You have reached your daily");
        const infoWarningLocator = tab.getByText('You will be able to vote');

        await test.step("Check for vote limit warning", async () => {
            if (await dailyVoteLimitLocator.isVisible()) {
                dailyLimitText = await dailyVoteLimitLocator.innerText();
                nextVoteText = (await infoWarningLocator.innerText()).trim();
                this.log(`Daily Vote Limit Reached`, '⚠️', 'warning');
            } else {
                this.log("No vote limit warning detected", '✅', 'success');
            }
        });

        const timestamp = new Date().toISOString().replace(/:/g, "-");
        await tab.screenshot({ path: `./test-results/screenshot-${timestamp}.png` });
        return handleVoteFormatting(headingText, voteConfirmed, dailyLimitText, nextVoteText);
    }
}