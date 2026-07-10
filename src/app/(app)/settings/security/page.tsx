import type { Metadata } from "next";
import { Download, ShieldCheck, KeyRound, Trash2 } from "lucide-react";
import { requireAnyPermission, can } from "@/lib/auth/context";
import { getAuditLogs } from "@/lib/services/settings";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo, titleCase } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Security & audit" };
export const dynamic = "force-dynamic";

export default async function SecuritySettingsPage() {
  const ctx = await requireAnyPermission(["audit.view", "settings.manage"]);
  const logs = await getAuditLogs(ctx.org.id, 60);
  const canManageData = can(ctx.role, "settings.manage");
  const activeSessions = await db.session.count({ where: { user: { memberships: { some: { orgId: ctx.org.id } } }, revokedAt: null, expiresAt: { gt: new Date() } } });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <InfoCard icon={<ShieldCheck />} title="Session security" value="httpOnly · JWT" hint="Rotating, revocable sessions" />
        <InfoCard icon={<KeyRound />} title="Active sessions" value={String(activeSessions)} hint="Across your team" />
        <InfoCard icon={<ShieldCheck />} title="Tenant isolation" value="Enforced" hint="Server-side RBAC on every request" />
      </div>

      {canManageData && (
        <Card>
          <CardHeader><CardTitle className="text-base">Data controls</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center">
              <div><p className="text-sm font-medium">Export workspace data</p><p className="text-sm text-muted-foreground">Download a JSON snapshot of contacts, catalog, quotes, invoices, tasks, and documents.</p></div>
              <Button asChild variant="outline" size="sm"><a href="/api/settings/export"><Download className="size-4" /> Export JSON</a></Button>
            </div>
            <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-danger/30 bg-danger-muted/20 p-4 sm:flex-row sm:items-center">
              <div><p className="text-sm font-medium text-danger">Delete workspace</p><p className="text-sm text-muted-foreground">Permanently delete this workspace and all its data. This cannot be undone.</p></div>
              <Button variant="danger" size="sm" disabled><Trash2 className="size-4" /> Delete workspace</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Audit log</CardTitle><p className="text-sm text-muted-foreground">Immutable record of every important action (SRS FR-031).</p></CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-5"><EmptyState compact title="No audit events yet" description="Actions across your workspace will appear here." className="border-0" /></div>
          ) : (
            <ul className="max-h-[32rem] divide-y divide-border overflow-y-auto">
              {logs.map((log) => (
                <li key={log.id} className="flex items-center gap-3 px-5 py-3">
                  {log.actor ? <Avatar name={log.actor.name} color={log.actor.avatarColor} size="xs" /> : <div className="flex size-6 items-center justify-center rounded-full bg-muted text-2xs font-medium text-muted-foreground">{log.actorType === "ai" ? "AI" : "SYS"}</div>}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm"><span className="font-medium">{log.actor?.name ?? titleCase(log.actorType)}</span> <span className="text-muted-foreground">{log.action.replace(/[._]/g, " ")}</span></p>
                    {log.targetType && <p className="text-2xs text-muted-foreground">{log.targetType}{log.targetId ? ` · ${log.targetId.slice(0, 8)}` : ""}</p>}
                  </div>
                  <Badge variant="outline" size="sm">{log.actorType}</Badge>
                  <span className="shrink-0 text-2xs text-muted-foreground">{timeAgo(log.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({ icon, title, value, hint }: { icon: React.ReactNode; title: string; value: string; hint: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary-muted text-primary [&_svg]:size-4">{icon}</div>
        <p className="mt-3 text-sm text-muted-foreground">{title}</p>
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-2xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
