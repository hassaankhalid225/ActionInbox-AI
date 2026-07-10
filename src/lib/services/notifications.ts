import { db } from "@/lib/db";

// In-app notifications (App Flow §15). Email/WhatsApp channels are abstracted
// and can be layered on top of the same create() call.
export async function notify(input: {
  orgId: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  linkUrl?: string;
  severity?: "info" | "warning" | "danger" | "success";
}): Promise<void> {
  await db.notification.create({
    data: {
      orgId: input.orgId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      linkUrl: input.linkUrl,
      severity: input.severity ?? "info",
    },
  });
}

export async function notifyRoles(input: {
  orgId: string;
  roles: string[];
  type: string;
  title: string;
  body?: string;
  linkUrl?: string;
  severity?: "info" | "warning" | "danger" | "success";
}): Promise<void> {
  const members = await db.membership.findMany({
    where: { orgId: input.orgId, role: { in: input.roles }, status: "active" },
    select: { userId: true },
  });
  await Promise.all(
    members.map((m) =>
      notify({
        orgId: input.orgId,
        userId: m.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        linkUrl: input.linkUrl,
        severity: input.severity,
      }),
    ),
  );
}
