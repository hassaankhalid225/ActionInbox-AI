"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Logo, LogoMark } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SidebarNav } from "./sidebar-nav";
import { CommandMenu } from "./command-menu";
import { UserMenu } from "./user-menu";
import { NotificationsMenu, type NotificationItem } from "./notifications-menu";
import { AppProvider, type AppUser, type AppOrg, type NavBadges, useApp } from "./app-context";
import type { Role } from "@/lib/constants/enums";

type ShellData = {
  user: AppUser;
  org: AppOrg;
  role: Role;
  memberships: { orgId: string; orgName: string; role: Role; slug: string }[];
  badges: NavBadges;
  notifications: NotificationItem[];
};

export function AppShell({ data, children }: { data: ShellData; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AppProvider value={{ user: data.user, org: data.org, role: data.role, memberships: data.memberships, badges: data.badges }}>
      <div className="flex min-h-screen bg-surface-muted/30">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
          <WorkspaceHeader />
          <div className="flex-1 overflow-y-auto">
            <SidebarNav />
          </div>
          <SidebarFooter />
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" width="w-72" className="p-0">
            <WorkspaceHeader />
            <div className="flex-1 overflow-y-auto">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
            <SidebarFooter />
          </SheetContent>
        </Sheet>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-lg sm:px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
            <div className="flex flex-1 items-center">
              <CommandMenu />
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <NotificationsMenu initial={data.notifications} />
              <div className="mx-1 h-6 w-px bg-border" />
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </AppProvider>
  );
}

function WorkspaceHeader() {
  const { org } = useApp();
  return (
    <div className="flex h-16 items-center gap-3 border-b border-border px-4">
      <LogoMark className="size-9" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-tight">{org.name}</p>
        <p className="truncate text-2xs text-muted-foreground">ActionInbox AI workspace</p>
      </div>
    </div>
  );
}

function SidebarFooter() {
  const { user, role } = useApp();
  return (
    <div className="border-t border-border p-3">
      <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
        <Avatar name={user.name} color={user.avatarColor} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{user.name}</p>
          <p className="truncate text-2xs capitalize text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}
