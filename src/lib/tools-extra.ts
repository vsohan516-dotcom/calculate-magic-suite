// Pure offline logic for the additional tool suite. No side effects, no DOM.

/* ───────────── Number bases ───────────── */

export function parseInBase(value: string, base: number): number {
  const cleaned = value.trim().replace(/\s+/g, "");
  if (!cleaned) return NaN;
  const n = parseInt(cleaned, base);
  if (Number.isNaN(n)) return NaN;
  // Reject characters not valid in the base.
  const digits = "0123456789abcdefghijklmnopqrstuvwxyz".slice(0, base);
  const re = new RegExp(`^-?[${digits}]+$`, "i");
  return re.test(cleaned) ? n : NaN;
}

export function toBase(n: number, base: number): string {
  if (!Number.isFinite(n)) return "—";
  return Math.trunc(n).toString(base).toUpperCase();
}

/* ───────────── Roman numerals ───────────── */

const ROMAN: Array<[number, string]> = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
  [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
  [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

export function toRoman(n: number): string {
  if (!Number.isFinite(n) || n <= 0 || n > 3999) return "—";
  let rest = Math.trunc(n);
  let out = "";
  for (const [v, sym] of ROMAN) {
    while (rest >= v) {
      out += sym;
      rest -= v;
    }
  }
  return out;
}

export function fromRoman(input: string): number {
  const s = input.trim().toUpperCase();
  if (!/^[MDCLXVI]+$/.test(s)) return NaN;
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]];
    const next = map[s[i + 1]] ?? 0;
    total += cur < next ? -cur : cur;
  }
  return toRoman(total) === s ? total : total;
}

/* ───────────── ASCII / Unicode ───────────── */

export function textToCodes(text: string, radix = 10): string {
  return Array.from(text)
    .map((ch) => (ch.codePointAt(0) ?? 0).toString(radix).toUpperCase())
    .join(" ");
}

export function codesToText(codes: string, radix = 10): string {
  return codes
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((c) => {
      const n = parseInt(c, radix);
      return Number.isFinite(n) ? String.fromCodePoint(n) : "";
    })
    .join("");
}

/* ───────────── Data storage / file size ───────────── */

export const DATA_UNITS = [
  { id: "bit", label: "Bit", factor: 1 / 8 },
  { id: "B", label: "Byte", factor: 1 },
  { id: "KB", label: "Kilobyte (1024)", factor: 1024 },
  { id: "MB", label: "Megabyte", factor: 1024 ** 2 },
  { id: "GB", label: "Gigabyte", factor: 1024 ** 3 },
  { id: "TB", label: "Terabyte", factor: 1024 ** 4 },
  { id: "PB", label: "Petabyte", factor: 1024 ** 5 },
  { id: "kB", label: "Kilobyte (1000)", factor: 1000 },
  { id: "MBd", label: "Megabyte (1000)", factor: 1000 ** 2 },
  { id: "GBd", label: "Gigabyte (1000)", factor: 1000 ** 3 },
];

export function convertData(value: number, from: string, to: string): number {
  const f = DATA_UNITS.find((u) => u.id === from)?.factor;
  const t = DATA_UNITS.find((u) => u.id === to)?.factor;
  if (!f || !t) return NaN;
  return (value * f) / t;
}

