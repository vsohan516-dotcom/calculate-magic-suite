import { ELEMENTS } from "./periodicTable";

export function isElementSymbol(sym: string) {
  if (!sym) return false;
  return !!ELEMENTS.find((e) => e.symbol.toLowerCase() === sym.toLowerCase());
}

export function isElementName(name: string) {
  if (!name) return false;
  return !!ELEMENTS.find((e) => e.name.toLowerCase() === name.toLowerCase());
}

export function isAtomicNumber(n: number | string) {
  const nn = Number(n);
  return Number.isInteger(nn) && nn >= 1 && nn <= ELEMENTS.length;
}

export function validateFormula(formula: string): { valid: boolean; error?: string } {
  if (!formula || typeof formula !== "string") return { valid: false, error: "Empty formula" };
  // basic checks: balanced parentheses, allowed characters
  const stack: string[] = [];
  for (let i = 0; i < formula.length; i++) {
    const ch = formula[i];
    if (ch === "(") stack.push(ch);
    else if (ch === ")") {
      if (!stack.length) return { valid: false, error: "Unbalanced parentheses" };
      stack.pop();
    }
    // allow letters, digits, parentheses, dot, middle dot
    if (!/^[A-Za-z0-9()·. ]$/.test(ch)) return { valid: false, error: `Invalid character: ${ch}` };
  }
  if (stack.length) return { valid: false, error: "Unbalanced parentheses" };
  return { valid: true };
}
