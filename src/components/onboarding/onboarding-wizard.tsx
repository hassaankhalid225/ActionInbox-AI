"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Zap,
  Receipt,
  FileText,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Mail,
  Upload,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field, Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils/cn";
import { api } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { INDUSTRIES, COUNTRIES, CURRENCIES, TIMEZONES, TEAM_SIZES, ONBOARDING_GOALS } from "@/lib/constants/options";

const GOAL_ICONS: Record<string, typeof Zap> = { Zap, Receipt, FileText, Inbox, LayoutDashboard };
const STEPS = ["Business", "Goal", "Channel", "Approvals", "Finish"];

type Profile = {
  name: string;
  industry: string;
  country: string;
  currency: string;
  timezone: string;
  teamSize: string;
  primaryLang: string;
  secondaryLang: string;
};

export function OnboardingWizard({ initial }: { initial: { name: string } }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState<Profile>({
    name: initial.name,
    industry: "Wholesale & Distribution",
    country: "PK",
    currency: "PKR",
    timezone: "Asia/Karachi",
    teamSize: "2-10",
    primaryLang: "en",
    secondaryLang: "ur-roman",
  });
  const [goal, setGoal] = useState("faster_quotes");
  const [channel, setChannel] = useState<"whatsapp" | "email" | "upload" | "sample">("sample");
  const [approvals, setApprovals] = useState({
    requireApprovalMessages: true,
    requireApprovalInvoices: true,
    autoCreateTasks: true,
    lowConfidenceThreshold: 70,
  });

  const setP = (k: keyof Profile, v: string) => setProfile((p) => ({ ...p, [k]: v }));

  function onCountryChange(code: string) {
    const c = COUNTRIES.find((x) => x.code === code);
    setProfile((p) => ({ ...p, country: code, currency: c?.currency ?? p.currency, timezone: c?.tz ?? p.timezone }));
  }

  async function persist(next: number) {
    setLoading(true);
    try {
      await api.patch("/api/onboarding", {
        step: next,
        ...(step === 0 ? { profile } : {}),
        ...(step === 1 ? { primaryGoal: goal } : {}),
        ...(step === 3 ? { approvals } : {}),
      });
      setStep(next);
    } catch {
      toast.error("Could not save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function finish() {
    setLoading(true);
    try {
      const res = await api.post<{ redirect: string }>("/api/onboarding/complete", { loadSample: channel === "sample" });
      toast.success("You're all set! Welcome to ActionInbox AI.");
      router.push(res.redirect);
      router.refresh();
    } catch {
      toast.error("Could not finish setup.");
      setLoading(false);
    }
  }

  const canContinue = step !== 0 || (profile.name.length >= 2 && profile.industry);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Logo href="/dashboard" />
        <ThemeToggle />
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
        {/* Stepper */}
        <div className="mb-10 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary/15 text-primary ring-2 ring-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={cn("h-0.5 flex-1 rounded-full", i < step ? "bg-primary" : "bg-muted")} />}
            </div>
          ))}
        </div>

        <div className="flex-1">
          {/* Step 0 — Business profile */}
          {step === 0 && (
            <StepShell title="Tell us about your business" subtitle="This personalizes your workspace, currency, and language handling.">
              <Field label="Business name" required>
                <Input value={profile.name} onChange={(e) => setP("name", e.target.value)} placeholder="Karachi Traders Co." />
              </Field>
              <Field label="Industry">
                <Select value={profile.industry} onValueChange={(v) => setP("industry", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Country">
                  <Select value={profile.country} onValueChange={onCountryChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Currency">
                  <Select value={profile.currency} onValueChange={(v) => setP("currency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Timezone">
                  <Select value={profile.timezone} onValueChange={(v) => setP("timezone", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Team size">
                  <Select value={profile.teamSize} onValueChange={(v) => setP("teamSize", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TEAM_SIZES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Primary language">
                  <Select value={profile.primaryLang} onValueChange={(v) => setP("primaryLang", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ur">Urdu</SelectItem>
                      <SelectItem value="ur-roman">Roman Urdu</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Secondary language">
                  <Select value={profile.secondaryLang} onValueChange={(v) => setP("secondaryLang", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ur-roman">Roman Urdu</SelectItem>
                      <SelectItem value="ur">Urdu</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </StepShell>
          )}

          {/* Step 1 — Goal */}
          {step === 1 && (
            <StepShell title="What should we help you with first?" subtitle="We'll tailor your dashboard and default workflows.">
              <div className="grid gap-3">
                {ONBOARDING_GOALS.map((g) => {
                  const Icon = GOAL_ICONS[g.icon] ?? Zap;
                  const active = goal === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoal(g.id)}
                      className={cn(
                        "flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                        active ? "border-primary bg-primary-muted/40 ring-1 ring-primary" : "border-border hover:border-border/80 hover:bg-muted/40",
                      )}
                    >
                      <div className={cn("flex size-10 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{g.label}</p>
                        <p className="text-sm text-muted-foreground">{g.desc}</p>
                      </div>
                      {active && <Check className="size-5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {/* Step 2 — Channel */}
          {step === 2 && (
            <StepShell title="Connect your first channel" subtitle="You can add more later. Not ready? Start with sample data.">
              <div className="grid gap-3">
                <ChannelOption icon={MessageSquare} title="WhatsApp Business" desc="Official Cloud API — receive text, media & voice notes." badge="Recommended" active={channel === "whatsapp"} onClick={() => setChannel("whatsapp")} />
                <ChannelOption icon={Mail} title="Email forwarding" desc="Get a forwarding address for your inbox." active={channel === "email"} onClick={() => setChannel("email")} />
                <ChannelOption icon={Upload} title="Manual uploads" desc="Drag & drop PDFs, images, and audio." active={channel === "upload"} onClick={() => setChannel("upload")} />
                <ChannelOption icon={Sparkles} title="Explore with sample data" desc="Load a demo inbox so you can see it working right away." active={channel === "sample"} onClick={() => setChannel("sample")} />
              </div>
              {channel !== "sample" && (
                <div className="rounded-lg border border-info/30 bg-info-muted/50 px-4 py-3 text-sm text-info">
                  Channel connection requires provider credentials. In this build we&apos;ll load sample data so you can explore — connect the real channel later in Settings → Channels.
                </div>
              )}
            </StepShell>
          )}

          {/* Step 3 — Approvals */}
          {step === 3 && (
            <StepShell title="Set your approval preferences" subtitle="ActionInbox never sends high-stakes actions without you.">
              <div className="space-y-1 rounded-xl border border-border">
                <ToggleRow label="Require approval for external messages" desc="AI replies wait for your OK before sending." checked={approvals.requireApprovalMessages} onCheckedChange={(v) => setApprovals((a) => ({ ...a, requireApprovalMessages: v }))} />
                <ToggleRow label="Require approval for invoices" desc="Invoices are drafted, never auto-sent." checked={approvals.requireApprovalInvoices} onCheckedChange={(v) => setApprovals((a) => ({ ...a, requireApprovalInvoices: v }))} />
                <ToggleRow label="Auto-create internal tasks" desc="Let AI create internal tasks without approval." checked={approvals.autoCreateTasks} onCheckedChange={(v) => setApprovals((a) => ({ ...a, autoCreateTasks: v }))} />
              </div>
              <Field label={`Low-confidence review threshold — ${approvals.lowConfidenceThreshold}%`} hint="Extractions below this send the item to manual review.">
                <input
                  type="range" min={40} max={95} step={5} value={approvals.lowConfidenceThreshold}
                  onChange={(e) => setApprovals((a) => ({ ...a, lowConfidenceThreshold: Number(e.target.value) }))}
                  className="w-full accent-primary"
                />
              </Field>
            </StepShell>
          )}

          {/* Step 4 — Finish */}
          {step === 4 && (
            <StepShell title="You're ready to go" subtitle="Here's what we've set up for your workspace.">
              <div className="space-y-3">
                {[
                  { icon: Check, text: `Business profile for ${profile.name}` },
                  { icon: Check, text: `Primary goal: ${ONBOARDING_GOALS.find((g) => g.id === goal)?.label}` },
                  { icon: Check, text: channel === "sample" ? "Sample inbox & catalog loaded" : "Channel setup saved" },
                  { icon: ShieldCheck, text: "Approval policy configured" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted/40 px-4 py-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-success-muted text-success">
                      <r.icon className="size-4" />
                    </div>
                    <span className="text-sm font-medium">{r.text}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary-muted/40 p-4">
                <p className="text-sm font-medium text-primary">Next: process your first action card</p>
                <p className="mt-1 text-sm text-muted-foreground">We&apos;ll drop you on the dashboard where your first AI suggestions are waiting for review.</p>
              </div>
            </StepShell>
          )}
        </div>

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || loading}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => persist(step + 1)} disabled={!canContinue} loading={loading}>
              Continue <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={finish} loading={loading}>
              Go to dashboard <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="animate-slide-up space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ChannelOption({ icon: Icon, title, desc, badge, active, onClick }: { icon: typeof Mail; title: string; desc: string; badge?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
        active ? "border-primary bg-primary-muted/40 ring-1 ring-primary" : "border-border hover:bg-muted/40",
      )}
    >
      <div className={cn("flex size-10 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{title}</p>
          {badge && <span className="rounded-full bg-primary-muted px-2 py-0.5 text-2xs font-medium text-primary">{badge}</span>}
        </div>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      {active && <Check className="size-5 text-primary" />}
    </button>
  );
}

function ToggleRow({ label, desc, checked, onCheckedChange }: { label: string; desc: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3.5 last:border-0">
      <div>
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
