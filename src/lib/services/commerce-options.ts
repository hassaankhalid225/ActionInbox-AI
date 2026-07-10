import { db } from "@/lib/db";

/** Contacts + active catalog used to populate the quote/invoice editor. */
export async function getEditorOptions(orgId: string) {
  const [contacts, catalog] = await Promise.all([
    db.contact.findMany({ where: { orgId, kind: { in: ["customer", "lead"] } }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 300 }),
    db.catalogItem.findMany({ where: { orgId, isActive: true }, select: { id: true, name: true, priceCents: true, taxPercent: true, unit: true }, orderBy: { name: "asc" }, take: 300 }),
  ]);
  return { contacts, catalog };
}
