// @ts-check

import { VotingAndLinksPage } from '../pageObjects/paradiseIslandLinks';
import { test } from '@playwright/test';
import path from 'path';

// Array to store formatted vote results
let voteResults: string[] = [];

test('Open all links and vote', async ({ page }) => {
  const votingPage = new VotingAndLinksPage(page);
  const filePath = path.resolve(__dirname, '../testData/links.txt');

  await test.step('Load voting links from the text file', async () => {
      await votingPage.loadLinksFromFile(filePath);
  });

  await test.step('Navigate to rust.paradiseisland.gg/links', async () => {
      await votingPage.goToHomePage();
  });

  await test.step('Process all voting links and vote', async () => {
      voteResults = await votingPage.processVotingLinks();
  });
});

// After all tests, print the collected vote results
test.afterAll(() => {
  console.log("\n📜 Summary of Vote Results:\n");
  voteResults.forEach((result) => {
    console.log(`${result}`);
  });
});