import { ELEMENTS } from "./periodicTable";

export type SearchResult = {
  type: "element" | "compound" | "topic";
  id: string;
  title: string;
  subtitle?: string;
};

export function searchElements(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: SearchResult[] = [];
  for (const e of ELEMENTS) {
    if (e.symbol.toLowerCase() === q || e.name.toLowerCase() === q || String(e.number) === q) {
      results.unshift({ type: "element", id: e.symbol, title: `${e.name} (${e.symbol})`, subtitle: `Z = ${e.number}` });
      continue;
    }
    if (e.name.toLowerCase().includes(q) || e.symbol.toLowerCase().includes(q)) {
      results.push({ type: "element", id: e.symbol, title: `${e.name} (${e.symbol})`, subtitle: `Z = ${e.number}` });
    }
  }
  return results;
}
