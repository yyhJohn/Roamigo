import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:8080',
    channel: 'chrome',
    headless: true,
  },
  webServer: {
    command: 'npm run dev -- --host 0.0.0.0 --port 8080',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
