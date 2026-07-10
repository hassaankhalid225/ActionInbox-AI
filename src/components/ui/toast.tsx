"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

/** App-wide toaster. Themed to match the design tokens. */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "!bg-card !text-card-foreground !border !border-border !rounded-xl !shadow-lg",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
          cancelButton: "!bg-muted !text-muted-foreground",
          error: "!border-danger/40",
          success: "!border-success/40",
        },
      }}
    />
  );
}

export { toast };
