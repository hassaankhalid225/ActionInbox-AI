import { db } from "@/lib/db";
import { stringifyJson } from "@/lib/utils/json";

// Append-only audit trail (SRS FR-031, NFR-018, BR-007). Never updated/deleted
// through standard app flows.
export async function recordAudit(input: {
  orgId: string;
  actorId?: string | null;
  actorType?: "user" | "ai" | "system" | "integration";
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  meta?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        orgId: input.orgId,
        actorId: input.actorId ?? null,
        actorType: input.actorType ?? "user",
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        metaJson: input.meta ? stringifyJson(input.meta) : null,
        ip: input.ip ?? null,
      },
    });
  } catch {
    // Audit must never break the primary flow.
  }
}
