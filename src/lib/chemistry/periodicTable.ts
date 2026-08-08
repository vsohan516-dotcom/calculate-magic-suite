// Periodic table data plus a molecular-formula parser used by the chemistry tools.
// Rows are "atomicNumber|symbol|name|standardAtomicWeight|category|group|period".

export type ElementCategory =
  | "alkali"
  | "alkaline"
  | "transition"
  | "post-transition"
  | "metalloid"
  | "nonmetal"
  | "halogen"
  | "noble"
  | "lanthanide"
  | "actinide";

export interface ChemicalElement {
  number: number;
  symbol: string;
  name: string;
  mass: number;
  category: ElementCategory;
  group: number;
  period: number;
}

const RAW = `1|H|Hydrogen|1.008|nonmetal|1|1
2|He|Helium|4.0026|noble|18|1
3|Li|Lithium|6.94|alkali|1|2
4|Be|Beryllium|9.0122|alkaline|2|2
5|B|Boron|10.81|metalloid|13|2
6|C|Carbon|12.011|nonmetal|14|2
7|N|Nitrogen|14.007|nonmetal|15|2
8|O|Oxygen|15.999|nonmetal|16|2
9|F|Fluorine|18.998|halogen|17|2
10|Ne|Neon|20.18|noble|18|2
11|Na|Sodium|22.99|alkali|1|3
12|Mg|Magnesium|24.305|alkaline|2|3
13|Al|Aluminium|26.982|post-transition|13|3
14|Si|Silicon|28.085|metalloid|14|3
15|P|Phosphorus|30.974|nonmetal|15|3
16|S|Sulfur|32.06|nonmetal|16|3
17|Cl|Chlorine|35.45|halogen|17|3
18|Ar|Argon|39.948|noble|18|3
19|K|Potassium|39.098|alkali|1|4
20|Ca|Calcium|40.078|alkaline|2|4
21|Sc|Scandium|44.956|transition|3|4
22|Ti|Titanium|47.867|transition|4|4
23|V|Vanadium|50.942|transition|5|4
24|Cr|Chromium|51.996|transition|6|4
25|Mn|Manganese|54.938|transition|7|4
26|Fe|Iron|55.845|transition|8|4
27|Co|Cobalt|58.933|transition|9|4
28|Ni|Nickel|58.693|transition|10|4
29|Cu|Copper|63.546|transition|11|4
30|Zn|Zinc|65.38|transition|12|4
31|Ga|Gallium|69.723|post-transition|13|4
32|Ge|Germanium|72.63|metalloid|14|4
33|As|Arsenic|74.922|metalloid|15|4
34|Se|Selenium|78.971|nonmetal|16|4
35|Br|Bromine|79.904|halogen|17|4
36|Kr|Krypton|83.798|noble|18|4
37|Rb|Rubidium|85.468|alkali|1|5
38|Sr|Strontium|87.62|alkaline|2|5
39|Y|Yttrium|88.906|transition|3|5
40|Zr|Zirconium|91.224|transition|4|5
41|Nb|Niobium|92.906|transition|5|5
42|Mo|Molybdenum|95.95|transition|6|5
43|Tc|Technetium|98|transition|7|5
44|Ru|Ruthenium|101.07|transition|8|5
45|Rh|Rhodium|102.91|transition|9|5
46|Pd|Palladium|106.42|transition|10|5
47|Ag|Silver|107.87|transition|11|5
48|Cd|Cadmium|112.41|transition|12|5
49|In|Indium|114.82|post-transition|13|5
50|Sn|Tin|118.71|post-transition|14|5
51|Sb|Antimony|121.76|metalloid|15|5
52|Te|Tellurium|127.6|metalloid|16|5
53|I|Iodine|126.9|halogen|17|5
54|Xe|Xenon|131.29|noble|18|5
55|Cs|Caesium|132.91|alkali|1|6
56|Ba|Barium|137.33|alkaline|2|6
57|La|Lanthanum|138.91|lanthanide|3|6
58|Ce|Cerium|140.12|lanthanide|3|6
59|Pr|Praseodymium|140.91|lanthanide|3|6
60|Nd|Neodymium|144.24|lanthanide|3|6
61|Pm|Promethium|145|lanthanide|3|6
62|Sm|Samarium|150.36|lanthanide|3|6
63|Eu|Europium|151.96|lanthanide|3|6
64|Gd|Gadolinium|157.25|lanthanide|3|6
65|Tb|Terbium|158.93|lanthanide|3|6
66|Dy|Dysprosium|162.5|lanthanide|3|6
67|Ho|Holmium|164.93|lanthanide|3|6
68|Er|Erbium|167.26|lanthanide|3|6
69|Tm|Thulium|168.93|lanthanide|3|6
70|Yb|Ytterbium|173.05|lanthanide|3|6
71|Lu|Lutetium|174.97|lanthanide|3|6
72|Hf|Hafnium|178.49|transition|4|6
73|Ta|Tantalum|180.95|transition|5|6
74|W|Tungsten|183.84|transition|6|6
75|Re|Rhenium|186.21|transition|7|6
76|Os|Osmium|190.23|transition|8|6
77|Ir|Iridium|192.22|transition|9|6
78|Pt|Platinum|195.08|transition|10|6
79|Au|Gold|196.97|transition|11|6
80|Hg|Mercury|200.59|transition|12|6
81|Tl|Thallium|204.38|post-transition|13|6
82|Pb|Lead|207.2|post-transition|14|6
83|Bi|Bismuth|208.98|post-transition|15|6
84|Po|Polonium|209|post-transition|16|6
85|At|Astatine|210|halogen|17|6
86|Rn|Radon|222|noble|18|6
87|Fr|Francium|223|alkali|1|7
88|Ra|Radium|226|alkaline|2|7
89|Ac|Actinium|227|actinide|3|7
90|Th|Thorium|232.04|actinide|3|7
91|Pa|Protactinium|231.04|actinide|3|7
92|U|Uranium|238.03|actinide|3|7
93|Np|Neptunium|237|actinide|3|7
94|Pu|Plutonium|244|actinide|3|7
95|Am|Americium|243|actinide|3|7
96|Cm|Curium|247|actinide|3|7
97|Bk|Berkelium|247|actinide|3|7
98|Cf|Californium|251|actinide|3|7
99|Es|Einsteinium|252|actinide|3|7
100|Fm|Fermium|257|actinide|3|7
101|Md|Mendelevium|258|actinide|3|7
102|No|Nobelium|259|actinide|3|7
103|Lr|Lawrencium|266|actinide|3|7
104|Rf|Rutherfordium|267|transition|4|7
105|Db|Dubnium|268|transition|5|7
106|Sg|Seaborgium|269|transition|6|7
107|Bh|Bohrium|270|transition|7|7
108|Hs|Hassium|269|transition|8|7
109|Mt|Meitnerium|278|transition|9|7
110|Ds|Darmstadtium|281|transition|10|7
111|Rg|Roentgenium|282|transition|11|7
112|Cn|Copernicium|285|transition|12|7
113|Nh|Nihonium|286|post-transition|13|7
114|Fl|Flerovium|289|post-transition|14|7
115|Mc|Moscovium|290|post-transition|15|7
116|Lv|Livermorium|293|post-transition|16|7
117|Ts|Tennessine|294|halogen|17|7
118|Og|Oganesson|294|noble|18|7`;

