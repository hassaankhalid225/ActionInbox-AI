"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Zap,
  CircleCheckBig,
  FileText,
  ReceiptText,
  Users,
  Package,
  FolderOpen,
  Workflow,
  ChartColumn,
  Settings,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS, NAV_SECTIONS } from "@/lib/constants/nav";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { useApp, useCan } from "./app-context";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, Inbox, Zap, CircleCheckBig, FileText, ReceiptText,
  Users, Package, FolderOpen, Workflow, ChartColumn, Settings, CreditCard,
};

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { badges } = useApp();
  const { can } = useCan();

  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {NAV_SECTIONS.map((section) => {
        const items = NAV_ITEMS.filter(
          (item) => item.section === section.key && (!item.permission || can(item.permission)),
        );
        if (items.length === 0) return null;
        return (
          <div key={section.key}>
            <p className="px-3 pb-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const Icon = ICONS[item.icon] ?? LayoutDashboard;
                const active =
                  item.href === "/settings"
                    ? pathname.startsWith("/settings") && pathname !== "/settings/billing"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary-muted text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className={cn("size-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {badgeCount > 0 && (
                        <Badge variant={item.badgeKey === "overdue" ? "danger" : active ? "primary" : "neutral"} size="sm">
                          {badgeCount}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
