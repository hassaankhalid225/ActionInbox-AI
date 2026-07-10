import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function getTasks(orgId: string, opts: { status?: string; assignee?: string; userId: string; search?: string }) {
  const where: Prisma.TaskWhereInput = { orgId };
  if (opts.status && opts.status !== "all") {
    if (opts.status === "mine") where.assigneeId = opts.userId;
    else if (opts.status === "overdue") {
      where.status = { in: ["open", "in_progress"] };
      where.dueAt = { lt: new Date() };
    } else where.status = opts.status;
  }
  if (opts.search?.trim()) where.title = { contains: opts.search };

  return db.task.findMany({
    where,
    include: { contact: true, assignee: true },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function getTaskCounts(orgId: string, userId: string) {
  const now = new Date();
  const [all, open, inProgress, done, mine, overdue] = await Promise.all([
    db.task.count({ where: { orgId } }),
    db.task.count({ where: { orgId, status: "open" } }),
    db.task.count({ where: { orgId, status: "in_progress" } }),
    db.task.count({ where: { orgId, status: "done" } }),
    db.task.count({ where: { orgId, assigneeId: userId, status: { in: ["open", "in_progress"] } } }),
    db.task.count({ where: { orgId, status: { in: ["open", "in_progress"] }, dueAt: { lt: now } } }),
  ]);
  return { all, open, in_progress: inProgress, done, mine, overdue };
}

export async function getReminders(orgId: string) {
  return db.reminder.findMany({
    where: { orgId, status: { in: ["scheduled", "sent"] } },
    include: { contact: true },
    orderBy: { remindAt: "asc" },
    take: 100,
  });
}

export async function getOrgMembers(orgId: string) {
  const members = await db.membership.findMany({
    where: { orgId, status: "active" },
    include: { user: true },
    orderBy: { role: "asc" },
  });
  return members.map((m) => ({ id: m.userId, name: m.user.name, avatarColor: m.user.avatarColor, role: m.role }));
}

export async function getContactOptions(orgId: string) {
  return db.contact.findMany({ where: { orgId }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 300 });
}
