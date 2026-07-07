/**
 * Wait until Postgres accepts TCP connections (CI service startup race).
 */
import net from "node:net";

function parseHostPort(connectionString) {
  const match = connectionString.match(/(?:@|\/\/)([^:/]+):(\d+)(?:\/|$)/);
  if (!match?.[1] || !match[2]) return null;
  return {
    host: match[1],
    port: Number.parseInt(match[2], 10),
  };
}

function probe(host, port) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port }, () => {
      socket.end();
      resolve();
    });
    socket.on("error", reject);
  });
}

const connectionString =
  process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL ?? "";
const target = parseHostPort(connectionString);

if (!target) {
  process.exit(0);
}

const maxAttempts = 30;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    await probe(target.host, target.port);
    process.exit(0);
  } catch {
    if (attempt === maxAttempts) break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

console.error(
  `Postgres not ready at ${target.host}:${target.port} after ${maxAttempts}s`,
);
process.exit(1);
