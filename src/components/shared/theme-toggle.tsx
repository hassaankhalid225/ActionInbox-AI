"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")} className={theme === "light" ? "bg-muted" : ""}>
          <Sun /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className={theme === "dark" ? "bg-muted" : ""}>
          <Moon /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className={theme === "system" ? "bg-muted" : ""}>
          <Monitor /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
