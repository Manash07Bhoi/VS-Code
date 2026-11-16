/**
 * CodeSense AI — Playwright configuration.
 *
 * Browser QA for the workbench: runs against a locally started backend +
 * frontend (the real app, not mocks). CI starts the server; local runs use
 * E2E_BASE_URL. Screenshots and the HTML report land in tests/artifacts/.
 */

const { defineConfig } = require('@playwright/test');

const BASE = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000';

module.exports = defineConfig({
  testDir: '.',
  testMatch: 'responsive.spec.js',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/artifacts/html-report', open: 'never' }],
  ],
  use: {
    baseURL: BASE,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 10_000,
  },
  outputDir: 'tests/artifacts/test-results',
});
