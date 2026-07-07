import { config as loadEnv } from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

let loaded = false

function readComposeValue(content: string, key: string): string | undefined {
  const match = content.match(new RegExp(`${key}:\\s*(.+)`))
  return match?.[1]?.trim()
}

/** Override stale .env DB vars with docker-compose credentials for local dev. */
function applyLocalDockerDatabaseEnv(repoRoot: string): void {
  if (process.env.VERCEL || process.env.CI) return

  const composePath = path.join(repoRoot, 'docker-compose.yml')
  if (!fs.existsSync(composePath)) return

  const content = fs.readFileSync(composePath, 'utf8')
  const user = readComposeValue(content, 'POSTGRES_USER') ?? 'app'
  const password = readComposeValue(content, 'POSTGRES_PASSWORD') ?? 'app'
  const database = readComposeValue(content, 'POSTGRES_DB') ?? 'app'
  const minioUser = readComposeValue(content, 'MINIO_ROOT_USER') ?? 'minioadmin'
  const minioPassword = readComposeValue(content, 'MINIO_ROOT_PASSWORD') ?? 'minioadmin'

  delete process.env.POSTGRES_URL
  delete process.env.DATABASE_URL
  delete process.env.POSTGRES_PRISMA_URL

  process.env.DATABASE_URI = `postgres://${user}:${password}@localhost:5433/${database}`
  process.env.POSTGRES_USER = user
  process.env.POSTGRES_PASSWORD = password
  process.env.POSTGRES_DB = database

  process.env.S3_ENDPOINT = process.env.S3_ENDPOINT ?? 'http://localhost:9000'
  process.env.S3_BUCKET = process.env.S3_BUCKET ?? 'media'
  process.env.S3_REGION = process.env.S3_REGION ?? 'us-east-1'
  process.env.S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE ?? 'true'
  process.env.S3_ACCESS_KEY_ID = minioUser
  process.env.S3_SECRET_ACCESS_KEY = minioPassword
  process.env.MINIO_ROOT_USER = minioUser
  process.env.MINIO_ROOT_PASSWORD = minioPassword
}

/** Load monorepo root `.env` for Payload CLI and Next.js (env lives at repo root, not in apps/web). */
export function loadRootEnv(): void {
  if (loaded) return
  loaded = true

  const here = path.dirname(fileURLToPath(import.meta.url))
  const repoRoot = path.resolve(here, '../../../..')
  const candidates = [
    path.join(repoRoot, '.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '.env'),
  ]

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      loadEnv({ path: envPath })
      break
    }
  }

  applyLocalDockerDatabaseEnv(repoRoot)
}
