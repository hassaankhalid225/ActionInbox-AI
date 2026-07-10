// Central value sets mirroring the string columns in prisma/schema.prisma.
// These are the single source of truth for validation (Zod) and UI labels.

export const ROLES = ["owner", "admin", "manager", "agent", "finance", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  agent: "Agent",
  finance: "Finance",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Full control incl. billing, roles, and workspace deletion.",
  admin: "Manage users, integrations, workflows, templates, settings.",
  manager: "Supervise inbox, approvals, assignments, and analytics.",
  agent: "Handle inbox replies, action cards, tasks, customer updates.",
  finance: "Handle invoices, payment follow-ups, bills, payment proofs.",
  viewer: "Read-only visibility for reports and audit review.",
};

export const CHANNEL_TYPES = ["whatsapp", "email", "upload", "instagram", "sms"] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

export const INTENTS = [
  "new_inquiry",
  "order",
  "quote_request",
  "invoice",
  "payment_proof",
  "complaint",
  "appointment",
  "deadline",
  "contract",
  "receipt",
  "vendor_bill",
  "unknown",
] as const;
export type Intent = (typeof INTENTS)[number];

export const INTENT_LABELS: Record<Intent, string> = {
  new_inquiry: "New inquiry",
  order: "Order",
  quote_request: "Quote request",
  invoice: "Invoice",
  payment_proof: "Payment proof",
  complaint: "Complaint",
  appointment: "Appointment",
  deadline: "Deadline",
  contract: "Contract",
  receipt: "Receipt",
  vendor_bill: "Vendor bill",
  unknown: "Unknown",
};

export const ENTITY_TYPES = [
  "customer",
  "product",
  "amount",
  "date",
  "quantity",
  "phone",
  "email",
  "address",
  "invoice_no",
  "due_date",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const ACTION_TYPES = [
  "task",
  "quote",
  "invoice",
  "reminder",
  "followup",
  "crm_update",
  "calendar",
  "approval",
  "document",
] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  task: "Task",
  quote: "Quote draft",
  invoice: "Invoice draft",
  reminder: "Reminder",
  followup: "Follow-up message",
  crm_update: "Customer update",
  calendar: "Calendar event",
  approval: "Approval request",
  document: "Document record",
};

export const ACTION_STATES = [
  "suggested",
  "needs_review",
  "approved",
  "executed",
  "rejected",
  "deferred",
] as const;
export type ActionState = (typeof ACTION_STATES)[number];

export const ACTION_STATE_LABELS: Record<ActionState, string> = {
  suggested: "Suggested",
  needs_review: "Needs review",
  approved: "Approved",
  executed: "Executed",
  rejected: "Rejected",
  deferred: "Deferred",
};

export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const INBOUND_STATUS = [
  "received",
  "processing",
  "processed",
  "failed",
  "needs_review",
] as const;

export const TASK_STATUS = ["open", "in_progress", "done", "cancelled"] as const;
export const QUOTE_STATUS = ["draft", "sent", "accepted", "rejected", "expired", "converted"] as const;
export const INVOICE_STATUS = ["draft", "sent", "paid", "partial", "overdue", "void"] as const;
export const REMINDER_KINDS = ["payment", "renewal", "deadline", "delivery", "appointment", "followup"] as const;
export const DOC_TYPES = ["invoice", "receipt", "contract", "notice", "quote", "payment_proof", "id", "other"] as const;

export const TONES = ["formal", "friendly", "concise", "premium", "conversational"] as const;
export type Tone = (typeof TONES)[number];

export const TEMPLATE_TYPES = [
  "quote",
  "invoice",
  "followup",
  "reminder",
  "greeting",
  "escalation",
  "appointment",
  "payment_request",
] as const;

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ur", label: "Urdu" },
  { code: "ur-roman", label: "Roman Urdu" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
] as const;

export const WORKFLOW_TRIGGERS = [
  "inbound_received",
  "intent_detected",
  "invoice_due",
  "low_confidence",
  "payment_proof",
] as const;

export const NOTIFICATION_TYPES = [
  "assignment",
  "approval",
  "integration_failed",
  "overdue",
  "processing_error",
  "digest",
] as const;
