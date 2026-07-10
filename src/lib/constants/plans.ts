// Monetization & packaging (PRD §12). Limits feed UsageCounter enforcement.

export type PlanId = "solo" | "team" | "ops";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number; // USD, indicative
  priceYearly: number;
  currency: string;
  highlight?: boolean;
  target: string;
  features: string[];
  limits: {
    seats: number;
    channels: number;
    aiActions: number; // per month
    ocrPages: number;
    voiceMinutes: number;
    storageMb: number;
    workflowRules: number;
  };
};

export const PLANS: Record<PlanId, Plan> = {
  solo: {
    id: "solo",
    name: "Solo",
    tagline: "For freelancers & one-person operators",
    priceMonthly: 24,
    priceYearly: 240,
    currency: "USD",
    target: "1 user, 1 channel",
    features: [
      "1 team member",
      "1 connected channel",
      "500 AI actions / month",
      "Tasks, reminders & follow-ups",
      "Basic quote & invoice drafts",
    ],
    limits: { seats: 1, channels: 1, aiActions: 500, ocrPages: 300, voiceMinutes: 120, storageMb: 2048, workflowRules: 3 },
  },
  team: {
    id: "team",
    name: "Team",
    tagline: "For small businesses with 2–10 people",
    priceMonthly: 79,
    priceYearly: 790,
    currency: "USD",
    highlight: true,
    target: "Team inbox & commerce",
    features: [
      "Up to 10 team members",
      "3 connected channels",
      "3,000 AI actions / month",
      "Catalog, quotes & invoices",
      "Workflow rules & analytics",
      "Audit log & exports",
    ],
    limits: { seats: 10, channels: 3, aiActions: 3000, ocrPages: 2000, voiceMinutes: 800, storageMb: 20480, workflowRules: 25 },
  },
  ops: {
    id: "ops",
    name: "Ops",
    tagline: "For growing SMBs with finance/admin teams",
    priceMonthly: 199,
    priceYearly: 1990,
    currency: "USD",
    target: "Approvals & integrations",
    features: [
      "Unlimited team members",
      "10 connected channels",
      "15,000 AI actions / month",
      "Advanced roles & approvals",
      "Priority support",
      "Integrations & API access",
    ],
    limits: { seats: 999, channels: 10, aiActions: 15000, ocrPages: 12000, voiceMinutes: 4000, storageMb: 102400, workflowRules: 200 },
  },
};

export const PLAN_LIST = Object.values(PLANS);

export const USAGE_METRICS = [
  { key: "ai_actions", label: "AI actions", limitKey: "aiActions" as const, unit: "" },
  { key: "ocr_pages", label: "OCR pages", limitKey: "ocrPages" as const, unit: "" },
  { key: "voice_minutes", label: "Voice minutes", limitKey: "voiceMinutes" as const, unit: "min" },
  { key: "storage_mb", label: "Storage", limitKey: "storageMb" as const, unit: "MB" },
  { key: "seats", label: "Team seats", limitKey: "seats" as const, unit: "" },
];
