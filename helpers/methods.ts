import { promises as fs } from 'fs';
import { Page } from '@playwright/test'; // Ensure you import Page from Playwright

export interface LinkData {
  [key: string]: string;
}

/**
 * Reads a text file formatted as key-value pairs (e.g., "link1:https://example.com")
 * and returns an array of links.
 * @param filePath - Path to the text file.
 * @returns A promise that resolves to an array of extracted links.
 */
export async function loadVotingLinks(filePath: string): Promise<string[]> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const lines = fileContent.split('\n');
      const links: string[] = [];
  
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue; // Skip empty lines
  
        // Updated regex to capture links directly after ':'
        const match = trimmedLine.match(/https?:\/\/[^\s]+/);
        if (match) {
          links.push(match[0]); // Add the extracted URL to the array
        }
      }
  
      return links;
    } catch (error) {
      console.error(`Error loading voting links from ${filePath}:`, error);
      throw error;
    }
}

/**
 * Refreshes a page until the target element is found or a timeout is reached.
 * @param tab - The Playwright Page instance.
 * @param targetLocator - The selector for the target element.
 * @param timeout - Maximum time in milliseconds to wait (default is 60000).
 * @returns A promise that resolves when the element is found, or rejects if the timeout is reached.
 */
export async function refreshUntilElementFound(
  tab: Page,
  targetLocator: string,
  timeout: number = 60000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      // Reload the page and wait until the page load event fires
      await tab.reload({ waitUntil: 'load' });
      
      // Wait for the target element to become visible (with a short timeout for each try)
      await tab.locator(targetLocator).waitFor({ state: 'visible', timeout: 5000 });
      console.log("Found the element!");
      return;
    } catch (error) {
      console.log("Element not found yet, retrying...");
      await tab.waitForTimeout(3000); // Wait a short time before the next retry
    }
  }

  throw new Error(`Timeout reached. Element not found within ${timeout / 1000} seconds.`);
}
