import * as React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";

const TONES = {
  primary: "bg-primary-muted text-primary",
  accent: "bg-accent-muted text-accent-foreground",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning-foreground",
  danger: "bg-danger-muted text-danger",
  info: "bg-info-muted text-info",
};

export function StatTile({
  label,
  value,
  icon,
  tone = "primary",
  delta,
  hint,
  href,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: keyof typeof TONES;
  delta?: { value: number; positiveIsGood?: boolean };
  hint?: string;
  href?: string;
}) {
  const body = (
    <Card interactive={!!href} className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          <p className="tabnum mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <div className={cn("flex size-10 items-center justify-center rounded-xl [&_svg]:size-5", TONES[tone])}>
            {icon}
          </div>
        )}
      </div>
      {delta && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium">
          {(() => {
            const good = delta.positiveIsGood === false ? delta.value < 0 : delta.value >= 0;
            const Icon = delta.value >= 0 ? ArrowUpRight : ArrowDownRight;
            return (
              <span className={cn("inline-flex items-center gap-0.5", good ? "text-success" : "text-danger")}>
                <Icon className="size-3.5" />
                {Math.abs(delta.value)}%
              </span>
            );
          })()}
          <span className="text-muted-foreground">vs last week</span>
        </div>
      )}
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