export const ELEMENTS: ChemicalElement[] = RAW.trim()
  .split("\n")
  .map((line) => {
    const [number, symbol, name, mass, category, group, period] = line.split("|");
    return {
      number: Number(number),
      symbol,
      name,
      mass: Number(mass),
      category: category as ElementCategory,
      group: Number(group),
      period: Number(period),
    };
  });

export const BY_SYMBOL: Record<string, ChemicalElement> = Object.fromEntries(
  ELEMENTS.map((e) => [e.symbol, e])
);

export const CATEGORY_LABELS: Record<ElementCategory, string> = {
  alkali: "Alkali metal",
  alkaline: "Alkaline earth metal",
  transition: "Transition metal",
  "post-transition": "Post-transition metal",
  metalloid: "Metalloid",
  nonmetal: "Nonmetal",
  halogen: "Halogen",
  noble: "Noble gas",
  lanthanide: "Lanthanide",
  actinide: "Actinide",
};

/** Grid position used to lay the table out; lanthanides/actinides sit in rows 8 and 9. */
export function gridPosition(el: ChemicalElement): { row: number; column: number } {
  if (el.number >= 57 && el.number <= 71) return { row: 8, column: 3 + (el.number - 57) };
  if (el.number >= 89 && el.number <= 103) return { row: 9, column: 3 + (el.number - 89) };
  return { row: el.period, column: el.group };
}

