"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  X,
  Clock,
  Pencil,
  ThumbsDown,
  ChevronDown,
  ExternalLink,
  History,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ActionIcon } from "@/components/shared/action-icon";
import { ActionStateBadge, ConfidenceMeter, PriorityBadge } from "@/components/ui/status";
import { ACTION_TYPE_LABELS, type ActionType } from "@/lib/constants/enums";
import { formatMoney, timeAgo, titleCase } from "@/lib/utils/format";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

export type ReviewAction = {
  id: string;
  type: string;
  title: string;
  summary: string | null;
  confidence: number;
  priority: string;
  state: string;
  requiresApproval: boolean;
  draftJson: string | null;
  rejectionReason: string | null;
  feedbackRating: string | null;
  resultType: string | null;
  resultId: string | null;
  events: { id: string; type: string; createdAt: string; actorName: string | null }[];
};

const RESULT_LINK: Record<string, (id: string) => string> = {
  quote: (id) => `/quotes/${id}`,
  invoice: (id) => `/invoices/${id}`,
  task: () => `/tasks`,
  reminder: () => `/tasks`,
  document: (id) => `/documents/${id}`,
};

export function ActionReviewCard({ action, canReview, currency }: { action: ReviewAction; canReview: boolean; currency: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [mode, setMode] = useState<"idle" | "reject" | "defer" | "edit">("idle");
  const [reason, setReason] = useState("");
  const [showTrail, setShowTrail] = useState(false);

  const draft = safeParse(action.draftJson);
  const [editTitle, setEditTitle] = useState<string>(String(draft?.title ?? action.title));
  const [editBody, setEditBody] = useState<string>(String(draft?.body ?? ""));

  const isOpen = action.state === "suggested" || action.state === "needs_review" || action.state === "deferred";
  const isDone = action.state === "executed";

  async function decide(decision: "approve" | "reject" | "defer" | "edit", extra?: Record<string, unknown>) {
    setBusy(decision);
    try {
      const nextDraft = mode === "edit" ? JSON.stringify({ ...draft, title: editTitle, body: editBody }) : undefined;
      await api.post(`/api/actions/${action.id}/decide`, { decision, reason, draftJson: nextDraft, ...extra });
      const msg =
        decision === "approve" ? "Action approved & executed" :
        decision === "reject" ? "Action rejected" :
        decision === "defer" ? "Action deferred" : "Draft updated";
      toast.success(msg);
      setMode("idle");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not complete that action.");
    } finally {
      setBusy(null);
    }
  }

  async function feedback(rating: "wrong" | "partial" | "correct") {
    try {
      await api.post(`/api/actions/${action.id}/feedback`, { rating });
      toast.success("Thanks — feedback recorded.");
      router.refresh();
    } catch {
      toast.error("Could not record feedback.");
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-shadow",
        action.state === "needs_review" ? "border-warning/40" : "border-border",
        isDone && "border-success/30 bg-success-muted/10",
      )}
    >
      <div className="flex items-start gap-3">
        <ActionIcon type={action.type} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{action.title}</p>
            <Badge variant="outline" size="sm">{ACTION_TYPE_LABELS[action.type as ActionType] ?? action.type}</Badge>
            <ActionStateBadge state={action.state} size="sm" />
            {action.requiresApproval && isOpen && (
              <Badge variant="warning" size="sm"><ShieldCheck className="size-3" /> Approval required</Badge>
            )}
          </div>
          {action.summary && <p className="mt-1 text-sm text-muted-foreground">{action.summary}</p>}
        </div>
        <div className="hidden shrink-0 sm:block"><PriorityBadge priority={action.priority} size="sm" /></div>
      </div>

      {/* Confidence */}
      <div className="mt-3">
        <ConfidenceMeter value={action.confidence} />
      </div>

      {/* Draft preview */}
      {draft && (draft.items || draft.body || draft.title) && (
        <div className="mt-3 rounded-lg border border-border bg-surface-muted/40 p-3 text-sm">
          <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Draft output</p>
          {Array.isArray(draft.items) && draft.items.length > 0 ? (
            <ul className="space-y-1">
              {draft.items.map((it: any, i: number) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{it.name} × {it.quantity ?? 1}</span>
                  {it.unitPriceCents != null && <span className="tabnum">{formatMoney((it.unitPriceCents ?? 0) * (it.quantity ?? 1), currency)}</span>}
                </li>
              ))}
            </ul>
          ) : draft.body ? (
            <p className="whitespace-pre-wrap text-muted-foreground">{draft.body}</p>
          ) : (
            <p className="text-muted-foreground">{draft.title}</p>
          )}
        </div>
      )}

      {/* Edit mode */}
      {mode === "edit" && (
        <div className="mt-3 space-y-2 rounded-lg border border-primary/30 bg-primary-muted/20 p-3">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Title"
          />
          {(draft?.body !== undefined || action.type === "followup") && (
            <Textarea rows={3} value={editBody} onChange={(e) => setEditBody(e.target.value)} placeholder="Message body" />
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => decide("edit")} loading={busy === "edit"}>Save draft</Button>
            <Button size="sm" variant="ghost" onClick={() => setMode("idle")}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Reject / defer prompts */}
      {mode === "reject" && (
        <div className="mt-3 space-y-2 rounded-lg border border-danger/30 bg-danger-muted/20 p-3">
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this wrong? (optional, improves future suggestions)" />
          <div className="flex gap-2">
            <Button size="sm" variant="danger" onClick={() => decide("reject")} loading={busy === "reject"}>Confirm reject</Button>
            <Button size="sm" variant="ghost" onClick={() => setMode("idle")}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Result link when executed */}
      {isDone && action.resultType && action.resultId && RESULT_LINK[action.resultType] && (
        <div className="mt-3">
          <Button asChild size="sm" variant="subtle">
            <Link href={RESULT_LINK[action.resultType]!(action.resultId)}>
              View {action.resultType} <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        </div>
      )}

      {/* Rejected reason */}
      {action.state === "rejected" && action.rejectionReason && (
        <p className="mt-3 rounded-lg bg-danger-muted/30 px-3 py-2 text-sm text-danger">Reason: {action.rejectionReason}</p>
      )}

      {/* Controls */}
      {canReview && isOpen && mode === "idle" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => decide("approve")} loading={busy === "approve"}>
            <Check className="size-4" /> Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMode("edit")}>
            <Pencil className="size-4" /> Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode("reject")}>
            <X className="size-4" /> Reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => decide("defer")} loading={busy === "defer"}>
            <Clock className="size-4" /> Defer
          </Button>
        </div>
      )}

      {/* Feedback + audit trail */}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        {canReview ? (
          <div className="flex items-center gap-2">
            <span className="text-2xs text-muted-foreground">Was this right?</span>
            <button
              onClick={() => feedback("wrong")}
              className={cn("rounded-md p-1 transition-colors hover:bg-muted", action.feedbackRating === "wrong" && "bg-danger-muted text-danger")}
              title="Mark as wrong"
            >
              <ThumbsDown className="size-3.5" />
            </button>
            <button
              onClick={() => feedback("correct")}
              className={cn("rounded-md p-1 transition-colors hover:bg-muted", action.feedbackRating === "correct" && "bg-success-muted text-success")}
              title="Mark as correct"
            >
              <Check className="size-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-2xs text-muted-foreground">Read-only</span>
        )}

        <button onClick={() => setShowTrail((s) => !s)} className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground">
          <History className="size-3.5" /> {action.events.length} events
          <ChevronDown className={cn("size-3 transition-transform", showTrail && "rotate-180")} />
        </button>
      </div>

      {showTrail && (
        <ul className="mt-2 space-y-1.5 border-t border-border pt-2">
          {action.events.length === 0 && <li className="text-2xs text-muted-foreground">No events yet.</li>}
          {action.events.map((e) => (
            <li key={e.id} className="flex items-center gap-2 text-2xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-border" />
              <span className="font-medium text-foreground">{titleCase(e.type)}</span>
              {e.actorName && <span>by {e.actorName}</span>}
              <span className="ml-auto">{timeAgo(e.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function safeParse(json: string | null): Record<string, any> | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
