import { test } from "node:test";
import assert from "node:assert/strict";
import { computeTotals } from "../src/lib/commerce/totals";
import { can, ROLE_PERMISSIONS } from "../src/lib/constants/rbac";
import { formatMoney, parseMoneyToCents } from "../src/lib/utils/format";
import { MockAiProvider } from "../src/lib/ai/mock-provider";

test("computeTotals sums line items, tax, and discount", () => {
  const t = computeTotals(
    [
      { name: "A", quantity: 2, unitPriceCents: 10000, taxPercent: 10 }, // 20000 + 2000 tax
      { name: "B", quantity: 1, unitPriceCents: 5000, taxPercent: 0 }, // 5000
    ],
    1000, // discount
  );
  assert.equal(t.subtotalCents, 25000);
  assert.equal(t.taxCents, 2000);
  assert.equal(t.totalCents, 26000); // 25000 + 2000 - 1000
});

test("computeTotals never goes negative", () => {
  const t = computeTotals([{ name: "A", quantity: 1, unitPriceCents: 1000, taxPercent: 0 }], 99999);
  assert.equal(t.totalCents, 0);
});

test("RBAC: owner has all permissions, viewer is read-only", () => {
  assert.equal(can("owner", "org.delete"), true);
  assert.equal(can("owner", "invoice.manage"), true);
  assert.equal(can("viewer", "invoice.manage"), false);
  assert.equal(can("viewer", "analytics.view"), true);
  assert.equal(can("finance", "payment.verify"), true);
  assert.equal(can("agent", "billing.manage"), false);
  assert.equal(can(null, "inbox.view"), false);
});

test("RBAC: every role has at least one permission", () => {
  for (const [, perms] of Object.entries(ROLE_PERMISSIONS)) {
    assert.ok(perms.length > 0);
  }
});

test("money formatting round-trips through cents", () => {
  assert.equal(parseMoneyToCents("1,250.50"), 125050);
  assert.equal(parseMoneyToCents(99.99), 9999);
  assert.match(formatMoney(125050, "USD"), /1,250\.50/);
});

test("MockAiProvider classifies a quote request with entities", async () => {
  const provider = new MockAiProvider();
  const result = await provider.analyze({
    text: "mujhe 20 bundle saria 8 aur 50 bag cement chahiye, rate btao",
    channelType: "whatsapp",
    catalog: [
      { id: "c1", name: "Steel Rod 8mm", aliases: ["saria 8"], priceCents: 1480000, unit: "bundle", taxPercent: 17 },
      { id: "c2", name: "Cement Bag OPC", aliases: ["cement"], priceCents: 135000, unit: "bag", taxPercent: 17 },
    ],
  });
  assert.equal(result.intent, "quote_request");
  assert.ok(result.confidence > 0 && result.confidence <= 100);
  assert.ok(result.entities.some((e) => e.type === "product"));
  assert.ok(result.suggestedActions.some((a) => a.type === "quote"));
});

test("MockAiProvider flags low confidence for unknown text", async () => {
  const provider = new MockAiProvider();
  const result = await provider.analyze({ text: "ok thanks", channelType: "whatsapp", lowConfidenceThreshold: 70 });
  assert.ok(result.confidence < 70);
});
