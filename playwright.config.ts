import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  timeout: 30000,
  use: { baseURL: "http://127.0.0.1:4702", headless: true },
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:4702/api/health",
    reuseExistingServer: false,
    env: { PORT: "4702", JARVIS_DATA_DIR: "/tmp/jarvisv7-e2e-" + process.pid },
  },
  reporter: "list",
});
