import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";
const KEY = "lumen.theme";

function getInitial(): Theme {
  if (typeof window === "undefined") return "dark";
  // Both of these can throw inside a WebView: localStorage throws a
  // SecurityError when storage is blocked/cleared, and matchMedia is missing
  // on very old WebViews. This runs from an effect with no error boundary
  // above it, so an unguarded throw unmounts the whole tree => blank screen.
  try {
    const saved = window.localStorage.getItem(KEY) as Theme | null;
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* storage unavailable — fall through to the media query */
  }
  try {
    if (typeof window.matchMedia === "function") {
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
  } catch {
    /* ignore */
  }
  return "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  // Apply on mount, then react to changes.
  useEffect(() => {
    const initial = getInitial();
    setTheme(initial);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      window.localStorage.setItem(KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggle, setTheme };
}
