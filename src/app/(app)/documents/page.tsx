import Link from "next/link";
import type { Metadata } from "next";
import { FolderOpen, FileText, Receipt, FileSignature, FileWarning, BadgeCheck, File } from "lucide-react";
import { requireAuth } from "@/lib/auth/context";
import { getDocuments, getDocumentCounts } from "@/lib/services/documents";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfidenceBadge } from "@/components/ui/status";
import { UploadDialog } from "@/components/documents/upload-dialog";
import { formatDate, titleCase } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

const DOC_ICON: Record<string, typeof FileText> = {
  invoice: Receipt, receipt: Receipt, contract: FileSignature, notice: FileWarning, payment_proof: BadgeCheck, quote: FileText, id: File, other: File,
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "invoice", label: "Invoices" },
  { key: "receipt", label: "Receipts" },
  { key: "contract", label: "Contracts" },
  { key: "notice", label: "Notices" },
  { key: "payment_proof", label: "Payment proofs" },
  { key: "other", label: "Other" },
];

export default async function DocumentsPage({ searchParams }: { searchParams: { docType?: string; q?: string; page?: string } }) {
  const ctx = await requireAuth();
  const docType = searchParams.docType && searchParams.docType !== "all" ? searchParams.docType : undefined;
  const page = parseInt(searchParams.page ?? "1", 10) || 1;

  const [{ items, total, pageSize }, counts, contacts] = await Promise.all([
    getDocuments(ctx.org.id, { docType, search: searchParams.q, page }),
    getDocumentCounts(ctx.org.id),
    db.contact.findMany({ where: { orgId: ctx.org.id }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 300 }),
  ]);
  const tabs = FILTERS.map((f) => ({ key: f.key, label: f.label, count: (counts as Record<string, number>)[f.key] }));

  return (
    <div className="space-y-5">
      <PageHeader title="Documents" description="Uploads, OCR results, extracted fields, and obligations." actions={<UploadDialog contacts={contacts} />} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs tabs={tabs} active={searchParams.docType ?? "all"} basePath="/documents" paramKey="docType" extraParams={{ q: searchParams.q }} />
        <SearchInput placeholder="Search documents…" className="lg:w-64" />
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<FolderOpen />} title={searchParams.q ? "No matching documents" : "No documents yet"} description="Upload a PDF or image, or let inbound attachments create document records automatically." action={<UploadDialog contacts={contacts} />} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((doc) => {
            const Icon = DOC_ICON[doc.docType] ?? File;
            return (
              <Link key={doc.id} href={`/documents/${doc.id}`}>
                <Card interactive className="h-full">
                  <CardContent className="flex gap-3 p-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary"><Icon className="size-5" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{doc.title}</p>
                      <p className="text-2xs text-muted-foreground">{doc.contact?.name ?? "Unlinked"} · {formatDate(doc.createdAt)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" size="sm">{titleCase(doc.docType)}</Badge>
                        {doc.confidence > 0 && <ConfidenceBadge value={doc.confidence} size="sm" />}
                        {doc._count.obligations > 0 && <Badge variant="warning" size="sm">{doc._count.obligations} obligation{doc._count.obligations > 1 ? "s" : ""}</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      <Pagination page={page} total={total} pageSize={pageSize} basePath="/documents" params={{ docType: searchParams.docType, q: searchParams.q }} />
    </div>
  );
}
