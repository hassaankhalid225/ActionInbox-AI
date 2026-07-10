import { db } from "@/lib/db";
import { runNow } from "@/lib/jobs/queue";

// Seeds a small, realistic demo dataset into a workspace so onboarding ends on a
// populated inbox/dashboard (App Flow §4 — "process first sample item").
// Idempotent-ish: guarded by an existing-catalog check.
export async function seedSampleData(orgId: string): Promise<void> {
  const existing = await db.catalogItem.count({ where: { orgId } });
  if (existing > 0) return;

  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!org) return;

  const channel = await db.channelAccount.create({
    data: { orgId, type: "whatsapp", label: "Sample WhatsApp", status: "connected", identifier: "+92 300 0000000", lastEventAt: new Date() },
  });

  const items = [
    { sku: "STL-8MM", name: "Steel Rod 8mm", unit: "bundle", priceCents: 1480000, tax: 17, aliases: ["saria 8", "8mm rod"] },
    { sku: "CEM-OPC", name: "Cement Bag OPC", unit: "bag", priceCents: 135000, tax: 17, aliases: ["cement", "bori"] },
    { sku: "BRK-RED", name: "Red Bricks (1000)", unit: "pallet", priceCents: 1800000, tax: 0, aliases: ["bricks", "eint"] },
  ];
  for (const c of items) {
    await db.catalogItem.create({
      data: { orgId, sku: c.sku, name: c.name, unit: c.unit, priceCents: c.priceCents, taxPercent: c.tax, aliases: { create: c.aliases.map((a) => ({ alias: a })) } },
    });
  }

  const customer = await db.contact.create({
    data: { orgId, kind: "customer", name: "Sample Customer", phone: "+92 301 1112222", language: "ur-roman", autoCreated: true },
  });

  await db.template.createMany({
    data: [
      { orgId, type: "greeting", name: "First response", body: "Assalam-o-alaikum {{customer}}! Thanks for contacting us. How can we help?", isDefault: true },
      { orgId, type: "followup", name: "Payment follow-up", body: "Hi {{customer}}, friendly reminder about invoice {{invoice}} due {{due_date}}.", isDefault: true },
    ],
  });

  const seeds = [
    { body: "", kind: "audio", transcript: "Assalam o alaikum, mujhe 15 bundle saria 8 aur 30 bag cement chahiye. Rate bata dein.", filename: "sample-voice.ogg" },
    { body: "bricks ka rate kya hai? 2 pallet chahiye", kind: "text" as const },
  ];
  for (const s of seeds) {
    const conv = await db.conversation.create({
      data: { orgId, channelId: channel.id, contactId: customer.id, channelType: "whatsapp", lastMessageAt: new Date() },
    });
    const item = await db.inboundItem.create({
      data: {
        orgId, conversationId: conv.id, channelId: channel.id, contactId: customer.id, channelType: "whatsapp",
        kind: s.kind, bodyText: s.body, fromIdentifier: customer.phone,
        attachments: "transcript" in s && s.transcript
          ? { create: [{ orgId, filename: (s as any).filename, mimeType: "audio/ogg", kind: "audio", storageKey: `sample/${(s as any).filename}`, durationSec: 20, transcriptText: (s as any).transcript, status: "ready" }] }
          : undefined,
      },
    });
    await runNow({ type: "process_inbound", itemId: item.id });
  }
}
