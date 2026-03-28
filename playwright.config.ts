import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./tests/e2e",
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry"
  },
  webServer: [
    {
      command: "pnpm --filter @cookpedia/api prisma:seed && pnpm --filter @cookpedia/api dev",
      port: 4000,
      reuseExistingServer: false
    },
    {
      command: "pnpm --filter @cookpedia/web dev",
      port: 3000,
      reuseExistingServer: false
    }
  ]
};

export default config;
