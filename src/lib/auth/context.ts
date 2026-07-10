import { cache } from "react";
import { db } from "@/lib/db";
import { readSession } from "./session";
import { Errors } from "@/lib/api/errors";
import { can, canAny, type Permission } from "@/lib/constants/rbac";
import type { Role } from "@/lib/constants/enums";

export type AuthContext = {
  user: {
    id: string;
    name: string;
    email: string;
    avatarColor: string;
  };
  org: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    timezone: string;
    onboardedAt: Date | null;
    onboardingStep: number;
    logoUrl: string | null;
    brandColor: string;
  };
  role: Role;
  memberships: { orgId: string; orgName: string; role: Role; slug: string }[];
};

/**
 * Resolve the authenticated user + active organization + role.
 * Cached per-request so repeated calls in a render tree hit the DB once.
 * Returns null when not authenticated — callers decide how to react.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const session = await readSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.sub },
    include: {
      memberships: {
        where: { status: "active" },
        include: { org: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user || user.status === "suspended" || user.memberships.length === 0) return null;

  // Active org: the default membership, else the first.
  const active = user.memberships.find((m) => m.isDefault) ?? user.memberships[0];
  if (!active) return null;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
    },
    org: {
      id: active.org.id,
      name: active.org.name,
      slug: active.org.slug,
      currency: active.org.currency,
      timezone: active.org.timezone,
      onboardedAt: active.org.onboardedAt,
      onboardingStep: active.org.onboardingStep,
      logoUrl: active.org.logoUrl,
      brandColor: active.org.brandColor,
    },
    role: active.role as Role,
    memberships: user.memberships.map((m) => ({
      orgId: m.orgId,
      orgName: m.org.name,
      role: m.role as Role,
      slug: m.org.slug,
    })),
  };
});

/** Require authentication; throws unauthorized otherwise. */
export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw Errors.unauthorized();
  return ctx;
}

/** Require a specific permission for the active role (server-side RBAC). */
export async function requirePermission(permission: Permission): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!can(ctx.role, permission)) throw Errors.forbidden();
  return ctx;
}

export async function requireAnyPermission(permissions: Permission[]): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!canAny(ctx.role, permissions)) throw Errors.forbidden();
  return ctx;
}

export { can, canAny };
