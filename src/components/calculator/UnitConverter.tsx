import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { convert, UNITS, type ConverterCategory } from "@/lib/converters";
import { formatResult } from "@/lib/calc-engine";

const CATEGORIES: { id: ConverterCategory; label: string }[] = [
  { id: "length", label: "Length" },
  { id: "weight", label: "Weight" },
  { id: "temperature", label: "Temperature" },
  { id: "area", label: "Area" },
  { id: "volume", label: "Volume" },
];

interface Props {
  onCommit?: (expression: string, result: string) => void;
}

export function UnitConverter({ onCommit }: Props) {
  const [category, setCategory] = useState<ConverterCategory>("length");
  const [value, setValue] = useState("1");
  const set = UNITS[category];
  const [from, setFrom] = useState(set.units[0].id);
  const [to, setTo] = useState(set.units[1]?.id ?? set.units[0].id);

  // Reset selections when category changes.
  useEffect(() => {
    const next = UNITS[category];
    setFrom(next.units[0].id);
    setTo(next.units[1]?.id ?? next.units[0].id);
  }, [category]);

  const result = useMemo(() => {
    const n = parseFloat(value);
    if (!Number.isFinite(n)) return "";
    return formatResult(convert(n, from, to, category));
  }, [value, from, to, category]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="glass-panel space-y-4 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Unit Converter</h2>
        {result ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onCommit?.(`${value} ${from} → ${to}`, `${result} ${to}`)
            }
          >
            Save
          </Button>
        ) : null}
      </div>

      <Tabs value={category} onValueChange={(v) => setCategory(v as ConverterCategory)}>
        <TabsList className="grid w-full grid-cols-5">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.id} value={c.id} className="text-xs sm:text-sm">
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {CATEGORIES.map((c) => (
          <TabsContent key={c.id} value={c.id} />
        ))}
      </Tabs>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            aria-label="Value to convert"
          />
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {set.units.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={swap}
          aria-label="Swap units"
          className="mx-auto sm:mb-1"
        >
          <ArrowRightLeft className="size-4" />
        </Button>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <div className="glass-key flex h-10 items-center justify-end rounded-md px-3 font-mono text-base">
            {result || "—"}
          </div>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {set.units.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
