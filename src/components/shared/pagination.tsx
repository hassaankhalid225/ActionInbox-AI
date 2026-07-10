import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Pagination({
  page,
  total,
  pageSize,
  basePath,
  params,
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const build = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params ?? {})) if (v) sp.set(k, v);
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex items-center justify-between gap-4 px-1 py-2 text-sm">
      <p className="text-muted-foreground">
        <span className="tabnum font-medium text-foreground">{start}–{end}</span> of{" "}
        <span className="tabnum font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <PageLink href={build(page - 1)} disabled={page <= 1}><ChevronLeft className="size-4" /></PageLink>
        <span className="px-2 text-muted-foreground">Page {page} of {totalPages}</span>
        <PageLink href={build(page + 1)} disabled={page >= totalPages}><ChevronRight className="size-4" /></PageLink>
      </div>
    </div>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled?: boolean; children: React.ReactNode }) {
  if (disabled) {
    return <span className="flex size-8 cursor-not-allowed items-center justify-center rounded-lg border border-border text-muted-foreground/40">{children}</span>;
  }
  return (
    <Link href={href} className={cn("flex size-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted")}>
      {children}
    </Link>
  );
}
