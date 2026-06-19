import fs from "fs";
import { config as loadEnv } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { withPayload } from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
loadEnv({ path: path.join(repoRoot, ".env") });

function readComposeValue(content, key) {
  const match = content.match(new RegExp(`${key}:\\s*(.+)`));
  return match?.[1]?.trim();
}

function applyLocalDockerEnv() {
  if (process.env.VERCEL || process.env.CI) return;
  const composePath = path.join(repoRoot, "docker-compose.yml");
  try {
    const content = fs.readFileSync(composePath, "utf8");
    const user = readComposeValue(content, "POSTGRES_USER") ?? "app";
    const password = readComposeValue(content, "POSTGRES_PASSWORD") ?? "app";
    const database = readComposeValue(content, "POSTGRES_DB") ?? "app";
    const minioUser = readComposeValue(content, "MINIO_ROOT_USER") ?? "minioadmin";
    const minioPassword = readComposeValue(content, "MINIO_ROOT_PASSWORD") ?? "minioadmin";

    delete process.env.POSTGRES_URL;
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_PRISMA_URL;

    process.env.DATABASE_URI = `postgres://${user}:${password}@localhost:5433/${database}`;
    process.env.S3_ENDPOINT = process.env.S3_ENDPOINT ?? "http://localhost:9000";
    process.env.S3_BUCKET = process.env.S3_BUCKET ?? "media";
    process.env.S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE ?? "true";
    process.env.S3_ACCESS_KEY_ID = minioUser;
    process.env.S3_SECRET_ACCESS_KEY = minioPassword;
  } catch {
    // docker-compose.yml missing — keep .env values
  }
}

applyLocalDockerEnv();
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9000" },
      { protocol: "https", hostname: "*.amazonaws.com" },
    ],
  },
};

export default withPayload(withNextIntl(nextConfig));
