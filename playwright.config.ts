import { defineConfig, devices } from '@playwright/test';
import { isAuthStateValid } from './helpers/authHelpers';

export default defineConfig({
    testDir: './tests',
    globalSetup: require.resolve('./global-setup'),
    globalTeardown: require.resolve('./global-teardown'),
    /* Run tests in files in parallel */
    fullyParallel: false, // Keep false globally, control at project level
    timeout: 60000,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    expect: {
        timeout: 60000
    },
    /* Allow multiple workers for parallel execution */
    workers: process.env.CI ? 1 : 3, // Allow 3 workers for full parallel execution
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
        // First server test - can run in parallel if auth is valid
        {
            name: 'first-server',
            use: { 
                ...devices['Desktop Chrome'],
                // Use the storage state from setup
                storageState: 'playwright/.auth/user.json'
            },
            dependencies: [], // No dependencies when auth is valid
            testMatch: '**/first-vote.spec.ts',
        },
        // Second server test - can run in parallel if auth is valid
        {
            name: 'second-server',
            use: { 
                ...devices['Desktop Chrome'],
                // Use the storage state from setup
                storageState: 'playwright/.auth/user.json'
            },
            dependencies: [], // No dependencies when auth is valid
            testMatch: '**/second-vote.spec.ts',
        },
        // Third server test - can run in parallel if auth is valid
        {
            name: 'third-server',
            use: { 
                ...devices['Desktop Chrome'],
                // Use the storage state from setup
                storageState: 'playwright/.auth/user.json'
            },
            dependencies: [], // No dependencies when auth is valid
            testMatch: '**/third-vote.spec.ts',
        },
        // Fallback sequential project for when fresh auth is needed
        {
            name: 'sequential-fallback',
            use: { 
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json'
            },
            dependencies: [],
            testMatch: ['**/first-vote.spec.ts', '**/second-vote.spec.ts', '**/third-vote.spec.ts'],
            fullyParallel: false, // Run sequentially for fresh auth scenarios
        }
    ],
});