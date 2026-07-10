import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Mic,
  FileText,
  Sparkles,
  Languages,
  TriangleAlert,
  Quote as QuoteIcon,
  Paperclip,
  Clock,
  User,
} from "lucide-react";
import { requireAuth, can } from "@/lib/auth/context";
import { getInboxItem, markInboxRead } from "@/lib/services/inbox";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/utils/json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfidenceBadge, IntentBadge, PriorityBadge, StatusBadge, ConfidenceMeter } from "@/components/ui/status";
import { ChannelIcon, channelLabel } from "@/components/inbox/kind-icon";
import { ItemToolbar } from "@/components/inbox/item-toolbar";
import { ActionReviewCard, type ReviewAction } from "@/components/actions/action-review-card";
import { ENTITY_TYPES, type EntityType } from "@/lib/constants/enums";
import { formatDateTime, titleCase } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Conversation" };
export const dynamic = "force-dynamic";

const ENTITY_LABELS: Record<EntityType, string> = {
  customer: "Customer", product: "Product", amount: "Amount", date: "Date",
  quantity: "Quantity", phone: "Phone", email: "Email", address: "Address",
  invoice_no: "Invoice no.", due_date: "Due date",
};

export default async function InboxDetailPage({ params }: { params: { id: string } }) {
  const ctx = await requireAuth();
  const item = await getInboxItem(ctx.org.id, params.id);
  if (!item) notFound();

  await markInboxRead(ctx.org.id, params.id);

  const members = (
    await db.membership.findMany({
      where: { orgId: ctx.org.id, status: "active" },
      include: { user: true },
      orderBy: { role: "asc" },
    })
  ).map((m) => ({ id: m.userId, name: m.user.name, avatarColor: m.user.avatarColor, role: m.role }));

  const canReview = can(ctx.role, "action.review");
  const canAssign = can(ctx.role, "inbox.assign");
  const analysis = item.analysis;
  const riskFlags = parseJson<string[]>(analysis?.riskFlagsJson ?? "[]", []);
  const sourceEvidence = parseJson<{ ref: string; snippet: string }[]>(analysis?.sourceEvidenceJson ?? "[]", []);

  const actions: ReviewAction[] = item.suggestions.map((s) => ({
    id: s.id,
    type: s.type,
    title: s.title,
    summary: s.summary,
    confidence: s.confidence,
    priority: s.priority,
    state: s.state,
    requiresApproval: s.requiresApproval,
    draftJson: s.draftJson,
    rejectionReason: s.rejectionReason,
    feedbackRating: s.feedbackRating,
    resultType: s.resultType,
    resultId: s.resultId,
    events: s.events.map((e) => ({ id: e.id, type: e.type, createdAt: e.createdAt.toISOString(), actorName: e.actor?.name ?? null })),
  }));

  const audioAttachment = item.attachments.find((a) => a.kind === "audio");
  const docAttachment = item.attachments.find((a) => a.kind === "document" || a.kind === "image");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm"><Link href="/inbox"><ArrowLeft className="size-4" /> Back to inbox</Link></Button>
        <ItemToolbar itemId={item.id} assigneeId={item.assignedToId} members={members} canAssign={canAssign} canReview={canReview} />
      </div>

      {/* Contact header */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={item.contact?.name ?? item.fromIdentifier ?? "Unknown"} size="lg" color={item.contact ? undefined : "#94a3b8"} />
            <div>
              <h1 className="text-lg font-semibold">{item.contact?.name ?? item.fromIdentifier ?? "Unknown sender"}</h1>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ChannelIcon channel={item.channelType} className="size-3.5" /> {channelLabel(item.channelType)}
                {item.fromIdentifier && <span>· {item.fromIdentifier}</span>}
                <span>· {formatDateTime(item.receivedAt)}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <IntentBadge intent={item.intent} />
            {item.confidence != null && <ConfidenceBadge value={item.confidence} />}
            <PriorityBadge priority={item.priority} />
            {item.contact && (
              <Button asChild variant="outline" size="sm"><Link href={`/customers/${item.contact.id}`}><User className="size-4" /> Profile</Link></Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing / failed states */}
      {item.status === "processing" && (
        <Card><CardContent className="flex items-center gap-3 p-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary-muted text-primary"><Sparkles className="size-5 animate-pulse-soft" /></div>
          <div><p className="text-sm font-medium">AI is analyzing this item…</p><p className="text-sm text-muted-foreground">Transcription, OCR, classification, and extraction are running. Refresh in a moment.</p></div>
        </CardContent></Card>
      )}
      {item.status === "failed" && (
        <Card className="border-danger/30"><CardContent className="p-5">
          <EmptyState compact icon={<TriangleAlert />} title="This item could not be processed automatically" description="You can retry the AI pipeline or handle it manually." className="border-0" />
        </CardContent></Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        {/* Left: source + understanding */}
        <div className="space-y-5">
          {/* Source evidence */}
          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <QuoteIcon className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Source evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.bodyText && (
                <div className="rounded-xl rounded-tl-sm bg-primary-muted/40 p-3.5 text-sm">
                  {item.bodyText}
                </div>
              )}
              {audioAttachment && (
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 text-sm font-medium"><Mic className="size-4 text-success" /> Voice note · {audioAttachment.durationSec ?? "—"}s</div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-8 flex-1 rounded-md bg-gradient-to-r from-success/20 to-success/5" />
                  </div>
                  {audioAttachment.transcriptText && (
                    <p className="mt-3 border-t border-border pt-3 text-sm italic text-muted-foreground">"{audioAttachment.transcriptText}"</p>
                  )}
                </div>
              )}
              {docAttachment && (
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 text-sm font-medium"><FileText className="size-4 text-primary" /> {docAttachment.filename}</div>
                  {docAttachment.transcriptText && (
                    <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">{docAttachment.transcriptText}</p>
                  )}
                </div>
              )}
              {item.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.attachments.map((a) => (
                    <Badge key={a.id} variant="outline"><Paperclip className="size-3" /> {a.filename}</Badge>
                  ))}
                </div>
              )}
              {sourceEvidence.length > 0 && (
                <p className="text-2xs text-muted-foreground">Grounded in: {sourceEvidence.map((s) => s.ref).join(", ")}</p>
              )}
            </CardContent>
          </Card>

          {/* AI understanding */}
          {analysis && (
            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <Sparkles className="size-4 text-primary" />
                <CardTitle className="text-base">AI understanding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5"><Languages className="size-4 text-muted-foreground" /> {titleCase(analysis.language ?? "unknown")}</span>
                  <span className="text-muted-foreground">·</span>
                  <div className="flex items-center gap-2">Overall <ConfidenceMeter value={analysis.confidence} className="w-28" /></div>
                </div>
                {riskFlags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {riskFlags.map((r) => (
                      <Badge key={r} variant="warning"><TriangleAlert className="size-3" /> {titleCase(r)}</Badge>
                    ))}
                  </div>
                )}

                {/* Extracted entities */}
                <div>
                  <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Extracted fields</p>
                  {analysis.entities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No structured fields extracted.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[...analysis.entities]
                        .sort((a, b) => ENTITY_TYPES.indexOf(a.type as EntityType) - ENTITY_TYPES.indexOf(b.type as EntityType))
                        .map((e) => {
                          const low = e.confidence < 70;
                          return (
                            <div key={e.id} className={cn("rounded-lg border p-2.5", low ? "border-warning/40 bg-warning-muted/20" : "border-border")}>
                              <div className="flex items-center justify-between">
                                <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">{ENTITY_LABELS[e.type as EntityType] ?? e.type}</span>
                                <ConfidenceBadge value={e.confidence} size="sm" />
                              </div>
                              <p className="mt-0.5 truncate text-sm font-medium">{e.value}</p>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: action cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold"><Sparkles className="size-4 text-primary" /> Suggested actions</h2>
            <Badge variant="neutral">{actions.length}</Badge>
          </div>
          {actions.length === 0 ? (
            <Card><CardContent className="p-5">
              <EmptyState compact icon={<Sparkles />} title={item.status === "processing" ? "Generating actions…" : "No actions suggested"} description={item.status === "processing" ? "Hang tight while the AI finishes." : "The AI didn't find an obvious next step. You can re-analyze or handle it manually."} className="border-0" />
            </CardContent></Card>
          ) : (
            actions.map((a) => (
              <ActionReviewCard key={a.id} action={a} canReview={canReview} currency={ctx.org.currency} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
