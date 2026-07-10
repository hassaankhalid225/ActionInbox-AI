import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { getNavBadges } from "@/lib/services/counts";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (!ctx.org.onboardedAt) redirect("/onboarding");

  const [badges, notifications] = await Promise.all([
    getNavBadges(ctx.org.id),
    db.notification.findMany({
      where: { orgId: ctx.org.id, userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <AppShell
      data={{
        user: ctx.user,
        org: {
          id: ctx.org.id,
          name: ctx.org.name,
          slug: ctx.org.slug,
          currency: ctx.org.currency,
          brandColor: ctx.org.brandColor,
          logoUrl: ctx.org.logoUrl,
        },
        role: ctx.role,
        memberships: ctx.memberships,
        badges,
        notifications: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          linkUrl: n.linkUrl,
          severity: n.severity,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
        })),
      }}
    >
      {children}
    </AppShell>
  );
}
