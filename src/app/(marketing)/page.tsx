import Link from "next/link";
import {
  ArrowRight,
  Mic,
  FileText,
  Image as ImageIcon,
  Mail,
  Sparkles,
  ShieldCheck,
  Languages,
  Zap,
  Receipt,
  Users,
  Workflow,
  BarChart3,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { ConfidenceMeter } from "@/components/ui/status";

const FEATURES = [
  { icon: MessageSquare, title: "Unified multichannel inbox", desc: "WhatsApp, email forwarding, and uploads land in one queue with filters for urgent, unprocessed, and low-confidence items." },
  { icon: Sparkles, title: "AI understanding layer", desc: "Transcription, OCR, intent classification, and entity extraction — every field carries a confidence score." },
  { icon: Zap, title: "Approval-ready action cards", desc: "Draft quotes, invoices, tasks, reminders, and follow-ups you approve in one click. Never sent without you." },
  { icon: Receipt, title: "Quotes, invoices & payments", desc: "Catalog-aware drafts, branded PDFs, payment-proof matching, and automatic follow-up scheduling." },
  { icon: Languages, title: "Multilingual & multimodal", desc: "Handles English, Urdu, Roman Urdu, Hindi and Arabic across text, voice notes, screenshots and PDFs." },
  { icon: Workflow, title: "Workflow rules & memory", desc: "Auto-route payment proofs, escalate complaints, and learn your product aliases, customers, and tone." },
  { icon: ShieldCheck, title: "Source-grounded & audited", desc: "Every suggestion links back to the original message, transcript, or document with a full audit trail." },
  { icon: BarChart3, title: "Operational analytics", desc: "Track response time, automation rate, corrections, overdue payments, and time saved." },
];

const STEPS = [
  { icon: Mail, title: "1 · Ingest", desc: "A voice note, screenshot, PDF, or message arrives on any channel." },
  { icon: Sparkles, title: "2 · Understand", desc: "AI transcribes, reads, classifies intent, and extracts entities with confidence." },
  { icon: CheckCircle2, title: "3 · Review", desc: "You see source evidence and approve, edit, reject, or defer the suggestion." },
  { icon: Zap, title: "4 · Act", desc: "A quote, invoice, task, or reminder is created and tracked to completion." },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="absolute left-1/2 top-0 -z-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="container relative grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="flex flex-col justify-center">
            <Badge variant="primary" className="w-fit gap-1.5">
              <Sparkles className="size-3" /> WhatsApp-first · Multilingual · Human-approved
            </Badge>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Turn messy inbound into <span className="text-gradient">approved actions</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              ActionInbox AI reads WhatsApp voice notes, screenshots, PDFs and emails, then drafts the quote, invoice,
              reminder or follow-up — ready for you to approve in one click.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start free trial <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Explore the demo</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required · 14-day trial · Official channel APIs only
            </p>
          </div>

          {/* Hero action-card preview */}
          <div className="flex items-center justify-center">
            <HeroCard />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border bg-surface-muted/30">
        <div className="container flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-6 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Built for chat-native SMBs:</span>
          <span>Wholesalers</span><span>·</span><span>Clinics</span><span>·</span>
          <span>Agencies</span><span>·</span><span>Travel operators</span><span>·</span><span>Home services</span>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container py-20">
        <SectionHeading eyebrow="The core loop" title="One simple loop, endlessly repeatable" description="Inbound item → AI suggestion → human review → completed action → tracked outcome." />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.title} className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary-muted text-primary">
                <s.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-border bg-surface-muted/30 py-20">
        <div className="container">
          <SectionHeading eyebrow="Everything you need" title="An operational action layer, not a chatbot" description="ActionInbox AI orchestrates messy inbound information into ready-to-approve outcomes — without replacing your accounting, CRM, or ERP." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent-muted text-accent-foreground">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personas */}
      <section className="container py-20">
        <SectionHeading eyebrow="Made for busy owners" title="Whoever runs the work, wins the day" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: Users, role: "Owners & founders", jtbd: "Fewer missed leads, faster quotes, fewer late payments, less admin." },
            { icon: Receipt, role: "Finance & admin", jtbd: "Accurate extraction, payment follow-up, exports, and accounting-ready records." },
            { icon: MessageSquare, role: "Sales & agents", jtbd: "AI drafts, customer context, templates, and one-click replies." },
          ].map((p) => (
            <div key={p.role} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary-muted text-primary">
                <p.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{p.role}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{p.jtbd}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border bg-surface-muted/30 py-20">
        <div className="container">
          <SectionHeading eyebrow="Pricing" title="Start free, scale when it pays for itself" description="Every plan is designed around cash-flow and admin-hour ROI — faster quotes and better payment follow-up." />
          <div className="mt-12">
            <PricingCards />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary to-accent px-8 py-14 text-center shadow-lg">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Stop losing work inside chats.</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/90">
              Recruit your inbox as a teammate. Approve actions, not clutter.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8 bg-white text-primary hover:bg-white/90">
              <Link href="/signup">Get started free <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-muted-foreground">{description}</p>}
    </div>
  );
}

function HeroCard() {
  return (
    <div className="w-full max-w-md rotate-1 rounded-2xl border border-border bg-card p-5 shadow-lg transition-transform hover:rotate-0">
      <div className="flex items-center justify-between">
        <Badge variant="primary" className="gap-1"><Sparkles className="size-3" /> Quote draft</Badge>
        <Badge variant="success">88% confident</Badge>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface-muted p-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-success-muted text-success">
          <Mic className="size-4" />
        </div>
        <div className="min-w-0 text-sm">
          <p className="font-medium">Voice note · Ahmed Constructions</p>
          <p className="truncate text-muted-foreground">"20 bundle saria 8 aur 50 bag cement chahiye…"</p>
        </div>
      </div>
      <div className="mt-4 space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Steel Rod 8mm × 20</span>
          <span className="tabnum font-medium">₨ 296,000</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Cement Bag OPC × 50</span>
          <span className="tabnum font-medium">₨ 67,500</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="font-semibold">Total incl. tax</span>
          <span className="tabnum font-semibold">₨ 425,295</span>
        </div>
      </div>
      <div className="mt-4">
        <p className="mb-1 text-xs text-muted-foreground">Extraction confidence</p>
        <ConfidenceMeter value={88} />
      </div>
      <div className="mt-4 flex gap-2">
        <Button size="sm" className="flex-1"><CheckCircle2 className="size-4" /> Approve</Button>
        <Button size="sm" variant="outline" className="flex-1">Edit</Button>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="size-3.5" /> Grounded in transcript
        <ImageIcon className="ml-2 size-3.5" /> Source attached
      </div>
    </div>
  );
}
