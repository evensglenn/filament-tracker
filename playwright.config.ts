import { defineConfig } from '@playwright/test';

/**
 * Browser tests against the Firebase emulators (`npm run test:e2e`). Every test signs in with
 * its own fresh account and inventory, so tests don't affect each other or the "Test" account
 * of `npm run dev:local`.
 */
export default defineConfig({
  testDir: 'e2e',
  // One emulator for all tests; running them one by one keeps the sign-in popup reliable
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:5180',
    // The installed Google Chrome (also on GitHub's runners), so no browser download is needed
    channel: 'chrome',
    trace: 'retain-on-failure',
    // Pulsing buttons never stand still; the app turns the pulse off for reduced motion
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'node scripts/emulators.mjs dev',
    url: 'http://127.0.0.1:5180',
    // Locally an already running `npm run dev:local` is reused
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
