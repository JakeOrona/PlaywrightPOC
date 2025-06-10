// page-objects/voting-only-handler.ts - SIMPLIFIED FOR PARALLEL EXECUTION
import { type Page } from '@playwright/test';
import { VotingPage } from './voting-page';
import { logStep, logSuccess } from '../helpers/logging-helpers';
import { refreshAuthState } from '../helpers/auth-helpers';

/**
 * Simplified VotingHandler for Phase 2 - assumes auth already exists
 * This version skips Steam authentication since it's handled in Phase 1
 */
export class VotingOnlyHandler {
    readonly page: Page;
    readonly votingPage: VotingPage;
    readonly verboseLogging: boolean;

    constructor(page: Page, verboseLogging: boolean = false) {
        this.page = page;
        this.verboseLogging = verboseLogging;
        this.votingPage = new VotingPage(page, verboseLogging);
    }

    /**
     * Simplified voting flow - assumes auth is already established
     */
    async performVote(votingUrl: string): Promise<string> {
        if (this.verboseLogging) {
            logStep(`Starting voting flow for: ${votingUrl}`, '🗳️');
        }

        // Step 1: Navigate to vote page
        await this.votingPage.navigateToVotePage(votingUrl);

        // Step 2: Click vote button and accept terms
        await this.votingPage.clickVoteButton();
        await this.votingPage.acceptTermsAndClickSteam();

        // Step 3: Wait for Steam redirect (should be automatic with existing auth)
        await this.waitForSteamRedirect();

        // Step 4: Process vote results
        const voteResult = await this.votingPage.processVoteResults();

        // Step 5: Refresh auth state to keep it current
        await this.refreshAuthState();

        if (this.verboseLogging) {
            logSuccess('Voting flow completed successfully', '✅');
        }

        return voteResult;
    }

    /**
     * Wait for Steam redirect to complete (should be automatic with existing auth)
     */
    private async waitForSteamRedirect(): Promise<void> {
        if (this.verboseLogging) {
            logStep('Waiting for Steam authentication redirect...', '🔄');
        }

        try {
            // Wait for page to redirect back from Steam
            // This should happen automatically since auth exists
            await this.page.waitForURL(url => 
                !url.href.includes('steamcommunity.com') && 
                !url.href.includes('steampowered.com'), 
                { timeout: 30000 }
            );
            
            if (this.verboseLogging) {
                logSuccess('Steam redirect completed', '✅');
            }
        } catch (error) {
            // If redirect times out, we might need manual intervention
            if (this.verboseLogging) {
                logStep('Steam redirect taking longer than expected...', '⏳');
            }
            
            // Check if we're on a Steam page that needs manual action
            const currentUrl = this.page.url();
            if (currentUrl.includes('steamcommunity.com') || currentUrl.includes('steampowered.com')) {
                // Try to find and click any Sign In button
                const signInButton = this.page.getByRole('button', { name: /sign in/i }).first();
                if (await signInButton.isVisible({ timeout: 5000 })) {
                    await signInButton.click();
                    if (this.verboseLogging) {
                        logStep('Clicked Steam Sign In button', '👆');
                    }
                    
                    // Wait for redirect after clicking
                    await this.page.waitForURL(url => 
                        !url.href.includes('steamcommunity.com') && 
                        !url.href.includes('steampowered.com'), 
                        { timeout: 15000 }
                    );
                }
            }
        }
    }

    /**
     * Refresh auth state to keep it current
     */
    private async refreshAuthState(): Promise<void> {
        try {
            await refreshAuthState(this.page);
            if (this.verboseLogging) {
                logStep('Auth state refreshed', '🔄');
            }
        } catch (error) {
            // Non-critical error - log but don't fail
            if (this.verboseLogging) {
                logStep('Could not refresh auth state (non-critical)', '⚠️');
            }
        }
    }

    /**
     * Gets the page title for server identification
     */
    async getPageTitle(): Promise<string> {
        return await this.votingPage.getPageTitle();
    }
}