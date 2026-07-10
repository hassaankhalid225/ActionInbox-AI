import type { Metadata } from "next";
import { CircleCheckBig, Bell } from "lucide-react";
import { requireAuth } from "@/lib/auth/context";
import { getTasks, getTaskCounts, getReminders, getOrgMembers, getContactOptions } from "@/lib/services/tasks";
import { PageHeader } from "@/components/shared/page-header";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskRow } from "@/components/tasks/task-row";
import { ReminderFormDialog } from "@/components/reminders/reminder-form-dialog";
import { formatDate, titleCase } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Tasks & reminders" };
export const dynamic = "force-dynamic";

const TASK_FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "mine", label: "Assigned to me" },
  { key: "overdue", label: "Overdue" },
  { key: "done", label: "Done" },
];

export default async function TasksPage({ searchParams }: { searchParams: { status?: string } }) {
  const ctx = await requireAuth();
  const status = searchParams.status ?? "open";
  const [tasks, counts, reminders, members, contacts] = await Promise.all([
    getTasks(ctx.org.id, { status, userId: ctx.user.id }),
    getTaskCounts(ctx.org.id, ctx.user.id),
    getReminders(ctx.org.id),
    getOrgMembers(ctx.org.id),
    getContactOptions(ctx.org.id),
  ]);
  const memberOpts = members.map((m) => ({ id: m.id, name: m.name }));
  const tabs = TASK_FILTERS.map((f) => ({ key: f.key, label: f.label, count: (counts as Record<string, number>)[f.key] }));

  return (
    <div className="space-y-5">
      <PageHeader title="Tasks & reminders" description="Track work items and time-based reminders across your team." />

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks"><CircleCheckBig className="size-4" /> Tasks</TabsTrigger>
          <TabsTrigger value="reminders"><Bell className="size-4" /> Reminders</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FilterTabs tabs={tabs} active={status} basePath="/tasks" paramKey="status" />
            <TaskFormDialog mode="create" members={memberOpts} contacts={contacts} />
          </div>
          <Card className="overflow-hidden">
            {tasks.length === 0 ? (
              <EmptyState icon={<CircleCheckBig />} title="No tasks here" description="Create a task or approve a task action card from your inbox." action={<TaskFormDialog mode="create" members={memberOpts} contacts={contacts} />} className="border-0" />
            ) : (
              <div className="divide-y divide-border">
                {tasks.map((t) => (
                  <TaskRow key={t.id} task={t} members={memberOpts} contacts={contacts} />
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <div className="flex justify-end">
            <ReminderFormDialog contacts={contacts} />
          </div>
          <Card className="overflow-hidden">
            {reminders.length === 0 ? (
              <EmptyState icon={<Bell />} title="No reminders scheduled" description="Reminders keep payments, renewals, and deadlines on track." action={<ReminderFormDialog contacts={contacts} />} className="border-0" />
            ) : (
              <ul className="divide-y divide-border">
                {reminders.map((r) => (
                  <li key={r.id} className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-warning-muted text-warning-foreground"><Bell className="size-4" /></div>
                      <div>
                        <p className="text-sm font-medium">{r.title}</p>
                        <p className="text-2xs text-muted-foreground">{r.contact?.name ? `${r.contact.name} · ` : ""}{formatDate(r.remindAt)}</p>
                      </div>
                    </div>
                    <Badge variant="outline" size="sm">{titleCase(r.kind)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
