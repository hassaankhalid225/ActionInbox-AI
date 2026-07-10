import { z } from "zod";

export const businessProfileSchema = z.object({
  name: z.string().min(2, "Business name is required").max(80),
  industry: z.string().min(1, "Select an industry"),
  country: z.string().min(2).max(2),
  currency: z.string().min(3).max(3),
  timezone: z.string().min(1),
  teamSize: z.string().min(1),
  primaryLang: z.string().min(2),
  secondaryLang: z.string().optional().nullable(),
});
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;

export const goalSchema = z.object({
  primaryGoal: z.enum([
    "faster_quotes",
    "payment_followups",
    "doc_reminders",
    "customer_inbox",
    "general",
  ]),
});

export const approvalPrefsSchema = z.object({
  requireApprovalMessages: z.boolean().default(true),
  requireApprovalInvoices: z.boolean().default(true),
  autoCreateTasks: z.boolean().default(true),
  lowConfidenceThreshold: z.number().min(0).max(100).default(70),
});
export type ApprovalPrefsInput = z.infer<typeof approvalPrefsSchema>;
