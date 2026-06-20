/**
 * Ensures root .env has vars required for local live-edit testing.
 * Reads docker-compose.yml + .env; does not print secret values.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(repoRoot, '.env')
const examplePath = path.join(repoRoot, '.env.example')
const composePath = path.join(repoRoot, 'docker-compose.yml')

function readComposeValue(content, key) {
  const match = content.match(new RegExp(`${key}:\\s*(.+)`))
  return match?.[1]?.trim()
}

function setOrReplace(lines, key, value) {
  const prefix = `${key}=`
  const idx = lines.findIndex((l) => l.startsWith(prefix) || l.startsWith(`# ${key}=`))
  const entry = `${key}=${value}`
  if (idx >= 0) {
    lines[idx] = entry
  } else {
    lines.push(entry)
  }
}

function hasKey(lines, key) {
  return lines.some((l) => l.startsWith(`${key}=`))
}

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath)
    console.log('Created .env from .env.example')
  } else {
    fs.writeFileSync(envPath, '', 'utf8')
    console.log('Created empty .env')
  }
}

const compose = fs.readFileSync(composePath, 'utf8')
const pgUser = readComposeValue(compose, 'POSTGRES_USER') ?? 'lenueparis'
const pgPass = readComposeValue(compose, 'POSTGRES_PASSWORD') ?? 'lenueparis'
const pgDb = readComposeValue(compose, 'POSTGRES_DB') ?? 'lenueparis'
const minioUser = readComposeValue(compose, 'MINIO_ROOT_USER') ?? 'lenueparis'
const minioPass = readComposeValue(compose, 'MINIO_ROOT_PASSWORD') ?? 'lenueparis123'

let lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)

setOrReplace(lines, 'DATABASE_URI', `postgres://${pgUser}:${pgPass}@localhost:5433/${pgDb}`)
setOrReplace(lines, 'POSTGRES_USER', pgUser)
setOrReplace(lines, 'POSTGRES_PASSWORD', pgPass)
setOrReplace(lines, 'POSTGRES_DB', pgDb)
setOrReplace(lines, 'S3_ACCESS_KEY_ID', minioUser)
setOrReplace(lines, 'S3_SECRET_ACCESS_KEY', minioPass)
setOrReplace(lines, 'MINIO_ROOT_USER', minioUser)
setOrReplace(lines, 'MINIO_ROOT_PASSWORD', minioPass)
setOrReplace(lines, 'S3_ENDPOINT', 'http://localhost:9000')
setOrReplace(lines, 'S3_BUCKET', 'media')
setOrReplace(lines, 'S3_FORCE_PATH_STYLE', 'true')
setOrReplace(lines, 'WEB_URL', 'http://localhost:3001')

if (!hasKey(lines, 'EDITOR_SHARE_TOKEN')) {
  setOrReplace(lines, 'EDITOR_SHARE_TOKEN', crypto.randomBytes(24).toString('hex'))
  console.log('Added EDITOR_SHARE_TOKEN')
} else {
  console.log('EDITOR_SHARE_TOKEN already set')
}

if (!hasKey(lines, 'PAYLOAD_SECRET') || lines.find((l) => l.startsWith('PAYLOAD_SECRET='))?.includes('change-me')) {
  setOrReplace(lines, 'PAYLOAD_SECRET', crypto.randomBytes(32).toString('hex'))
  console.log('Set PAYLOAD_SECRET')
}

// Trim trailing empties, ensure newline at EOF
while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
fs.writeFileSync(envPath, `${lines.join('\n')}\n`, 'utf8')
console.log('.env synced with docker-compose.yml')
