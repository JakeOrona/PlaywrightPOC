// @ts-check

import { VotingAndLinksPage } from '../pageObjects/paradiseIslandLinks';
import { test } from '@playwright/test';
import path from 'path';

// first test
test('Open all links and vote', async ({ page }) => {
  const votingPage = new VotingAndLinksPage(page);

  // Load voting links from the text file
  const filePath = path.resolve(__dirname, '../testData/links.txt');
  await votingPage.loadLinksFromFile(filePath);

  // Navigate to the main page (if needed)
  await votingPage.goto();

  // Start the voting process
  await votingPage.vote();
});