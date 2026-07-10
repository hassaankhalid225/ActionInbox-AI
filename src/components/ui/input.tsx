"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, ...props }, ref) => {
    const input = (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm shadow-xs transition-colors",
          "placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
          "disabled:cursor-not-allowed disabled:opacity-60 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          leftIcon && "pl-9",
          error && "border-danger focus-visible:ring-danger/40",
          className,
        )}
        {...props}
      />
    );
    if (!leftIcon) return input;
    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
          {leftIcon}
        </span>
        {input}
      </div>
    );
  },
);
Input.displayName = "Input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm shadow-xs transition-colors",
      "placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
      "disabled:cursor-not-allowed disabled:opacity-60",
      error && "border-danger focus-visible:ring-danger/40",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Input, Textarea };
