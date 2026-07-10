"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, ArrowRightLeft, Pencil, Printer, Check, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";

export function QuoteActions({ id, status, canManage }: { id: string; status: string; canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(action: string) {
    setBusy(action);
    try {
      const res = await api.post<{ redirect?: string }>(`/api/quotes/${id}/actions`, { action });
      toast.success(labelFor(action));
      if (res?.redirect) router.push(res.redirect);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="size-4" /> Print / PDF</Button>
      {canManage && (
        <>
          {status === "draft" && (
            <Button asChild variant="outline" size="sm"><Link href={`/quotes/${id}/edit`}><Pencil className="size-4" /> Edit</Link></Button>
          )}
          {(status === "draft" || status === "expired") && (
            <Button size="sm" onClick={() => act("send")} loading={busy === "send"}><Send className="size-4" /> Send</Button>
          )}
          {(status === "sent" || status === "accepted") && (
            <Button size="sm" onClick={() => act("convert")} loading={busy === "convert"}><ArrowRightLeft className="size-4" /> Convert to invoice</Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {status === "sent" && <DropdownMenuItem onClick={() => act("accept")}><Check /> Mark accepted</DropdownMenuItem>}
              <DropdownMenuItem onClick={() => act("expire")}><X /> Mark expired</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href={`/quotes/${id}/edit`}><Pencil /> Edit</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}

function labelFor(action: string) {
  return { send: "Quote sent", convert: "Converted to invoice", accept: "Marked accepted", expire: "Marked expired" }[action] ?? "Done";
}
