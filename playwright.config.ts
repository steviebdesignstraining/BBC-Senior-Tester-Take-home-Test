import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['ortoni-report', {
      open: 'never',
      folderPath: 'reports',
      filename: 'ortoni-report.html',
      title: 'BBC Senior Tester Take-home Test - Ortoni Report',
      projectName: 'BBC Senior Tester Take-home Test',
      authorName: 'BBC',
      testType: 'Functional',
      base64Image: false,
      stdIO: false,
      meta: {
        'Test Cycle': 'Dec, 2025',
        version: '1.0.0',
        description: 'BBC Senior Tester Take-home Test',
        release: '1.0',
        platform: process.platform,
        'k6 Load Test Report': './performance-tests/k6/reports/load-test-report.html',
        'k6 Stress Test Report': './performance-tests/k6/reports/stress-test-report.html',
        'k6 Security Test Report': './performance-tests/k6/reports/security-test-report.html',
        'k6 Performance Test Report': './performance-tests/k6/reports/performance-test-report.html',
      },
    }],
  ],
  /* Global timeout for each test in milliseconds */
  timeout: parseInt(process.env.TIMEOUT || '30000'),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: process.env.BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
