import { handler } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Workspace data export (SRS FR-060, NFR-007). Returns a JSON snapshot.
export const GET = handler(async () => {
  const ctx = await requirePermission("settings.manage");
  const orgId = ctx.org.id;

  const [org, contacts, catalog, quotes, invoices, tasks, documents] = await Promise.all([
    db.organization.findUnique({ where: { id: orgId } }),
    db.contact.findMany({ where: { orgId } }),
    db.catalogItem.findMany({ where: { orgId }, include: { aliases: true } }),
    db.quote.findMany({ where: { orgId }, include: { items: true } }),
    db.invoice.findMany({ where: { orgId }, include: { items: true, payments: true } }),
    db.task.findMany({ where: { orgId } }),
    db.document.findMany({ where: { orgId }, include: { obligations: true } }),
  ]);

  const payload = { exportedAt: new Date().toISOString(), org, contacts, catalog, quotes, invoices, tasks, documents };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="actioninbox-export-${org?.slug ?? "workspace"}.json"`,
    },
  });
});
