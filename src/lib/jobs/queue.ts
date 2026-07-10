import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { processInboundItem } from "@/lib/ai/pipeline";

// ---------------------------------------------------------------------------
// Job queue abstraction (TRD §3/§13). The `inline` driver runs jobs in-process
// (fine for dev + modular-monolith MVP). Swap for a `redis` driver backed by
// BullMQ in production — the enqueue() contract stays identical.
// ---------------------------------------------------------------------------

export type JobPayload =
  | { type: "process_inbound"; itemId: string; delayMs?: number }
  | { type: "reanalyze"; itemId: string; delayMs?: number };

async function run(payload: JobPayload): Promise<void> {
  switch (payload.type) {
    case "process_inbound":
    case "reanalyze":
      await processInboundItem(payload.itemId);
      break;
  }
}

/**
 * Enqueue a job. Non-blocking for the inline driver: the caller (e.g. a webhook)
 * returns immediately while processing happens asynchronously — matching the
 * event-driven ingestion model (NFR-008).
 */
export function enqueue(payload: JobPayload): void {
  if (env.QUEUE_DRIVER === "redis") {
    // TODO: publish to BullMQ. For now, fall through to inline execution.
    logger.warn("QUEUE_DRIVER=redis not wired; running inline.", { type: payload.type });
  }
  const delay = "delayMs" in payload && payload.delayMs ? payload.delayMs : 400;
  setTimeout(() => {
    run(payload).catch((err) => logger.error("Job failed", { payload, error: String(err) }));
  }, delay);
}

/** Await a job synchronously — used by the seeder and tests for determinism. */
export async function runNow(payload: JobPayload): Promise<void> {
  await run(payload);
}
