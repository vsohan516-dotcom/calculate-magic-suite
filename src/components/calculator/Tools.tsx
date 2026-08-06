import { useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatResult } from "@/lib/calc-engine";
import { toast } from "sonner";

interface FrameProps {
  title: string;
  children: ReactNode;
  result?: { label: string; value: string; sub?: ReactNode } | null;
  expression?: string;
  onCommit?: (expression: string, result: string) => void;
}

function ToolFrame({ title, children, result, expression, onCommit }: FrameProps) {
  return (
    <div className="glass-panel space-y-4 p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="grid gap-3">{children}</div>
      {result ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-muted/30 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {result.label}
            </div>
            <div className="mt-1 font-display text-3xl font-semibold text-grad">{result.value}</div>
            {result.sub ? <div className="mt-1 text-xs text-muted-foreground">{result.sub}</div> : null}
          </div>
          {onCommit && expression ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onCommit(expression, result.value);
                toast.success("Saved to history");
              }}
            >
              Save to history
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Field({
  id, label, value, onChange, type = "number", suffix,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          inputMode={type === "number" ? "decimal" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
};

type CommitFn = (expression: string, result: string, category?: string) => void;

/* Existing tools above here are assumed — this file will be extended with many
   new tools for Phase 1. */

/* -------------------- New Phase 1 Tools -------------------- */

/* Password generator + strength checker */
export function PasswordTool({ onCommit }: { onCommit: CommitFn }) {
  const [length, setLength] = useState("16");
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState("");

  const charset = useMemo(() => {
    let s = "";
    if (lower) s += "abcdefghijklmnopqrstuvwxyz";
    if (upper) s += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (numbers) s += "0123456789";
    if (symbols) s += "!@#$%^&*()_+-=[]{}|;:,.<>/?";
    return s;
  }, [lower, upper, numbers, symbols]);

  const generate = () => {
    const L = Math.max(1, Math.min(128, parseInt(length || "0", 10) || 16));
    if (!charset) {
      toast.error("Choose at least one character set");
      return;
    }
    const ar = new Uint32Array(L);
    crypto.getRandomValues(ar);
    let out = "";
    for (let i = 0; i < L; i++) {
      out += charset[ar[i] % charset.length];
    }
    setPassword(out);
  };

  const score = useMemo(() => {
    let s = 0;
    const L = parseInt(length || "0", 10) || 0;
    if (L >= 8) s += 1;
    if (L >= 12) s += 1;
    if (upper) s += 1;
    if (lower) s += 1;
    if (numbers) s += 1;
    if (symbols) s += 1;
    return Math.min(6, s);
  }, [length, upper, lower, numbers, symbols]);

  const labelForScore = (s: number) => ["Very weak", "Weak", "OK", "Good", "Strong", "Very strong"][Math.max(0, Math.min(5, s - 1))] ?? "Very weak";

  return (
    <ToolFrame
      title="Password"
      expression={password || undefined}
      onCommit={(e, r) => onCommit(e, r, "Password")}
      result={password ? { label: labelForScore(score), value: password } : null}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field id="pw-len" label="Length" value={length} onChange={setLength} />
        <div className="space-y-1.5">
          <Label>Charset</Label>
          <div className="flex flex-wrap gap-2">
            <Button variant={lower ? "secondary" : "ghost" as any} size="sm" onClick={() => setLower((v) => !v)}>
              abc
            </Button>
            <Button variant={upper ? "secondary" : "ghost" as any} size="sm" onClick={() => setUpper((v) => !v)}>
              ABC
            </Button>
            <Button variant={numbers ? "secondary" : "ghost" as any} size="sm" onClick={() => setNumbers((v) => !v)}>
              123
            </Button>
            <Button variant={symbols ? "secondary" : "ghost" as any} size="sm" onClick={() => setSymbols((v) => !v)}>
              #%@
            </Button>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={generate}>Generate</Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (!password) return;
              navigator.clipboard.writeText(password).then(() => toast.success("Copied"));
            }}
          >
            Copy
          </Button>
        </div>
      </div>
    </ToolFrame>
  );
}

/* Random tools: RNG, dice, coin */
export function RandomTools({ onCommit }: { onCommit: CommitFn }) {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [count, setCount] = useState("1");
  const [result, setResult] = useState<string[]>([]);

  const roll = () => {
    const a = Math.ceil(num(min));
    const b = Math.floor(num(max));
    const n = Math.max(1, Math.min(100, Math.floor(num(count) || 1)));
    if (!Number.isFinite(a) || !Number.isFinite(b) || a > b) {
      toast.error("Invalid range");
      return;
    }
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const v = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1) * (b - a + 1)) + a;
      out.push(String(v));
    }
    setResult(out);
    onCommit?.(`${a}-${b} ×${n}`, out.join(", "), "Random");
  };

  return (
    <ToolFrame
      title="Random"
      expression={`${min}-${max} ×${count}`}
      onCommit={(e, r) => onCommit(e, r, "Random")}
      result={result.length ? { label: `Generated ${result.length}`, value: result.join(", ") } : null}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field id="rnd-min" label="Min" value={min} onChange={setMin} />
        <Field id="rnd-max" label="Max" value={max} onChange={setMax} />
        <Field id="rnd-count" label="Count" value={count} onChange={setCount} />
      </div>
      <div className="flex gap-2">
        <Button onClick={roll}>Generate</Button>
        <Button
          variant="ghost"
          onClick={() => {
            // Dice quick: roll a d6
            const v = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1) * 6) + 1;
            setResult([String(v)]);
            onCommit?.(`d6`, String(v), "Dice");
            toast.success(`Rolled d6 → ${v}`);
          }}
        >
          Roll d6
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            const v = crypto.getRandomValues(new Uint32Array(1))[0] % 2 === 0 ? "Heads" : "Tails";
            setResult([v]);
            onCommit?.("coin", v, "Coin");
          }}
        >
          Flip coin
        </Button>
      </div>
    </ToolFrame>
  );
}

