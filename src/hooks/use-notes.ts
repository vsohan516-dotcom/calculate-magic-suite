import { useCallback, useEffect, useState } from "react";

export interface Note {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  locked: boolean;
  updatedAt: number;
  createdAt: number;
}

const STORAGE_KEY = "lumen.notes.v1";

function read(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(notes: Note[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // ignore quota errors
  }
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    setNotes(read());
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setNotes(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: Note[]) => {
    const sorted = [...next].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt,
    );
    write(sorted);
    setNotes(sorted);
    return sorted;
  }, []);

  const create = useCallback(
    (input: { title: string; body: string; locked?: boolean }) => {
      const now = Date.now();
      const note: Note = {
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        title: input.title.trim() || "Untitled",
        body: input.body,
        pinned: false,
        locked: !!input.locked,
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => {
        const next = [note, ...prev].sort(
          (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt,
        );
        write(next);
        return next;
      });
      return note;
    },
    [],
  );

  const update = useCallback((id: string, patch: Partial<Omit<Note, "id" | "createdAt">>) => {
    setNotes((prev) => {
      const next = prev
        .map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      write(next);
      return next;
    });
  }, []);

  const togglePin = useCallback((id: string) => {
    setNotes((prev) => {
      const next = prev
        .map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
      write(next);
      return next;
    });
  }, []);

  return { notes, create, update, remove, togglePin, persist };
}
