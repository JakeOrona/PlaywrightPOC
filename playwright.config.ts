// playwright.config.ts - STREAMLINED VERSION
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    globalSetup: require.resolve('./global-setup'),
    globalTeardown: require.resolve('./global-teardown'),
    /* Run tests in files in parallel */
    fullyParallel: true,
    timeout: 60000,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    expect: {
        timeout: 60000
    },
    /* Allow multiple workers for parallel execution */
    workers: process.env.CI ? 1 : 3, // Allow parallel execution
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['allure-playwright', { outputFolder: 'allure-results' }],
        ['list'], // Add list reporter for cleaner parallel output
    ],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        headless: true,
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        screenshot: "only-on-failure"
    },

    /* Configure projects for major browsers */
    projects: [
        // Each test handles its own auth automatically
        {
            name: 'first-server',
            use: { 
                ...devices['Desktop Chrome'],
                // Auth state will be created/used automatically by the streamlined flow
                storageState: 'playwright/.auth/user.json'
            },
            testMatch: '**/first-vote.spec.ts',
        },
        {
            name: 'second-server',
            use: { 
                ...devices['Desktop Chrome'],
                // Auth state will be shared automatically
                storageState: 'playwright/.auth/user.json'
            },
            testMatch: '**/second-vote.spec.ts',
        },
        {
            name: 'third-server',
            use: { 
                ...devices['Desktop Chrome'],
                // Auth state will be shared automatically  
                storageState: 'playwright/.auth/user.json'
            },
            testMatch: '**/third-vote.spec.ts',
        }
    ],
});