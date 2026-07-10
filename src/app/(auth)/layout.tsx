import Link from "next/link";
import { CheckCircle2, Quote } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const HIGHLIGHTS = [
  "Approve AI-drafted quotes & invoices in one click",
  "Every suggestion grounded in source evidence",
  "Multilingual: English, Urdu, Roman Urdu, Hindi, Arabic",
  "Human approval on every high-stakes action",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="relative flex flex-col">
        <div className="flex items-center justify-between p-6">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="p-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our <Link href="#" className="underline underline-offset-2">Terms</Link> and{" "}
          <Link href="#" className="underline underline-offset-2">Privacy Policy</Link>.
        </p>
      </div>

      {/* Brand side */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-accent lg:block">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -right-20 top-1/4 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div />
          <div className="max-w-md">
            <Quote className="size-10 opacity-70" />
            <p className="mt-6 text-2xl font-semibold leading-snug">
              "We stopped losing orders inside WhatsApp. Quotes that took hours now go out in minutes."
            </p>
            <p className="mt-4 text-sm text-white/80">— Design partner, wholesale distribution</p>
          </div>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-3 text-sm text-white/90">
                <CheckCircle2 className="size-5 shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
