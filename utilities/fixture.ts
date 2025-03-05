import { test as base, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Define custom fixture types
type CustomFixtures = {
  autoScreenshot: void;
};

export const test = base.extend<CustomFixtures>({
  autoScreenshot: [async ({ page }, use, testInfo) => {
    // Before test
    await use();
    // After test - take screenshot regardless of pass/fail
    try {
      const screenshotPath = path.join(
        'test-results',
        testInfo.project.name,
        `${testInfo.title.replace(/\s+/g, '-')}-${testInfo.status}.png`
      );
      
      const dir = path.dirname(screenshotPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await testInfo.attach('screenshot', { path: screenshotPath, contentType: 'image/png' });
    } catch (e) {
      console.error('Failed to take screenshot:', e);
    }
  }, { auto: true }]
});

export { expect } from '@playwright/test';