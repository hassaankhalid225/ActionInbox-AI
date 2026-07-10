import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";

export type FilterTab = { key: string; label: string; count?: number };

/** Query-param driven filter tabs (server component; links preserve other params). */
export function FilterTabs({
  tabs,
  active,
  basePath,
  paramKey = "filter",
  extraParams,
}: {
  tabs: FilterTab[];
  active: string;
  basePath: string;
  paramKey?: string;
  extraParams?: Record<string, string | undefined>;
}) {
  const build = (key: string) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(extraParams ?? {})) if (v) sp.set(k, v);
    if (key) sp.set(paramKey, key);
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="flex flex-wrap items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Link
            key={tab.key}
            href={build(tab.key)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isActive ? "bg-primary-muted text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <Badge variant={isActive ? "primary" : "neutral"} size="sm">{tab.count}</Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
}
