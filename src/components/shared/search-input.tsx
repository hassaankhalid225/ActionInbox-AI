"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

/** URL-synced debounced search box. */
export function SearchInput({ placeholder = "Search…", paramKey = "q", className }: { placeholder?: string; paramKey?: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramKey) ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  function update(next: string) {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set(paramKey, next);
      else params.delete(paramKey);
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    }, 350);
  }

  return (
    <div className={className}>
      <div className="relative">
        <Input value={value} onChange={(e) => update(e.target.value)} placeholder={placeholder} leftIcon={<Search />} className="pr-8" />
        {value && (
          <button onClick={() => update("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear search">
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
