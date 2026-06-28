import { useCallback, useEffect, useState } from "react";

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  category: string; // calculator | scientific | gst | emi | bmi | ...
  timestamp: number;
}

const STORAGE_KEY = "lumen.calc.history.v1";
const MAX_ENTRIES = 500;

function read(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // ignore quota errors
  }
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  // Hydrate from localStorage on mount (avoid SSR mismatch).
  useEffect(() => {
    setEntries(read());
  }, []);

  // Sync across tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setEntries(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((entry: Omit<HistoryEntry, "id" | "timestamp">) => {
    setEntries((prev) => {
      const next: HistoryEntry[] = [
        {
          ...entry,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, MAX_ENTRIES);
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
    write([]);
  }, []);

  return { entries, add, remove, clear };
}
