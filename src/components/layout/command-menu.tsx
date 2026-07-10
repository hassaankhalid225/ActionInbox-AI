"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Inbox,
  Zap,
  FileText,
  ReceiptText,
  Users,
  Package,
  FolderOpen,
  Workflow,
  ChartColumn,
  Settings,
  CornerDownLeft,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";

type Command = { label: string; href: string; icon: LucideIcon; group: string; keywords?: string };

const COMMANDS: Command[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Navigate" },
  { label: "Inbox", href: "/inbox", icon: Inbox, group: "Navigate", keywords: "messages conversations" },
  { label: "Actions", href: "/actions", icon: Zap, group: "Navigate", keywords: "approvals cards" },
  { label: "Quotes", href: "/quotes", icon: FileText, group: "Navigate" },
  { label: "Invoices", href: "/invoices", icon: ReceiptText, group: "Navigate", keywords: "payments overdue" },
  { label: "Customers", href: "/customers", icon: Users, group: "Navigate", keywords: "contacts vendors" },
  { label: "Catalog", href: "/catalog", icon: Package, group: "Navigate", keywords: "products services" },
  { label: "Documents", href: "/documents", icon: FolderOpen, group: "Navigate", keywords: "files ocr" },
  { label: "Workflows", href: "/workflows", icon: Workflow, group: "Navigate", keywords: "rules automation" },
  { label: "Analytics", href: "/analytics", icon: ChartColumn, group: "Navigate", keywords: "reports metrics" },
  { label: "Settings", href: "/settings", icon: Settings, group: "Navigate" },
  { label: "New quote", href: "/quotes/new", icon: FileText, group: "Create" },
  { label: "New invoice", href: "/invoices/new", icon: ReceiptText, group: "Create" },
  { label: "New customer", href: "/customers?new=1", icon: Users, group: "Create" },
  { label: "New catalog item", href: "/catalog?new=1", icon: Package, group: "Create" },
];

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const filtered = COMMANDS.filter((c) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return c.label.toLowerCase().includes(q) || c.keywords?.includes(q) || c.group.toLowerCase().includes(q);
  });

  const groups = Array.from(new Set(filtered.map((c) => c.group)));

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && filtered[active]) { e.preventDefault(); go(filtered[active].href); }
  }

  let index = -1;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-xs items-center gap-2 rounded-lg border border-input bg-surface px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:w-64"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden rounded border border-border bg-muted px-1.5 text-2xs font-medium sm:inline">⌘K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg" className="gap-0 p-0">
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={onKeyDown}
              placeholder="Search or jump to…"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">No results for &quot;{query}&quot;</p>
            ) : (
              groups.map((group) => (
                <div key={group} className="mb-1">
                  <p className="px-2 py-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
                  {filtered
                    .filter((c) => c.group === group)
                    .map((c) => {
                      index++;
                      const i = index;
                      return (
                        <button
                          key={c.href + c.label}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => go(c.href)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                            i === active ? "bg-muted" : "hover:bg-muted/60",
                          )}
                        >
                          <c.icon className="size-4 text-muted-foreground" />
                          <span className="flex-1 text-left">{c.label}</span>
                          {i === active && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
                        </button>
                      );
                    })}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
