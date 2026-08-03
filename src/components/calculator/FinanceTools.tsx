import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatResult } from "@/lib/calc-engine";
import { CommitFn, Field, num, ResultBox, ToolCard } from "@/components/calculator/ToolCard";
import { compoundInterest, simpleInterest, sipFutureValue } from "@/lib/tools-extra";
import { toast } from "sonner";

function SaveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => {
        onClick();
        toast.success("Saved to history");
      }}
    >
      Save to history
    </Button>
  );
}

const fmt = (n: number) => (Number.isFinite(n) ? formatResult(n, 12) : "—");

/* ───────────── SIP ───────────── */
export function SipCalc({ onCommit }: { onCommit: CommitFn }) {
  const [monthly, setMonthly] = useState("5000");
  const [rate, setRate] = useState("12");
  const [years, setYears] = useState("10");

  const res = useMemo(() => {
    const m = num(monthly), r = num(rate), y = num(years);
    if ([m, r, y].some(Number.isNaN)) return null;
    const fv = sipFutureValue(m, r, y);
    const invested = m * y * 12;
    return { fv, invested, gain: fv - invested };
  }, [monthly, rate, years]);

  return (
    <ToolCard title="SIP Calculator" description="Future value of a monthly investment plan">
      <Field id="sip-m" label="Monthly investment" value={monthly} onChange={setMonthly} />
      <Field id="sip-r" label="Expected return (p.a.)" value={rate} onChange={setRate} suffix="%" />
      <Field id="sip-y" label="Duration" value={years} onChange={setYears} suffix="years" />
      {res ? (
        <ResultBox
          label="Maturity value"
          value={fmt(Math.round(res.fv))}
          sub={`Invested ${fmt(Math.round(res.invested))} · Gain ${fmt(Math.round(res.gain))}`}
          action={
            <SaveButton
              onClick={() =>
                onCommit(`SIP ${monthly}/mo @ ${rate}% × ${years}y`, fmt(Math.round(res.fv)), "Finance")
              }
            />
          }
        />
      ) : null}
    </ToolCard>
  );
}

/* ───────────── Loan ───────────── */
export function LoanCalc({ onCommit }: { onCommit: CommitFn }) {
  const [amount, setAmount] = useState("500000");
  const [rate, setRate] = useState("9.5");
  const [years, setYears] = useState("5");

  const res = useMemo(() => {
    const p = num(amount), r = num(rate) / 1200, n = num(years) * 12;
    if ([p, r, n].some(Number.isNaN) || n <= 0) return null;
    const emi = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = emi * n;
    return { emi, total, interest: total - p };
  }, [amount, rate, years]);

  return (
    <ToolCard title="Loan Calculator" description="Monthly payment, total cost and interest">
      <Field id="loan-a" label="Loan amount" value={amount} onChange={setAmount} />
      <Field id="loan-r" label="Interest rate (p.a.)" value={rate} onChange={setRate} suffix="%" />
      <Field id="loan-y" label="Tenure" value={years} onChange={setYears} suffix="years" />
      {res ? (
        <ResultBox
          label="Monthly payment"
          value={fmt(Math.round(res.emi))}
          sub={`Total payable ${fmt(Math.round(res.total))} · Interest ${fmt(Math.round(res.interest))}`}
          action={
            <SaveButton
              onClick={() =>
                onCommit(`Loan ${amount} @ ${rate}% × ${years}y`, fmt(Math.round(res.emi)), "Finance")
              }
            />
          }
        />
      ) : null}
    </ToolCard>
  );
}

/* ───────────── Simple interest ───────────── */
export function SimpleInterestCalc({ onCommit }: { onCommit: CommitFn }) {
  const [p, setP] = useState("100000");
  const [r, setR] = useState("7.5");
  const [t, setT] = useState("3");

  const res = useMemo(() => {
    const P = num(p), R = num(r), T = num(t);
    if ([P, R, T].some(Number.isNaN)) return null;
    return simpleInterest(P, R, T);
  }, [p, r, t]);

  return (
    <ToolCard title="Simple Interest" description="I = P × R × T ÷ 100">
      <Field id="si-p" label="Principal" value={p} onChange={setP} />
      <Field id="si-r" label="Rate (p.a.)" value={r} onChange={setR} suffix="%" />
      <Field id="si-t" label="Time" value={t} onChange={setT} suffix="years" />
      {res ? (
        <ResultBox
          label="Interest"
          value={fmt(res.interest)}
          sub={`Maturity ${fmt(res.total)}`}
          action={
            <SaveButton
              onClick={() => onCommit(`SI ${p} @ ${r}% × ${t}y`, fmt(res.interest), "Finance")}
            />
          }
        />
      ) : null}
    </ToolCard>
  );
}

