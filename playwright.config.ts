import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './client/e2e',
  use: { baseURL: 'http://127.0.0.1:5173', browserName: 'chromium' },
  webServer: {
    command: 'npm run dev -w client -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
  },
});
