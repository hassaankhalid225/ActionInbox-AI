import type { AiProvider, AnalyzeInput, AiAnalysisResult, AiEntity, AiSuggestedAction, SourceRef } from "./types";
import type { Intent } from "@/lib/constants/enums";

// ---------------------------------------------------------------------------
// Deterministic, source-grounded mock engine. No external calls, no randomness
// (so seeds and demos are reproducible). Mirrors the real pipeline's contract
// so it can be swapped for Anthropic/OpenAI behind the same interface.
// ---------------------------------------------------------------------------

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function detectLanguage(text: string): string {
  if (/[؀-ۿ]/.test(text)) {
    // Arabic block: distinguish Urdu-ish vs Arabic by common words.
    if (/\b(?:درکار|قیمت|بھیج|سلام)\b/.test(text)) return "ur";
    return "ar";
  }
  const romanUrdu = ["chahiye", "kitne", "kitna", "rate", "bhej", "kal", "kar", "hai", "krna", "paise", "qeemat", "salam", "mil", "dena", "chahye"];
  const hits = romanUrdu.filter((w) => new RegExp(`\\b${w}`, "i").test(text)).length;
  return hits >= 2 ? "roman_urdu" : "en";
}

type IntentRule = { intent: Intent; patterns: RegExp[]; weight: number };

