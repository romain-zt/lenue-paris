import { getPayload, type Payload, type SanitizedConfig } from "payload";

let cachedConfig: SanitizedConfig | Promise<SanitizedConfig> | undefined;
let clientPromise: Promise<Payload> | undefined;

/** Bind the Payload config once (call from the Next.js route module). */
export function setPayloadConfig(config: SanitizedConfig | Promise<SanitizedConfig>): void {
  cachedConfig = config;
  clientPromise = undefined;
}

async function resolveConfig(): Promise<SanitizedConfig> {
  if (!cachedConfig) {
    throw new Error(
      "@repo/cms-data: setPayloadConfig() must be called before any cms-data operation",
    );
  }
  return cachedConfig instanceof Promise ? cachedConfig : cachedConfig;
}

export async function getCmsClient(): Promise<Payload> {
  if (!clientPromise) {
    clientPromise = resolveConfig().then((config) => getPayload({ config }));
  }
  return clientPromise;
}
