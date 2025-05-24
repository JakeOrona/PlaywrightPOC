import { defineConfig, devices } from '@playwright/test';
import { isAuthStateValid } from './helpers/authHelpers';

export default defineConfig({
    testDir: './tests',
    globalSetup: require.resolve('./global-setup'),
    globalTeardown: require.resolve('./global-teardown'),
    /* Run tests in files in parallel */
    fullyParallel: false, // Keep false globally for proper test ordering
    timeout: 60000,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    expect: {
        timeout: 60000
    },
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : 2, // Allow 2 workers for parallel execution
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
        // First server test - must run first and sequentially
        {
            name: 'first-server',
            use: { 
                ...devices['Desktop Chrome'],
                // Use the storage state from setup
                storageState: 'playwright/.auth/user.json'
            },
            dependencies: [], // No dependencies as it handles auth internally
            testMatch: '**/first-vote.spec.ts',
            fullyParallel: false, // Ensure this runs sequentially
        },
        // Second and third server tests - can run in parallel after first server
        {
            name: 'parallel-servers',
            use: { 
                ...devices['Desktop Chrome'],
                // Use the storage state from setup
                storageState: 'playwright/.auth/user.json'
            },
            dependencies: ['first-server'], // Wait for first server to complete
            testMatch: ['**/second-vote.spec.ts', '**/third-vote.spec.ts'],
            fullyParallel: true, // Allow parallel execution within this project
        }
    ],
});