import * as React from "react";
import { cn } from "@/lib/utils/cn";

function DataTable({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

const THead = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("[&_tr]:border-b [&_tr]:border-border", className)} {...props} />
);

const TBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("divide-y divide-border", className)} {...props} />
);

const TR = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("transition-colors hover:bg-muted/40 data-[state=selected]:bg-primary-muted/40", className)} {...props} />
);

const TH = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      "h-10 whitespace-nowrap px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground",
      className,
    )}
    {...props}
  />
);

const TD = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("px-4 py-3 align-middle", className)} {...props} />
);

export { DataTable, THead, TBody, TR, TH, TD };
