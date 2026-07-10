import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/context";
import { getMembers, getInvitations } from "@/lib/services/settings";
import { TeamManager } from "@/components/settings/team-manager";

export const metadata: Metadata = { title: "Team & roles" };
export const dynamic = "force-dynamic";

export default async function TeamSettingsPage() {
  const ctx = await requirePermission("member.manage");
  const [members, invitations] = await Promise.all([getMembers(ctx.org.id), getInvitations(ctx.org.id)]);

  return (
    <TeamManager
      currentUserId={ctx.user.id}
      currentRole={ctx.role}
      members={members.map((m) => ({
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        avatarColor: m.user.avatarColor,
        role: m.role,
        status: m.status,
        createdAt: m.createdAt.toISOString(),
      }))}
      invitations={invitations.map((i) => ({ id: i.id, email: i.email, role: i.role, createdAt: i.createdAt.toISOString() }))}
    />
  );
}