/* ───────────── Compound interest ───────────── */
export function CompoundInterestCalc({ onCommit }: { onCommit: CommitFn }) {
  const [p, setP] = useState("100000");
  const [r, setR] = useState("8");
  const [t, setT] = useState("5");
  const [n, setN] = useState("4");

  const res = useMemo(() => {
    const P = num(p), R = num(r), T = num(t), N = num(n);
    if ([P, R, T, N].some(Number.isNaN) || N <= 0) return null;
    return compoundInterest(P, R, T, N);
  }, [p, r, t, n]);

  return (
    <ToolCard title="Compound Interest" description="A = P(1 + r/n)^(n·t)">
      <Field id="ci-p" label="Principal" value={p} onChange={setP} />
      <Field id="ci-r" label="Rate (p.a.)" value={r} onChange={setR} suffix="%" />
      <Field id="ci-t" label="Time" value={t} onChange={setT} suffix="years" />
      <Field id="ci-n" label="Compounds per year" value={n} onChange={setN} />
      {res ? (
        <ResultBox
          label="Maturity amount"
          value={fmt(Math.round(res.total))}
          sub={`Interest earned ${fmt(Math.round(res.interest))}`}
          action={
            <SaveButton
              onClick={() =>
                onCommit(`CI ${p} @ ${r}% × ${t}y (n=${n})`, fmt(Math.round(res.total)), "Finance")
              }
            />
          }
        />
      ) : null}
    </ToolCard>
  );
}

/* ───────────── Profit & Loss ───────────── */
export function ProfitLossCalc({ onCommit }: { onCommit: CommitFn }) {
  const [cost, setCost] = useState("1200");
  const [sell, setSell] = useState("1500");

  const res = useMemo(() => {
    const c = num(cost), s = num(sell);
    if ([c, s].some(Number.isNaN) || c === 0) return null;
    const diff = s - c;
    return { diff, pct: (diff / c) * 100 };
  }, [cost, sell]);

  return (
    <ToolCard title="Profit & Loss" description="Margin on cost price">
      <Field id="pl-c" label="Cost price" value={cost} onChange={setCost} />
      <Field id="pl-s" label="Selling price" value={sell} onChange={setSell} />
      {res ? (
        <ResultBox
          label={res.diff >= 0 ? "Profit" : "Loss"}
          value={fmt(Math.abs(res.diff))}
          sub={`${res.diff >= 0 ? "Profit" : "Loss"} ${fmt(Math.abs(res.pct))}%`}
          action={
            <SaveButton
              onClick={() => onCommit(`P&L ${cost} → ${sell}`, fmt(res.diff), "Finance")}
            />
          }
        />
      ) : null}
    </ToolCard>
  );
}

