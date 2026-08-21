import { useMemo, useState } from "react";
import { Atom, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CommitFn, Field, num, ResultBox, ToolCard } from "@/components/calculator/ToolCard";
import { CONSTANTS, ELEMENTS, molarMass, PHYSICS_FORMULAS } from "@/lib/tools-extra";
import { toast } from "sonner";

/* ───────────── Scientific constants ───────────── */
export function ConstantsTable() {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s
      ? CONSTANTS.filter(
          (c) => c.name.toLowerCase().includes(s) || c.symbol.toLowerCase().includes(s),
        )
      : CONSTANTS;
  }, [q]);

  return (
    <ToolCard title="Scientific Constants" description="Tap any value to copy it">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search constants"
        />
      </div>
      <ul className="max-h-72 space-y-1 overflow-auto">
        {rows.map((c) => (
          <li key={c.symbol}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-xl bg-muted/25 px-3 py-2 text-left transition hover:bg-muted/50"
              onClick={() => {
                void navigator.clipboard?.writeText(c.value);
                toast.success(`Copied ${c.symbol}`);
              }}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.symbol}</span>
              </span>
              <span className="shrink-0 text-right text-xs tabular-nums">
                {c.value}
                <span className="block text-muted-foreground">{c.unit}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </ToolCard>
  );
}

/* ───────────── Physics formula calculator ───────────── */
export function PhysicsCalc({ onCommit }: { onCommit: CommitFn }) {
  const [id, setId] = useState(PHYSICS_FORMULAS[0].id);
  const formula = PHYSICS_FORMULAS.find((f) => f.id === id) ?? PHYSICS_FORMULAS[0];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(formula.inputs.map((i) => [i.id, i.default])),
  );

  const pick = (nextId: string) => {
    const next = PHYSICS_FORMULAS.find((f) => f.id === nextId);
    if (!next) return;
    setId(nextId);
    setValues(Object.fromEntries(next.inputs.map((i) => [i.id, i.default])));
  };

  const result = useMemo(() => {
    const nums: Record<string, number> = {};
    for (const input of formula.inputs) {
      const n = num(values[input.id] ?? "");
      if (Number.isNaN(n)) return null;
      nums[input.id] = n;
    }
    const out = formula.compute(nums);
    return Number.isFinite(out) ? out : null;
  }, [formula, values]);

  return (
    <ToolCard title="Physics Formulas" description="Pick a formula and fill in the values">
      <div className="space-y-1.5">
        <span className="text-sm font-medium">Formula</span>
        <Select value={id} onValueChange={pick}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PHYSICS_FORMULAS.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{formula.expression}</p>
      </div>
      {formula.inputs.map((input) => (
        <Field
          key={input.id}
          id={`phys-${formula.id}-${input.id}`}
          label={input.label}
          suffix={input.unit}
          value={values[input.id] ?? ""}
          onChange={(v) => setValues((prev) => ({ ...prev, [input.id]: v }))}
        />
      ))}
      {result !== null ? (
        <ResultBox
          label={formula.name}
          value={`${Number(result.toPrecision(8))} ${formula.unit}`}
          sub={formula.expression}
          action={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onCommit(
                  `${formula.name} (${formula.expression})`,
                  `${Number(result.toPrecision(8))} ${formula.unit}`,
                  "Physics",
                );
                toast.success("Saved to history");
              }}
            >
              Save to history
            </Button>
          }
        />
      ) : null}
    </ToolCard>
  );
}

/* ───────────── Molar mass + periodic table lookup ───────────── */
export function MolarMassCalc({ onCommit }: { onCommit: CommitFn }) {
  const [formula, setFormula] = useState("Ca(OH)2");

  const res = useMemo(() => {
    try {
      return { data: molarMass(formula), error: "" };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : "Invalid formula" };
    }
  }, [formula]);

  return (
    <ToolCard title="Molar Mass" description="Chemical formula → g/mol">
      <div className="space-y-1.5">
        <Label htmlFor="mm-f">Formula</Label>
        <Input id="mm-f" value={formula} onChange={(e) => setFormula(e.target.value)} />
      </div>
      {res.data && res.data.mass > 0 ? (
        <ResultBox
          label="Molar mass"
          value={`${Number(res.data.mass.toFixed(4))} g/mol`}
          sub={res.data.parts.map((p) => `${p.symbol}${p.count > 1 ? p.count : ""} ${p.mass.toFixed(3)}`).join(" · ")}
          action={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onCommit(`Molar mass ${formula}`, `${Number(res.data!.mass.toFixed(4))} g/mol`, "Chemistry");
                toast.success("Saved to history");
              }}
            >
              Save to history
            </Button>
          }
        />
      ) : formula.trim() ? (
        <p className="text-xs text-destructive">{res.error || "Invalid formula"}</p>
      ) : null}
    </ToolCard>
  );
}

export function PeriodicTableLookup() {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ELEMENTS.slice(0, 20);
    return ELEMENTS.filter(
      (e) =>
        e.name.toLowerCase().includes(s) ||
        e.symbol.toLowerCase() === s ||
        String(e.z) === s,
    );
  }, [q]);

  return (
    <ToolCard title="Periodic Table" description="Search by name, symbol or atomic number">
      <div className="relative">
        <Atom className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Na" />
      </div>
      <ul className="max-h-72 space-y-1 overflow-auto">
        {rows.map((e) => (
          <li key={e.z} className="flex items-center justify-between rounded-xl bg-muted/25 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm">
                {e.z}. {e.name} ({e.symbol})
              </span>
              <span className="text-xs text-muted-foreground">{e.category}</span>
            </span>
            <span className="shrink-0 text-xs tabular-nums">{e.mass} u</span>
          </li>
        ))}
      </ul>
    </ToolCard>
  );
}
