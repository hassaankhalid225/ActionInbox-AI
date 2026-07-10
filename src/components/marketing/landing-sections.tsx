"use client";

import * as React from "react";
import Link from "next/link";
import {
  Mail,
  Sparkles,
  CheckCircle2,
  Zap,
  Users,
  Receipt,
  MessageSquare,
  Plus,
  Minus,
  ArrowRight,
  Quote as QuoteIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal, CountUp } from "./motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const easeOut = [0.16, 1, 0.3, 1] as const;

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-muted-foreground">{description}</p>}
    </Reveal>
  );
}

/* ─────────────────────────── Trust marquee ─────────────────────────── */
export function TrustMarquee() {
  const items = ["Wholesalers", "Clinics", "Agencies", "Travel operators", "Home services", "Retailers", "Freelancers", "Distributors"];
  const row = [...items, ...items];
  return (
    <section className="border-b border-border bg-surface-muted/30 py-6">
      <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <motion.div className="flex shrink-0 items-center gap-10 pr-10" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 26, repeat: Infinity, ease: "linear" }}>
          {row.map((w, i) => (
            <span key={i} className="whitespace-nowrap text-sm font-medium text-muted-foreground">{w}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Core loop ─────────────────────────── */
const STEPS = [
  { icon: Mail, title: "Ingest", desc: "A voice note, screenshot, PDF, or message arrives on any channel." },
  { icon: Sparkles, title: "Understand", desc: "AI transcribes, reads, classifies intent, and extracts entities with confidence." },
  { icon: CheckCircle2, title: "Review", desc: "You see the source evidence and approve, edit, reject, or defer." },
  { icon: Zap, title: "Act", desc: "A quote, invoice, task, or reminder is created and tracked to completion." },
];

export function CoreLoop() {
  return (
    <section id="how" className="container py-24">
      <SectionHeading eyebrow="The core loop" title="One simple loop, endlessly repeatable" description="Inbound item → AI suggestion → human review → completed action → tracked outcome." />
      <div className="relative mt-16">
        {/* connecting line */}
        <div aria-hidden className="absolute left-0 right-0 top-[26px] hidden lg:block">
          <div className="mx-auto h-px max-w-5xl bg-border" />
          <motion.div className="mx-auto h-px max-w-5xl origin-left bg-gradient-to-r from-primary to-accent" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: easeOut }} />
        </div>
        <div className="grid gap-8 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div key={s.title} className="relative text-center lg:text-left" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6, ease: easeOut }}>
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm lg:mx-0">
                <s.icon className="size-6" />
              </div>
              <div className="mt-5">
                <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Step {i + 1}</span>
                <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Stats band ─────────────────────────── */
export function StatsBand() {
  const stats = [
    { to: 30, suffix: "%", label: "Faster quote turnaround" },
    { to: 70, suffix: "%", label: "Overdue invoices followed up" },
    { to: 5, suffix: "", label: "Languages, out of the box" },
    { to: 15, prefix: "<", suffix: "min", label: "To first useful action" },
  ];
  return (
    <section className="border-y border-border bg-gradient-to-br from-primary to-accent">
      <div className="container grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Reveal key={s.label} className="text-center text-white">
            <p className="tabnum text-4xl font-bold tracking-tight sm:text-5xl">
              <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-sm text-white/85">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── Personas ─────────────────────────── */
export function Personas() {
  const personas = [
    { icon: Users, role: "Owners & founders", jtbd: "Fewer missed leads, faster quotes, fewer late payments, less admin." },
    { icon: Receipt, role: "Finance & admin", jtbd: "Accurate extraction, payment follow-up, exports, accounting-ready records." },
    { icon: MessageSquare, role: "Sales & agents", jtbd: "AI drafts, customer context, templates, and one-click replies." },
  ];
  return (
    <section className="container py-24">
      <SectionHeading eyebrow="Made for busy teams" title="Whoever runs the work, wins the day" />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {personas.map((p, i) => (
          <motion.div key={p.role} className="rounded-2xl border border-border bg-card p-6 shadow-sm" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.6, ease: easeOut }}>
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary-muted text-primary"><p.icon className="size-5" /></div>
            <h3 className="mt-4 font-semibold">{p.role}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{p.jtbd}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── Testimonial ─────────────────────────── */
export function Testimonial() {
  return (
    <section className="border-y border-border bg-surface-muted/30 py-20">
      <div className="container">
        <Reveal className="mx-auto max-w-3xl text-center">
          <QuoteIcon className="mx-auto size-10 text-primary/30" />
          <p className="mt-6 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            "We stopped losing orders inside WhatsApp. Quotes that took hours now go out in minutes — and our payment follow-ups finally happen on time."
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="size-10 rounded-full bg-gradient-to-br from-primary to-accent" />
            <div className="text-left">
              <p className="text-sm font-semibold">Design partner</p>
              <p className="text-sm text-muted-foreground">Wholesale distribution</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────── FAQ ─────────────────────────── */
const FAQS = [
  { q: "Is this just a chatbot?", a: "No. ActionInbox AI is an operational action layer — it converts messy inbound information into ready-to-approve actions like quotes, invoices, tasks, and reminders. It orchestrates work rather than just answering questions." },
  { q: "Will it send messages or invoices without my approval?", a: "Never for high-stakes outputs. Every external message and invoice is drafted and waits for human approval by default. You control the approval policy per action type." },
  { q: "Which languages does it support?", a: "English, Urdu, Roman Urdu, Hindi, and Arabic — across text, voice notes, screenshots, and PDFs, with more available through configuration." },
  { q: "Does it use official WhatsApp APIs?", a: "Yes. It uses the official WhatsApp Business Platform (Cloud API) and respects opt-in, template, and messaging policies. No scraping or browser automation." },
  { q: "Do I have to change how my team works?", a: "No. Keep working through WhatsApp and email. ActionInbox reads your inbound work and turns it into structured actions — without replacing your accounting, CRM, or ERP." },
];

export function Faq() {
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <section className="container py-24">
      <SectionHeading eyebrow="Questions" title="Everything you need to know" />
      <div className="mx-auto mt-12 max-w-3xl divide-y divide-border rounded-2xl border border-border bg-card">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q}>
              <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40">
                <span className="font-medium">{f.q}</span>
                <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full transition-colors", isOpen ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {isOpen ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: easeOut }} className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm text-muted-foreground">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────────────── Final CTA ─────────────────────────── */
export function FinalCta() {
  return (
    <section className="container py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary via-primary to-accent px-8 py-16 text-center shadow-2xl">
          <div aria-hidden className="absolute inset-0 bg-grid opacity-20" />
          <motion.div aria-hidden className="absolute -left-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" animate={{ x: [0, 40, 0], y: [0, 30, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Stop losing work inside chats.</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/90">Recruit your inbox as a teammate. Approve actions, not clutter.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                <Link href="/signup">Get started free <ArrowRight className="size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                <Link href="/login">Explore the demo</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-white/80">No credit card · 14-day trial · Official channel APIs only</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
