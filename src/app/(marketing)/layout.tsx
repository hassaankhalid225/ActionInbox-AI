import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { getAuthContext } from "@/lib/auth/context";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
              <a href="#features" className="transition-colors hover:text-foreground">Features</a>
              <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
              <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {ctx ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Start free trial</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-surface-muted/40">
        <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-sm text-sm text-muted-foreground">
              The multilingual AI inbox-to-action OS for small businesses. Turn messy inbound into approved outcomes.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium text-foreground">Product</p>
              <a href="#features" className="block text-muted-foreground hover:text-foreground">Features</a>
              <a href="#pricing" className="block text-muted-foreground hover:text-foreground">Pricing</a>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Company</p>
              <span className="block text-muted-foreground">About</span>
              <span className="block text-muted-foreground">Security</span>
            </div>
          </div>
        </div>
        <div className="border-t border-border py-4">
          <p className="container text-xs text-muted-foreground">
            © {new Date().getFullYear()} ActionInbox AI. Uses official channel APIs only. Human approval on every high-stakes action.
          </p>
        </div>
      </footer>
    </div>
  );
}
