import { expect, type Locator, type Page } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: 'properties.env' });

export class votingAndLinksPage {
  readonly page: Page;
  readonly votingLinks: Locator[];
  readonly voteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.votingLinks = [
      page.locator('a', { hasText: 'https://rust-servers.net/server/151475/' }),
      page.locator('a', { hasText: 'https://rust-servers.net/server/151790/' }),
      page.locator('a', { hasText: 'https://rust-servers.net/server/151562/' }),
    ];
    this.voteButton = page.locator('//a[@class="btn btn-success mr-1 my-1" and @role="button" and @title="Vote"]');
  }

  async goto() {
    await this.page.goto('https://rust.paradiseisland.gg/links', { timeout: 60000 });
  }

    // Function to refresh a tab until the target element is found
    async refreshUntilElementFound(tab: Page, targetLocator: string, timeout: number = 60000) {
        const startTime = Date.now();
    
        while (Date.now() - startTime < timeout) {
          try {
            // Reload the page
            await tab.reload({ waitUntil: 'load' });
            
            // Wait for the target element to be visible
            await tab.locator(targetLocator).waitFor({ state: 'visible', timeout: 5000 });
            console.log("Found the element!");
            return;
          } catch (error) {
            console.log("Element not found yet, retrying...");
            await tab.waitForTimeout(3000); // Wait a short time before next retry
          }
        }
    
        throw new Error(`Timeout reached. Element not found within ${timeout / 1000} seconds.`);
      }

  async openLinksAndClickVote() {
    // Open the first link (this is where we will sign in)
    const [firstTab] = await Promise.all([
      this.page.context().waitForEvent('page'), // Wait for the first new tab
      this.votingLinks[0].click(), // Click the first link
    ]);

    // Focus on the first tab for sign-in
    await firstTab.bringToFront();

    // Click the "Vote" button, check the accept box, and click on the Steam image
    const voteButton = firstTab.locator('//a[@class="btn btn-success mr-1 my-1" and @role="button" and @title="Vote"]');
    const agreeBox = firstTab.locator('#accept');
    const steamImage = firstTab.locator('input[type="image"]');

    await voteButton.waitFor({ state: 'visible', timeout: 5000 });
    await voteButton.click(); // Click the vote button

    await agreeBox.waitFor({ state: 'visible', timeout: 5000 });
    await agreeBox.check(); // Check the accept checkbox

    await steamImage.waitFor({ state: 'visible', timeout: 5000 });
    await steamImage.click(); // Click the Steam sign-in button

    // Wait for the sign-in page to show (this assumes the text "Sign in" appears after Steam authentication)
    const signInText = firstTab.locator('div.g5L61o-ZrHHmwLEugLjLI:has-text("Sign in")');
    await expect(signInText).toBeVisible({ timeout: 5000 });

    // Fill in the username and password
    const userName = process.env.USER_NAME || '';
    const password = process.env.PASSWORD || '';
    const usernameInput = firstTab.locator('form').filter({ hasText: 'Sign in with account' }).locator('input[type="text"]');
    const passwordInput = firstTab.locator('input[type="password"]');

    await usernameInput.fill(userName);
    await passwordInput.fill(password);

    // Locate and click the "Sign in" button
    const signInButton = firstTab.locator('button.DjSvCZoKKfoNSmarsEcTS[type="submit"]');
    await signInButton.waitFor({ state: 'visible', timeout: 5000 });
    await signInButton.click(); // Click the Sign in button

    // Wait for the confirmation text that instructs to use the Steam Mobile App
    const steamMobileAppTextLocator = firstTab.locator('div._2WgwHabhUV3cP6dHQPybw8:has-text("Use the Steam Mobile App to confirm your sign in...")');
    await expect(steamMobileAppTextLocator).toBeVisible({ timeout: 25000 });

    // Now that the first tab is signed in, reload the other tabs
    for (let i = 1; i < this.votingLinks.length; i++) {
      const [newTab] = await Promise.all([
        this.page.context().waitForEvent('page'),
        this.votingLinks[i].click(),
      ]);

      // Focus on the new tab
      await newTab.bringToFront();

      // Wait for the page to load completely (adjust wait conditions as needed)
      await newTab.waitForLoadState('load');

      // Reload the tab to inherit the session from the signed-in first tab
      await newTab.reload({ waitUntil: 'load' });

      // After the tab reloads, you can interact with the "Vote" button or perform other actions
      const voteButton = newTab.locator('//a[@class="btn btn-success mr-1 my-1" and @role="button" and @title="Vote"]');
      await voteButton.waitFor({ state: 'visible', timeout: 5000 });
      await voteButton.click();
      const agreeBox = newTab.locator('#accept');
      const steamImage = newTab.locator('input[type="image"]');

      await agreeBox.waitFor({ state: 'visible', timeout: 5000 });
      await agreeBox.check(); // Check the accept checkbox

      await steamImage.waitFor({ state: 'visible', timeout: 5000 });
      await steamImage.click(); // Click the Steam sign-in button

      await this.refreshUntilElementFound(newTab, 'h2:has-text("By signing into rust-servers.net through Steam:")');
    }
  }

  async clickVote() {
    await this.openLinksAndClickVote();
  }
}
