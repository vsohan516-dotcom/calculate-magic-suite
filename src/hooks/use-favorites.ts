import { useCallback, useEffect, useState } from "react";

export interface FavoriteEntry {
  id: string;
  expression: string;
  result: string;
  category: string;
  timestamp: number;
}

const STORAGE_KEY = "lumen.favorites.v1";

function read(): FavoriteEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: FavoriteEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 300)));
  } catch {
    // ignore quota errors
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);

  useEffect(() => {
    setFavorites(read());
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setFavorites(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isFavorite = useCallback(
    (expression: string, result: string) =>
      favorites.some((f) => f.expression === expression && f.result === result),
    [favorites],
  );

  const toggle = useCallback((entry: Omit<FavoriteEntry, "id" | "timestamp">) => {
    setFavorites((prev) => {
      const existing = prev.find(
        (f) => f.expression === entry.expression && f.result === entry.result,
      );
      const next = existing
        ? prev.filter((f) => f.id !== existing.id)
        : [
            {
              ...entry,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              timestamp: Date.now(),
            },
            ...prev,
          ];
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setFavorites([]);
    write([]);
  }, []);

  return { favorites, isFavorite, toggle, remove, clear };
}
