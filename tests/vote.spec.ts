// @ts-check

import { votingAndLinksPage } from '../pageObjects/paradiseIslandLinks';
import { test } from '@playwright/test';

test('Open Voting Links page', async ({ page }) => {
  const votingPage = new votingAndLinksPage(page);
  await votingPage.goto();
  await votingPage.clickVote();
});

