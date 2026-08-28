import { ChemicalElement, ELEMENTS, BY_SYMBOL } from "./periodicTable";

export type ElementInfo = {
  name: string;
  symbol: string;
  atomicNumber: number;
  atomicMass: number | string;
  iupacName?: string | null;
  group?: number | null;
  period?: number | null;
  block?: "s" | "p" | "d" | "f" | null;
  category?: string | null;

  electronicConfiguration?: string | null;
  valenceElectrons?: number | null;
  commonOxidationStates?: Array<number> | null;
  commonIons?: Array<string> | null;
  electronegativity?: number | null;
  firstIonizationEnergy?: number | null;

  stateAtRoomTemp?: string | null;
  appearance?: string | null;
  meltingPoint?: number | null;
  boilingPoint?: number | null;
  density?: number | null;

  oxidizingBehavior?: string | null;
  reducingBehavior?: string | null;
  shortDescription?: string | null;
  importantCompounds?: Array<string> | null;
  inorganicRelevance?: string | null;
  organicRelevance?: string | null;

  commonUses?: Array<string> | null;
  environmentalRelevance?: string | null;

  safety?: {
    hazard?: string | null;
    handling?: string | null;
  } | null;

  class11_12?: {
    importantConcepts?: Array<string> | null;
    quickRevision?: Array<string> | null;
    commonMistakes?: Array<string> | null;
  } | null;
};

const deriveBlock = (e: ChemicalElement): ElementInfo["block"] => {
  // simple heuristic based on group
  if (e.number >= 57 && e.number <= 71) return "f";
  if (e.number >= 89 && e.number <= 103) return "f";
  if (e.group >= 1 && e.group <= 2) return "s";
  if (e.group >= 13 && e.group <= 18) return "p";
  if (e.group >= 3 && e.group <= 12) return "d";
  return null;
};

export const ELEMENT_INFO: Record<string, ElementInfo> = Object.fromEntries(
  ELEMENTS.map((el) => {
    const info: ElementInfo = {
      name: el.name,
      symbol: el.symbol,
      atomicNumber: el.number,
      atomicMass: el.mass || "Not available",
      iupacName: null,
      group: el.group || null,
      period: el.period || null,
      block: deriveBlock(el),
      category: el.category || null,

      electronicConfiguration: null,
      valenceElectrons: null,
      commonOxidationStates: null,
      commonIons: null,
      electronegativity: null,
      firstIonizationEnergy: null,

      stateAtRoomTemp: null,
      appearance: null,
      meltingPoint: null,
      boilingPoint: null,
      density: null,

      oxidizingBehavior: null,
      reducingBehavior: null,
      shortDescription: null,
      importantCompounds: null,
      inorganicRelevance: null,
      organicRelevance: null,

      commonUses: null,
      environmentalRelevance: null,

      safety: null,

      class11_12: null,
    };
    return [el.symbol, info];
  }),
) as Record<string, ElementInfo>;

export function getElementInfoBySymbol(sym: string): ElementInfo | null {
  return ELEMENT_INFO[sym] ?? null;
}

export function getElementInfoByNumber(n: number): ElementInfo | null {
  const el = ELEMENTS.find((e) => e.number === n);
  if (!el) return null;
  return ELEMENT_INFO[el.symbol];
}

export function getElementInfoByName(name: string): ElementInfo | null {
  const el = ELEMENTS.find((e) => e.name.toLowerCase() === name.toLowerCase());
  if (!el) return null;
  return ELEMENT_INFO[el.symbol];
}
