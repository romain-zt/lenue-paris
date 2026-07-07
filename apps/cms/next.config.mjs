import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { withPayload } from "@payloadcms/next/withPayload";

const monorepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv({ path: resolve(monorepoRoot, ".env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPayload(nextConfig);
