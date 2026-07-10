"use client";

import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";

export function ObligationToggle({ id, status }: { id: string; status: string }) {
  const router = useRouter();

  async function update(next: string) {
    try {
      await api.patch(`/api/obligations/${id}`, { status: next });
      toast.success(next === "done" ? "Marked done" : "Dismissed");
      router.refresh();
    } catch {
      toast.error("Could not update");
    }
  }

  if (status !== "open") return null;
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" aria-label="Mark done" onClick={() => update("done")}><Check className="size-4 text-success" /></Button>
      <Button variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={() => update("dismissed")}><X className="size-4 text-muted-foreground" /></Button>
    </div>
  );
}
