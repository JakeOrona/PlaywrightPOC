import { defineConfig, devices } from '@playwright/test';
import { isAuthStateValid } from './helpers/authHelpers';

export default defineConfig({
    testDir: './tests',
    globalSetup: require.resolve('./global-setup'),
    globalTeardown: require.resolve('./global-teardown'),
    /* Run tests in files in parallel */
    fullyParallel: false, // Changed to false to ensure proper test order
    timeout: 60000,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    expect: {
        timeout: 60000
    },
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : 1, // Set to 1 to ensure sequential execution
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['allure-playwright', { outputFolder: 'allure-results' }],
    ],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        headless: true,
        /* Base URL to use in actions like `await page.goto('/')`. */
        // baseURL: 'http://127.0.0.1:3000',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        screenshot: "only-on-failure"
    },

    /* Configure projects for major browsers */
    projects: [
        // Setup project for authentication - runs conditionally
        {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
            use: { ...devices['Desktop Chrome'] },
        },
        // Main test project with conditional dependencies
        {
            name: 'chromium',
            use: { 
                ...devices['Desktop Chrome'],
                // Use the storage state from setup
                storageState: 'playwright/.auth/user.json'
            },
            // Dependencies are determined at runtime based on auth state validity
            dependencies: [],
            testIgnore: /.*\.setup\.ts/,
        }
    ],
});