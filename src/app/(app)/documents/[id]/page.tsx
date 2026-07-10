import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, FileText, User } from "lucide-react";
import { requireAuth, can } from "@/lib/auth/context";
import { getDocument } from "@/lib/services/documents";
import { parseJson } from "@/lib/utils/json";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, ConfidenceBadge } from "@/components/ui/status";
import { EmptyState } from "@/components/ui/empty-state";
import { ObligationToggle } from "@/components/documents/obligation-toggle";
import { formatMoney, formatDate, dueLabel, titleCase } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Document" };
export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const ctx = await requireAuth();
  const doc = await getDocument(ctx.org.id, params.id);
  if (!doc) notFound();

  const canManage = can(ctx.role, "document.manage");
  const fields = parseJson<Record<string, unknown>>(doc.extractedJson ?? null, {});
  const fieldEntries = Object.entries(fields);

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm"><Link href="/documents"><ArrowLeft className="size-4" /> Documents</Link></Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary-muted text-primary"><FileText className="size-5" /></div>
          <div>
            <h1 className="text-lg font-semibold">{doc.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" size="sm">{titleCase(doc.docType)}</Badge>
              <StatusBadge status={doc.status} size="sm" />
              {doc.confidence > 0 && <ConfidenceBadge value={doc.confidence} size="sm" />}
            </div>
          </div>
        </div>
        {doc.contact && (
          <Button asChild variant="outline" size="sm"><Link href={`/customers/${doc.contact.id}`}><User className="size-4" /> {doc.contact.name}</Link></Button>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {/* Preview placeholder */}
          <Card>
            <CardHeader><CardTitle className="text-base">Preview</CardTitle></CardHeader>
            <CardContent>
              <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-muted/40 text-center">
                <FileText className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Preview not available in demo build</p>
                <p className="text-2xs text-muted-foreground">{doc.mimeType ?? "application/pdf"} · {doc.pageCount} page(s)</p>
              </div>
            </CardContent>
          </Card>

          {doc.ocrText && (
            <Card>
              <CardHeader><CardTitle className="text-base">OCR text</CardTitle></CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-lg bg-surface-muted/50 p-4 font-mono text-xs leading-relaxed text-muted-foreground">{doc.ocrText}</pre>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          {/* Extracted fields */}
          <Card>
            <CardHeader><CardTitle className="text-base">Extracted fields</CardTitle></CardHeader>
            <CardContent className="p-0">
              {fieldEntries.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-muted-foreground">No structured fields extracted.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {fieldEntries.map(([k, v]) => (
                    <li key={k} className="flex items-center justify-between gap-4 px-5 py-2.5 text-sm">
                      <span className="text-muted-foreground">{titleCase(k)}</span>
                      <span className="font-medium">{String(v)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Obligations */}
          <Card>
            <CardHeader><CardTitle className="text-base">Obligations</CardTitle></CardHeader>
            <CardContent className="p-0">
              {doc.obligations.length === 0 ? (
                <div className="px-5 pb-5"><EmptyState compact title="No obligations" description="No deadlines or duties detected." className="border-0" /></div>
              ) : (
                <ul className="divide-y divide-border">
                  {doc.obligations.map((o) => {
                    const due = dueLabel(o.dueAt);
                    return (
                      <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <p className={cn("text-sm font-medium", o.status !== "open" && "text-muted-foreground line-through")}>{o.title}</p>
                          <div className="mt-0.5 flex items-center gap-2 text-2xs">
                            <span className={cn(due.tone === "danger" ? "text-danger" : "text-muted-foreground")}>{due.label}</span>
                            {o.amountCents != null && <span className="tabnum text-muted-foreground">{formatMoney(o.amountCents, ctx.org.currency)}</span>}
                            {o.riskLevel === "high" && <Badge variant="danger" size="sm">High risk</Badge>}
                          </div>
                        </div>
                        {canManage && <ObligationToggle id={o.id} status={o.status} />}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
