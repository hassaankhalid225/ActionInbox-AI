"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";

type Member = { id: string; name: string; avatarColor: string; role: string };

export function ItemToolbar({
  itemId,
  assigneeId,
  members,
  canAssign,
  canReview,
}: {
  itemId: string;
  assigneeId: string | null;
  members: Member[];
  canAssign: boolean;
  canReview: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const assignee = members.find((m) => m.id === assigneeId);

  async function assign(id: string | null) {
    try {
      await api.post(`/api/inbox/${itemId}/assign`, { assigneeId: id });
      toast.success(id ? "Assigned" : "Unassigned");
      router.refresh();
    } catch {
      toast.error("Could not assign");
    }
  }

  async function reanalyze() {
    setBusy(true);
    try {
      await api.post(`/api/inbox/${itemId}/reanalyze`);
      toast.success("Re-analyzing…", { description: "AI is reprocessing this item." });
      setTimeout(() => router.refresh(), 1600);
    } catch {
      toast.error("Could not reprocess");
    } finally {
      setTimeout(() => setBusy(false), 1600);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {canReview && (
        <Button variant="outline" size="sm" onClick={reanalyze} loading={busy}>
          <RefreshCw className="size-4" /> Re-analyze
        </Button>
      )}
      {canAssign && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {assignee ? (
                <>
                  <Avatar name={assignee.name} color={assignee.avatarColor} size="xs" /> {assignee.name.split(" ")[0]}
                </>
              ) : (
                <>
                  <UserPlus className="size-4" /> Assign
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Assign to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {members.map((m) => (
              <DropdownMenuItem key={m.id} onClick={() => assign(m.id)}>
                <Avatar name={m.name} color={m.avatarColor} size="xs" />
                <span className="flex-1">{m.name}</span>
                {assigneeId === m.id && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => assign(null)}>Unassign</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
