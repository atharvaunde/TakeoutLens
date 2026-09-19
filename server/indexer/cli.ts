import { getConfig } from "@/server/config"
import { getDb } from "@/server/db"
import { acquireLock } from "./lock"
import { runIndexer } from "./run"

async function main() {
  const { takeoutDir, dataDir } = getConfig()
  const release = acquireLock(dataDir)
  if (!release) {
    console.error("Indexer is already running.")
    process.exit(1)
  }
  const started = performance.now()
  try {
    await runIndexer(getDb(), takeoutDir)
    console.log(`Indexed ${takeoutDir} in ${((performance.now() - started) / 1000).toFixed(1)}s`)
  } finally {
    release()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
