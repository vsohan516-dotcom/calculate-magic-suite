import React, { useState } from "react";
import { analyzeCompound, type CompoundAnalysis } from "@/lib/chemistry/compounds";

export function ChemistryCalculators() {
  const [formula, setFormula] = useState("");
  const [result, setResult] = useState<CompoundAnalysis | { error: string } | null>(null);

  const onAnalyze = () => {
    try {
      const res = analyzeCompound(formula);
      setResult(res);
    } catch (e) {
      setResult({ error: String(e) });
    }
  };

  return (
    <div className="glass-panel p-4">
      <h3 className="font-display text-sm font-semibold">Chemistry Calculators</h3>
      <div className="mt-3 grid gap-2">
        <label className="text-xs">Formula</label>
        <input className="input" value={formula} onChange={(e) => setFormula(e.target.value)} />
        <div className="flex gap-2">
          <button className="btn" onClick={onAnalyze}>
            Analyze
          </button>
        </div>

        {result ? (
          <div className="mt-3">
            {"error" in result ? (
              <div className="text-red-500">{result.error}</div>
            ) : (
              <div>
                <div>Molar mass: {result.molarMass} g/mol</div>
                <div className="mt-2">Composition:</div>
                <ul>
                  {result.elements.map((e) => (
                    <li key={e.symbol}>
                      {e.symbol} × {e.count} → {e.mass} g ({e.percent.toFixed(2)}%)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
