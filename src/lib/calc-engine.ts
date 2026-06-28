// Safe expression evaluator with scientific functions, memory, percentage support.
// Allows: digits, + - * / % ^ ( ) . , constants (π, e), functions (sin, cos, tan, asin, acos, atan, sqrt, cbrt, log, ln, exp, abs, floor, ceil, round, fact).
// Trig accepts current angle mode ("deg" | "rad").

export type AngleMode = "deg" | "rad";

const FUNCS = [
  "sin", "cos", "tan", "asin", "acos", "atan",
  "sinh", "cosh", "tanh",
  "sqrt", "cbrt", "log", "ln", "exp",
  "abs", "floor", "ceil", "round", "fact",
];

function factorial(n: number): number {
  if (n < 0 || !Number.isFinite(n)) return NaN;
  if (n > 170) return Infinity;
  const k = Math.floor(n);
  let acc = 1;
  for (let i = 2; i <= k; i++) acc *= i;
  return acc;
}

// Normalize human-friendly characters to JS-evaluable form.
function normalize(input: string): string {
  return input
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/\s+/g, "")
    .replace(/,/g, "");
}

// Replace x! (factorial) with fact(x). Handles numbers and parenthesised groups.
function replaceFactorial(expr: string): string {
  // Repeatedly resolve from inside-out.
  let prev = "";
  let cur = expr;
  while (prev !== cur) {
    prev = cur;
    cur = cur.replace(/(\d+(?:\.\d+)?|\([^()]*\))!/g, "fact($1)");
  }
  return cur;
}

// Convert "a^b" to "pow(a,b)" — basic single-token base/exponent; complex cases use Math.pow via **.
function replacePower(expr: string): string {
  return expr.replace(/\^/g, "**");
}

// Convert standalone trailing "%" to "/100" so 50% => 0.5, and "200+10%" => 200+(200*10/100).
function replacePercent(expr: string): string {
  // Pattern: <number>+/-<number>% => apply percent of left operand.
  expr = expr.replace(
    /(\d+(?:\.\d+)?)\s*([+\-])\s*(\d+(?:\.\d+)?)%/g,
    (_m, a, op, b) => `(${a}${op}(${a}*${b}/100))`,
  );
  // Remaining trailing % => /100
  expr = expr.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
  return expr;
}

function validate(expr: string): void {
  // Allowed characters and identifiers only.
  const stripped = expr
    .replace(/\b(?:Math\.[A-Za-z]+|pow|fact|PI|E)\b/g, "")
    .replace(/[0-9+\-*/().,\s*]/g, "");
  if (stripped.length > 0) {
    throw new Error("Invalid characters in expression");
  }
}

export function evaluate(rawInput: string, angle: AngleMode = "deg"): number {
  if (!rawInput || !rawInput.trim()) return 0;
  let expr = normalize(rawInput);

  // Constants
  expr = expr.replace(/π/g, "PI");
  expr = expr.replace(/\bpi\b/gi, "PI");
  // Lowercase "e" only as standalone constant (not within identifiers/scientific notation).
  expr = expr.replace(/(?<![A-Za-z0-9.])e(?![A-Za-z0-9])/g, "E");

  // Functions — map to Math.* equivalents, with trig respecting angle mode.
  for (const fn of FUNCS) {
    const re = new RegExp(`\\b${fn}\\b`, "g");
    let target: string;
    switch (fn) {
      case "ln":
        target = "Math.log";
        break;
      case "log":
        target = "Math.log10";
        break;
      case "fact":
        target = "fact";
        break;
      case "sin":
      case "cos":
      case "tan":
        target = angle === "deg" ? `((x)=>Math.${fn}(x*Math.PI/180))` : `Math.${fn}`;
        break;
      case "asin":
      case "acos":
      case "atan":
        target = angle === "deg" ? `((x)=>Math.${fn}(x)*180/Math.PI)` : `Math.${fn}`;
        break;
      default:
        target = `Math.${fn}`;
    }
    expr = expr.replace(re, target);
  }

  expr = replaceFactorial(expr);
  expr = replacePercent(expr);
  expr = replacePower(expr);

  validate(expr);

  // Build a sandbox where only Math, PI, E, pow, fact exist.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  const fn = new Function("Math", "PI", "E", "pow", "fact", `"use strict"; return (${expr});`);
  const value = fn(Math, Math.PI, Math.E, Math.pow, factorial);
  if (typeof value !== "number" || Number.isNaN(value)) throw new Error("Math error");
  return value;
}

export function formatResult(n: number, precision = 10): string {
  if (!Number.isFinite(n)) return n > 0 ? "∞" : "-∞";
  if (Number.isInteger(n)) return n.toString();
  // Trim trailing zeros from fixed precision.
  const s = n.toPrecision(precision);
  // toPrecision can use exponent — prefer plain when reasonable.
  if (Math.abs(n) >= 1e-6 && Math.abs(n) < 1e15) {
    return parseFloat(s).toString();
  }
  return s;
}
