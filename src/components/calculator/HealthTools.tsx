import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatResult } from "@/lib/calc-engine";
import { CommitFn, Field, num, ResultBox, ToolCard } from "@/components/calculator/ToolCard";
import { ACTIVITY_LEVELS, bmrMifflin, bodyFatNavy, waterIntakeLitres } from "@/lib/tools-extra";
import { toast } from "sonner";

const fmt = (n: number) => (Number.isFinite(n) ? formatResult(n, 8) : "—");

function SaveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" variant="ghost" onClick={() => { onClick(); toast.success("Saved to history"); }}>
      Save to history
    </Button>
  );
}

function SexSelect({ value, onChange }: { value: "male" | "female"; onChange: (v: "male" | "female") => void }) {
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">Sex</span>
      <Select value={value} onValueChange={(v) => onChange(v as "male" | "female")}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="female">Female</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function BmrCalc({ onCommit }: { onCommit: CommitFn }) {
  const [sex, setSex] = useState<"male" | "female">("male");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("175");
  const [age, setAge] = useState("28");
  const [activity, setActivity] = useState("1.375");

  const res = useMemo(() => {
    const w = num(weight), h = num(height), a = num(age), f = parseFloat(activity);
    if ([w, h, a].some(Number.isNaN)) return null;
    const bmr = bmrMifflin(sex, w, h, a);
    return { bmr, tdee: bmr * f };
  }, [sex, weight, height, age, activity]);

  return (
    <ToolCard title="BMR & Daily Calories" description="Mifflin–St Jeor equation">
      <SexSelect value={sex} onChange={setSex} />
      <Field id="bmr-w" label="Weight" value={weight} onChange={setWeight} suffix="kg" />
      <Field id="bmr-h" label="Height" value={height} onChange={setHeight} suffix="cm" />
      <Field id="bmr-a" label="Age" value={age} onChange={setAge} suffix="years" />
      <div className="space-y-1.5">
        <span className="text-sm font-medium">Activity level</span>
        <Select value={activity} onValueChange={setActivity}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACTIVITY_LEVELS.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {res ? (
        <ResultBox
          label="Maintenance calories"
          value={`${fmt(Math.round(res.tdee))} kcal/day`}
          sub={`BMR ${fmt(Math.round(res.bmr))} kcal · Mild loss ${fmt(Math.round(res.tdee - 500))} kcal`}
          action={<SaveButton onClick={() => onCommit(`BMR ${sex} ${weight}kg ${height}cm ${age}y`, `${Math.round(res.tdee)} kcal`, "Health")} />}
        />
      ) : null}
    </ToolCard>
  );
}

export function BodyFatCalc({ onCommit }: { onCommit: CommitFn }) {
  const [sex, setSex] = useState<"male" | "female">("male");
  const [height, setHeight] = useState("175");
  const [neck, setNeck] = useState("38");
  const [waist, setWaist] = useState("84");
  const [hip, setHip] = useState("95");

  const res = useMemo(() => {
    const h = num(height), n = num(neck), w = num(waist), hp = num(hip);
    if ([h, n, w].some(Number.isNaN)) return null;
    if (sex === "female" && Number.isNaN(hp)) return null;
    const pct = bodyFatNavy(sex, h, n, w, hp);
    return Number.isFinite(pct) ? pct : null;
  }, [sex, height, neck, waist, hip]);

  const band = (p: number) => {
    if (sex === "male") return p < 6 ? "Essential" : p < 14 ? "Athletic" : p < 18 ? "Fit" : p < 25 ? "Average" : "High";
    return p < 14 ? "Essential" : p < 21 ? "Athletic" : p < 25 ? "Fit" : p < 32 ? "Average" : "High";
  };

  return (
    <ToolCard title="Body Fat %" description="US Navy circumference method">
      <SexSelect value={sex} onChange={setSex} />
      <Field id="bf-h" label="Height" value={height} onChange={setHeight} suffix="cm" />
      <Field id="bf-n" label="Neck" value={neck} onChange={setNeck} suffix="cm" />
      <Field id="bf-w" label="Waist" value={waist} onChange={setWaist} suffix="cm" />
      {sex === "female" ? <Field id="bf-hip" label="Hip" value={hip} onChange={setHip} suffix="cm" /> : null}
      {res !== null ? (
        <ResultBox
          label="Body fat"
          value={`${fmt(Math.round(res * 10) / 10)} %`}
          sub={band(res)}
          action={<SaveButton onClick={() => onCommit(`Body fat ${sex} waist ${waist} neck ${neck}`, `${Math.round(res * 10) / 10}%`, "Health")} />}
        />
      ) : null}
    </ToolCard>
  );
}

export function WaterIntakeCalc({ onCommit }: { onCommit: CommitFn }) {
  const [weight, setWeight] = useState("70");
  const [exercise, setExercise] = useState("30");

  const res = useMemo(() => {
    const w = num(weight), e = num(exercise);
    if ([w, e].some(Number.isNaN)) return null;
    return waterIntakeLitres(w, e);
  }, [weight, exercise]);

  return (
    <ToolCard title="Water Intake" description="Recommended daily hydration">
      <Field id="wi-w" label="Weight" value={weight} onChange={setWeight} suffix="kg" />
      <Field id="wi-e" label="Exercise" value={exercise} onChange={setExercise} suffix="min/day" />
      {res !== null ? (
        <ResultBox
          label="Daily water"
          value={`${fmt(Math.round(res * 100) / 100)} L`}
          sub={`≈ ${Math.round((res * 1000) / 250)} glasses of 250 ml`}
          action={<SaveButton onClick={() => onCommit(`Water ${weight}kg + ${exercise}min`, `${Math.round(res * 100) / 100} L`, "Health")} />}
        />
      ) : null}
    </ToolCard>
  );
}
