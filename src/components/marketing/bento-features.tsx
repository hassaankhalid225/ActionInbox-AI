"use client";

import {
  Sparkles,
  Languages,
  ShieldCheck,
  Workflow,
  Mic,
  FileText,
  Image as ImageIcon,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Reveal } from "./motion";
import { cn } from "@/lib/utils/cn";

const easeOut = [0.16, 1, 0.3, 1] as const;

export function BentoFeatures() {
  return (
    <section id="features" className="relative border-y border-border bg-surface-muted/30 py-24">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">The action engine</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Not a chatbot. An operational layer.</h2>
          <p className="mt-3 text-muted-foreground">
            Every capability is designed around one job: convert messy inbound information into ready-to-approve outcomes.
          </p>
        </Reveal>

        <div className="mt-14 grid auto-rows-[minmax(0,1fr)] gap-4 md:grid-cols-6">
          {/* Big — multimodal understanding */}
          <BentoCard className="md:col-span-4 md:row-span-2" icon={<Sparkles />} title="AI that understands anything you throw at it" desc="Transcription, OCR, intent classification, and entity extraction — every field carries a confidence score you can trust.">
            <MultimodalVisual />
          </BentoCard>

          {/* Confidence */}
          <BentoCard className="md:col-span-2" icon={<ShieldCheck />} title="Source-grounded & approved" desc="Every suggestion links to its evidence. Nothing high-stakes sends without you.">
            <div className="mt-4 space-y-2">
              {[92, 78, 64].map((v, i) => (
                <ConfidenceRow key={i} value={v} delay={i * 0.15} />
              ))}
            </div>
          </BentoCard>

          {/* Multilingual */}
          <BentoCard className="md:col-span-2" icon={<Languages />} title="Speaks your customers' language" desc="English, Urdu, Roman Urdu, Hindi & Arabic — across text, voice & docs.">
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["English", "اردو", "Roman Urdu", "हिन्दी", "العربية"].map((l, i) => (
                <motion.span
                  key={l}
                  className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 240 }}
                >
                  {l}
                </motion.span>
              ))}
            </div>
          </BentoCard>

          {/* Workflows */}
          <BentoCard className="md:col-span-3" icon={<Workflow />} title="Automate the busywork" desc="Auto-route payment proofs, escalate complaints, tag quotes — with human approval where it matters.">
            <WorkflowVisual />
          </BentoCard>

          {/* Speed */}
          <BentoCard className="md:col-span-3" icon={<Zap />} title="From inquiry to quote in minutes" desc="Catalog-aware drafts, branded PDFs, and one-click approval turn hours of admin into seconds.">
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <div className="flex-1">
                <p className="text-2xs text-muted-foreground">Quote turnaround</p>
                <p className="text-lg font-bold tracking-tight">−30%<span className="ml-1 text-xs font-normal text-muted-foreground">avg. time</span></p>
              </div>
              <div className="flex items-center gap-1 text-success">
                <CheckCircle2 className="size-4" />
                <span className="text-xs font-medium">Approved</span>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

function BentoCard({ className, icon, title, desc, children }: { className?: string; icon: React.ReactNode; title: string; desc: string; children?: React.ReactNode }) {
  return (
    <motion.div
      className={cn("group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-lg", className)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: easeOut }}
    >
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:bg-primary/10" />
      <div className="relative">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary-muted text-primary [&_svg]:size-5">{icon}</div>
        <h3 className="mt-4 text-base font-semibold">{title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
        {children}
      </div>
    </motion.div>
  );
}

function ConfidenceRow({ value, delay }: { value: number; delay: number }) {
  const tone = value >= 80 ? "from-success to-success" : value >= 60 ? "from-warning to-accent" : "from-danger to-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <motion.div className={cn("h-full rounded-full bg-gradient-to-r", tone)} initial={{ width: 0 }} whileInView={{ width: `${value}%` }} viewport={{ once: true }} transition={{ delay, duration: 0.9, ease: easeOut }} />
      </div>
      <span className="tabnum w-8 text-right text-2xs font-semibold text-muted-foreground">{value}%</span>
    </div>
  );
}

function MultimodalVisual() {
  const items = [
    { icon: Mic, label: "Voice note", color: "bg-success-muted text-success" },
    { icon: ImageIcon, label: "Screenshot", color: "bg-info-muted text-info" },
    { icon: FileText, label: "PDF invoice", color: "bg-accent-muted text-accent-foreground" },
  ];
  return (
    <div className="relative mt-6 flex-1">
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-3"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, duration: 0.5 }}
          >
            <span className={cn("flex size-8 items-center justify-center rounded-lg [&_svg]:size-4", it.color)}><it.icon /></span>
            <span className="text-xs font-medium">{it.label}</span>
          </motion.div>
        ))}
      </div>
      <div className="my-4 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="h-px w-8 bg-border" />
        <Sparkles className="size-3.5 text-primary" /> AI pipeline
        <span className="h-px w-8 bg-border" />
      </div>
      <motion.div
        className="rounded-xl border border-primary/30 bg-primary-muted/40 p-4"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-primary">Structured action card</span>
          <span className="rounded-full bg-success-muted px-2 py-0.5 text-2xs font-semibold text-success">Ready to approve</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-2xs sm:grid-cols-4">
          {["Customer", "Products", "Quantity", "Total"].map((f) => (
            <div key={f} className="rounded-lg bg-surface/70 px-2 py-1.5">
              <p className="text-muted-foreground">{f}</p>
              <p className="font-medium">✓ extracted</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function WorkflowVisual() {
  const steps = ["Payment proof", "Auto-tag", "Assign Finance", "Notify"];
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <motion.div key={s} className="flex items-center gap-2" initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}>
          <span className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium">{s}</span>
          {i < steps.length - 1 && <Zap className="size-3 text-primary" />}
        </motion.div>
      ))}
    </div>
  );
}
