import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  webServer: {
    command: "npm run dev -- --port 5187 --strictPort",
    url: "http://127.0.0.1:5187",
    reuseExistingServer: false,
  },
  use: {
    baseURL: "http://127.0.0.1:5187",
    viewport: { width: 1320, height: 1000 },
  },
  reporter: "list",
  outputDir: "artifacts/test-results",
});
