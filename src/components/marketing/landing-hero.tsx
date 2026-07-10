"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Mic, CheckCircle2, FileText, Star, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Spotlight } from "./motion";

const easeOut = [0.16, 1, 0.3, 1] as const;
const words = ["Turn", "messy", "inbound", "into"];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Animated aurora backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -left-40 top-[-10%] size-[560px] rounded-full bg-primary/25 blur-[120px]"
          animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-10%] top-[10%] size-[520px] rounded-full bg-accent/20 blur-[120px]"
          animate={{ x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute bottom-[-20%] left-1/3 size-[480px] rounded-full bg-info/15 blur-[120px]"
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent)]" />
      <Spotlight className="-z-10 hidden lg:block" />

      <div className="container relative grid gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div className="flex flex-col justify-center">
          {/* Announcement */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }}>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 py-1 pl-1 pr-3 text-sm shadow-sm backdrop-blur transition-colors hover:border-primary/40"
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-2xs font-semibold text-primary-foreground">
                <Sparkles className="size-3" /> NEW
              </span>
              <span className="text-muted-foreground">WhatsApp voice-note → approved quote</span>
              <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* Headline with word stagger */}
          <h1 className="mt-6 text-[2.6rem] font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.2rem]">
            <span className="flex flex-wrap gap-x-3.5">
              {words.map((w, i) => (
                <motion.span
                  key={w}
                  initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.7, ease: easeOut, delay: 0.15 + i * 0.08 }}
                >
                  {w}
                </motion.span>
              ))}
            </span>
            <motion.span
              className="mt-1 block text-gradient"
              initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: easeOut, delay: 0.5 }}
            >
              approved actions.
            </motion.span>
          </h1>

          <motion.p
            className="mt-6 max-w-xl text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOut, delay: 0.65 }}
          >
            ActionInbox AI reads WhatsApp voice notes, screenshots, PDFs and emails, then drafts the quote,
            invoice, reminder or follow-up — ready for you to approve in one click.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOut, delay: 0.8 }}
          >
            <Button asChild size="lg" className="group shadow-lg shadow-primary/20">
              <Link href="/signup">Start free trial <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Explore live demo</Link>
            </Button>
          </motion.div>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2.5">
                {["#4f46e5", "#0ea5e9", "#16a34a", "#f59e0b", "#db2777"].map((c, i) => (
                  <span key={i} className="size-7 rounded-full border-2 border-background" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span>Trusted by chat-native SMBs</span>
            </div>
            <span className="hidden h-4 w-px bg-border sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-3.5 fill-accent text-accent" />)}</span>
              <span>4.9 · ROI in weeks</span>
            </div>
          </motion.div>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 40, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, ease: easeOut, delay: 0.4 }}
        style={{ perspective: 1000 }}
      >
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
          {/* Card */}
          <div className="relative rounded-3xl border border-border bg-card/90 p-5 shadow-2xl backdrop-blur-xl">
            {/* glow ring */}
            <div aria-hidden className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-primary/30 via-transparent to-accent/30 opacity-50 blur-[2px]" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-muted px-2.5 py-1 text-xs font-medium text-primary">
                  <Sparkles className="size-3" /> Quote draft
                </span>
                <motion.span
                  className="inline-flex items-center gap-1 rounded-full bg-success-muted px-2.5 py-1 text-xs font-semibold text-success"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.2, type: "spring", stiffness: 260 }}
                >
                  88% confident
                </motion.span>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface-muted p-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-success-muted text-success"><Mic className="size-4" /></div>
                <div className="min-w-0 text-sm">
                  <p className="font-medium">Voice note · Ahmed Constructions</p>
                  <p className="truncate text-muted-foreground">"20 bundle saria 8 aur 50 bag cement…"</p>
                </div>
              </div>

              {/* animated line items */}
              <div className="mt-4 space-y-2.5 text-sm">
                {[
                  { name: "Steel Rod 8mm × 20", val: "₨ 296,000", d: 1.35 },
                  { name: "Cement Bag OPC × 50", val: "₨ 67,500", d: 1.5 },
                ].map((r) => (
                  <motion.div
                    key={r.name}
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: r.d, duration: 0.5 }}
                  >
                    <span className="text-muted-foreground">{r.name}</span>
                    <span className="tabnum font-medium">{r.val}</span>
                  </motion.div>
                ))}
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="font-semibold">Total incl. tax</span>
                  <span className="tabnum font-semibold">₨ 425,295</span>
                </div>
              </div>

              {/* confidence bar */}
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-2xs text-muted-foreground"><span>Extraction confidence</span><span>88%</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-success to-primary" initial={{ width: 0 }} animate={{ width: "88%" }} transition={{ delay: 1.6, duration: 1, ease: easeOut }} />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex-1"><CheckCircle2 className="size-4" /> Approve</Button>
                <Button size="sm" variant="outline" className="flex-1">Edit</Button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-2xs text-muted-foreground">
                <FileText className="size-3.5" /> Grounded in transcript · Source attached
              </div>
            </div>
          </div>
        </motion.div>

        {/* floating chips */}
        <motion.div
          className="absolute -left-6 top-10 hidden items-center gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 text-xs font-medium shadow-lg backdrop-blur sm:flex"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.8, duration: 0.6 }}
        >
          <span className="flex size-6 items-center justify-center rounded-lg bg-info-muted text-info"><ShieldCheck className="size-3.5" /></span>
          Human-approved
        </motion.div>
        <motion.div
          className="absolute -right-4 bottom-16 hidden items-center gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 text-xs font-medium shadow-lg backdrop-blur sm:flex"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <span className="flex size-6 items-center justify-center rounded-lg bg-accent-muted text-accent-foreground"><Sparkles className="size-3.5" /></span>
          5 languages
        </motion.div>
      </motion.div>
    </div>
  );
}
