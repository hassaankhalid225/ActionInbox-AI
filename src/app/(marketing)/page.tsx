import { LandingHero } from "@/components/marketing/landing-hero";
import { BentoFeatures } from "@/components/marketing/bento-features";
import {
  TrustMarquee,
  CoreLoop,
  StatsBand,
  Personas,
  Testimonial,
  Faq,
  FinalCta,
} from "@/components/marketing/landing-sections";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { Reveal } from "@/components/marketing/motion";

export default function LandingPage() {
  return (
    <>
      <LandingHero />
      <TrustMarquee />
      <CoreLoop />
      <BentoFeatures />
      <StatsBand />
      <Personas />
      <Testimonial />

      {/* Pricing */}
      <section id="pricing" className="border-t border-border bg-surface-muted/30 py-24">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Pricing</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Start free, scale when it pays for itself</h2>
            <p className="mt-3 text-muted-foreground">Every plan is built around cash-flow and admin-hour ROI — faster quotes and better payment follow-up.</p>
          </Reveal>
          <Reveal className="mt-12" delay={0.1}>
            <PricingCards />
          </Reveal>
        </div>
      </section>

      <Faq />
      <FinalCta />
    </>
  );
}
