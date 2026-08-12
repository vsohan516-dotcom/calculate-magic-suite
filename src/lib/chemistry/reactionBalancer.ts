// Simple reaction balancer using matrix nullspace (basic implementation)
// This is an educational balancer and may not handle extremely complex equations.

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

export function balanceReaction(reactants: string[], products: string[]): { success: boolean; coefficients?: { reactants: number[]; products: number[] }; error?: string } {
  // Build element list and matrix by parsing simple formulas (reuse a very small parser)
  // For reliability, we'll implement a very small parser that counts element symbols and integers.
  const parse = (formula: string): Record<string, number> => {
    const counts: Record<string, number> = {};
    const token = /([A-Z][a-z]?)(\d*)/g;
    let m;
    while ((m = token.exec(formula)) !== null) {
      const sym = m[1];
      const cnt = m[2] ? Number(m[2]) : 1;
      counts[sym] = (counts[sym] || 0) + cnt;
    }
    return counts;
  };

  try {
    const all = [...reactants, ...products];
    const elems = new Set<string>();
    const parsed = all.map((f) => {
      const p = parse(f);
      Object.keys(p).forEach((k) => elems.add(k));
      return p;
    });
    const elemList = Array.from(elems);
    const rows = elemList.length;
    const cols = all.length;
    const A: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let j = 0; j < cols; j++) {
      const map = parsed[j];
      for (let i = 0; i < rows; i++) {
        const el = elemList[i];
        A[i][j] = map[el] || 0;
        if (j >= reactants.length) A[i][j] *= -1; // products negative
      }
    }
    // Solve integer nullspace by Gaussian elimination on rationals (simple approach)
    // We'll use a naive approach: try small integer coefficients up to a limit
    const maxCoeff = 10;
    const tryCoeffs = (limit: number) => {
      // brute-force small search (reactants+products dims)
      const n = cols;
      const iter = (idx: number, coeffs: number[]): number[] | null => {
        if (idx === n) {
          // check balance: for each row sum A[i][j]*coeff[j] == 0
          for (let i = 0; i < rows; i++) {
            let s = 0;
            for (let j = 0; j < cols; j++) s += A[i][j] * coeffs[j];
            if (s !== 0) return null;
          }
          return coeffs;
        }
        for (let v = 1; v <= limit; v++) {
          coeffs[idx] = v;
          const res = iter(idx + 1, coeffs);
          if (res) return res;
        }
        return null;
      };
      return iter(0, Array(cols).fill(1));
    };
    const sol = tryCoeffs(maxCoeff);
    if (!sol) return { success: false, error: "Unable to find small integer coefficients (try larger limit)" };
    // normalize coefficients by gcd
    let g = sol[0];
    for (let i = 1; i < sol.length; i++) g = gcd(g, sol[i]);
    const norm = sol.map((v) => v / g);
    return { success: true, coefficients: { reactants: norm.slice(0, reactants.length), products: norm.slice(reactants.length) } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
