// pageObjects/voting-handler.ts - STREAMLINED VERSION
import { type Page } from '@playwright/test';
import { VotingPage } from './voting-page';
import { SteamSignInPage } from './steam-signin';
import { loadVotingLink } from '../helpers/methods';
import { logStep, logSuccess } from '../helpers/logging-helpers';

/**
 * Streamlined VotingHandler - implements the simple 6-step flow
 */
export class VotingHandler {
    readonly page: Page;
    readonly votingPage: VotingPage;
    readonly steamSignInPage: SteamSignInPage;
    readonly verboseLogging: boolean;
    
    votingLinks: string[] = [];

    constructor(page: Page, verboseLogging: boolean = false) {
        this.page = page;
        this.verboseLogging = verboseLogging;
        
        this.votingPage = new VotingPage(page, verboseLogging);
        this.steamSignInPage = new SteamSignInPage(page, verboseLogging);
    }

    /**
     * The main streamlined voting flow - implements your 6-step process
     */
    async performStreamlinedVote(votingUrl: string): Promise<string> {
        if (this.verboseLogging) {
            logStep(`Starting streamlined vote flow for: ${votingUrl}`, '🚀');
        }

        // Step 1: Navigate to vote page
        await this.votingPage.navigateToVotePage(votingUrl);

        // Step 2: Click vote button
        await this.votingPage.clickVoteButton();

        // Step 3: Click accept box and Steam login button
        await this.votingPage.acceptTermsAndClickSteam();

        // Step 4: Check Steam page and handle auth accordingly
        await this.steamSignInPage.handleSteamAuth();

        // Step 5: Check vote results page and Step 6: Display results
        const voteResult = await this.votingPage.processVoteResults();

        if (this.verboseLogging) {
            logSuccess('Streamlined vote flow completed successfully', '✅');
        }

        return voteResult;
    }

    /**
     * Gets the page title for server identification
     */
    async getPageTitle(): Promise<string> {
        return await this.votingPage.getPageTitle();
    }

    /**
     * Backward compatibility methods for existing tests
     */
    async smartVoteFlow(votingUrl: string): Promise<string> {
        return await this.performStreamlinedVote(votingUrl);
    }

    async clickVoteFlow(): Promise<void> {
        await this.votingPage.clickVoteButton();
        await this.votingPage.acceptTermsAndClickSteam();
    }

    async handleVoteStatus(): Promise<string> {
        return await this.votingPage.processVoteResults();
    }

    async isSteamSignInRequired(): Promise<boolean> {
        return await this.steamSignInPage['checkIfSignInRequired']();
    }
}