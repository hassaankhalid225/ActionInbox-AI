"use client";

import * as React from "react";
import { can, canAny, type Permission } from "@/lib/constants/rbac";
import type { Role } from "@/lib/constants/enums";

export type AppUser = { id: string; name: string; email: string; avatarColor: string };
export type AppOrg = { id: string; name: string; slug: string; currency: string; brandColor: string; logoUrl: string | null };
export type NavBadges = { inbox: number; actions: number; approvals: number; overdue: number };

type AppContextValue = {
  user: AppUser;
  org: AppOrg;
  role: Role;
  memberships: { orgId: string; orgName: string; role: Role; slug: string }[];
  badges: NavBadges;
};

const AppContext = React.createContext<AppContextValue | null>(null);

export function AppProvider({ value, children }: { value: AppContextValue; children: React.ReactNode }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

/** Client-side permission check (mirrors server RBAC; server still enforces). */
export function useCan() {
  const { role } = useApp();
  return React.useMemo(
    () => ({
      can: (p: Permission) => can(role, p),
      canAny: (ps: Permission[]) => canAny(role, ps),
    }),
    [role],
  );
}