/* Base converter (bin/dec/oct/hex) */
function toBase(n: number, base: number) {
  if (!Number.isFinite(n)) return "NaN";
  if (!Number.isInteger(n)) return n.toString();
  return n.toString(base).toUpperCase();
}

export function BaseConverter({ onCommit }: { onCommit: CommitFn }) {
  const [value, setValue] = useState("0");
  const [base, setBase] = useState<2 | 8 | 10 | 16>(10 as 10);

  const parsed = useMemo(() => {
    try {
      return parseInt(value.replace(/\s+/g, ""), base);
    } catch {
      return NaN;
    }
  }, [value, base]);

  const out = {
    bin: Number.isFinite(parsed) ? toBase(parsed, 2) : "",
    oct: Number.isFinite(parsed) ? toBase(parsed, 8) : "",
    dec: Number.isFinite(parsed) ? String(parsed) : "",
    hex: Number.isFinite(parsed) ? toBase(parsed, 16) : "",
  };

  return (
    <ToolFrame
      title="Base Converter"
      expression={`${value} (base ${base})`}
      onCommit={(e, r) => onCommit(e, r, "Converter")}
      result={{ label: "Converted", value: `${out.dec} (dec)` }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field id="base-val" label="Value" value={value} onChange={setValue} type="text" />
        <div className="space-y-1.5">
          <Label>Base</Label>
          <div className="flex gap-2">
            {[2, 8, 10, 16].map((b) => (
              <Button key={b} variant={base === b ? "secondary" : "ghost" as any} size="sm" onClick={() => setBase(b as any)}>
                {b}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Output</Label>
          <div className="grid gap-1">
            <div className="font-mono text-sm">Bin: {out.bin}</div>
            <div className="font-mono text-sm">Oct: {out.oct}</div>
            <div className="font-mono text-sm">Dec: {out.dec}</div>
            <div className="font-mono text-sm">Hex: {out.hex}</div>
          </div>
        </div>
      </div>
    </ToolFrame>
  );
}

/* Roman number converter (number -> roman) */
function toRoman(num: number): string {
  if (!Number.isFinite(num) || num <= 0 || num >= 4000) return "";
  const romans: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let res = "";
  let n = Math.floor(num);
  for (const [val, sym] of romans) {
    while (n >= val) {
      res += sym;
      n -= val;
    }
  }
  return res;
}

export function RomanConverter({ onCommit }: { onCommit: CommitFn }) {
  const [n, setN] = useState("1");
  const val = num(n);
  const roman = Number.isFinite(val) ? toRoman(val) : "";
  return (
    <ToolFrame
      title="Roman Numerals"
      expression={n}
      onCommit={(e, r) => onCommit(e, r, "Roman")}
      result={roman ? { label: "Roman", value: roman } : null}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="roman-n" label="Number" value={n} onChange={setN} />
        <div />
      </div>
    </ToolFrame>
  );
}

/* ASCII / Unicode converter */
export function AsciiUnicode({ onCommit }: { onCommit: CommitFn }) {
  const [text, setText] = useState("");
  const codes = useMemo(() => {
    return Array.from(text).map((ch) => ({ ch, dec: ch.charCodeAt(0), hex: ch.charCodeAt(0).toString(16).toUpperCase() }));
  }, [text]);

  return (
    <ToolFrame
      title="ASCII / Unicode"
      expression={text}
      onCommit={(e, r) => onCommit(e, r, "Text")}
      result={text ? { label: "Length", value: String(text.length) } : null}
    >
      <div className="grid gap-3">
        <div>
          <Label>Text</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        {text ? (
          <div className="overflow-auto max-h-40 rounded-md border p-2 font-mono text-sm">
            {codes.map((c, i) => (
              <div key={i}>{c.ch} · dec {c.dec} · hex {c.hex}</div>
            ))}
          </div>
        ) : null}
      </div>
    </ToolFrame>
  );
}
