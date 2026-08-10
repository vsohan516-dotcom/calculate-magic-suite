import React, { useMemo, useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { formatResult } from "@/lib/calc-engine";
import { ELEMENTS, CATEGORY_LABELS, gridPosition, molarMass } from "@/lib/chemistry/periodicTable";

type CommitFn = (expression: string, result: string, category?: string) => void;

export function Chemistry({ onCommit }: { onCommit?: CommitFn }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [formula, setFormula] = useState("");
  const [molar, setMolar] = useState<{ mass: number; composition: Array<{ symbol: string; count: number; mass: number; percent: number }> } | null>(null);

  const bySymbol = useMemo(() => {
    return Object.fromEntries(ELEMENTS.map((e) => [e.symbol, e]));
  }, []);

  const onCalculate = () => {
    try {
      const res = molarMass(formula || "");
      setMolar(res);
      onCommit?.(formula, String(res.mass), "Chemistry");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
      setMolar(null);
    }
  };

  const selectElement = (sym: string) => {
    setSelected(sym);
  };

  const insertSymbol = (sym: string) => {
    setFormula((f) => f + sym);
    toast.success(`${sym} added to formula`);
  };

  const TILE = 84; // px fixed tile size to keep readability on mobile
  const GAP = 6; // gap between tiles
  const TABLE_WIDTH = TILE * 18 + GAP * 17; // explicit width so grid doesn't compress on narrow screens

  // Modal / expanded view state for mobile
  const [expanded, setExpanded] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Prevent background scrolling when modal open
  useEffect(() => {
    if (expanded) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
    return;
  }, [expanded]);

  // Render the grid (extracted so we can reuse it in modal and inline)
  const renderGrid = (opts?: { tile?: number }) => {
    const tile = opts?.tile ?? TILE;
    return (
      <div
        className="relative"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(18, ${tile}px)`,
          gridAutoRows: tile,
          gap: GAP,
          paddingBottom: GAP,
          width: tile * 18 + GAP * 17,
        }}
      >
        {ELEMENTS.map((el) => {
          const pos = gridPosition(el);
          return (
            <button
              key={el.symbol}
              type="button"
              onClick={(e) => { e.stopPropagation(); selectElement(el.symbol); }}
              className="rounded-md border p-2 text-center bg-muted/10 hover:shadow-lg"
              style={{
                gridColumnStart: pos.column,
                gridRowStart: pos.row,
                width: tile - 12,
                height: tile - 12,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label={`${el.name} (${el.symbol})`}
            >
              <div className="text-[11px] text-muted-foreground">{el.number}</div>
              <div className="font-display text-lg font-semibold">{el.symbol}</div>
              <div className="text-xs text-muted-foreground">{el.mass}</div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Periodic Table</h2>
          <div className="text-xs text-muted-foreground">Browse elements · Click to view details</div>
        </div>

        <div className="mt-4 grid gap-2">
          <ScrollArea className="h-64">
            {/* Inline table container. On mobile tapping the empty area opens expanded view. */}
            <div
              ref={tableContainerRef}
              style={{ overflowX: "auto", overflowY: "hidden" }}
              onClick={(e) => {
                // If mobile and user tapped the background (not a button), open expanded view
                if (!isMobile) return;
                if (e.target === tableContainerRef.current) setExpanded(true);
              }}
            >
              {renderGrid()}
            </div>
          </ScrollArea>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="col-span-2">
              <Label>Formula</Label>
              <Input value={formula} onChange={(e) => setFormula(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={onCalculate}>Calculate molar mass</Button>
              <Button variant="ghost" onClick={() => { setFormula(""); setMolar(null); }}>Clear</Button>
            </div>
          </div>

          {molar ? (
            <div className="mt-2 glass-panel p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Molar mass</div>
                  <div className="mt-1 font-display text-2xl font-semibold">{formatResult(molar.mass)} g/mol</div>
                </div>
                <div className="text-sm text-muted-foreground">Composition</div>
              </div>

              <div className="mt-3 grid gap-2">
                {molar.composition.map((c) => (
                  <div key={c.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-mono w-12">{c.symbol}</div>
                      <div className="text-sm">{c.count} × {formatResult(c.mass / c.count)} g</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{formatResult(c.mass)} g · {formatResult(c.percent)}%</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Expanded full-screen modal for mobile */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70">
          <div className="flex items-center justify-between p-3 backdrop-blur-sm">
            <h3 className="text-lg font-semibold">Periodic Table</h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setExpanded(false)}>Close</Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 bg-transparent">
            <div style={{ minWidth: TABLE_WIDTH }}>
              {/* The expanded grid is inside a scrollable container so both axes can scroll */}
              <div style={{ overflow: "auto" }}>
                {renderGrid({ tile: Math.max(TILE, 92) })}
                {/* Render lanthanides/actinides rows if needed by gridPosition (they're already placed) */}
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="font-display text-sm font-semibold">Element details</h3>
        <div className="mt-2">
          {selected ? (
            (() => {
              const el = bySymbol[selected];
              if (!el) return <div className="text-sm text-muted-foreground">Element not found</div>;
              return (
                <div className="glass-panel p-4">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl font-display font-semibold">{el.symbol}</div>
                    <div>
                      <div className="text-sm text-muted-foreground">{el.name}</div>
                      <div className="mt-2 text-xs">Atomic number: {el.number}</div>
                      <div className="text-xs">Atomic mass: {el.mass}</div>
                      <div className="text-xs">Group: {el.group} · Period: {el.period}</div>
                      <div className="mt-2">
                        <Button onClick={() => insertSymbol(el.symbol)}>Add to formula</Button>
                        <Button variant="ghost" onClick={() => setSelected(null)} className="ml-2">Close</Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-sm text-muted-foreground">Select an element to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