const INTENT_RULES: IntentRule[] = [
  { intent: "payment_proof", weight: 30, patterns: [/payment (done|sent|proof|slip)/i, /paid/i, /transfer(red)?/i, /receipt attached/i, /paisay bhej/i, /screenshot/i] },
  { intent: "quote_request", weight: 26, patterns: [/quot(e|ation)/i, /price|pricing|rate|cost/i, /how much/i, /kitne? (ka|ke|paise)/i, /qeemat/i, /estimate/i] },
  { intent: "order", weight: 24, patterns: [/order/i, /\bwant\b|\bneed\b|chahiye|chahye|drkar|darkar/i, /\b(\d+)\s*(pcs|units|dozen|kg|boxes?)/i, /send me|bhej (do|dein)/i] },
  { intent: "invoice", weight: 22, patterns: [/invoice/i, /bill/i, /inv[-#\s]?\d+/i] },
  { intent: "appointment", weight: 20, patterns: [/appointment|meeting|schedule|visit/i, /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, /\bat \d{1,2}(:\d{2})?\s?(am|pm)/i] },
  { intent: "complaint", weight: 20, patterns: [/complain|not working|broken|refund|damaged|late|worst|disappointed|issue with/i] },
  { intent: "vendor_bill", weight: 18, patterns: [/vendor|supplier|purchase order|\bpo\b/i] },
  { intent: "contract", weight: 18, patterns: [/contract|agreement|nda|terms of/i] },
  { intent: "deadline", weight: 16, patterns: [/deadline|due (date|by)|renew(al)?|expir(e|y|es)|last date/i] },
  { intent: "receipt", weight: 14, patterns: [/receipt|challan/i] },
  { intent: "new_inquiry", weight: 10, patterns: [/hello|hi|salam|assalam|inquir|available|do you have|info(rmation)?/i] },
];

function classifyIntent(text: string): { intent: Intent; secondary: Intent | null; confidence: number } {
  const scored = INTENT_RULES.map((r) => {
    const matched = r.patterns.filter((p) => p.test(text)).length;
    return { intent: r.intent, score: matched > 0 ? r.weight + matched * 6 : 0 };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { intent: "unknown", secondary: null, confidence: 35 };
  const top = scored[0]!;
  const confidence = clamp(48 + top.score);
  return { intent: top.intent, secondary: scored[1]?.intent ?? null, confidence };
}

function extractEntities(text: string, input: AnalyzeInput): AiEntity[] {
  const entities: AiEntity[] = [];
  const push = (e: AiEntity) => entities.push(e);

  // Contact name (from known sender)
  if (input.contactName) {
    push({ type: "customer", value: input.contactName, confidence: 92, source: "sender", resolvedRef: null });
  }

  // Email
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (email) push({ type: "email", value: email[0], confidence: 96, source: "message" });

  // Phone
  const phone = text.match(/(?:\+?\d[\d\s-]{7,}\d)/);
  if (phone) push({ type: "phone", value: phone[0].trim(), confidence: 88, source: "message" });

  // Invoice number
  const inv = text.match(/\binv[-#\s]?(\d{2,})/i);
  if (inv) push({ type: "invoice_no", value: `INV-${inv[1]}`, confidence: 90, source: "message" });

  // Amounts (Rs 5,000 / PKR 5000 / $120 / 5k)
  const amount = text.match(/(?:rs\.?|pkr|usd|\$|₨)\s?([\d,]+(?:\.\d{1,2})?)(k)?/i) || text.match(/\b([\d,]{2,})(k)\b/i);
  if (amount) {
    let n = parseFloat(amount[1].replace(/,/g, ""));
    if (amount[2]?.toLowerCase() === "k") n *= 1000;
    push({ type: "amount", value: String(n), confidence: 82, source: "message" });
  }

  // Dates / relative dates
  const rel = text.match(/\b(today|tomorrow|kal|next (?:week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|this (?:week|weekend)|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  if (rel) push({ type: "date", value: rel[0].toLowerCase(), confidence: 74, source: "message" });
  const explicitDate = text.match(/\b(\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?)\b/);
  if (explicitDate) push({ type: "due_date", value: explicitDate[1], confidence: 80, source: "message" });

  // Catalog products + quantities
  const catalog = input.catalog ?? [];
  for (const item of catalog) {
    const names = [item.name, ...item.aliases].filter(Boolean);
    for (const n of names) {
      const re = new RegExp(`(?:(\\d+)\\s*(?:x|pcs|units|dozen|boxes?|kg)?\\s*)?\\b${escapeRe(n)}\\b`, "i");
      const m = text.match(re);
      if (m) {
        const isAlias = n.toLowerCase() !== item.name.toLowerCase();
        push({
          type: "product",
          value: item.name,
          confidence: isAlias ? 78 : 90,
          source: `message:${n}`,
          resolvedRef: item.id,
        });
        if (m[1]) push({ type: "quantity", value: m[1], confidence: 85, source: `message:${n}` });
        break;
      }
    }
  }

  // Bare quantity phrases when no catalog match found
  if (!entities.some((e) => e.type === "quantity")) {
    const qty = text.match(/\b(\d+)\s*(pcs|units|dozen|boxes?|kg|items?)\b/i);
    if (qty) push({ type: "quantity", value: qty[1], confidence: 70, source: "message" });
  }

  return entities;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSourceEvidence(text: string, input: AnalyzeInput): SourceRef[] {
  const refs: SourceRef[] = [];
  const primary = text.slice(0, 240);
  const ref =
    input.attachments?.some((a) => a.kind === "audio")
      ? "transcript"
      : input.attachments?.length
        ? "ocr:page1"
        : "message";
  refs.push({ ref, snippet: primary });
  return refs;
}

function generateActions(
  intent: Intent,
  entities: AiEntity[],
  confidence: number,
  requireApprovalDefault: boolean,
): AiSuggestedAction[] {
  const actions: AiSuggestedAction[] = [];
  const products = entities.filter((e) => e.type === "product");
  const hasAmount = entities.some((e) => e.type === "amount");
  const customer = entities.find((e) => e.type === "customer")?.value ?? "the customer";

  const draftItems = products.map((p) => {
    const qty = Number(entities.find((e) => e.type === "quantity" && e.source === p.source)?.value ?? 1) || 1;
    return { name: p.value, quantity: qty, catalogId: p.resolvedRef ?? null };
  });

  switch (intent) {
    case "quote_request":
    case "order":
      actions.push({
        type: "quote",
        title: `Draft quote for ${customer}`,
        summary: products.length ? `${products.length} item(s) matched from catalog.` : "Confirm items before drafting.",
        confidence: clamp(confidence - (products.length ? 0 : 18)),
        requiresApproval: true,
        priority: "high",
        draft: { items: draftItems },
      });
      actions.push({
        type: "task",
        title: `Prepare & respond to ${customer}`,
        summary: "Reply with pricing and availability.",
        confidence: clamp(confidence),
        requiresApproval: false,
        priority: "normal",
        draft: { title: `Respond to ${customer} with quote` },
      });
      break;
    case "payment_proof":
      actions.push({
        type: "task",
        title: `Verify payment from ${customer}`,
        summary: hasAmount ? "Match the amount against an open invoice." : "Confirm amount and invoice.",
        confidence: clamp(confidence),
        requiresApproval: false,
        priority: "high",
        draft: { title: `Verify payment — ${customer}` },
      });
      actions.push({
        type: "crm_update",
        title: `Update ${customer} payment status`,
        summary: "Log payment against the customer record.",
        confidence: clamp(confidence - 8),
        requiresApproval: true,
        priority: "normal",
      });
      break;
    case "invoice":
    case "vendor_bill":
      actions.push({
        type: "invoice",
        title: `Record invoice for ${customer}`,
        summary: "Create an invoice/bill record with due date.",
        confidence: clamp(confidence),
        requiresApproval: true,
        priority: "normal",
        draft: { items: draftItems },
      });
      actions.push({
        type: "reminder",
        title: "Set payment reminder",
        summary: "Remind before the due date.",
        confidence: clamp(confidence - 10),
        requiresApproval: false,
        priority: "normal",
      });
      break;
    case "appointment":
      actions.push({
        type: "calendar",
        title: `Schedule appointment with ${customer}`,
        summary: "Create a calendar event from the requested time.",
        confidence: clamp(confidence),
        requiresApproval: true,
        priority: "normal",
      });
      actions.push({
        type: "reminder",
        title: "Remind before appointment",
        summary: "Notify ahead of the meeting.",
        confidence: clamp(confidence - 6),
        requiresApproval: false,
        priority: "low",
      });
      break;
    case "deadline":
    case "contract":
      actions.push({
        type: "reminder",
        title: "Track deadline / renewal",
        summary: "Create a reminder for the extracted date.",
        confidence: clamp(confidence),
        requiresApproval: false,
        priority: "high",
      });
      actions.push({
        type: "document",
        title: "File document & obligations",
        summary: "Store the document and its obligations.",
        confidence: clamp(confidence - 6),
        requiresApproval: true,
        priority: "normal",
      });
      break;
    case "complaint":
      actions.push({
        type: "task",
        title: `Resolve complaint from ${customer}`,
        summary: "Escalate to a manager for quick resolution.",
        confidence: clamp(confidence),
        requiresApproval: false,
        priority: "urgent",
      });
      break;
    case "new_inquiry":
      actions.push({
        type: "followup",
        title: `Reply to ${customer}`,
        summary: "Send a helpful first response.",
        confidence: clamp(confidence),
        requiresApproval: requireApprovalDefault,
        priority: "normal",
        draft: { channel: "reply", body: `Hi ${customer}, thanks for reaching out! How can we help you today?` },
      });
      break;
    default:
      actions.push({
        type: "task",
        title: "Review message manually",
        summary: "AI was unsure — a human should triage this item.",
        confidence: 40,
        requiresApproval: false,
        priority: "normal",
      });
  }
  return actions;
}

export class MockAiProvider implements AiProvider {
  name = "mock";

  async analyze(input: AnalyzeInput): Promise<AiAnalysisResult> {
    const start = Date.now();
    const text = (input.text ?? "").trim();
    const language = input.contactLanguage || detectLanguage(text);
    const { intent, secondary, confidence } = classifyIntent(text);
    const entities = extractEntities(text, input);
    const sourceEvidence = buildSourceEvidence(text, input);

    // Overall confidence blends intent + entity resolution quality.
    const resolved = entities.filter((e) => e.confidence >= 75).length;
    const overall = clamp(confidence * 0.7 + Math.min(30, resolved * 8));

    const riskFlags: string[] = [];
    if (overall < (input.lowConfidenceThreshold ?? 70)) riskFlags.push("low_confidence");
    if (intent === "invoice" || intent === "payment_proof") riskFlags.push("financial_review");
    if (!entities.some((e) => e.type === "amount") && (intent === "invoice" || intent === "quote_request")) {
      riskFlags.push("missing_amount");
    }

    const actions = generateActions(intent, entities, overall, true);
    const summary = buildSummary(intent, entities, input);

    const usage = [
      { operation: "classify", units: Math.ceil(text.length / 4), costCents: 1 },
      { operation: "extract", units: entities.length, costCents: 1 },
    ];

    return {
      intent,
      secondaryIntent: secondary,
      language,
      summary,
      confidence: overall,
      entities,
      suggestedActions: actions,
      riskFlags,
      sourceEvidence,
      provider: this.name,
      model: "mock-rules-v1",
      latencyMs: Date.now() - start,
      usage,
    };
  }

  async transcribe(input: { filename: string; hint?: string }) {
    return {
      text: input.hint ?? `[Transcribed voice note: ${input.filename}]`,
      confidence: 84,
      language: "roman_urdu",
    };
  }

  async ocr(input: { filename: string; hint?: string }) {
    return {
      text: input.hint ?? `[OCR extracted text from ${input.filename}]`,
      confidence: 80,
      pages: 1,
    };
  }
}

function buildSummary(intent: Intent, entities: AiEntity[], input: AnalyzeInput): string {
  const customer = entities.find((e) => e.type === "customer")?.value ?? input.contactName ?? "A contact";
  const products = entities.filter((e) => e.type === "product").map((e) => e.value);
  const amount = entities.find((e) => e.type === "amount")?.value;
  switch (intent) {
    case "quote_request":
      return `${customer} requested pricing${products.length ? ` for ${products.join(", ")}` : ""}.`;
    case "order":
      return `${customer} wants to order${products.length ? ` ${products.join(", ")}` : " items"}.`;
    case "payment_proof":
      return `${customer} shared a payment${amount ? ` of ${amount}` : ""}.`;
    case "invoice":
    case "vendor_bill":
      return `Incoming ${intent === "invoice" ? "invoice" : "vendor bill"}${amount ? ` for ${amount}` : ""}.`;
    case "appointment":
      return `${customer} requested an appointment.`;
    case "complaint":
      return `${customer} raised a complaint that needs attention.`;
    case "deadline":
    case "contract":
      return `Document with a deadline/obligation detected.`;
    default:
      return `Message from ${customer}.`;
  }
}
