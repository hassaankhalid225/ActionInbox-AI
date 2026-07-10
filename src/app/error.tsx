"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In production this would be reported to Sentry (see TRD §12).
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-danger-muted text-danger">
        <AlertTriangle className="size-7" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          An unexpected error occurred. You can retry, and if it keeps happening, please contact support.
        </p>
        {error.digest && <p className="mt-2 text-xs text-muted-foreground">Reference: {error.digest}</p>}
      </div>
      <Button onClick={reset}><RotateCw className="size-4" /> Try again</Button>
    </div>
  );
}
