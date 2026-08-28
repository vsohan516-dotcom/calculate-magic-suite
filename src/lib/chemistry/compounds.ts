import { molarMass } from "./periodicTable";

export type CompoundAnalysis = {
  formula: string;
  molarMass: number;
  elements: Array<{ symbol: string; count: number; mass: number; percent: number }>;
};

export function analyzeCompound(formula: string): CompoundAnalysis {
  const res = molarMass(formula);
  return {
    formula,
    molarMass: res.mass,
    elements: res.composition.map((c) => ({
      symbol: c.symbol,
      count: c.count,
      mass: c.mass,
      percent: c.percent,
    })),
  };
}
