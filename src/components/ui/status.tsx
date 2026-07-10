import { Badge, type BadgeProps } from "./badge";
import { cn } from "@/lib/utils/cn";
import { titleCase } from "@/lib/utils/format";
import {
  ACTION_STATE_LABELS,
  INTENT_LABELS,
  type ActionState,
  type Intent,
  type Priority,
} from "@/lib/constants/enums";

type Variant = NonNullable<BadgeProps["variant"]>;

const STATUS_MAP: Record<string, { variant: Variant; label?: string }> = {
  // generic
  active: { variant: "success" },
  connected: { variant: "success" },
  pending: { variant: "warning" },
  error: { variant: "danger" },
  disabled: { variant: "neutral" },
  failed: { variant: "danger" },
  // inbound
  received: { variant: "info" },
  processing: { variant: "warning", label: "Processing" },
  processed: { variant: "success" },
  needs_review: { variant: "warning", label: "Needs review" },
  // tasks
  open: { variant: "info" },
  in_progress: { variant: "primary", label: "In progress" },
  done: { variant: "success" },
  cancelled: { variant: "neutral" },
  // quotes/invoices
  draft: { variant: "neutral" },
  sent: { variant: "info" },
  accepted: { variant: "success" },
  rejected: { variant: "danger" },
  expired: { variant: "neutral" },
  converted: { variant: "primary" },
  paid: { variant: "success" },
  partial: { variant: "warning" },
  overdue: { variant: "danger" },
  void: { variant: "neutral" },
  // action states
  suggested: { variant: "primary" },
  approved: { variant: "success" },
  executed: { variant: "success" },
  deferred: { variant: "warning" },
  // subscription
  trialing: { variant: "accent", label: "Trial" },
  past_due: { variant: "danger", label: "Past due" },
  canceled: { variant: "neutral" },
};

export function StatusBadge({ status, className, size }: { status: string; className?: string; size?: BadgeProps["size"] }) {
  const cfg = STATUS_MAP[status] ?? { variant: "neutral" as Variant };
  return (
    <Badge variant={cfg.variant} size={size} className={className} dot>
      {cfg.label ?? titleCase(status)}
    </Badge>
  );
}

const PRIORITY_MAP: Record<Priority, { variant: Variant }> = {
  low: { variant: "neutral" },
  normal: { variant: "info" },
  high: { variant: "warning" },
  urgent: { variant: "danger" },
};

export function PriorityBadge({ priority, size }: { priority: string; size?: BadgeProps["size"] }) {
  const cfg = PRIORITY_MAP[priority as Priority] ?? { variant: "neutral" as Variant };
  return (
    <Badge variant={cfg.variant} size={size}>
      {titleCase(priority)}
    </Badge>
  );
}

export function ActionStateBadge({ state, size }: { state: string; size?: BadgeProps["size"] }) {
  const cfg = STATUS_MAP[state] ?? { variant: "neutral" as Variant };
  return (
    <Badge variant={cfg.variant} size={size} dot>
      {ACTION_STATE_LABELS[state as ActionState] ?? titleCase(state)}
    </Badge>
  );
}

export function IntentBadge({ intent, size }: { intent: string | null; size?: BadgeProps["size"] }) {
  if (!intent) return <Badge variant="neutral" size={size}>Unclassified</Badge>;
  const variant: Variant =
    intent === "complaint" ? "danger" : intent === "payment_proof" || intent === "invoice" ? "accent" : "primary";
  return (
    <Badge variant={variant} size={size}>
      {INTENT_LABELS[intent as Intent] ?? titleCase(intent)}
    </Badge>
  );
}

/** Confidence chip: color-coded band + percentage (SRS FR-015/016). */
export function ConfidenceBadge({ value, size }: { value: number | null; size?: BadgeProps["size"] }) {
  if (value == null) return null;
  const variant: Variant = value >= 80 ? "success" : value >= 60 ? "warning" : "danger";
  return (
    <Badge variant={variant} size={size}>
      {value}% confident
    </Badge>
  );
}

/** Inline confidence meter used in action cards / evidence panels. */
export function ConfidenceMeter({ value, className }: { value: number; className?: string }) {
  const color = value >= 80 ? "bg-success" : value >= 60 ? "bg-warning" : "bg-danger";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.max(4, value)}%` }} />
      </div>
      <span className="tabnum text-2xs font-semibold text-muted-foreground">{value}%</span>
    </div>
  );
}
