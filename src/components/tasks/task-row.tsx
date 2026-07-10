"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge, StatusBadge } from "@/components/ui/status";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TaskFormDialog, type TaskFormValue } from "./task-form-dialog";
import { api } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { dueLabel } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Task = TaskFormValue & {
  contact: { name: string } | null;
  assignee: { name: string; avatarColor: string } | null;
};

export function TaskRow({ task, members, contacts }: { task: Task; members: { id: string; name: string }[]; contacts: { id: string; name: string }[] }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const done = task.status === "done";
  const due = dueLabel(task.dueAt);

  async function toggle() {
    try {
      await api.patch(`/api/tasks/${task.id}`, { status: done ? "open" : "done" });
      router.refresh();
    } catch {
      toast.error("Could not update task");
    }
  }

  async function remove() {
    setLoading(true);
    try {
      await api.del(`/api/tasks/${task.id}`);
      toast.success("Task deleted");
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not delete task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Checkbox checked={done} onCheckedChange={toggle} aria-label="Toggle done" />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", done && "text-muted-foreground line-through")}>{task.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-muted-foreground">
          {task.contact && <span>{task.contact.name}</span>}
          {task.dueAt && (
            <span className={cn(due.tone === "danger" ? "text-danger" : due.tone === "warning" ? "text-warning-foreground" : "")}>{due.label}</span>
          )}
        </div>
      </div>
      <PriorityBadge priority={task.priority} size="sm" />
      {!done && <StatusBadge status={task.status} size="sm" />}
      {task.assignee && <Avatar name={task.assignee.name} color={task.assignee.avatarColor} size="xs" />}

      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}><Pencil /> Edit</DropdownMenuItem>
          <DropdownMenuItem destructive onClick={() => setConfirmOpen(true)}><Trash2 /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TaskFormDialog mode="edit" task={task} members={members} contacts={contacts} open={editOpen} onOpenChange={setEditOpen} />

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Delete task?" description="This task will be permanently removed." confirmLabel="Delete" loading={loading} onConfirm={remove} />
    </div>
  );
}
