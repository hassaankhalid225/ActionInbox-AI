import { cn } from "@/lib/utils/cn";

export function Progress({
  value,
  max = 100,
  className,
  tone = "primary",
}: {
  value: number;
  max?: number;
  className?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "accent";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tones = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    accent: "bg-accent",
  };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-all duration-500", tones[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
