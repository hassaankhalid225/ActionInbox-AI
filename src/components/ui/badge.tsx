import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors [&_svg]:size-3",
  {
    variants: {
      variant: {
        neutral: "border-transparent bg-muted text-muted-foreground",
        primary: "border-transparent bg-primary-muted text-primary",
        accent: "border-transparent bg-accent-muted text-accent-foreground",
        success: "border-transparent bg-success-muted text-success",
        warning: "border-transparent bg-warning-muted text-warning-foreground",
        danger: "border-transparent bg-danger-muted text-danger",
        info: "border-transparent bg-info-muted text-info",
        outline: "border-border text-foreground",
      },
      size: { sm: "px-1.5 py-0 text-2xs", md: "px-2 py-0.5 text-xs" },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
