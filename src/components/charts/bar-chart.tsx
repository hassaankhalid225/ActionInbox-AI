"use client";

/** Horizontal labeled bars — accessible, dependency-light, theme-aware. */
export function HBarChart({ data, tone = "primary" }: { data: { label: string; value: number }[]; tone?: "primary" | "accent" }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const color = tone === "accent" ? "bg-accent" : "bg-primary";
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 text-sm">
          <span className="truncate text-muted-foreground">{d.label}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="tabnum text-right font-medium">{d.value}</span>
        </div>
      ))}
    </div>
  );
}
