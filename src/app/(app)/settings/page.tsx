import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/context";
import { getOrgWithSettings } from "@/lib/services/settings";
import { OrgForm } from "@/components/settings/org-form";

export const metadata: Metadata = { title: "Organization settings" };
export const dynamic = "force-dynamic";

export default async function OrgSettingsPage() {
  const ctx = await requirePermission("settings.manage");
  const { org } = await getOrgWithSettings(ctx.org.id);
  return <OrgForm org={org} />;
}
