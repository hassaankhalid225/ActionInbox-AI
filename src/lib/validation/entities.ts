import { z } from "zod";
import {
  ACTION_STATES,
  DOC_TYPES,
  PRIORITIES,
  REMINDER_KINDS,
  TASK_STATUS,
  TEMPLATE_TYPES,
  TONES,
  WORKFLOW_TRIGGERS,
} from "@/lib/constants/enums";

const optionalId = z.string().optional().nullable();

// ── Contacts (customers/vendors) ──────────────────────────────────────────
export const contactSchema = z.object({
  kind: z.enum(["customer", "vendor", "lead"]).default("customer"),
  name: z.string().min(1, "Name is required").max(120),
  company: z.string().max(120).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
  language: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});
export type ContactInput = z.infer<typeof contactSchema>;

// ── Catalog ───────────────────────────────────────────────────────────────
export const catalogItemSchema = z.object({
  sku: z.string().max(40).optional().nullable(),
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(1000).optional().nullable(),
  unit: z.string().max(24).default("unit"),
  priceCents: z.number().int().min(0).default(0),
  taxPercent: z.number().int().min(0).max(100).default(0),
  trackStock: z.boolean().default(false),
  stockQty: z.number().int().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  aliases: z.array(z.string().min(1)).default([]),
});
export type CatalogItemInput = z.infer<typeof catalogItemSchema>;

// ── Line items (quotes/invoices) ──────────────────────────────────────────
export const lineItemSchema = z.object({
  name: z.string().min(1, "Item name required"),
  description: z.string().optional().nullable(),
  quantity: z.number().min(0.01, "Qty must be positive"),
  unitPriceCents: z.number().int().min(0),
  taxPercent: z.number().int().min(0).max(100).default(0),
});

export const quoteSchema = z.object({
  contactId: optionalId,
  currency: z.string().min(3).max(3).default("PKR"),
  notes: z.string().max(2000).optional().nullable(),
  terms: z.string().max(2000).optional().nullable(),
  validUntil: z.string().optional().nullable(),
  discountCents: z.number().int().min(0).default(0),
  items: z.array(lineItemSchema).min(1, "Add at least one line item"),
});
export type QuoteInput = z.infer<typeof quoteSchema>;

export const invoiceSchema = z.object({
  contactId: optionalId,
  quoteId: optionalId,
  currency: z.string().min(3).max(3).default("PKR"),
  notes: z.string().max(2000).optional().nullable(),
  terms: z.string().max(2000).optional().nullable(),
  dueAt: z.string().optional().nullable(),
  discountCents: z.number().int().min(0).default(0),
  items: z.array(lineItemSchema).min(1, "Add at least one line item"),
});
export type InvoiceInput = z.infer<typeof invoiceSchema>;

export const paymentSchema = z.object({
  amountCents: z.number().int().min(1, "Amount is required"),
  method: z.enum(["manual", "bank", "cash", "online"]).default("manual"),
  reference: z.string().optional().nullable(),
});

// ── Tasks & reminders ─────────────────────────────────────────────────────
export const taskSchema = z.object({
  title: z.string().min(1, "Task title required").max(200),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(TASK_STATUS).default("open"),
  priority: z.enum(PRIORITIES).default("normal"),
  dueAt: z.string().optional().nullable(),
  contactId: optionalId,
  assigneeId: optionalId,
});
export type TaskInput = z.infer<typeof taskSchema>;

export const reminderSchema = z.object({
  title: z.string().min(1).max(200),
  remindAt: z.string(),
  kind: z.enum(REMINDER_KINDS).default("followup"),
  contactId: optionalId,
});

// ── Documents ─────────────────────────────────────────────────────────────
export const documentSchema = z.object({
  title: z.string().min(1).max(200),
  docType: z.enum(DOC_TYPES).default("other"),
  contactId: optionalId,
});

// ── Templates ─────────────────────────────────────────────────────────────
export const templateSchema = z.object({
  type: z.enum(TEMPLATE_TYPES),
  name: z.string().min(1).max(120),
  language: z.string().default("en"),
  tone: z.enum(TONES).default("friendly"),
  subject: z.string().optional().nullable(),
  body: z.string().min(1, "Template body required"),
});

// ── Workflow rules ────────────────────────────────────────────────────────
export const workflowRuleSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().optional().nullable(),
  trigger: z.enum(WORKFLOW_TRIGGERS),
  isActive: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
  conditions: z
    .array(z.object({ field: z.string(), op: z.string(), value: z.string() }))
    .default([]),
  actions: z.array(z.object({ type: z.string(), configJson: z.string().optional() })).default([]),
});
export type WorkflowRuleInput = z.infer<typeof workflowRuleSchema>;

// ── Action review ─────────────────────────────────────────────────────────
export const actionDecisionSchema = z.object({
  decision: z.enum(["approve", "reject", "defer", "edit"]),
  reason: z.string().optional().nullable(),
  draftJson: z.string().optional().nullable(),
  deferUntil: z.string().optional().nullable(),
});

export const actionStateSchema = z.enum(ACTION_STATES);
