import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo href="/" />
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary-muted text-primary">
        <Compass className="size-8" />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-2 text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline"><Link href="/">Go home</Link></Button>
        <Button asChild><Link href="/dashboard">Open dashboard</Link></Button>
      </div>
    </div>
  );
}
