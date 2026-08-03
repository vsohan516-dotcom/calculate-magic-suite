import { useMemo, useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CommitFn, Field, ResultBox, ToolCard } from "@/components/calculator/ToolCard";
import {
  codesToText, convertData, DATA_UNITS, fromRoman, humanBytes, parseInBase, textToCodes, toBase, toRoman,
} from "@/lib/tools-extra";
import { toast } from "sonner";

const BASES = [
  { id: "2", label: "Binary (2)" },
  { id: "8", label: "Octal (8)" },
  { id: "10", label: "Decimal (10)" },
  { id: "16", label: "Hexadecimal (16)" },
  { id: "32", label: "Base 32" },
  { id: "36", label: "Base 36" },
];

export function BaseConverter({ onCommit }: { onCommit: CommitFn }) {
  const [value, setValue] = useState("255");
  const [from, setFrom] = useState("10");
  const [to, setTo] = useState("2");

  const res = useMemo(() => {
    const n = parseInBase(value.trim(), Number(from));
    if (!Number.isFinite(n)) return null;
    return { decimal: n, out: toBase(n, Number(to)) };
  }, [value, from, to]);

  return (
    <ToolCard title="Number Base Converter" description="Binary, octal, decimal, hex and more">
      <Field id="bc-v" label="Value" type="text" value={value} onChange={setValue} />
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div className="space-y-1.5">
          <Label>From</Label>
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{BASES.map((b) => <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" aria-label="Swap bases" onClick={() => { setFrom(to); setTo(from); }}>
          <ArrowRightLeft className="size-4" />
        </Button>
        <div className="space-y-1.5">
          <Label>To</Label>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{BASES.map((b) => <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      {res ? (
        <ResultBox
          label={`Base ${to}`}
          value={res.out.toUpperCase()}
          sub={`Decimal ${res.decimal}`}
          action={
            <Button size="sm" variant="ghost" onClick={() => { onCommit(`${value}₍${from}₎ → base ${to}`, res.out.toUpperCase(), "Convert"); toast.success("Saved to history"); }}>
              Save to history
            </Button>
          }
        />
      ) : null}
    </ToolCard>
  );
}

export function RomanConverter({ onCommit }: { onCommit: CommitFn }) {
  const [numeric, setNumeric] = useState("2026");
  const [roman, setRoman] = useState("MMXXVI");

  return (
    <ToolCard title="Roman Numerals" description="Convert both ways (1–3999)">
      <div className="space-y-1.5">
        <Label htmlFor="rn-n">Number</Label>
        <Input
          id="rn-n"
          inputMode="numeric"
          value={numeric}
          onChange={(e) => {
            setNumeric(e.target.value);
            const n = parseInt(e.target.value, 10);
            setRoman(Number.isFinite(n) ? toRoman(n) : "");
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rn-r">Roman numeral</Label>
        <Input
          id="rn-r"
          value={roman}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            setRoman(v);
            const n = fromRoman(v);
            setNumeric(Number.isFinite(n) && n > 0 ? String(n) : "");
          }}
        />
      </div>
      <Button size="sm" variant="ghost" className="justify-self-start" onClick={() => { onCommit(`${numeric} ⇄ Roman`, roman, "Convert"); toast.success("Saved to history"); }}>
        Save to history
      </Button>
    </ToolCard>
  );
}

export function AsciiConverter() {
  const [text, setText] = useState("Lumen");
  const [radix, setRadix] = useState("10");
  const codes = useMemo(() => textToCodes(text, Number(radix)), [text, radix]);
  const [decodeInput, setDecodeInput] = useState("76 117 109 101 110");
  const decoded = useMemo(() => codesToText(decodeInput, Number(radix)), [decodeInput, radix]);

  return (
    <ToolCard title="ASCII / Unicode" description="Text ⇄ character codes">
      <div className="space-y-1.5">
        <Label>Code format</Label>
        <Select value={radix} onValueChange={setRadix}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="10">Decimal</SelectItem>
            <SelectItem value="16">Hexadecimal</SelectItem>
            <SelectItem value="2">Binary</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Field id="ac-t" label="Text → codes" type="text" value={text} onChange={setText} />
      <div className="break-words rounded-2xl bg-muted/30 p-3 font-mono text-sm">{codes || "—"}</div>
      <Field id="ac-c" label="Codes → text" type="text" value={decodeInput} onChange={setDecodeInput} />
      <div className="break-words rounded-2xl bg-muted/30 p-3 font-mono text-sm">{decoded || "—"}</div>
    </ToolCard>
  );
}

export function DataSizeConverter({ onCommit }: { onCommit: CommitFn }) {
  const [value, setValue] = useState("1024");
  const [from, setFrom] = useState("MB");
  const [to, setTo] = useState("GB");

  const res = useMemo(() => {
    const n = parseFloat(value);
    if (!Number.isFinite(n)) return null;
    const out = convertData(n, from, to);
    const bytes = convertData(n, from, "B");
    return { out, human: humanBytes(bytes) };
  }, [value, from, to]);

  return (
    <ToolCard title="Data Storage Converter" description="Bytes through petabytes">
      <Field id="ds-v" label="Value" value={value} onChange={setValue} />
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div className="space-y-1.5">
          <Label>From</Label>
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DATA_UNITS.map((u) => <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" aria-label="Swap units" onClick={() => { setFrom(to); setTo(from); }}>
          <ArrowRightLeft className="size-4" />
        </Button>
        <div className="space-y-1.5">
          <Label>To</Label>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DATA_UNITS.map((u) => <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      {res ? (
        <ResultBox
          label={to}
          value={String(Number(res.out.toPrecision(10)))}
          sub={`Human readable: ${res.human}`}
          action={
            <Button size="sm" variant="ghost" onClick={() => { onCommit(`${value} ${from} → ${to}`, String(Number(res.out.toPrecision(10))), "Convert"); toast.success("Saved to history"); }}>
              Save to history
            </Button>
          }
        />
      ) : null}
    </ToolCard>
  );
}
