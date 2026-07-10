"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, Radio, MessageSquareText, Sparkles, ShieldCheck, CreditCard, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCan } from "@/components/layout/app-context";
import type { Permission } from "@/lib/constants/rbac";

const ITEMS: { href: string; label: string; icon: LucideIcon; permission?: Permission }[] = [
  { href: "/settings", label: "Organization", icon: Building2, permission: "settings.manage" },
  { href: "/settings/team", label: "Team & roles", icon: Users, permission: "member.manage" },
  { href: "/settings/channels", label: "Channels", icon: Radio, permission: "channel.manage" },
  { href: "/settings/ai", label: "AI & automation", icon: Sparkles, permission: "settings.manage" },
  { href: "/settings/security", label: "Security & audit", icon: ShieldCheck, permission: "audit.view" },
  { href: "/settings/billing", label: "Billing & usage", icon: CreditCard, permission: "billing.manage" },
];

export function SettingsNav() {
  const pathname = usePathname();
  const { can } = useCan();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
      {ITEMS.filter((i) => !i.permission || can(i.permission)).map((item) => {
        const active = item.href === "/settings" ? pathname === "/settings" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary-muted text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
