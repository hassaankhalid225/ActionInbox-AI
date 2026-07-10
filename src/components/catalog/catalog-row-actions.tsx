"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CatalogFormDialog } from "./catalog-form-dialog";
import { api } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";

type Item = NonNullable<React.ComponentProps<typeof CatalogFormDialog>["item"]>;

export function CatalogRowActions({ item }: { item: Item }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function remove() {
    setLoading(true);
    try {
      await api.del(`/api/catalog/${item.id}`);
      toast.success("Item deleted");
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not delete item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <CatalogFormDialog
        mode="edit"
        item={item}
        trigger={<Button variant="ghost" size="icon-sm" aria-label="Edit item"><Pencil className="size-4" /></Button>}
      />
      <Button variant="ghost" size="icon-sm" aria-label="Delete item" onClick={() => setConfirmOpen(true)}>
        <Trash2 className="size-4" />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${item.name}"?`}
        description="This removes the item and its aliases. This cannot be undone."
        confirmLabel="Delete"
        loading={loading}
        onConfirm={remove}
      />
    </div>
  );
}
