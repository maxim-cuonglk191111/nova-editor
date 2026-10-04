import { defineConfig } from "@playwright/test";

// Runs e2e specs against a deployed build (e.g. a Workers preview URL) instead of
// the local dev server: BASE_URL=https://<alias>-nova-editor.<acct>.workers.dev
export default defineConfig({
  testDir: "./e2e",
  timeout: 900_000,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL,
    viewport: { width: 1440, height: 900 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
