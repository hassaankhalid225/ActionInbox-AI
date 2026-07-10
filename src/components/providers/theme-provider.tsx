"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type ThemeContextValue = { theme: Theme; resolved: "light" | "dark"; setTheme: (t: Theme) => void };

const ThemeContext = React.createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "aib-theme";

function apply(theme: Theme): "light" | "dark" {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [resolved, setResolved] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
    setThemeState(stored);
    setResolved(apply(stored));
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem(STORAGE_KEY) as Theme) === "system") setResolved(apply("system"));
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = React.useCallback((t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
    setResolved(apply(t));
  }, []);

  return <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/** Blocking inline script to prevent theme flash before hydration. */
export const themeScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}')||'system';var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var r=t==='system'?(d?'dark':'light'):t;if(r==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;
