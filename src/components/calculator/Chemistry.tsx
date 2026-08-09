import React, { useMemo, useState } from "react";
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

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Periodic Table</h2>
          <div className="text-xs text-muted-foreground">Browse elements · Click to view details</div>
        </div>

        <div className="mt-4 grid gap-2">
          <ScrollArea className="h-64">
            {/* Horizontal scroll container to preserve readable tile sizes on narrow screens */}
            <div style={{ overflowX: "auto", overflowY: "hidden" }}>
              <div
                className="relative"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(18, ${TILE}px)`,
                  gridAutoRows: TILE,
                  gap: 6,
                  paddingBottom: 6,
                }}
              >
                {ELEMENTS.map((el) => {
                  const pos = gridPosition(el);
                  return (
                    <button
                      key={el.symbol}
                      type="button"
                      onClick={() => selectElement(el.symbol)}
                      className="rounded-md border p-2 text-center bg-muted/10 hover:shadow-lg"
                      style={{
                        gridColumn: pos.column,
                        gridRow: pos.row,
                        minWidth: TILE - 12,
                        minHeight: TILE - 12,
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
