"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, type Role } from "@/lib/constants/enums";
import { formatDate } from "@/lib/utils/format";

type Member = { userId: string; name: string; email: string; avatarColor: string; role: string; status: string; createdAt: string };
type Invite = { id: string; email: string; role: string; createdAt: string };

const ASSIGNABLE = ROLES.filter((r) => r !== "owner");

export function TeamManager({ members, invitations, currentUserId, currentRole }: { members: Member[]; invitations: Invite[]; currentUserId: string; currentRole: Role }) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("agent");
  const [loading, setLoading] = useState(false);

  async function invite() {
    setLoading(true);
    try {
      const res = await api.post<{ inviteUrl: string }>("/api/team/invite", { email, role });
      toast.success("Invitation created", { description: "Email delivery is stubbed — share the invite link." });
      if (res?.inviteUrl && navigator.clipboard) navigator.clipboard.writeText(`${window.location.origin}${res.inviteUrl}`).catch(() => {});
      setInviteOpen(false);
      setEmail("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not invite.");
    } finally {
      setLoading(false);
    }
  }

  async function changeRole(userId: string, nextRole: string) {
    try {
      await api.patch(`/api/team/${userId}`, { role: nextRole });
      toast.success("Role updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update role.");
    }
  }

  async function toggleStatus(userId: string, next: "active" | "suspended") {
    try {
      await api.patch(`/api/team/${userId}`, { status: next });
      toast.success(next === "active" ? "Member reactivated" : "Member deactivated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update.");
    }
  }

  const canManageRoles = currentRole === "owner" || currentRole === "admin";

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div><CardTitle className="text-base">Team members</CardTitle><p className="mt-1 text-sm text-muted-foreground">{members.length} member{members.length === 1 ? "" : "s"}</p></div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild><Button size="sm"><UserPlus className="size-4" /> Invite</Button></DialogTrigger>
            <DialogContent size="sm">
              <DialogHeader><DialogTitle>Invite a team member</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Field label="Email"><Input type="email" leftIcon={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" /></Field>
                <Field label="Role">
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ASSIGNABLE.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role as Role]}</p>
                </Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                <Button onClick={invite} loading={loading}>Send invite</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable>
            <THead>
              <TR><TH>Member</TH><TH>Role</TH><TH>Status</TH><TH>Joined</TH><TH className="text-right">Actions</TH></TR>
            </THead>
            <TBody>
              {members.map((m) => {
                const isSelf = m.userId === currentUserId;
                return (
                  <TR key={m.userId}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} color={m.avatarColor} size="sm" />
                        <div><p className="text-sm font-medium">{m.name}{isSelf && <span className="ml-1.5 text-2xs text-muted-foreground">(you)</span>}</p><p className="text-xs text-muted-foreground">{m.email}</p></div>
                      </div>
                    </TD>
                    <TD>
                      {canManageRoles && m.role !== "owner" && !isSelf ? (
                        <Select value={m.role} onValueChange={(v) => changeRole(m.userId, v)}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>{ASSIGNABLE.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={m.role === "owner" ? "primary" : "neutral"}>{ROLE_LABELS[m.role as Role]}</Badge>
                      )}
                    </TD>
                    <TD><StatusBadge status={m.status === "suspended" ? "disabled" : "active"} size="sm" /></TD>
                    <TD className="text-muted-foreground">{formatDate(m.createdAt)}</TD>
                    <TD className="text-right">
                      {canManageRoles && m.role !== "owner" && !isSelf && (
                        m.status === "active"
                          ? <Button variant="ghost" size="sm" onClick={() => toggleStatus(m.userId, "suspended")}>Deactivate</Button>
                          : <Button variant="ghost" size="sm" onClick={() => toggleStatus(m.userId, "active")}>Reactivate</Button>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </DataTable>
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Pending invitations</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {invitations.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3"><Mail className="size-4 text-muted-foreground" /><span className="text-sm">{inv.email}</span><Badge variant="outline" size="sm">{ROLE_LABELS[inv.role as Role]}</Badge></div>
                  <span className="text-2xs text-muted-foreground">Invited {formatDate(inv.createdAt)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
