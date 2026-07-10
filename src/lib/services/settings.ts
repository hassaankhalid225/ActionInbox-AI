import { db } from "@/lib/db";
import { parseJson } from "@/lib/utils/json";

export type OrgSettings = {
  lowConfidenceThreshold?: number;
  requireApprovalMessages?: boolean;
  requireApprovalInvoices?: boolean;
  autoCreateTasks?: boolean;
  defaultTone?: string;
};

export async function getOrgWithSettings(orgId: string) {
  const org = await db.organization.findUniqueOrThrow({ where: { id: orgId } });
  return { org, settings: parseJson<OrgSettings>(org.settingsJson, {}) };
}

export async function getMembers(orgId: string) {
  return db.membership.findMany({
    where: { orgId },
    include: { user: true },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
}

export async function getInvitations(orgId: string) {
  return db.invitation.findMany({ where: { orgId, status: "pending" }, orderBy: { createdAt: "desc" } });
}

export async function getChannels(orgId: string) {
  return db.channelAccount.findMany({ where: { orgId }, orderBy: { createdAt: "asc" } });
}

export async function getAuditLogs(orgId: string, take = 50) {
  return db.auditLog.findMany({ where: { orgId }, include: { actor: true }, orderBy: { createdAt: "desc" }, take });
}

export async function getWebhookEvents(orgId: string, take = 20) {
  return db.webhookEvent.findMany({ where: { orgId }, orderBy: { createdAt: "desc" }, take });
}
