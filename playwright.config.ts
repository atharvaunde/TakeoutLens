import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { defineConfig } from "@playwright/test"

import { createFixture } from "./tests/fixture/generate"

const PORT = 3210

// The server under test gets a fresh synthetic export and an empty data folder.
// Run against a production build: `pnpm build && pnpm test:e2e`. Set E2E_BASE_URL to test a running instance instead.
const { root } = createFixture({ wrap: true })
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "takeout-e2e-data-"))

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  use: { baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}` },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm start --port ${PORT}`,
        url: `http://localhost:${PORT}/login`,
        env: { TAKEOUT_DIR: root, DATA_DIR: dataDir },
        reuseExistingServer: false,
        timeout: 60_000,
      },
})