export interface MolarMassResult {
  mass: number;
  composition: Array<{ symbol: string; count: number; mass: number; percent: number }>;
}

/**
 * Compute the molar mass of a formula such as Ca(OH)2, H2SO4 or
 * CuSO4·5H2O. Throws on unknown symbols or unbalanced brackets.
 */
export function molarMass(formula: string): MolarMassResult {
  const input = formula.replace(/\s+/g, "").replace(/[·.]/g, "+");
  if (!input) throw new Error("Enter a formula");

  const counts = new Map<string, number>();
  const addCounts = (source: Map<string, number>, multiplier: number) => {
    for (const [symbol, n] of source) counts.set(symbol, (counts.get(symbol) ?? 0) + n * multiplier);
  };

  for (const part of input.split("+")) {
    if (!part) continue;
    const leading = /^\d+/.exec(part);
    const multiplier = leading ? Number(leading[0]) : 1;
    addCounts(parseGroup(leading ? part.slice(leading[0].length) : part), multiplier);
  }

  let total = 0;
  for (const [symbol, n] of counts) total += BY_SYMBOL[symbol].mass * n;
  if (total <= 0) throw new Error("Enter a formula");

  const composition = [...counts.entries()]
    .map(([symbol, count]) => {
      const mass = BY_SYMBOL[symbol].mass * count;
      return { symbol, count, mass, percent: (mass / total) * 100 };
    })
    .sort((a, b) => b.mass - a.mass);

  return { mass: total, composition };
}

function parseGroup(source: string): Map<string, number> {
  const counts = new Map<string, number>();
  let i = 0;

  const readNumber = () => {
    const match = /^\d+/.exec(source.slice(i));
    if (!match) return 1;
    i += match[0].length;
    return Number(match[0]);
  };

  while (i < source.length) {
    const ch = source[i];
    if (ch === "(" || ch === "[") {
      const close = ch === "(" ? ")" : "]";
      let depth = 1;
      let j = i + 1;
      while (j < source.length && depth > 0) {
        if (source[j] === ch) depth++;
        else if (source[j] === close) depth--;
        j++;
      }
      if (depth !== 0) throw new Error("Unbalanced brackets");
      const inner = parseGroup(source.slice(i + 1, j - 1));
      i = j;
      const multiplier = readNumber();
      for (const [symbol, n] of inner) counts.set(symbol, (counts.get(symbol) ?? 0) + n * multiplier);
      continue;
    }

    const symbolMatch = /^[A-Z][a-z]?/.exec(source.slice(i));
    if (!symbolMatch) throw new Error(`Unexpected character "${ch}"`);
    let symbol = symbolMatch[0];
    if (!BY_SYMBOL[symbol]) {
      // "Co" could be C followed by O — retry with the single-letter symbol.
      symbol = symbol[0];
      if (!BY_SYMBOL[symbol]) throw new Error(`Unknown element "${symbolMatch[0]}"`);
    }
    i += symbol.length;
    const count = readNumber();
    counts.set(symbol, (counts.get(symbol) ?? 0) + count);
  }

  return counts;
}