/* ───────────── Average ───────────── */
export function AverageCalc({ onCommit }: { onCommit: CommitFn }) {
  const [list, setList] = useState("12, 18, 25, 40");

  const res = useMemo(() => {
    const values = list
      .split(/[\s,;]+/)
      .map((v) => parseFloat(v))
      .filter((v) => Number.isFinite(v));
    if (!values.length) return null;
    const sum = values.reduce((a, b) => a + b, 0);
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    return {
      count: values.length,
      sum,
      mean: sum / values.length,
      median,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }, [list]);

  return (
    <ToolCard title="Average Calculator" description="Mean, median, sum, min and max">
      <Field id="avg-l" label="Numbers (comma or space separated)" type="text" value={list} onChange={setList} />
      {res ? (
        <ResultBox
          label="Mean"
          value={fmt(res.mean)}
          sub={`Count ${res.count} · Sum ${fmt(res.sum)} · Median ${fmt(res.median)} · Min ${fmt(res.min)} · Max ${fmt(res.max)}`}
          action={<SaveButton onClick={() => onCommit(`avg(${list})`, fmt(res.mean), "Finance")} />}
        />
      ) : null}
    </ToolCard>
  );
}

/* ───────────── Split bill ───────────── */
export function SplitBillCalc({ onCommit }: { onCommit: CommitFn }) {
  const [total, setTotal] = useState("2400");
  const [people, setPeople] = useState("4");
  const [tip, setTip] = useState("10");

  const res = useMemo(() => {
    const t = num(total), p = num(people), tp = num(tip);
    if ([t, p, tp].some(Number.isNaN) || p <= 0) return null;
    const grand = t * (1 + tp / 100);
    return { grand, each: grand / p };
  }, [total, people, tip]);

  return (
    <ToolCard title="Split Bill" description="Share a bill evenly, tip included">
      <Field id="sb-t" label="Bill total" value={total} onChange={setTotal} />
      <Field id="sb-p" label="People" value={people} onChange={setPeople} />
      <Field id="sb-tip" label="Tip" value={tip} onChange={setTip} suffix="%" />
      {res ? (
        <ResultBox
          label="Each person pays"
          value={fmt(Math.round(res.each * 100) / 100)}
          sub={`Grand total ${fmt(Math.round(res.grand * 100) / 100)}`}
          action={
            <SaveButton
              onClick={() =>
                onCommit(`Split ${total} + ${tip}% / ${people}`, fmt(res.each), "Finance")
              }
            />
          }
        />
      ) : null}
    </ToolCard>
  );
}

/* ───────────── Fuel cost ───────────── */
export function FuelCostCalc({ onCommit }: { onCommit: CommitFn }) {
  const [distance, setDistance] = useState("300");
  const [mileage, setMileage] = useState("18");
  const [price, setPrice] = useState("105");

  const res = useMemo(() => {
    const d = num(distance), m = num(mileage), p = num(price);
    if ([d, m, p].some(Number.isNaN) || m <= 0) return null;
    const litres = d / m;
    return { litres, cost: litres * p, perKm: (litres * p) / (d || 1) };
  }, [distance, mileage, price]);

  return (
    <ToolCard title="Fuel Cost" description="Trip fuel usage and cost">
      <Field id="fc-d" label="Distance" value={distance} onChange={setDistance} suffix="km" />
      <Field id="fc-m" label="Mileage" value={mileage} onChange={setMileage} suffix="km/L" />
      <Field id="fc-p" label="Fuel price" value={price} onChange={setPrice} suffix="/L" />
      {res ? (
        <ResultBox
          label="Trip cost"
          value={fmt(Math.round(res.cost * 100) / 100)}
          sub={`${fmt(Math.round(res.litres * 100) / 100)} L · ${fmt(Math.round(res.perKm * 100) / 100)} per km`}
          action={
            <SaveButton
              onClick={() => onCommit(`Fuel ${distance}km @ ${mileage}km/L`, fmt(res.cost), "Finance")}
            />
          }
        />
      ) : null}
    </ToolCard>
  );
}

/* ───────────── Unit price ───────────── */
export function UnitPriceCalc({ onCommit }: { onCommit: CommitFn }) {
  const [priceA, setPriceA] = useState("120");
  const [qtyA, setQtyA] = useState("500");
  const [priceB, setPriceB] = useState("210");
  const [qtyB, setQtyB] = useState("1000");

  const res = useMemo(() => {
    const pa = num(priceA), qa = num(qtyA), pb = num(priceB), qb = num(qtyB);
    if ([pa, qa, pb, qb].some(Number.isNaN) || qa <= 0 || qb <= 0) return null;
    const a = pa / qa;
    const b = pb / qb;
    return { a, b, better: a <= b ? "A" : "B", savingPct: (Math.abs(a - b) / Math.max(a, b)) * 100 };
  }, [priceA, qtyA, priceB, qtyB]);

  return (
    <ToolCard title="Unit Price Compare" description="Find which pack is cheaper per unit">
      <Field id="up-pa" label="Option A price" value={priceA} onChange={setPriceA} />
      <Field id="up-qa" label="Option A quantity" value={qtyA} onChange={setQtyA} />
      <Field id="up-pb" label="Option B price" value={priceB} onChange={setPriceB} />
      <Field id="up-qb" label="Option B quantity" value={qtyB} onChange={setQtyB} />
      {res ? (
        <ResultBox
          label={`Better value: Option ${res.better}`}
          value={`${fmt(Math.round(Math.min(res.a, res.b) * 10000) / 10000)} / unit`}
          sub={`A ${fmt(res.a)} · B ${fmt(res.b)} · saves ${fmt(Math.round(res.savingPct * 10) / 10)}%`}
          action={
            <SaveButton
              onClick={() => onCommit(`Unit price A ${priceA}/${qtyA} vs B ${priceB}/${qtyB}`, `Option ${res.better}`, "Finance")}
            />
          }
        />
      ) : null}
    </ToolCard>
  );
}

/* ───────────── Income tax (slab-free simple estimator) ───────────── */
export function TaxCalc({ onCommit }: { onCommit: CommitFn }) {
  const [income, setIncome] = useState("900000");
  const [deductions, setDeductions] = useState("50000");
  const [rate, setRate] = useState("20");
  const [cess, setCess] = useState("4");

  const res = useMemo(() => {
    const i = num(income), d = num(deductions), r = num(rate), c = num(cess);
    if ([i, d, r, c].some(Number.isNaN)) return null;
    const taxable = Math.max(0, i - d);
    const tax = (taxable * r) / 100;
    const total = tax * (1 + c / 100);
    return { taxable, tax, total, net: i - total };
  }, [income, deductions, rate, cess]);

  return (
    <ToolCard title="Tax Calculator" description="Estimate tax with deductions and cess">
      <Field id="tx-i" label="Gross income" value={income} onChange={setIncome} />
      <Field id="tx-d" label="Deductions" value={deductions} onChange={setDeductions} />
      <Field id="tx-r" label="Tax rate" value={rate} onChange={setRate} suffix="%" />
      <Field id="tx-c" label="Cess / surcharge" value={cess} onChange={setCess} suffix="%" />
      {res ? (
        <ResultBox
          label="Total tax payable"
          value={fmt(Math.round(res.total))}
          sub={`Taxable ${fmt(res.taxable)} · Net income ${fmt(Math.round(res.net))}`}
          action={
            <SaveButton
              onClick={() => onCommit(`Tax ${income} @ ${rate}% + ${cess}% cess`, fmt(res.total), "Finance")}
            />
          }
        />
      ) : null}
    </ToolCard>
  );
}
