/**
 * Derive local Postgres + MinIO credentials from docker-compose.yml so CLI commands
 * (migrate, seed) work even when root .env still has stale values.
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const composePath = path.join(repoRoot, 'docker-compose.yml')

function readComposeValue(content, key) {
  const match = content.match(new RegExp(`${key}:\\s*(.+)`))
  return match?.[1]?.trim()
}

export function applyLocalDockerEnv() {
  if (process.env.VERCEL || !fs.existsSync(composePath)) return

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

export function runPayloadCommand(command) {
  applyLocalDockerEnv()

  const webDir = path.join(repoRoot, 'apps/web')
  execSync(command, {
    cwd: webDir,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  })
}

if (process.argv.length > 2) {
  runPayloadCommand(process.argv.slice(2).join(' '))
}
