import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** ActionInbox AI mark — an inbox tray transformed into a decisive "action" bolt. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-sm",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
        <path
          d="M3 13h4l2 3h6l2-3h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 13V6a2 2 0 0 1 2-2h6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.65"
        />
        <path d="M14 3l-2.5 5H15l-2.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Logo({ className, href = "/", showText = true }: { className?: string; href?: string; showText?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {showText && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          ActionInbox<span className="text-primary"> AI</span>
        </span>
      )}
    </Link>
  );
}