export function humanBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = Math.abs(bytes);
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${(bytes < 0 ? -v : v).toFixed(v >= 100 || i === 0 ? 0 : 2)} ${units[i]}`;
}

/* ───────────── Passwords ───────────── */

export interface PasswordOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
};
const AMBIGUOUS = /[Il1O0o]/g;

function randomInt(max: number): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function generatePassword(opts: PasswordOptions): string {
  let pool = "";
  if (opts.lower) pool += SETS.lower;
  if (opts.upper) pool += SETS.upper;
  if (opts.digits) pool += SETS.digits;
  if (opts.symbols) pool += SETS.symbols;
  if (opts.excludeAmbiguous) pool = pool.replace(AMBIGUOUS, "");
  if (!pool) return "";
  let out = "";
  for (let i = 0; i < Math.max(4, Math.min(128, opts.length)); i++) {
    out += pool[randomInt(pool.length)];
  }
  return out;
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  entropyBits: number;
  hints: string[];
}

export function checkPasswordStrength(pw: string): PasswordStrength {
  const hints: string[] = [];
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  else hints.push("Add lowercase letters");
  if (/[A-Z]/.test(pw)) pool += 26;
  else hints.push("Add uppercase letters");
  if (/[0-9]/.test(pw)) pool += 10;
  else hints.push("Add digits");
  if (/[^A-Za-z0-9]/.test(pw)) pool += 24;
  else hints.push("Add symbols");
  if (pw.length < 12) hints.push("Use at least 12 characters");
  if (/(.)\1{2,}/.test(pw)) hints.push("Avoid repeated characters");
  if (/^(?:12345|qwerty|password|admin)/i.test(pw)) hints.push("Avoid common patterns");

  const entropyBits = pw.length && pool ? Math.round(pw.length * Math.log2(pool)) : 0;
  let score: PasswordStrength["score"] = 0;
  if (entropyBits >= 100) score = 4;
  else if (entropyBits >= 75) score = 3;
  else if (entropyBits >= 55) score = 2;
  else if (entropyBits >= 35) score = 1;
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Excellent"];
  return { score, label: labels[score], entropyBits, hints };
}

/* ───────────── Scientific constants ───────────── */

export interface Constant {
  name: string;
  symbol: string;
  value: string;
  unit: string;
}

export const CONSTANTS: Constant[] = [
  { name: "Speed of light in vacuum", symbol: "c", value: "299792458", unit: "m/s" },
  { name: "Planck constant", symbol: "h", value: "6.62607015e-34", unit: "J·s" },
  { name: "Reduced Planck constant", symbol: "ℏ", value: "1.054571817e-34", unit: "J·s" },
  { name: "Gravitational constant", symbol: "G", value: "6.67430e-11", unit: "m³/kg·s²" },
  { name: "Standard gravity", symbol: "g", value: "9.80665", unit: "m/s²" },
  { name: "Elementary charge", symbol: "e", value: "1.602176634e-19", unit: "C" },
  { name: "Electron mass", symbol: "mₑ", value: "9.1093837015e-31", unit: "kg" },
  { name: "Proton mass", symbol: "m_p", value: "1.67262192369e-27", unit: "kg" },
  { name: "Neutron mass", symbol: "m_n", value: "1.67492749804e-27", unit: "kg" },
  { name: "Avogadro constant", symbol: "N_A", value: "6.02214076e23", unit: "1/mol" },
  { name: "Boltzmann constant", symbol: "k_B", value: "1.380649e-23", unit: "J/K" },
  { name: "Gas constant", symbol: "R", value: "8.314462618", unit: "J/mol·K" },
  { name: "Faraday constant", symbol: "F", value: "96485.33212", unit: "C/mol" },
  { name: "Stefan–Boltzmann constant", symbol: "σ", value: "5.670374419e-8", unit: "W/m²·K⁴" },
  { name: "Vacuum permittivity", symbol: "ε₀", value: "8.8541878128e-12", unit: "F/m" },
  { name: "Vacuum permeability", symbol: "μ₀", value: "1.25663706212e-6", unit: "N/A²" },
  { name: "Rydberg constant", symbol: "R∞", value: "10973731.568160", unit: "1/m" },
  { name: "Atomic mass unit", symbol: "u", value: "1.66053906660e-27", unit: "kg" },
  { name: "Bohr radius", symbol: "a₀", value: "5.29177210903e-11", unit: "m" },
  { name: "Fine-structure constant", symbol: "α", value: "7.2973525693e-3", unit: "—" },
];

/* ───────────── Physics formulas ───────────── */

export interface PhysicsFormula {
  id: string;
  name: string;
  expression: string;
  unit: string;
  inputs: Array<{ id: string; label: string; unit: string; default: string }>;
  compute: (v: Record<string, number>) => number;
}

export const PHYSICS_FORMULAS: PhysicsFormula[] = [
  {
    id: "speed",
    name: "Speed",
    expression: "v = d / t",
    unit: "m/s",
    inputs: [
      { id: "d", label: "Distance", unit: "m", default: "100" },
      { id: "t", label: "Time", unit: "s", default: "9.58" },
    ],
    compute: (v) => v.d / v.t,
  },
  {
    id: "force",
    name: "Force (Newton's 2nd law)",
    expression: "F = m × a",
    unit: "N",
    inputs: [
      { id: "m", label: "Mass", unit: "kg", default: "10" },
      { id: "a", label: "Acceleration", unit: "m/s²", default: "9.81" },
    ],
    compute: (v) => v.m * v.a,
  },
  {
    id: "ke",
    name: "Kinetic energy",
    expression: "E = ½ m v²",
    unit: "J",
    inputs: [
      { id: "m", label: "Mass", unit: "kg", default: "2" },
      { id: "v", label: "Velocity", unit: "m/s", default: "5" },
    ],
    compute: (v) => 0.5 * v.m * v.v * v.v,
  },
  {
    id: "pe",
    name: "Potential energy",
    expression: "E = m g h",
    unit: "J",
    inputs: [
      { id: "m", label: "Mass", unit: "kg", default: "2" },
      { id: "h", label: "Height", unit: "m", default: "10" },
      { id: "g", label: "Gravity", unit: "m/s²", default: "9.81" },
    ],
    compute: (v) => v.m * v.g * v.h,
  },
  {
    id: "ohm",
    name: "Ohm's law (voltage)",
    expression: "V = I × R",
    unit: "V",
    inputs: [
      { id: "i", label: "Current", unit: "A", default: "2" },
      { id: "r", label: "Resistance", unit: "Ω", default: "10" },
    ],
    compute: (v) => v.i * v.r,
  },
  {
    id: "power",
    name: "Electrical power",
    expression: "P = V × I",
    unit: "W",
    inputs: [
      { id: "v", label: "Voltage", unit: "V", default: "230" },
      { id: "i", label: "Current", unit: "A", default: "5" },
    ],
    compute: (v) => v.v * v.i,
  },
  {
    id: "density",
    name: "Density",
    expression: "ρ = m / V",
    unit: "kg/m³",
    inputs: [
      { id: "m", label: "Mass", unit: "kg", default: "1000" },
      { id: "v", label: "Volume", unit: "m³", default: "1" },
    ],
    compute: (v) => v.m / v.v,
  },
  {
    id: "pressure",
    name: "Pressure",
    expression: "P = F / A",
    unit: "Pa",
    inputs: [
      { id: "f", label: "Force", unit: "N", default: "500" },
      { id: "a", label: "Area", unit: "m²", default: "0.25" },
    ],
    compute: (v) => v.f / v.a,
  },
  {
    id: "momentum",
    name: "Momentum",
    expression: "p = m × v",
    unit: "kg·m/s",
    inputs: [
      { id: "m", label: "Mass", unit: "kg", default: "3" },
      { id: "v", label: "Velocity", unit: "m/s", default: "4" },
    ],
    compute: (v) => v.m * v.v,
  },
  {
    id: "emc2",
    name: "Mass–energy equivalence",
    expression: "E = m c²",
    unit: "J",
    inputs: [{ id: "m", label: "Mass", unit: "kg", default: "0.001" }],
    compute: (v) => v.m * 299792458 ** 2,
  },
];

/* ───────────── Periodic table ───────────── */

export interface Element {
  z: number;
  symbol: string;
  name: string;
  mass: number;
  category: string;
}

export const ELEMENTS: Element[] = [
  { z: 1, symbol: "H", name: "Hydrogen", mass: 1.008, category: "Nonmetal" },
  { z: 2, symbol: "He", name: "Helium", mass: 4.0026, category: "Noble gas" },
  { z: 3, symbol: "Li", name: "Lithium", mass: 6.94, category: "Alkali metal" },
  { z: 4, symbol: "Be", name: "Beryllium", mass: 9.0122, category: "Alkaline earth" },
  { z: 5, symbol: "B", name: "Boron", mass: 10.81, category: "Metalloid" },
  { z: 6, symbol: "C", name: "Carbon", mass: 12.011, category: "Nonmetal" },
  { z: 7, symbol: "N", name: "Nitrogen", mass: 14.007, category: "Nonmetal" },
  { z: 8, symbol: "O", name: "Oxygen", mass: 15.999, category: "Nonmetal" },
  { z: 9, symbol: "F", name: "Fluorine", mass: 18.998, category: "Halogen" },
  { z: 10, symbol: "Ne", name: "Neon", mass: 20.18, category: "Noble gas" },
  { z: 11, symbol: "Na", name: "Sodium", mass: 22.99, category: "Alkali metal" },
  { z: 12, symbol: "Mg", name: "Magnesium", mass: 24.305, category: "Alkaline earth" },
  { z: 13, symbol: "Al", name: "Aluminium", mass: 26.982, category: "Post-transition" },
  { z: 14, symbol: "Si", name: "Silicon", mass: 28.085, category: "Metalloid" },
  { z: 15, symbol: "P", name: "Phosphorus", mass: 30.974, category: "Nonmetal" },
  { z: 16, symbol: "S", name: "Sulfur", mass: 32.06, category: "Nonmetal" },
  { z: 17, symbol: "Cl", name: "Chlorine", mass: 35.45, category: "Halogen" },
  { z: 18, symbol: "Ar", name: "Argon", mass: 39.948, category: "Noble gas" },
  { z: 19, symbol: "K", name: "Potassium", mass: 39.098, category: "Alkali metal" },
  { z: 20, symbol: "Ca", name: "Calcium", mass: 40.078, category: "Alkaline earth" },
  { z: 21, symbol: "Sc", name: "Scandium", mass: 44.956, category: "Transition metal" },
  { z: 22, symbol: "Ti", name: "Titanium", mass: 47.867, category: "Transition metal" },
  { z: 23, symbol: "V", name: "Vanadium", mass: 50.942, category: "Transition metal" },
  { z: 24, symbol: "Cr", name: "Chromium", mass: 51.996, category: "Transition metal" },
  { z: 25, symbol: "Mn", name: "Manganese", mass: 54.938, category: "Transition metal" },
  { z: 26, symbol: "Fe", name: "Iron", mass: 55.845, category: "Transition metal" },
  { z: 27, symbol: "Co", name: "Cobalt", mass: 58.933, category: "Transition metal" },
  { z: 28, symbol: "Ni", name: "Nickel", mass: 58.693, category: "Transition metal" },
  { z: 29, symbol: "Cu", name: "Copper", mass: 63.546, category: "Transition metal" },
  { z: 30, symbol: "Zn", name: "Zinc", mass: 65.38, category: "Transition metal" },
  { z: 31, symbol: "Ga", name: "Gallium", mass: 69.723, category: "Post-transition" },
  { z: 32, symbol: "Ge", name: "Germanium", mass: 72.63, category: "Metalloid" },
  { z: 33, symbol: "As", name: "Arsenic", mass: 74.922, category: "Metalloid" },
  { z: 34, symbol: "Se", name: "Selenium", mass: 78.971, category: "Nonmetal" },
  { z: 35, symbol: "Br", name: "Bromine", mass: 79.904, category: "Halogen" },
  { z: 36, symbol: "Kr", name: "Krypton", mass: 83.798, category: "Noble gas" },
  { z: 37, symbol: "Rb", name: "Rubidium", mass: 85.468, category: "Alkali metal" },
  { z: 38, symbol: "Sr", name: "Strontium", mass: 87.62, category: "Alkaline earth" },
  { z: 39, symbol: "Y", name: "Yttrium", mass: 88.906, category: "Transition metal" },
  { z: 40, symbol: "Zr", name: "Zirconium", mass: 91.224, category: "Transition metal" },
  { z: 41, symbol: "Nb", name: "Niobium", mass: 92.906, category: "Transition metal" },
  { z: 42, symbol: "Mo", name: "Molybdenum", mass: 95.95, category: "Transition metal" },
  { z: 43, symbol: "Tc", name: "Technetium", mass: 98, category: "Transition metal" },
  { z: 44, symbol: "Ru", name: "Ruthenium", mass: 101.07, category: "Transition metal" },
  { z: 45, symbol: "Rh", name: "Rhodium", mass: 102.91, category: "Transition metal" },
  { z: 46, symbol: "Pd", name: "Palladium", mass: 106.42, category: "Transition metal" },
  { z: 47, symbol: "Ag", name: "Silver", mass: 107.87, category: "Transition metal" },
  { z: 48, symbol: "Cd", name: "Cadmium", mass: 112.41, category: "Transition metal" },
  { z: 49, symbol: "In", name: "Indium", mass: 114.82, category: "Post-transition" },
  { z: 50, symbol: "Sn", name: "Tin", mass: 118.71, category: "Post-transition" },
  { z: 51, symbol: "Sb", name: "Antimony", mass: 121.76, category: "Metalloid" },
  { z: 52, symbol: "Te", name: "Tellurium", mass: 127.6, category: "Metalloid" },
  { z: 53, symbol: "I", name: "Iodine", mass: 126.9, category: "Halogen" },
  { z: 54, symbol: "Xe", name: "Xenon", mass: 131.29, category: "Noble gas" },
  { z: 55, symbol: "Cs", name: "Caesium", mass: 132.91, category: "Alkali metal" },
  { z: 56, symbol: "Ba", name: "Barium", mass: 137.33, category: "Alkaline earth" },
  { z: 57, symbol: "La", name: "Lanthanum", mass: 138.91, category: "Lanthanide" },
  { z: 58, symbol: "Ce", name: "Cerium", mass: 140.12, category: "Lanthanide" },
  { z: 59, symbol: "Pr", name: "Praseodymium", mass: 140.91, category: "Lanthanide" },
  { z: 60, symbol: "Nd", name: "Neodymium", mass: 144.24, category: "Lanthanide" },
  { z: 61, symbol: "Pm", name: "Promethium", mass: 145, category: "Lanthanide" },
  { z: 62, symbol: "Sm", name: "Samarium", mass: 150.36, category: "Lanthanide" },
  { z: 63, symbol: "Eu", name: "Europium", mass: 151.96, category: "Lanthanide" },
  { z: 64, symbol: "Gd", name: "Gadolinium", mass: 157.25, category: "Lanthanide" },
  { z: 65, symbol: "Tb", name: "Terbium", mass: 158.93, category: "Lanthanide" },
  { z: 66, symbol: "Dy", name: "Dysprosium", mass: 162.5, category: "Lanthanide" },
  { z: 67, symbol: "Ho", name: "Holmium", mass: 164.93, category: "Lanthanide" },
  { z: 68, symbol: "Er", name: "Erbium", mass: 167.26, category: "Lanthanide" },
  { z: 69, symbol: "Tm", name: "Thulium", mass: 168.93, category: "Lanthanide" },
  { z: 70, symbol: "Yb", name: "Ytterbium", mass: 173.05, category: "Lanthanide" },
  { z: 71, symbol: "Lu", name: "Lutetium", mass: 174.97, category: "Lanthanide" },
  { z: 72, symbol: "Hf", name: "Hafnium", mass: 178.49, category: "Transition metal" },
  { z: 73, symbol: "Ta", name: "Tantalum", mass: 180.95, category: "Transition metal" },
  { z: 74, symbol: "W", name: "Tungsten", mass: 183.84, category: "Transition metal" },
  { z: 75, symbol: "Re", name: "Rhenium", mass: 186.21, category: "Transition metal" },
  { z: 76, symbol: "Os", name: "Osmium", mass: 190.23, category: "Transition metal" },
  { z: 77, symbol: "Ir", name: "Iridium", mass: 192.22, category: "Transition metal" },
  { z: 78, symbol: "Pt", name: "Platinum", mass: 195.08, category: "Transition metal" },
  { z: 79, symbol: "Au", name: "Gold", mass: 196.97, category: "Transition metal" },
  { z: 80, symbol: "Hg", name: "Mercury", mass: 200.59, category: "Transition metal" },
  { z: 81, symbol: "Tl", name: "Thallium", mass: 204.38, category: "Post-transition" },
  { z: 82, symbol: "Pb", name: "Lead", mass: 207.2, category: "Post-transition" },
  { z: 83, symbol: "Bi", name: "Bismuth", mass: 208.98, category: "Post-transition" },
  { z: 84, symbol: "Po", name: "Polonium", mass: 209, category: "Metalloid" },
  { z: 85, symbol: "At", name: "Astatine", mass: 210, category: "Halogen" },
  { z: 86, symbol: "Rn", name: "Radon", mass: 222, category: "Noble gas" },
  { z: 87, symbol: "Fr", name: "Francium", mass: 223, category: "Alkali metal" },
  { z: 88, symbol: "Ra", name: "Radium", mass: 226, category: "Alkaline earth" },
  { z: 89, symbol: "Ac", name: "Actinium", mass: 227, category: "Actinide" },
  { z: 90, symbol: "Th", name: "Thorium", mass: 232.04, category: "Actinide" },
  { z: 91, symbol: "Pa", name: "Protactinium", mass: 231.04, category: "Actinide" },
  { z: 92, symbol: "U", name: "Uranium", mass: 238.03, category: "Actinide" },
  { z: 93, symbol: "Np", name: "Neptunium", mass: 237, category: "Actinide" },
  { z: 94, symbol: "Pu", name: "Plutonium", mass: 244, category: "Actinide" },
  { z: 95, symbol: "Am", name: "Americium", mass: 243, category: "Actinide" },
  { z: 96, symbol: "Cm", name: "Curium", mass: 247, category: "Actinide" },
  { z: 97, symbol: "Bk", name: "Berkelium", mass: 247, category: "Actinide" },
  { z: 98, symbol: "Cf", name: "Californium", mass: 251, category: "Actinide" },
  { z: 99, symbol: "Es", name: "Einsteinium", mass: 252, category: "Actinide" },
  { z: 100, symbol: "Fm", name: "Fermium", mass: 257, category: "Actinide" },
  { z: 101, symbol: "Md", name: "Mendelevium", mass: 258, category: "Actinide" },
  { z: 102, symbol: "No", name: "Nobelium", mass: 259, category: "Actinide" },
  { z: 103, symbol: "Lr", name: "Lawrencium", mass: 266, category: "Actinide" },
  { z: 104, symbol: "Rf", name: "Rutherfordium", mass: 267, category: "Transition metal" },
  { z: 105, symbol: "Db", name: "Dubnium", mass: 268, category: "Transition metal" },
  { z: 106, symbol: "Sg", name: "Seaborgium", mass: 269, category: "Transition metal" },
  { z: 107, symbol: "Bh", name: "Bohrium", mass: 270, category: "Transition metal" },
  { z: 108, symbol: "Hs", name: "Hassium", mass: 269, category: "Transition metal" },
  { z: 109, symbol: "Mt", name: "Meitnerium", mass: 278, category: "Unknown" },
  { z: 110, symbol: "Ds", name: "Darmstadtium", mass: 281, category: "Unknown" },
  { z: 111, symbol: "Rg", name: "Roentgenium", mass: 282, category: "Unknown" },
  { z: 112, symbol: "Cn", name: "Copernicium", mass: 285, category: "Unknown" },
  { z: 113, symbol: "Nh", name: "Nihonium", mass: 286, category: "Unknown" },
  { z: 114, symbol: "Fl", name: "Flerovium", mass: 289, category: "Unknown" },
  { z: 115, symbol: "Mc", name: "Moscovium", mass: 290, category: "Unknown" },
  { z: 116, symbol: "Lv", name: "Livermorium", mass: 293, category: "Unknown" },
  { z: 117, symbol: "Ts", name: "Tennessine", mass: 294, category: "Unknown" },
  { z: 118, symbol: "Og", name: "Oganesson", mass: 294, category: "Unknown" },
];

const BY_SYMBOL = new Map(ELEMENTS.map((e) => [e.symbol, e]));

/** Parse a chemical formula like "Ca(OH)2" and return its molar mass in g/mol. */
export function molarMass(formula: string): { mass: number; parts: Array<{ symbol: string; count: number; mass: number }> } {
  const tokens = formula.replace(/\s+/g, "");
  let i = 0;

  function parseGroup(): Record<string, number> {
    const counts: Record<string, number> = {};
    while (i < tokens.length) {
      const ch = tokens[i];
      if (ch === "(") {
        i++;
        const inner = parseGroup();
        if (tokens[i] === ")") i++;
        else throw new Error("Unbalanced parenthesis");
        const mult = readNumber();
        for (const [k, v] of Object.entries(inner)) counts[k] = (counts[k] ?? 0) + v * mult;
      } else if (ch === ")") {
        break;
      } else if (/[A-Z]/.test(ch)) {
        let sym = ch;
        i++;
        while (i < tokens.length && /[a-z]/.test(tokens[i])) sym += tokens[i++];
        if (!BY_SYMBOL.has(sym)) throw new Error(`Unknown element: ${sym}`);
        const mult = readNumber();
        counts[sym] = (counts[sym] ?? 0) + mult;
      } else {
        throw new Error(`Unexpected character: ${ch}`);
      }
    }
    return counts;
  }

  function readNumber(): number {
    let digits = "";
    while (i < tokens.length && /[0-9]/.test(tokens[i])) digits += tokens[i++];
    return digits ? parseInt(digits, 10) : 1;
  }

  const counts = parseGroup();
  if (i < tokens.length) throw new Error("Unbalanced parenthesis");
  const parts = Object.entries(counts).map(([symbol, count]) => {
    const el = BY_SYMBOL.get(symbol)!;
    return { symbol, count, mass: el.mass * count };
  });
  return { mass: parts.reduce((s, p) => s + p.mass, 0), parts };
}

/* ───────────── Health ───────────── */

export function bmrMifflin(
  sex: "male" | "female",
  weightKg: number,
  heightCm: number,
  ageYears: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === "male" ? base + 5 : base - 161;
}

export const ACTIVITY_LEVELS = [
  { id: "1.2", label: "Sedentary (little exercise)" },
  { id: "1.375", label: "Light (1–3 days/week)" },
  { id: "1.55", label: "Moderate (3–5 days/week)" },
  { id: "1.725", label: "Active (6–7 days/week)" },
  { id: "1.9", label: "Very active (physical job)" },
];

/** US Navy method body-fat percentage. */
export function bodyFatNavy(
  sex: "male" | "female",
  heightCm: number,
  neckCm: number,
  waistCm: number,
  hipCm?: number,
): number {
  if (sex === "male") {
    return 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
  }
  const hip = hipCm ?? 0;
  return (
    495 / (1.29579 - 0.35004 * Math.log10(waistCm + hip - neckCm) + 0.221 * Math.log10(heightCm)) - 450
  );
}

/** Daily water intake in litres. */
export function waterIntakeLitres(weightKg: number, exerciseMinutes: number): number {
  return weightKg * 0.033 + (exerciseMinutes / 30) * 0.35;
}

/* ───────────── Text utilities ───────────── */

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingMinutes: number;
}

export function textStats(text: string): TextStats {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    words,
    sentences: (text.match(/[^.!?॥]+[.!?॥]+/g) ?? []).length,
    paragraphs: text.trim() ? text.trim().split(/\n{2,}/).length : 0,
    lines: text ? text.split(/\n/).length : 0,
    readingMinutes: Math.max(words ? 1 : 0, Math.round(words / 200)),
  };
}

export type CaseMode = "upper" | "lower" | "title" | "sentence" | "camel" | "snake" | "kebab";

export function convertCase(text: string, mode: CaseMode): string {
  switch (mode) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text.replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
    case "sentence":
      return text
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, (m) => m.toUpperCase());
    case "camel": {
      const parts = text.trim().toLowerCase().split(/[\s_-]+/).filter(Boolean);
      return parts.map((p, i) => (i === 0 ? p : p[0].toUpperCase() + p.slice(1))).join("");
    }
    case "snake":
      return text.trim().toLowerCase().split(/[\s_-]+/).filter(Boolean).join("_");
    case "kebab":
      return text.trim().toLowerCase().split(/[\s_-]+/).filter(Boolean).join("-");
    default:
      return text;
  }
}

/* ───────────── Finance ───────────── */

export function sipFutureValue(monthly: number, annualRatePct: number, years: number): number {
  const i = annualRatePct / 100 / 12;
  const n = years * 12;
  if (i === 0) return monthly * n;
  return monthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
}

export function compoundInterest(
  principal: number,
  annualRatePct: number,
  years: number,
  perYear: number,
): { total: number; interest: number } {
  const r = annualRatePct / 100;
  const total = principal * Math.pow(1 + r / perYear, perYear * years);
  return { total, interest: total - principal };
}

export function simpleInterest(principal: number, annualRatePct: number, years: number) {
  const interest = (principal * annualRatePct * years) / 100;
  return { interest, total: principal + interest };
}
