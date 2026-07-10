import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/context";
import { getOrgWithSettings } from "@/lib/services/settings";
import { AiForm } from "@/components/settings/ai-form";

export const metadata: Metadata = { title: "AI & automation" };
export const dynamic = "force-dynamic";

export default async function AiSettingsPage() {
  const ctx = await requirePermission("settings.manage");
  const { settings } = await getOrgWithSettings(ctx.org.id);
  return <AiForm settings={settings} />;
}
