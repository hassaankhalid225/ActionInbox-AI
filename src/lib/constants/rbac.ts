import type { Role } from "./enums";

// ---------------------------------------------------------------------------
// Role-Based Access Control (SRS FR-003, NFR-005 — enforced server-side).
// Permissions are coarse-grained capabilities checked on every mutation and in
// the UI to hide/disable controls the user cannot use.
// ---------------------------------------------------------------------------

export const PERMISSIONS = [
  // inbox / actions
  "inbox.view",
  "inbox.assign",
  "action.review", // approve/edit/reject/defer
  "action.execute",
  // commerce
  "quote.manage",
  "invoice.manage",
  "payment.verify",
  "customer.manage",
  "catalog.manage",
  "document.manage",
  // ops
  "task.manage",
  "workflow.manage",
  "analytics.view",
  // administration
  "member.manage",
  "channel.manage",
  "template.manage",
  "settings.manage",
  "billing.manage",
  "org.delete",
  "audit.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: Permission[] = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ALL,
  admin: ALL.filter((p) => p !== "org.delete" && p !== "billing.manage"),
  manager: [
    "inbox.view",
    "inbox.assign",
    "action.review",
    "action.execute",
    "quote.manage",
    "invoice.manage",
    "customer.manage",
    "catalog.manage",
    "document.manage",
    "task.manage",
    "workflow.manage",
    "analytics.view",
    "audit.view",
  ],
  agent: [
    "inbox.view",
    "action.review",
    "action.execute",
    "quote.manage",
    "customer.manage",
    "task.manage",
    "document.manage",
  ],
  finance: [
    "inbox.view",
    "action.review",
    "invoice.manage",
    "quote.manage",
    "payment.verify",
    "customer.manage",
    "document.manage",
    "task.manage",
    "analytics.view",
  ],
  viewer: ["inbox.view", "analytics.view", "audit.view"],
};

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAny(role: Role | undefined | null, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

// Default landing route per role (App Flow §3 — role-based entry points).
export const ROLE_HOME: Record<Role, string> = {
  owner: "/dashboard",
  admin: "/dashboard",
  manager: "/actions",
  agent: "/inbox",
  finance: "/invoices",
  viewer: "/analytics",
};
