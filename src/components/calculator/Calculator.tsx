import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { evaluate, formatResult, type AngleMode } from "@/lib/calc-engine";
import { Display } from "./Display";
import { CalcKey } from "./CalcKey";
import { useSpeech } from "@/hooks/use-speech";
import type { HistoryEntry } from "@/hooks/use-history";

interface CalculatorProps {
  scientific?: boolean;
  onCommit: (entry: Omit<HistoryEntry, "id" | "timestamp">) => void;
}

const STANDARD_LAYOUT: Array<{
  label: string;
  insert?: string;
  action?: "clear" | "back" | "equals" | "negate";
  variant?: "default" | "operator" | "accent" | "equals" | "danger" | "ghost";
  span?: 1 | 2;
  aria?: string;
}> = [
  { label: "AC", action: "clear", variant: "danger", aria: "All clear" },
  { label: "( )", insert: "()", variant: "ghost" },
  { label: "%", insert: "%", variant: "ghost" },
  { label: "÷", insert: "÷", variant: "operator", aria: "Divide" },

  { label: "7", insert: "7" },
  { label: "8", insert: "8" },
  { label: "9", insert: "9" },
  { label: "×", insert: "×", variant: "operator", aria: "Multiply" },

  { label: "4", insert: "4" },
  { label: "5", insert: "5" },
  { label: "6", insert: "6" },
  { label: "−", insert: "-", variant: "operator", aria: "Subtract" },

  { label: "1", insert: "1" },
  { label: "2", insert: "2" },
  { label: "3", insert: "3" },
  { label: "+", insert: "+", variant: "operator", aria: "Add" },

  { label: "±", action: "negate", variant: "ghost", aria: "Toggle sign" },
  { label: "0", insert: "0" },
  { label: ".", insert: "." },
  { label: "=", action: "equals", variant: "equals", aria: "Equals" },
];

const SCIENTIFIC_TOP = [
  { label: "sin", insert: "sin(" },
  { label: "cos", insert: "cos(" },
  { label: "tan", insert: "tan(" },
  { label: "ln", insert: "ln(" },
  { label: "log", insert: "log(" },
  { label: "√", insert: "sqrt(" },
  { label: "x²", insert: "^2" },
  { label: "x^y", insert: "^" },
  { label: "π", insert: "π" },
  { label: "e", insert: "e" },
  { label: "x!", insert: "!" },
  { label: "exp", insert: "exp(" },
];

