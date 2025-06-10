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
    workers: process.env.CI ? 1 : 3,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['allure-playwright', { outputFolder: 'allure-results' }],
        ['list'],
    ],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        headless: true,
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        screenshot: "only-on-failure"
    },

    /* Configure projects */
    projects: [
        // Authentication setup project (runs first)
        {
            name: 'auth-setup',
            use: { 
                ...devices['Desktop Chrome'],
                headless: false // Show browser for Steam mobile approval
            },
            testMatch: '**/auth-setup.spec.ts',
        },
        

        {
            name: 'first-server',
            use: { 
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json'
            },
            testMatch: '**/first-vote.spec.ts',
            dependencies: ['auth-setup'],
        },
        {
            name: 'second-server',
            use: { 
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json'
            },
            testMatch: '**/second-vote.spec.ts',
            dependencies: ['auth-setup'],
        },
        {
            name: 'third-server',
            use: { 
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json'
            },
            testMatch: '**/third-vote.spec.ts',
            dependencies: ['auth-setup'],
        }
    ],
});