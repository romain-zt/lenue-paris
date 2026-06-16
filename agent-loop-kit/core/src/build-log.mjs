import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

/** @param {string} logPath */
export function createBuildLogger(logPath) {
  mkdirSync(dirname(logPath), { recursive: true });

  return {
    /** @param {Record<string, unknown>} entry */
    append(entry) {
      const line = JSON.stringify({
        ts: new Date().toISOString(),
        ...entry
      });
      appendFileSync(logPath, line + '\n');
    },

    /** Log an adapter call with required Step 1 fields */
    logAdapterCall({ role, requestId, usage, event = 'adapter_call', ...rest }) {
      this.append({
        agent: role,
        role,
        request_id: requestId ?? randomUUID(),
        event,
        usage: usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        ...rest
      });
    }
  };
}
