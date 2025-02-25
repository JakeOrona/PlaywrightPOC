import { expect, type Locator, type Page } from '@playwright/test';
import dotenv from 'dotenv';
import { loadVotingLinks, refreshUntilElementFound } from '../helpers/methods';

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

  constructor(page: Page) {
    this.page = page;
    this.votingLinks = [];
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
    this.steamSignInButton = page.locator('//input[@class="btn_green_white_innerfade" and @type="submit"]');
    this.steamUserID = page.locator('div.OpenID_loggedInName:has-text("Gary_Oak")');
    this.voteConfirmation = page.locator('h1:has-text("Vote Confirmation")');
    this.infoWarningLocator = this.page.locator('div.alert.alert-info[role="alert"]');
  }

  /**
   * Loads voting links from a file into the votingLinks array.
   * @param filePath - The path to the text file.
   */
  async loadLinksFromFile(filePath: string): Promise<void> {
    this.votingLinks = await loadVotingLinks(filePath);
    console.log('Loaded voting links:', this.votingLinks);
  }
  
  /**
   * Navigates to the specified URL or a default voting page.
   * @param url Optional URL to navigate to.
   */
  async goto(url?: string): Promise<void> {
    const targetUrl = url || 'https://rust.paradiseisland.gg/links';
    await this.page.goto(targetUrl, { timeout: 60000 });
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
    await voteButton.waitFor({ state: 'visible', timeout: 5000 });
    await voteButton.click();

    const agreeBox = tab.locator('#accept');
    await agreeBox.waitFor({ state: 'visible', timeout: 5000 });
    await agreeBox.check();

    const steamImage = tab.locator('input[type="image"]');
    await steamImage.waitFor({ state: 'visible', timeout: 5000 });
    await steamImage.click();
  }

  /**
   * Handles the sign-in flow on the provided tab.
   * @param tab - The page where sign-in is performed.
   */
  async signIn(tab: Page): Promise<void> {
    // Perform the common voting actions first.
    await this.clickVoteFlow(tab);

    // Wait for the sign-in form to be visible.
    await expect(this.signInText).toBeVisible({ timeout: 5000 });

    // Fill in credentials.
    const userName = process.env.USER_NAME || '';
    const password = process.env.PASSWORD || '';
    await this.usernameInput.fill(userName);
    await this.passwordInput.fill(password);

    // Click the sign-in button.
    await this.signInButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.signInButton.click();

    // Wait for Steam Mobile App confirmation text.
    await expect(this.steamMobileAppText).toBeVisible({ timeout: 30000 });
    console.log("Steam Mobile App Text Displayed! Open Your Phone!");
    await expect(this.steamUserID).toBeVisible({ timeout: 30000 });
    await this.steamSignInButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.steamSignInButton.click();


    // Check for an error message and refresh if necessary.
    if (await tab.locator('#error_display').isVisible()) {
      console.log("Error displayed. Refreshing until confirmation appears.");
      await refreshUntilElementFound(tab, 'h2:has-text("By signing into rust-servers.net through Steam:")');
    } else if (await this.voteConfirmation.isVisible()) {
      await expect(tab.locator('h1:has-text("Vote Confirmation")')).toBeVisible({ timeout: 5000 });
      console.log("Vote Confirmed!");
    } else if (await this.infoWarningLocator.isVisible()) {
      const infoText = await this.infoWarningLocator.innerText();
      console.log('Info Warning Message:', infoText);
    }
  }

  /**
   * Opens the voting links from a file, handles the Steam sign-in on the first link,
   * and then repeats the voting steps for subsequent links in new tabs.
   */
  async openLinksAndClickVote(): Promise<void> {
    if (!this.votingLinks || this.votingLinks.length === 0) {
      throw new Error("No voting links loaded.");
    }

    // Open the first voting link to perform sign-in.
    await this.page.goto(this.votingLinks[0], { timeout: 60000 });
    // Use the current page as the first tab.
    const firstTab = this.page;
    await this.signIn(firstTab);
    // Optionally wait for the Steam confirmation element after sign-in.
    // await refreshUntilElementFound(firstTab, 'h2:has-text("By signing into rust-servers.net through Steam:")');

    // Process the remaining voting links.
    for (let i = 1; i < this.votingLinks.length; i++) {
      const link = this.votingLinks[i];
      // Create a new tab (page) for each additional link.
      const newTab = await this.page.context().newPage();
      await newTab.goto(link, { waitUntil: 'load', timeout: 60000 });
      // Optionally, reload the tab to ensure the session is carried over.
      await newTab.reload({ waitUntil: 'load' });
      
      // Perform the common voting actions.
      await this.clickVoteFlow(newTab);
      
      // Wait for the Steam confirmation element to appear.
      await refreshUntilElementFound(newTab, 'h2:has-text("By signing into rust-servers.net through Steam:")');
      
      await this.handleVoteStatus(newTab);

    }
  }

  /**
 * Handles different vote statuses on the provided tab:
 * - Checks for an error message and refreshes if necessary.
 * - Confirms successful voting.
 * - Logs informational warnings about voting cooldowns.
 * @param tab - The page/tab where the vote status should be checked.
 */
  async handleVoteStatus(tab: Page): Promise<void> {
    // Check for an error message
    if (await tab.locator('#error_display').isVisible()) {
      console.log("❌ Error displayed. Refreshing until confirmation appears.");
      await refreshUntilElementFound(tab, 'h2:has-text("By signing into rust-servers.net through Steam:")');
    } 
    // Check for vote confirmation
    else if (await this.voteConfirmation.isVisible()) {
      await expect(tab.locator('h1:has-text("Vote Confirmation")')).toBeVisible({ timeout: 5000 });
      console.log("✅ Vote Confirmed!");
    } 
    // Check for info warning
    else if (await this.infoWarningLocator.isVisible()) {
      const infoText = await this.infoWarningLocator.innerText();
      console.log('ℹ️ Info Warning Message:', infoText);
    } 
    // No visible status detected
    else {
      console.log("⚠️ No visible vote status detected.");
    }
  }


  /**
   * Initiates the complete voting process.
   */
  async vote(): Promise<void> {
    await this.openLinksAndClickVote();
  }
}
