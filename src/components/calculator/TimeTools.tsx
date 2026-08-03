import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommitFn, Field, num, ResultBox, ToolCard } from "@/components/calculator/ToolCard";
import { toast } from "sonner";

/* ───────────── Time (duration) calculator ───────────── */
function toSeconds(h: number, m: number, s: number) {
  return h * 3600 + m * 60 + s;
}

function fromSeconds(total: number) {
  const sign = total < 0 ? "-" : "";
  const t = Math.abs(Math.round(total));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${sign}${h}h ${m}m ${s}s`;
}

export function TimeCalc({ onCommit }: { onCommit: CommitFn }) {
  const [h1, setH1] = useState("2"); const [m1, setM1] = useState("45"); const [s1, setS1] = useState("0");
  const [h2, setH2] = useState("1"); const [m2, setM2] = useState("30"); const [s2, setS2] = useState("0");
  const [op, setOp] = useState<"add" | "sub">("add");

  const res = useMemo(() => {
    const vals = [h1, m1, s1, h2, m2, s2].map(num);
    if (vals.some(Number.isNaN)) return null;
    const a = toSeconds(vals[0], vals[1], vals[2]);
    const b = toSeconds(vals[3], vals[4], vals[5]);
    return op === "add" ? a + b : a - b;
  }, [h1, m1, s1, h2, m2, s2, op]);

  return (
    <ToolCard title="Time Calculator" description="Add or subtract two durations">
      <div className="grid grid-cols-3 gap-2">
        <Field id="t-h1" label="Hours" value={h1} onChange={setH1} />
        <Field id="t-m1" label="Minutes" value={m1} onChange={setM1} />
        <Field id="t-s1" label="Seconds" value={s1} onChange={setS1} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant={op === "add" ? "default" : "outline"} onClick={() => setOp("add")}>Add</Button>
        <Button size="sm" variant={op === "sub" ? "default" : "outline"} onClick={() => setOp("sub")}>Subtract</Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Field id="t-h2" label="Hours" value={h2} onChange={setH2} />
        <Field id="t-m2" label="Minutes" value={m2} onChange={setM2} />
        <Field id="t-s2" label="Seconds" value={s2} onChange={setS2} />
      </div>
      {res !== null ? (
        <ResultBox
          label="Result"
          value={fromSeconds(res)}
          sub={`${Math.round(res)} seconds total`}
          action={
            <Button size="sm" variant="ghost" onClick={() => {
              onCommit(`${h1}:${m1}:${s1} ${op === "add" ? "+" : "−"} ${h2}:${m2}:${s2}`, fromSeconds(res), "Time");
              toast.success("Saved to history");
            }}>Save to history</Button>
          }
        />
      ) : null}
    </ToolCard>
  );
}

/* ───────────── Date difference ───────────── */
export function DateDiffCalc({ onCommit }: { onCommit: CommitFn }) {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState("2026-01-01");
  const [to, setTo] = useState(today);

  const res = useMemo(() => {
    const a = new Date(from).getTime();
    const b = new Date(to).getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    const ms = b - a;
    const days = Math.round(ms / 86400000);
    return {
      days,
      weeks: Math.floor(Math.abs(days) / 7),
      months: Math.abs(days) / 30.4375,
      years: Math.abs(days) / 365.25,
      hours: Math.round(ms / 3600000),
    };
  }, [from, to]);

  return (
    <ToolCard title="Date Difference" description="Days, weeks, months and years between dates">
      <Field id="dd-f" label="From date" type="date" value={from} onChange={setFrom} />
      <Field id="dd-t" label="To date" type="date" value={to} onChange={setTo} />
      {res ? (
        <ResultBox
          label="Difference"
          value={`${res.days} days`}
          sub={`${res.weeks} weeks · ${res.months.toFixed(1)} months · ${res.years.toFixed(2)} years · ${res.hours} hours`}
          action={
            <Button size="sm" variant="ghost" onClick={() => {
              onCommit(`${from} → ${to}`, `${res.days} days`, "Time");
              toast.success("Saved to history");
            }}>Save to history</Button>
          }
        />
      ) : null}
    </ToolCard>
  );
}

/* ───────────── Stopwatch ───────────── */
export function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now() - elapsed;
    const id = window.setInterval(() => setElapsed(Date.now() - startRef.current), 50);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const display = useMemo(() => {
    const t = elapsed;
    const mm = String(Math.floor(t / 60000)).padStart(2, "0");
    const ss = String(Math.floor((t % 60000) / 1000)).padStart(2, "0");
    const cs = String(Math.floor((t % 1000) / 10)).padStart(2, "0");
    return `${mm}:${ss}.${cs}`;
  }, [elapsed]);

  return (
    <ToolCard title="Stopwatch" description="Precise timing with laps">
      <div className="text-center font-display text-4xl font-semibold tabular-nums text-grad">{display}</div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setRunning((r) => !r)} className="gap-1.5">
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {running ? "Pause" : "Start"}
        </Button>
        <Button variant="outline" onClick={() => setLaps((l) => [elapsed, ...l])} disabled={!running}>
          Lap
        </Button>
        <Button variant="ghost" className="gap-1.5" onClick={() => { setRunning(false); setElapsed(0); setLaps([]); }}>
          <RotateCcw className="size-4" /> Reset
        </Button>
      </div>
      {laps.length ? (
        <ul className="max-h-40 space-y-1 overflow-auto text-sm tabular-nums">
          {laps.map((l, i) => (
            <li key={i} className="flex justify-between rounded-lg bg-muted/30 px-3 py-1.5">
              <span className="text-muted-foreground">Lap {laps.length - i}</span>
              <span>{`${String(Math.floor(l / 60000)).padStart(2, "0")}:${String(Math.floor((l % 60000) / 1000)).padStart(2, "0")}.${String(Math.floor((l % 1000) / 10)).padStart(2, "0")}`}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </ToolCard>
  );
}

/* ───────────── Countdown timer ───────────── */
export function CountdownTimer() {
  const [minutes, setMinutes] = useState("5");
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1000) {
          window.clearInterval(id);
          setRunning(false);
          toast.success("Timer finished");
          try {
            navigator.vibrate?.([200, 100, 200]);
          } catch {
            // vibration unsupported
          }
          return 0;
        }
        return r - 1000;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const display = useMemo(() => {
    const t = Math.max(0, remaining);
    const mm = String(Math.floor(t / 60000)).padStart(2, "0");
    const ss = String(Math.floor((t % 60000) / 1000)).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [remaining]);

  return (
    <ToolCard title="Countdown Timer" description="Alerts you when the time is up">
      <Field id="cd-m" label="Duration" value={minutes} onChange={setMinutes} suffix="minutes" />
      <div className="text-center font-display text-4xl font-semibold tabular-nums text-grad">{display}</div>
      <div className="flex flex-wrap gap-2">
        <Button
          className="gap-1.5"
          onClick={() => {
            if (!running) {
              const m = num(minutes);
              if (Number.isNaN(m) || m <= 0) return toast.error("Enter a valid duration");
              if (remaining === 0) setRemaining(m * 60000);
            }
            setRunning((r) => !r);
          }}
        >
          <Timer className="size-4" /> {running ? "Pause" : "Start"}
        </Button>
        <Button variant="ghost" onClick={() => { setRunning(false); setRemaining(0); }}>Reset</Button>
      </div>
    </ToolCard>
  );
}
