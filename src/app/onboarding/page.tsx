import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/context";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = { title: "Set up your workspace" };

export default async function OnboardingPage() {
  const ctx = await requireAuth();
  if (ctx.org.onboardedAt) redirect("/dashboard");

  return <OnboardingWizard initial={{ name: ctx.org.name }} />;
}
