// pageObjects/VotingPage.ts - STREAMLINED VERSION
import { test, expect, type Locator, type Page } from '@playwright/test';
import { logStep, logSuccess, logWarning } from '../helpers/logging-helpers';
import { handleVoteFormatting } from '../helpers/methods';

/**
 * Streamlined VotingPage - handles the voting flow and vote results
 */
export class VotingPage {
    readonly page: Page;
    readonly voteButton: Locator;
    readonly agreeBox: Locator;
    readonly steamLoginButton: Locator;
    readonly verboseLogging: boolean;

    constructor(page: Page, verboseLogging: boolean = false) {
        this.page = page;
        this.verboseLogging = verboseLogging;
        
        // Initial voting page locators
        this.voteButton = page.locator('//a[@class="btn btn-success mr-1 my-1" and @role="button" and @title="Vote"]');
        this.agreeBox = page.locator('#accept');
        this.steamLoginButton = page.locator('input[type="image"]');
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
     * Step 1: Navigate to voting page
     */
    async navigateToVotePage(url: string): Promise<void> {
        this.log(`Navigating to vote page: ${url}`, '🌍');
        await this.page.goto(url, { timeout: 60000 });
        this.log(`Successfully loaded vote page`, '✅', 'success');
    }

    /**
     * Step 2: Click the vote button
     */
    async clickVoteButton(): Promise<void> {
        await test.step("Click the vote button", async () => {
            await this.voteButton.waitFor({ state: "visible", timeout: 8000 });
            await this.voteButton.click();
            this.log("Vote button clicked", "🗳️");
        });
    }

    /**
     * Step 3: Click accept checkbox and Steam login button
     */
    async acceptTermsAndClickSteam(): Promise<void> {
        await test.step("Accept terms and click Steam button", async () => {
            // Accept terms
            await this.agreeBox.waitFor({ state: "visible", timeout: 8000 });
            await this.agreeBox.check();
            this.log("Accepted voting terms", "✔️");

            // Click Steam login button
            await this.steamLoginButton.waitFor({ state: "visible", timeout: 8000 });
            await this.steamLoginButton.click();
            this.log("Clicked Steam login button", "👇");
        });
    }

    /**
     * Step 5: Process vote results page
     */
    async processVoteResults(): Promise<string> {
        this.log("Processing vote results...", "🔎");

        let headingText: string = await test.step("Extract page heading", async () => {
            const extractedHeading = await this.page.locator('h1').first().innerText();
            this.log(`Extracted Heading: ${extractedHeading}`, '📌');
            return extractedHeading;
        });

        let voteConfirmed: boolean = await test.step("Check vote confirmation", async () => {
            const isConfirmed = await this.page.locator('h1:has-text("Vote Confirmation")').isVisible();
            this.log(`Vote Confirmed: ${isConfirmed}`, '🗳️');
            return isConfirmed;
        });

        let dailyLimitText: string | undefined = undefined;
        let nextVoteText: string | undefined = undefined;

        const dailyVoteLimitLocator = this.page.getByText("You have reached your daily");
        const infoWarningLocator = this.page.getByText('You will be able to vote');

        await test.step("Check for vote limit warning", async () => {
            if (await dailyVoteLimitLocator.isVisible()) {
                dailyLimitText = await dailyVoteLimitLocator.innerText();
                nextVoteText = (await infoWarningLocator.innerText()).trim();
                this.log(`Daily Vote Limit Reached`, '⚠️', 'warning');
            } else {
                this.log("No vote limit warning detected", '✅', 'success');
            }
        });

        // Take screenshot for debugging
        // await this.page.screenshot({ path: `./test-results/vote-result-${testInfo.title}.png` });
        
        const formattedResult = handleVoteFormatting(headingText, voteConfirmed, dailyLimitText, nextVoteText);
        this.log("Vote results processed successfully", '✅', 'success');
        
        return formattedResult;
    }

    /**
     * Gets the page title for server identification
     */
    async getPageTitle(): Promise<string> {
        try {
            const heading = await this.page.locator('h1').first().innerText({ timeout: 5000 });
            return heading;
        } catch {
            return 'Unknown Server';
        }
    }
}