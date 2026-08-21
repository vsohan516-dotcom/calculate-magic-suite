// Unit conversion tables. Values are factors relative to a base unit.

export type ConverterCategory = "length" | "weight" | "temperature" | "area" | "volume";

export interface UnitDef {
  id: string;
  label: string;
  /** factor: value in base = input * factor (ignored for temperature) */
  factor?: number;
}

export const UNITS: Record<ConverterCategory, { base: string; units: UnitDef[] }> = {
  length: {
    base: "m",
    units: [
      { id: "mm", label: "Millimeter", factor: 0.001 },
      { id: "cm", label: "Centimeter", factor: 0.01 },
      { id: "m", label: "Meter", factor: 1 },
      { id: "km", label: "Kilometer", factor: 1000 },
      { id: "in", label: "Inch", factor: 0.0254 },
      { id: "ft", label: "Foot", factor: 0.3048 },
      { id: "yd", label: "Yard", factor: 0.9144 },
      { id: "mi", label: "Mile", factor: 1609.344 },
    ],
  },
  weight: {
    base: "g",
    units: [
      { id: "mg", label: "Milligram", factor: 0.001 },
      { id: "g", label: "Gram", factor: 1 },
      { id: "kg", label: "Kilogram", factor: 1000 },
      { id: "t", label: "Tonne", factor: 1_000_000 },
      { id: "oz", label: "Ounce", factor: 28.3495 },
      { id: "lb", label: "Pound", factor: 453.592 },
    ],
  },
  temperature: {
    base: "C",
    units: [
      { id: "C", label: "Celsius" },
      { id: "F", label: "Fahrenheit" },
      { id: "K", label: "Kelvin" },
    ],
  },
  area: {
    base: "m2",
    units: [
      { id: "mm2", label: "Square Millimeter", factor: 0.000001 },
      { id: "cm2", label: "Square Centimeter", factor: 0.0001 },
      { id: "m2", label: "Square Meter", factor: 1 },
      { id: "km2", label: "Square Kilometer", factor: 1_000_000 },
      { id: "ha", label: "Hectare", factor: 10_000 },
      { id: "ac", label: "Acre", factor: 4046.86 },
      { id: "ft2", label: "Square Foot", factor: 0.092903 },
    ],
  },
  volume: {
    base: "l",
    units: [
      { id: "ml", label: "Milliliter", factor: 0.001 },
      { id: "l", label: "Liter", factor: 1 },
      { id: "m3", label: "Cubic Meter", factor: 1000 },
      { id: "gal", label: "Gallon (US)", factor: 3.78541 },
      { id: "qt", label: "Quart (US)", factor: 0.946353 },
      { id: "pt", label: "Pint (US)", factor: 0.473176 },
      { id: "cup", label: "Cup (US)", factor: 0.24 },
      { id: "floz", label: "Fluid Ounce (US)", factor: 0.0295735 },
    ],
  },
};

export function convert(
  value: number,
  from: string,
  to: string,
  category: ConverterCategory,
): number {
  if (category === "temperature") return convertTemperature(value, from, to);
  const set = UNITS[category];
  const fromUnit = set.units.find((u) => u.id === from);
  const toUnit = set.units.find((u) => u.id === to);
  if (!fromUnit?.factor || !toUnit?.factor) return NaN;
  const base = value * fromUnit.factor;
  return base / toUnit.factor;
}

function convertTemperature(value: number, from: string, to: string): number {
  // Normalize to Celsius first.
  let c: number;
  switch (from) {
    case "C":
      c = value;
      break;
    case "F":
      c = (value - 32) * (5 / 9);
      break;
    case "K":
      c = value - 273.15;
      break;
    default:
      return NaN;
  }
  switch (to) {
    case "C":
      return c;
    case "F":
      return c * (9 / 5) + 32;
    case "K":
      return c + 273.15;
    default:
      return NaN;
  }
}