export function Calculator({ scientific = false, onCommit }: CalculatorProps) {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [memory, setMemory] = useState<number>(0);
  const [memoryActive, setMemoryActive] = useState(false);
  const [angle, setAngle] = useState<AngleMode>("deg");
  const justEvaluatedRef = useRef(false);
  const speech = useSpeech();

  // Open paren / close paren toggle for the "( )" key
  const balancedParen = useCallback((expr: string): "(" | ")" => {
    let open = 0;
    for (const ch of expr) {
      if (ch === "(") open++;
      else if (ch === ")") open--;
    }
    const lastChar = expr.slice(-1);
    if (open <= 0) return "(";
    if (/[0-9.)π]|e/.test(lastChar)) return ")";
    return "(";
  }, []);

  const insert = useCallback(
    (token: string) => {
      setError(null);
      setExpression((prev) => {
        // After equals, an operator continues from the previous result; a digit starts fresh.
        let base = prev;
        if (justEvaluatedRef.current) {
          if (/^[+\-×÷*/^%]/.test(token)) {
            base = result;
          } else {
            base = "";
          }
          justEvaluatedRef.current = false;
        }
        if (token === "()") return base + balancedParen(base);
        return base + token;
      });
    },
    [balancedParen, result],
  );

  const calculate = useCallback(
    (commit = true): number | null => {
      if (!expression.trim()) return null;
      try {
        const value = evaluate(expression, angle);
        const formatted = formatResult(value);
        setResult(formatted);
        setError(null);
        justEvaluatedRef.current = true;
        if (commit) {
          onCommit({
            expression,
            result: formatted,
            category: scientific ? "Scientific" : "Standard",
          });
        }
        return value;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
        return null;
      }
    },
    [angle, expression, onCommit, scientific],
  );

  // Live preview: when expression contains a binary op + 2 numbers and looks complete enough.
  useEffect(() => {
    if (!expression.trim()) {
      setResult("0");
      setError(null);
      return;
    }
    try {
      const value = evaluate(expression, angle);
      setResult(formatResult(value));
      setError(null);
    } catch {
      // silent — wait for the user to fix
    }
  }, [expression, angle]);

  const onAction = useCallback(
    (action: "clear" | "back" | "equals" | "negate") => {
      switch (action) {
        case "clear":
          setExpression("");
          setResult("0");
          setError(null);
          return;
        case "back":
          setExpression((p) => p.slice(0, -1));
          return;
        case "equals":
          calculate(true);
          return;
        case "negate":
          setExpression((p) => {
            if (!p) return "-";
            if (p.startsWith("-(") && p.endsWith(")")) return p.slice(2, -1);
            return `-(${p})`;
          });
      }
    },
    [calculate],
  );

  // Keyboard handling
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      const k = e.key;
      if (/^[0-9.]$/.test(k)) {
        insert(k);
      } else if (k === "+" || k === "-" || k === "*" || k === "/") {
        insert(k === "*" ? "×" : k === "/" ? "÷" : k);
      } else if (k === "Enter" || k === "=") {
        e.preventDefault();
        onAction("equals");
      } else if (k === "Backspace") {
        onAction("back");
      } else if (k === "Escape") {
        onAction("clear");
      } else if (k === "(" || k === ")") {
        insert(k);
      } else if (k === "%") {
        insert("%");
      } else if (k === "^") {
        insert("^");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [insert, onAction]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result);
      toast.success("Result copied");
    } catch {
      toast.error("Could not copy");
    }
  }, [result]);

  const speak = useCallback(() => {
    speech.speak(`The result is ${result}`);
  }, [result, speech]);

  const startVoice = useCallback(() => {
    if (speech.listening) {
      speech.stop();
      return;
    }
    speech.start((expr) => {
      setExpression(expr);
      // give the engine a tick to compute
      setTimeout(() => {
        try {
          const v = evaluate(expr, angle);
          const f = formatResult(v);
          setResult(f);
          justEvaluatedRef.current = true;
          onCommit({ expression: expr, result: f, category: "Voice" });
        } catch {
          setError("Could not parse");
        }
      }, 50);
    });
  }, [angle, onCommit, speech]);

  // Memory
  const mem = useMemo(
    () => ({
      mc: () => {
        setMemory(0);
        setMemoryActive(false);
      },
      mr: () => insert(String(memory)),
      mplus: () => {
        const v = parseFloat(result);
        if (Number.isFinite(v)) {
          setMemory((m) => m + v);
          setMemoryActive(true);
        }
      },
      mminus: () => {
        const v = parseFloat(result);
        if (Number.isFinite(v)) {
          setMemory((m) => m - v);
          setMemoryActive(true);
        }
      },
      ms: () => {
        const v = parseFloat(result);
        if (Number.isFinite(v)) {
          setMemory(v);
          setMemoryActive(true);
        }
      },
    }),
    [insert, memory, result],
  );

  return (
    <div className="space-y-4">
      <Display
        expression={expression}
        result={result}
        error={error}
        onCopy={copy}
        onSpeak={speak}
        onMic={startVoice}
        listening={speech.listening}
        micSupported={speech.supported}
        memoryActive={memoryActive}
        angleMode={scientific ? angle : undefined}
      />

      {/* Memory row */}
      <div className="grid grid-cols-5 gap-2">
        {(["MC", "MR", "M+", "M-", "MS"] as const).map((label, i) => (
          <Button
            key={label}
            variant="ghost"
            className="glass-key glass-key-hover h-10 rounded-xl text-xs font-semibold tracking-wider"
            onClick={() => {
              const fns = [mem.mc, mem.mr, mem.mplus, mem.mminus, mem.ms];
              fns[i]();
            }}
            aria-label={`Memory ${label}`}
          >
            {label}
          </Button>
        ))}
      </div>

      {scientific ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Scientific</span>
            <div className="flex gap-1 rounded-full bg-muted/40 p-1">
              {(["deg", "rad"] as AngleMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAngle(m)}
                  className={
                    "rounded-full px-3 py-1 text-[11px] uppercase tracking-widest transition " +
                    (angle === m
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {SCIENTIFIC_TOP.map((k) => (
              <CalcKey key={k.label} variant="ghost" onClick={() => insert(k.insert)}>
                {k.label}
              </CalcKey>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {STANDARD_LAYOUT.map((k, i) => (
          <CalcKey
            key={`${k.label}-${i}`}
            variant={k.variant}
            span={k.span}
            ariaLabel={k.aria ?? k.label}
            onClick={() => {
              if (k.action) onAction(k.action);
              else if (k.insert) insert(k.insert);
            }}
          >
            {k.label}
          </CalcKey>
        ))}
      </div>
    </div>
  );
}
