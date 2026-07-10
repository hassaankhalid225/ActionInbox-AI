import * as React from "react";
import { cn } from "@/lib/utils/cn";

/** Empty / all-caught-up states (App Flow §14). Always offers a next action. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted/40 text-center",
        compact ? "px-6 py-10" : "px-6 py-16",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary-muted text-primary [&_svg]:size-6">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5 flex items-center gap-2">{action}</div>}
    </div>
  );
}
