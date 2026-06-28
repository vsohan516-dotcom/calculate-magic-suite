import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatResult } from "@/lib/calc-engine";
import { toast } from "sonner";

// Common currencies displayed in selector.
const CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "INR", "AUD", "CAD", "CHF", "CNY", "SEK",
  "NZD", "SGD", "HKD", "KRW", "MXN", "BRL", "ZAR", "AED",
];

interface RatesState {
  base: string;
  rates: Record<string, number>;
  updatedAt: number;
}

const CACHE_KEY = "lumen.currency.rates.v1";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function readCache(base: string): RatesState | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}.${base}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RatesState;
    if (Date.now() - parsed.updatedAt > CACHE_TTL) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(state: RatesState) {
  try {
    localStorage.setItem(`${CACHE_KEY}.${state.base}`, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

// Public, no-key API. App is "API ready" — swap the URL if a paid provider is wired up.
async function fetchRates(base: string): Promise<RatesState> {
  const cached = readCache(base);
  if (cached) return cached;
  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
  if (!res.ok) throw new Error("Failed to load rates");
  const data = (await res.json()) as { result: string; rates: Record<string, number> };
  if (data.result !== "success") throw new Error("Rate provider error");
  const state: RatesState = { base, rates: data.rates, updatedAt: Date.now() };
  writeCache(state);
  return state;
}

interface Props {
  onCommit?: (expression: string, result: string) => void;
}

export function CurrencyConverter({ onCommit }: Props) {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [rates, setRates] = useState<RatesState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (base: string, force = false) => {
    setLoading(true);
    setError(null);
    try {
      if (force) localStorage.removeItem(`${CACHE_KEY}.${base}`);
      const data = await fetchRates(base);
      setRates(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(from);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from]);

  const result = useMemo(() => {
    if (!rates) return "";
    const n = parseFloat(amount);
    const rate = rates.rates[to];
    if (!Number.isFinite(n) || !rate) return "";
    return formatResult(n * rate);
  }, [amount, to, rates]);

  return (
    <div className="glass-panel space-y-4 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Currency</h2>
        <div className="flex items-center gap-2">
          {rates ? (
            <span className="text-xs text-muted-foreground">
              Updated {new Date(rates.updatedAt).toLocaleTimeString()}
            </span>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh rates"
            onClick={() => void load(from, true)}
            disabled={loading}
          >
            <RefreshCcw className={"size-4 " + (loading ? "animate-spin" : "")} />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Amount</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
          />
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Swap"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          className="mx-auto sm:mb-1"
        >
          <ArrowRightLeft className="size-4" />
        </Button>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Converted</label>
          <div className="glass-key flex h-10 items-center justify-end rounded-md px-3 font-mono text-base">
            {loading ? "…" : result || "—"}
          </div>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}. Showing cached rates if available.</p>
      ) : null}

      {result ? (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onCommit?.(`${amount} ${from} → ${to}`, `${result} ${to}`);
              toast.success("Saved to history");
            }}
          >
            Save to history
          </Button>
        </div>
      ) : null}
    </div>
  );
}
