import { config as loadEnv } from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

let loaded = false

export function loadRootEnv(): void {
  if (loaded) return
  loaded = true

  const here = path.dirname(fileURLToPath(import.meta.url))
  const candidates = [
    path.resolve(here, '../../../.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '.env'),
  ]

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      loadEnv({ path: envPath })
      return
    }
  }
}
