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

/* ───────────── Percentage ───────────── */
export function PercentageCalc({ onCommit }: { onCommit: CommitFn }) {
  const [base, setBase] = useState("200");
  const [pct, setPct] = useState("15");

  const b = num(base);
  const p = num(pct);
  const ok = Number.isFinite(b) && Number.isFinite(p);
  const partOf = ok ? (b * p) / 100 : NaN;
  const ofTotal = ok && b !== 0 ? (p / b) * 100 : NaN;
  const increase = ok ? b + (b * p) / 100 : NaN;
  const decrease = ok ? b - (b * p) / 100 : NaN;

  return (
    <ToolFrame
      title="Percentage"
      expression={`${p}% of ${b}`}
      onCommit={(e, r) => onCommit(e, r, "Percentage")}
      result={
        ok
          ? {
              label: `${formatResult(p)}% of ${formatResult(b)}`,
              value: formatResult(partOf),
              sub: (
                <>
                  {formatResult(p)} is {formatResult(ofTotal)}% of {formatResult(b)} · increase →{" "}
                  {formatResult(increase)} · decrease → {formatResult(decrease)}
                </>
              ),
            }
          : null
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="pct-base" label="Value" value={base} onChange={setBase} />
        <Field id="pct-p" label="Percentage" value={pct} onChange={setPct} suffix="%" />
      </div>
    </ToolFrame>
  );
}

/* ───────────── GST ───────────── */
export function GstCalc({ onCommit }: { onCommit: CommitFn }) {
  const [amount, setAmount] = useState("1000");
  const [rate, setRate] = useState("18");
  const [mode, setMode] = useState<"add" | "remove">("add");

  const a = num(amount);
  const r = num(rate);
  const ok = Number.isFinite(a) && Number.isFinite(r);
  const { net, gst, gross } = useMemo(() => {
    if (!ok) return { net: NaN, gst: NaN, gross: NaN };
    if (mode === "add") {
      const g = (a * r) / 100;
      return { net: a, gst: g, gross: a + g };
    }
    const netVal = a / (1 + r / 100);
    return { net: netVal, gst: a - netVal, gross: a };
  }, [a, r, mode, ok]);

  return (
    <ToolFrame
      title="GST"
      expression={`${formatResult(a)} ${mode === "add" ? "+" : "-"} ${formatResult(r)}% GST`}
      onCommit={(e, r) => onCommit(e, r, "GST")}
      result={
        ok
          ? {
              label: mode === "add" ? "Gross (incl. GST)" : "Net (excl. GST)",
              value: formatResult(mode === "add" ? gross : net),
              sub: (
                <>
                  Net {formatResult(net)} · GST {formatResult(gst)} · Gross {formatResult(gross)}
                </>
              ),
            }
          : null
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="gst-amount" label="Amount" value={amount} onChange={setAmount} />
        <Field id="gst-rate" label="GST rate" value={rate} onChange={setRate} suffix="%" />
      </div>
      <div className="flex gap-1 rounded-full bg-muted/40 p-1 self-start">
        {(["add", "remove"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={
              "rounded-full px-4 py-1.5 text-xs font-medium transition " +
              (mode === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {m === "add" ? "Add GST" : "Remove GST"}
          </button>
        ))}
      </div>
    </ToolFrame>
  );
}

/* ───────────── EMI ───────────── */
export function EmiCalc({ onCommit }: { onCommit: CommitFn }) {
  const [principal, setPrincipal] = useState("500000");
  const [rate, setRate] = useState("8.5");
  const [years, setYears] = useState("10");

  const P = num(principal);
  const annual = num(rate);
  const Y = num(years);
  const ok = [P, annual, Y].every(Number.isFinite) && P > 0 && Y > 0;

  const { emi, total, interest } = useMemo(() => {
    if (!ok) return { emi: NaN, total: NaN, interest: NaN };
    const n = Y * 12;
    const r = annual / 12 / 100;
    if (r === 0) {
      const e = P / n;
      return { emi: e, total: e * n, interest: 0 };
    }
    const e = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return { emi: e, total: e * n, interest: e * n - P };
  }, [P, annual, Y, ok]);

  return (
    <ToolFrame
      title="EMI / Loan"
      expression={`${P} @ ${annual}% for ${Y}y`}
      onCommit={(e, r) => onCommit(e, r, "EMI")}
      result={
        ok
          ? {
              label: "Monthly EMI",
              value: formatResult(emi),
              sub: (
                <>
                  Total payable {formatResult(total)} · Interest {formatResult(interest)}
                </>
              ),
            }
          : null
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field id="emi-p" label="Principal" value={principal} onChange={setPrincipal} />
        <Field id="emi-r" label="Annual rate" value={rate} onChange={setRate} suffix="%" />
        <Field id="emi-y" label="Years" value={years} onChange={setYears} />
      </div>
    </ToolFrame>
  );
}

/* ───────────── Age ───────────── */
export function AgeCalc({ onCommit }: { onCommit: CommitFn }) {
  const [dob, setDob] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [to, setTo] = useState(today);

  const detail = useMemo(() => {
    if (!dob) return null;
    const d = new Date(dob);
    const t = new Date(to || today);
    if (Number.isNaN(d.getTime()) || Number.isNaN(t.getTime()) || d > t) return null;

    let years = t.getFullYear() - d.getFullYear();
    let months = t.getMonth() - d.getMonth();
    let days = t.getDate() - d.getDate();
    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(t.getFullYear(), t.getMonth(), 0).getDate();
      days += prevMonth;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    const totalDays = Math.floor((t.getTime() - d.getTime()) / 86_400_000);
    return { years, months, days, totalDays };
  }, [dob, to, today]);

  return (
    <ToolFrame
      title="Age"
      expression={dob ? `Age on ${to}` : undefined}
      onCommit={(e, r) => onCommit(e, r, "Age")}
      result={
        detail
          ? {
              label: "Age",
              value: `${detail.years}y ${detail.months}m ${detail.days}d`,
              sub: <>{detail.totalDays.toLocaleString()} total days</>,
            }
          : null
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="age-dob" label="Date of birth" type="date" value={dob} onChange={setDob} />
        <Field id="age-to" label="On date" type="date" value={to} onChange={setTo} />
      </div>
    </ToolFrame>
  );
}

/* ───────────── BMI ───────────── */
export function BmiCalc({ onCommit }: { onCommit: CommitFn }) {
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("70");

  const h = num(height);
  const w = num(weight);
  const ok = Number.isFinite(h) && Number.isFinite(w) && h > 0;
  const bmi = ok ? w / Math.pow(h / 100, 2) : NaN;
  const cat = !ok
    ? ""
    : bmi < 18.5
      ? "Underweight"
      : bmi < 25
        ? "Normal"
        : bmi < 30
          ? "Overweight"
          : "Obese";

  return (
    <ToolFrame
      title="BMI"
      expression={`${w}kg / (${h}cm)²`}
      onCommit={(e, r) => onCommit(e, r, "BMI")}
      result={
        ok
          ? {
              label: cat,
              value: formatResult(bmi),
              sub: <>Healthy range 18.5 – 24.9</>,
            }
          : null
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="bmi-h" label="Height" value={height} onChange={setHeight} suffix="cm" />
        <Field id="bmi-w" label="Weight" value={weight} onChange={setWeight} suffix="kg" />
      </div>
    </ToolFrame>
  );
}

/* ───────────── Discount ───────────── */
export function DiscountCalc({ onCommit }: { onCommit: CommitFn }) {
  const [price, setPrice] = useState("1200");
  const [pct, setPct] = useState("20");

  const p = num(price);
  const d = num(pct);
  const ok = Number.isFinite(p) && Number.isFinite(d);
  const saved = ok ? (p * d) / 100 : NaN;
  const final = ok ? p - saved : NaN;

  return (
    <ToolFrame
      title="Discount"
      expression={`${p} − ${d}%`}
      onCommit={(e, r) => onCommit(e, r, "Discount")}
      result={
        ok
          ? {
              label: "Final price",
              value: formatResult(final),
              sub: <>You save {formatResult(saved)}</>,
            }
          : null
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="dc-price" label="Original price" value={price} onChange={setPrice} />
        <Field id="dc-pct" label="Discount" value={pct} onChange={setPct} suffix="%" />
      </div>
    </ToolFrame>
  );
}

/* ───────────── Tip ───────────── */
export function TipCalc({ onCommit }: { onCommit: CommitFn }) {
  const [bill, setBill] = useState("50");
  const [tip, setTip] = useState("15");
  const [people, setPeople] = useState("2");

  const b = num(bill);
  const t = num(tip);
  const n = num(people);
  const ok = [b, t, n].every(Number.isFinite) && n > 0;
  const tipAmount = ok ? (b * t) / 100 : NaN;
  const total = ok ? b + tipAmount : NaN;
  const perPerson = ok ? total / n : NaN;

  return (
    <ToolFrame
      title="Tip"
      expression={`${b} + ${t}% / ${n}`}
      onCommit={(e, r) => onCommit(e, r, "Tip")}
      result={
        ok
          ? {
              label: "Per person",
              value: formatResult(perPerson),
              sub: (
                <>
                  Tip {formatResult(tipAmount)} · Total {formatResult(total)}
                </>
              ),
            }
          : null
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field id="tip-b" label="Bill" value={bill} onChange={setBill} />
        <Field id="tip-p" label="Tip" value={tip} onChange={setTip} suffix="%" />
        <Field id="tip-n" label="People" value={people} onChange={setPeople} />
      </div>
    </ToolFrame>
  );
}

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

/* -------------------- Newly added financial tools for Phase 1 Batch 1 -------------------- */

/* Simple Interest Calculator */
export function SimpleInterestCalc({ onCommit }: { onCommit: CommitFn }) {
  const [principal, setPrincipal] = useState("1000");
  const [rate, setRate] = useState("5");
  const [years, setYears] = useState("1");

  const P = num(principal);
  const r = num(rate);
  const t = num(years);
  const ok = [P, r, t].every(Number.isFinite) && P >= 0 && t >= 0;
  const interest = ok ? (P * r * t) / 100 : NaN;
  const total = ok ? P + interest : NaN;

  return (
    <ToolFrame
      title="Simple Interest"
      expression={`${P} @ ${r}% for ${t}y`}
      onCommit={(e, r) => onCommit(e, r, "Simple Interest")}
      result={
        ok
          ? {
              label: "Interest",
              value: formatResult(interest),
              sub: <>Total {formatResult(total)}</>,
            }
          : null
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field id="si-p" label="Principal" value={principal} onChange={setPrincipal} />
        <Field id="si-r" label="Rate (annual)" value={rate} onChange={setRate} suffix="%" />
        <Field id="si-t" label="Years" value={years} onChange={setYears} />
      </div>
    </ToolFrame>
  );
}

/* Compound Interest Calculator */
export function CompoundInterestCalc({ onCommit }: { onCommit: CommitFn }) {
  const [principal, setPrincipal] = useState("1000");
  const [rate, setRate] = useState("5");
  const [years, setYears] = useState("1");
  const [compounds, setCompounds] = useState("1");

  const P = num(principal);
  const r = num(rate) / 100;
  const t = num(years);
  const n = Math.max(1, Math.floor(num(compounds) || 1));
  const ok = [P, r, t, n].every(Number.isFinite) && P >= 0 && t >= 0 && n > 0;

  const amount = useMemo(() => {
    if (!ok) return NaN;
    return P * Math.pow(1 + r / n, n * t);
  }, [P, r, t, n, ok]);

  const interest = ok ? amount - P : NaN;

  return (
    <ToolFrame
      title="Compound Interest"
      expression={`${P} @ ${ (r*100).toFixed(2) }% for ${t}y`}
      onCommit={(e, r) => onCommit(e, r, "Compound Interest")}
      result={
        ok
          ? {
              label: "Amount",
              value: formatResult(amount),
              sub: <>Interest {formatResult(interest)}</>,
            }
          : null
      }
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <Field id="ci-p" label="Principal" value={principal} onChange={setPrincipal} />
        <Field id="ci-r" label="Annual rate" value={rate} onChange={setRate} suffix="%" />
        <Field id="ci-t" label="Years" value={years} onChange={setYears} />
        <Field id="ci-n" label="Compounds/year" value={compounds} onChange={setCompounds} />
      </div>
    </ToolFrame>
  );
}

/* SIP (Systematic Investment Plan) Calculator */
export function SipCalc({ onCommit }: { onCommit: CommitFn }) {
  const [monthly, setMonthly] = useState("1000");
  const [rate, setRate] = useState("12");
  const [years, setYears] = useState("10");

  const m = num(monthly);
  const annual = num(rate) / 100;
  const t = num(years);
  const n = Math.max(0, Math.floor(t * 12));
  const ok = [m, annual, t].every(Number.isFinite) && m >= 0 && t >= 0;

  const fv = useMemo(() => {
    if (!ok) return NaN;
    if (annual === 0) return m * n;
    const r = annual / 12;
    // Future value of monthly SIP (assumes contributions at end of period)
    return m * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  }, [m, annual, n, ok]);

  const invested = ok ? m * n : NaN;
  const gain = ok ? fv - invested : NaN;

  return (
    <ToolFrame
      title="SIP Calculator"
      expression={`${m}/mo @ ${(annual*100).toFixed(2)}% for ${t}y`}
      onCommit={(e, r) => onCommit(e, r, "SIP")}
      result={
        ok
          ? {
              label: "Future value",
              value: formatResult(fv),
              sub: <>Invested {formatResult(invested)} · Gain {formatResult(gain)}</>,
            }
          : null
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field id="sip-m" label="Monthly investment" value={monthly} onChange={setMonthly} />
        <Field id="sip-r" label="Expected annual return" value={rate} onChange={setRate} suffix="%" />
        <Field id="sip-t" label="Years" value={years} onChange={setYears} />
      </div>
    </ToolFrame>
  );
}
