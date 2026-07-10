/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { runNow } from "../src/lib/jobs/queue";
import { PLANS } from "../src/lib/constants/plans";

const db = new PrismaClient();

const DEMO_PASSWORD = "Password123";
const now = new Date();
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

async function main() {
  console.log("🌱  Seeding ActionInbox AI demo workspace…");

  // Clean slate (dev only) — order respects FKs via cascade on org delete.
  await db.organization.deleteMany({});
  await db.user.deleteMany({});

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // ── Organization ──────────────────────────────────────────────────────────
  const org = await db.organization.create({
    data: {
      name: "Karachi Traders Co.",
      slug: "karachi-traders",
      industry: "Wholesale & Distribution",
      country: "PK",
      currency: "PKR",
      timezone: "Asia/Karachi",
      primaryLang: "en",
      secondaryLang: "ur-roman",
      teamSize: "2-10",
      brandColor: "#4f46e5",
      primaryGoal: "faster_quotes",
      onboardingStep: 6,
      onboardedAt: now,
      settingsJson: JSON.stringify({
        lowConfidenceThreshold: 70,
        requireApprovalMessages: true,
        requireApprovalInvoices: true,
        autoCreateTasks: true,
        defaultTone: "friendly",
      }),
    },
  });

  // ── Users + memberships (all roles) ────────────────────────────────────────
  const people: { name: string; email: string; role: string; color: string; isDefault?: boolean }[] = [
    { name: "Aisha Khan", email: "owner@actioninbox.demo", role: "owner", color: "#4f46e5", isDefault: true },
    { name: "Bilal Ahmed", email: "admin@actioninbox.demo", role: "admin", color: "#0ea5e9" },
    { name: "Sana Malik", email: "manager@actioninbox.demo", role: "manager", color: "#16a34a" },
    { name: "Usman Raza", email: "agent@actioninbox.demo", role: "agent", color: "#f59e0b" },
    { name: "Fatima Sheikh", email: "finance@actioninbox.demo", role: "finance", color: "#db2777" },
    { name: "Imran Ali", email: "viewer@actioninbox.demo", role: "viewer", color: "#64748b" },
  ];

  const users: Record<string, string> = {};
  for (const p of people) {
    const user = await db.user.create({
      data: {
        name: p.name,
        email: p.email,
        passwordHash,
        avatarColor: p.color,
        emailVerified: true,
        status: "active",
        lastLoginAt: now,
        memberships: { create: { orgId: org.id, role: p.role, status: "active", isDefault: p.isDefault ?? false } },
      },
    });
    users[p.role] = user.id;
  }

  // ── Subscription + usage counters ───────────────────────────────────────────
  const plan = PLANS.team;
  await db.subscription.create({
    data: {
      orgId: org.id,
      plan: "team",
      status: "trialing",
      trialEndsAt: daysFromNow(11),
      currentPeriodEnd: daysFromNow(30),
      seats: plan.limits.seats,
    },
  });
  const period = now.toISOString().slice(0, 7);
  const usage: [string, number, number][] = [
    ["ai_actions", 842, plan.limits.aiActions],
    ["ocr_pages", 318, plan.limits.ocrPages],
    ["voice_minutes", 96, plan.limits.voiceMinutes],
    ["storage_mb", 1240, plan.limits.storageMb],
    ["seats", 6, plan.limits.seats],
  ];
  for (const [metric, used, limit] of usage) {
    await db.usageCounter.create({ data: { orgId: org.id, metric, period, used, limit } });
  }

  // ── Channels ────────────────────────────────────────────────────────────────
  const waChannel = await db.channelAccount.create({
    data: {
      orgId: org.id,
      type: "whatsapp",
      label: "Sales WhatsApp",
      status: "connected",
      identifier: "+92 300 1234567",
      lastEventAt: now,
    },
  });
  await db.channelAccount.create({
    data: {
      orgId: org.id,
      type: "email",
      label: "Forwarding inbox",
      status: "connected",
      identifier: "karachi-traders@inbox.actioninbox.ai",
      lastEventAt: now,
    },
  });
  await db.channelAccount.create({
    data: { orgId: org.id, type: "upload", label: "Web uploads", status: "connected" },
  });

  // ── Catalog + aliases ────────────────────────────────────────────────────────
  const catalog = [
    { sku: "STL-6MM", name: "Steel Rod 6mm", unit: "bundle", priceCents: 1250000, tax: 17, aliases: ["sariya", "6mm rod", "saria 6"] },
    { sku: "STL-8MM", name: "Steel Rod 8mm", unit: "bundle", priceCents: 1480000, tax: 17, aliases: ["8mm rod", "saria 8"] },
    { sku: "CEM-OPC", name: "Cement Bag OPC", unit: "bag", priceCents: 135000, tax: 17, aliases: ["cement", "bori", "opc"] },
    { sku: "PVC-4IN", name: "PVC Pipe 4 inch", unit: "piece", priceCents: 82000, tax: 17, aliases: ["pipe 4inch", "pvc pipe"] },
    { sku: "PNT-WHT", name: "Wall Paint White 20L", unit: "drum", priceCents: 950000, tax: 17, aliases: ["paint", "safaidi", "white paint"] },
    { sku: "BRK-RED", name: "Red Bricks (1000)", unit: "pallet", priceCents: 1800000, tax: 0, aliases: ["bricks", "eint", "eent"] },
  ];
  const catalogIds: Record<string, string> = {};
  for (const c of catalog) {
    const item = await db.catalogItem.create({
      data: {
        orgId: org.id,
        sku: c.sku,
        name: c.name,
        unit: c.unit,
        priceCents: c.priceCents,
        taxPercent: c.tax,
        isActive: true,
        aliases: { create: c.aliases.map((a) => ({ alias: a, language: "ur-roman" })) },
      },
    });
    catalogIds[c.sku] = item.id;
  }

  // ── Contacts (customers + vendors) ────────────────────────────────────────────
  const mkContact = (data: Partial<Parameters<typeof db.contact.create>[0]["data"]> & { name: string }) =>
    db.contact.create({ data: { orgId: org.id, kind: "customer", ...data } as any });

  const cust = {
    ahmed: await mkContact({ name: "Ahmed Constructions", company: "Ahmed & Sons", phone: "+92 301 2223344", email: "ahmed@builders.pk", language: "ur-roman", tags: "vip,builder" }),
    zeeshan: await mkContact({ name: "Zeeshan Enterprises", phone: "+92 333 7778899", email: "zee@ent.pk", language: "en", tags: "wholesale" }),
    hina: await mkContact({ name: "Hina Interiors", phone: "+92 345 1112233", language: "ur-roman", tags: "interior" }),
    farhan: await mkContact({ name: "Farhan Builders", phone: "+92 321 4455667", email: "farhan@fb.pk" }),
    noor: await mkContact({ name: "Noor Hardware", phone: "+92 300 9988776", tags: "retail" }),
  };
  const vendor = {
    metro: await db.contact.create({ data: { orgId: org.id, kind: "vendor", name: "Metro Steel Mills", email: "sales@metrosteel.pk", phone: "+92 42 111222" } }),
  };

  // ── Templates ────────────────────────────────────────────────────────────────
  const templates = [
    { type: "quote", name: "Standard quote", tone: "friendly", body: "Dear {{customer}},\n\nThank you for your inquiry. Please find our quotation below.\n\n{{items}}\n\nTotal: {{total}}\nValid until: {{valid_until}}\n\nRegards,\n{{org}}" },
    { type: "followup", name: "Gentle payment follow-up", tone: "friendly", body: "Hi {{customer}}, hope you're well! This is a friendly reminder about invoice {{invoice}} of {{amount}}, due on {{due_date}}. Thank you!" },
    { type: "followup", name: "Firm payment follow-up", tone: "formal", body: "Dear {{customer}}, invoice {{invoice}} ({{amount}}) is now overdue since {{due_date}}. Kindly arrange payment at the earliest." },
    { type: "reminder", name: "Delivery reminder", tone: "concise", body: "Reminder: delivery for {{customer}} scheduled on {{date}}." },
    { type: "greeting", name: "First response", tone: "friendly", body: "Assalam-o-alaikum {{customer}}! Thanks for contacting {{org}}. How can we help you today?" },
    { type: "payment_request", name: "Payment request", tone: "friendly", body: "Dear {{customer}}, please find invoice {{invoice}} attached for {{amount}}. Payment details: {{bank}}." },
  ];
  for (const t of templates) {
    await db.template.create({
      data: { orgId: org.id, type: t.type, name: t.name, tone: t.tone, body: t.body, isDefault: true, language: "en" },
    });
  }

  // ── Workflow rules ────────────────────────────────────────────────────────────
  await db.workflowRule.create({
    data: {
      orgId: org.id,
      name: "Route payment proofs to Finance",
      description: "When a payment proof arrives, assign it to the finance team and tag it.",
      trigger: "inbound_received",
      conditionsJson: JSON.stringify([{ field: "intent", op: "eq", value: "payment_proof" }]),
      actionsJson: JSON.stringify([
        { type: "assign_role", configJson: JSON.stringify({ role: "finance" }) },
        { type: "add_label", configJson: JSON.stringify({ label: "payment" }) },
      ]),
      runCount: 3,
    },
  });
  await db.workflowRule.create({
    data: {
      orgId: org.id,
      name: "Escalate complaints",
      description: "Mark complaints urgent and notify managers.",
      trigger: "inbound_received",
      conditionsJson: JSON.stringify([{ field: "intent", op: "eq", value: "complaint" }]),
      actionsJson: JSON.stringify([
        { type: "set_priority", configJson: JSON.stringify({ priority: "urgent" }) },
        { type: "notify_managers", configJson: JSON.stringify({ title: "New complaint received" }) },
      ]),
      runCount: 1,
    },
  });
  await db.workflowRule.create({
    data: {
      orgId: org.id,
      name: "Auto-tag quote requests",
      description: "Label incoming quote requests for the sales team.",
      trigger: "inbound_received",
      conditionsJson: JSON.stringify([{ field: "intent", op: "eq", value: "quote_request" }]),
      actionsJson: JSON.stringify([{ type: "add_label", configJson: JSON.stringify({ label: "quote" }) }]),
      isActive: true,
      runCount: 7,
    },
  });

  // ── Labels ──────────────────────────────────────────────────────────────────
  for (const [name, color] of [["payment", "#16a34a"], ["quote", "#4f46e5"], ["urgent", "#dc2626"], ["vip", "#f59e0b"]] as const) {
    await db.label.create({ data: { orgId: org.id, name, color } });
  }

  // ── Inbound items (drive the AI pipeline) ─────────────────────────────────────
  type Seed = {
    contactId: string;
    channelType: string;
    kind: string;
    body: string;
    from: string;
    ageMin: number;
    assignee?: string;
    attachments?: { filename: string; kind: string; mime: string; transcript?: string; duration?: number }[];
  };

  const seeds: Seed[] = [
    {
      contactId: cust.ahmed.id, channelType: "whatsapp", kind: "audio", from: "+92 301 2223344", ageMin: 12, assignee: users.agent,
      body: "", attachments: [{ filename: "voice-note-01.ogg", kind: "audio", mime: "audio/ogg", duration: 24, transcript: "Assalam o alaikum, mujhe 20 bundle saria 8 aur 50 bag cement chahiye. Rate bata dein aur kal tak deliver ho sakta hai?" }],
    },
    {
      contactId: cust.zeeshan.id, channelType: "whatsapp", kind: "text", from: "+92 333 7778899", ageMin: 40,
      body: "Hi, please share quote for 100 PVC Pipe 4 inch and 10 drum wall paint white. Need pricing today.",
    },
    {
      contactId: cust.hina.id, channelType: "whatsapp", kind: "image", from: "+92 345 1112233", ageMin: 95, assignee: users.finance,
      body: "Payment done, Rs 45,000 transferred", attachments: [{ filename: "payment-slip.jpg", kind: "image", mime: "image/jpeg", transcript: "HBL Funds Transfer Successful. Amount PKR 45,000. Ref TX-889201. To Karachi Traders." }],
    },
    {
      contactId: cust.farhan.id, channelType: "email", kind: "email", from: "farhan@fb.pk", ageMin: 180,
      body: "Subject: Site meeting\n\nCan we schedule an appointment this Friday at 3pm to discuss the bricks order for the new project? Thanks.",
    },
    {
      contactId: vendor.metro.id, channelType: "email", kind: "document", from: "sales@metrosteel.pk", ageMin: 300,
      body: "Please find attached our invoice INV-5521 for the last steel supply.", attachments: [{ filename: "metro-invoice-5521.pdf", kind: "document", mime: "application/pdf", transcript: "INVOICE INV-5521. Metro Steel Mills. Bill to: Karachi Traders. Steel Rod 8mm x 40 bundles. Amount PKR 592,000. Due date: 30 days." }],
    },
    {
      contactId: cust.noor.id, channelType: "whatsapp", kind: "text", from: "+92 300 9988776", ageMin: 22,
      body: "The last cement delivery was damaged and 5 bags were broken. This is not acceptable, please resolve urgently or refund.",
    },
    {
      contactId: cust.ahmed.id, channelType: "whatsapp", kind: "text", from: "+92 301 2223344", ageMin: 8,
      body: "bricks ka kya rate hai? 2 pallet chahiye",
    },
    {
      contactId: cust.zeeshan.id, channelType: "whatsapp", kind: "text", from: "+92 333 7778899", ageMin: 5,
      body: "thanks",
    },
  ];

  for (const s of seeds) {
    const conv = await db.conversation.create({
      data: {
        orgId: org.id,
        channelId: s.channelType === "whatsapp" ? waChannel.id : null,
        contactId: s.contactId,
        channelType: s.channelType,
        status: "open",
        lastMessageAt: new Date(now.getTime() - s.ageMin * 60000),
        unread: true,
      },
    });
    const item = await db.inboundItem.create({
      data: {
        orgId: org.id,
        conversationId: conv.id,
        channelId: conv.channelId,
        contactId: s.contactId,
        channelType: s.channelType,
        kind: s.kind,
        bodyText: s.body,
        fromIdentifier: s.from,
        assignedToId: s.assignee ?? null,
        receivedAt: new Date(now.getTime() - s.ageMin * 60000),
        attachments: s.attachments
          ? {
              create: s.attachments.map((a) => ({
                orgId: org.id,
                filename: a.filename,
                mimeType: a.mime,
                kind: a.kind,
                storageKey: `seed/${a.filename}`,
                sizeBytes: 128000,
                durationSec: a.duration ?? null,
                transcriptText: a.transcript ?? null,
                status: "ready",
              })),
            }
          : undefined,
      },
    });

    // Run the pipeline synchronously so analyses + suggestions exist after seed.
    await runNow({ type: "process_inbound", itemId: item.id });
  }

  // ── Quotes ────────────────────────────────────────────────────────────────────
  const q1 = await db.quote.create({
    data: {
      orgId: org.id, number: "QUO-1001", contactId: cust.zeeshan.id, status: "sent", currency: "PKR",
      validUntil: daysFromNow(10), sentAt: new Date(now.getTime() - 2 * 86400000),
      subtotalCents: 17700000, taxCents: 3009000, totalCents: 20709000,
      notes: "Delivery within 3 working days.", terms: "50% advance, 50% on delivery.",
      items: {
        create: [
          { name: "PVC Pipe 4 inch", quantity: 100, unitPriceCents: 82000, taxPercent: 17, lineTotalCents: 8200000 },
          { name: "Wall Paint White 20L", quantity: 10, unitPriceCents: 950000, taxPercent: 17, lineTotalCents: 9500000 },
        ],
      },
    },
  });

  // ── Invoices (varied statuses incl. overdue) ────────────────────────────────────
  await db.invoice.create({
    data: {
      orgId: org.id, number: "INV-1001", contactId: cust.ahmed.id, status: "overdue", currency: "PKR",
      dueAt: daysFromNow(-6), sentAt: new Date(now.getTime() - 20 * 86400000),
      subtotalCents: 6400000, taxCents: 1088000, totalCents: 7488000, paidCents: 0,
      items: { create: [{ name: "Steel Rod 8mm", quantity: 40, unitPriceCents: 148000, taxPercent: 17, lineTotalCents: 5920000 }] },
    },
  });
  await db.invoice.create({
    data: {
      orgId: org.id, number: "INV-1002", contactId: cust.hina.id, status: "partial", currency: "PKR",
      dueAt: daysFromNow(4), sentAt: new Date(now.getTime() - 6 * 86400000),
      subtotalCents: 9000000, taxCents: 1530000, totalCents: 10530000, paidCents: 4500000,
      items: { create: [{ name: "Wall Paint White 20L", quantity: 9, unitPriceCents: 950000, taxPercent: 17, lineTotalCents: 8550000 }] },
      payments: { create: [{ orgId: org.id, amountCents: 4500000, method: "bank", reference: "TX-889201", status: "verified" }] },
    },
  });
  await db.invoice.create({
    data: {
      orgId: org.id, number: "INV-1003", contactId: cust.zeeshan.id, quoteId: q1.id, status: "paid", currency: "PKR",
      dueAt: daysFromNow(-2), sentAt: new Date(now.getTime() - 15 * 86400000),
      subtotalCents: 3600000, taxCents: 612000, totalCents: 4212000, paidCents: 4212000,
      items: { create: [{ name: "Red Bricks (1000)", quantity: 2, unitPriceCents: 1800000, taxPercent: 0, lineTotalCents: 3600000 }] },
      payments: { create: [{ orgId: org.id, amountCents: 4212000, method: "cash", status: "verified" }] },
    },
  });
  await db.invoice.create({
    data: {
      orgId: org.id, number: "INV-1004", contactId: cust.farhan.id, status: "sent", currency: "PKR",
      dueAt: daysFromNow(9), sentAt: new Date(now.getTime() - 1 * 86400000),
      subtotalCents: 2700000, taxCents: 459000, totalCents: 3159000,
      items: { create: [{ name: "Cement Bag OPC", quantity: 20, unitPriceCents: 135000, taxPercent: 17, lineTotalCents: 2700000 }] },
    },
  });

  // ── Standalone tasks + reminders ────────────────────────────────────────────────
  await db.task.create({
    data: { orgId: org.id, title: "Call Ahmed about overdue INV-1001", priority: "high", status: "open", dueAt: daysFromNow(0), contactId: cust.ahmed.id, assigneeId: users.finance, createdById: users.manager, sourceType: "manual" },
  });
  await db.task.create({
    data: { orgId: org.id, title: "Arrange delivery truck for Friday", priority: "normal", status: "in_progress", dueAt: daysFromNow(2), assigneeId: users.agent, createdById: users.manager, sourceType: "manual" },
  });
  await db.task.create({
    data: { orgId: org.id, title: "Update paint stock levels", priority: "low", status: "done", assigneeId: users.admin, createdById: users.admin, completedAt: now, sourceType: "manual" },
  });

  await db.reminder.create({ data: { orgId: org.id, title: "Follow up: INV-1002 balance due", remindAt: daysFromNow(3), kind: "payment", contactId: cust.hina.id, relatedType: "invoice" } });
  await db.reminder.create({ data: { orgId: org.id, title: "Metro Steel bill due (INV-5521)", remindAt: daysFromNow(12), kind: "deadline" } });
  await db.reminder.create({ data: { orgId: org.id, title: "Site meeting with Farhan Builders", remindAt: daysFromNow(4), kind: "appointment", contactId: cust.farhan.id } });

  // ── Documents + obligations ──────────────────────────────────────────────────────
  const doc = await db.document.create({
    data: {
      orgId: org.id, contactId: vendor.metro.id, title: "Metro Steel Invoice INV-5521", docType: "invoice", status: "ready",
      mimeType: "application/pdf", pageCount: 1, confidence: 88,
      ocrText: "INVOICE INV-5521. Metro Steel Mills. Steel Rod 8mm x 40 bundles. Amount PKR 592,000. Due in 30 days.",
      extractedJson: JSON.stringify({ invoice_no: "INV-5521", amount: 592000, vendor: "Metro Steel Mills", due_days: 30 }),
    },
  });
  await db.obligation.create({ data: { orgId: org.id, documentId: doc.id, title: "Pay Metro Steel INV-5521 (PKR 592,000)", dueAt: daysFromNow(12), amountCents: 59200000, riskLevel: "high" } });

  // ── Notifications ──────────────────────────────────────────────────────────────
  await db.notification.create({ data: { orgId: org.id, userId: users.owner, type: "overdue", title: "Invoice INV-1001 is overdue", body: "Ahmed Constructions — PKR 74,880 · 6 days overdue", severity: "danger", linkUrl: "/invoices" } });
  await db.notification.create({ data: { orgId: org.id, userId: users.owner, type: "approval", title: "3 actions awaiting approval", body: "Review AI-suggested quotes and follow-ups", severity: "warning", linkUrl: "/actions" } });
  await db.notification.create({ data: { orgId: org.id, userId: users.finance, type: "assignment", title: "Payment proof assigned to you", body: "Hina Interiors shared a payment slip", severity: "info", linkUrl: "/inbox" } });

  // ── Analytics rollups (last 14 days) ──────────────────────────────────────────────
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
    const wave = Math.round(8 + Math.sin(i / 2) * 4 + (13 - i) * 0.6);
    await db.metricsRollup.create({ data: { orgId: org.id, date, metric: "inbound_items", value: Math.max(2, wave) } });
    await db.metricsRollup.create({ data: { orgId: org.id, date, metric: "actions_completed", value: Math.max(1, Math.round(wave * 0.55)) } });
    await db.metricsRollup.create({ data: { orgId: org.id, date, metric: "quotes_sent", value: Math.max(0, Math.round(wave * 0.2)) } });
  }

  const counts = {
    users: people.length,
    inbound: seeds.length,
    suggestions: await db.actionSuggestion.count({ where: { orgId: org.id } }),
    invoices: await db.invoice.count({ where: { orgId: org.id } }),
  };
  console.log("✅  Seed complete:", counts);
  console.log(`\n   Demo login: owner@actioninbox.demo  /  ${DEMO_PASSWORD}`);
  console.log("   (also admin@, manager@, agent@, finance@, viewer@ — same password)\n");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
