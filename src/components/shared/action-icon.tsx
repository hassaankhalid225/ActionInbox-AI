import {
  CheckSquare,
  FileText,
  ReceiptText,
  Bell,
  MessageSquare,
  UserCog,
  Calendar,
  ShieldCheck,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ActionType } from "@/lib/constants/enums";

const MAP: Record<ActionType, { icon: LucideIcon; tone: string }> = {
  task: { icon: CheckSquare, tone: "bg-info-muted text-info" },
  quote: { icon: FileText, tone: "bg-primary-muted text-primary" },
  invoice: { icon: ReceiptText, tone: "bg-accent-muted text-accent-foreground" },
  reminder: { icon: Bell, tone: "bg-warning-muted text-warning-foreground" },
  followup: { icon: MessageSquare, tone: "bg-success-muted text-success" },
  crm_update: { icon: UserCog, tone: "bg-info-muted text-info" },
  calendar: { icon: Calendar, tone: "bg-primary-muted text-primary" },
  approval: { icon: ShieldCheck, tone: "bg-danger-muted text-danger" },
  document: { icon: FolderOpen, tone: "bg-muted text-muted-foreground" },
};

export function ActionIcon({ type, size = "md" }: { type: string; size?: "sm" | "md" }) {
  const cfg = MAP[type as ActionType] ?? MAP.task;
  const Icon = cfg.icon;
  const sizeCls = size === "sm" ? "size-8 [&_svg]:size-4" : "size-10 [&_svg]:size-5";
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-lg", sizeCls, cfg.tone)}>
      <Icon />
    </div>
  );
}
