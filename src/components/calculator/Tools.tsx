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
            <div className="mt-1 font-display text-3xl font-semibold text-grad">
              {result.value}
            </div>
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
