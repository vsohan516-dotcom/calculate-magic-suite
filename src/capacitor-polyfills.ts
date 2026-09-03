// Small, safe runtime shims used only by the Capacitor (native Android/iOS)
// build. The web build runs on modern browsers that already support these
// features, so this file is imported exclusively from `capacitor-main`.
//
// Tailwind v4 / modern bundling outputs some ES2020-ES2022 syntax and APIs.
// Newer Android System WebView versions have them, but older devices don't —
// which silently produces an empty / invisible app. These shims let the app
// at least start rendering on such devices.

/* eslint-disable @typescript-eslint/no-explicit-any */

// --- ES2022 Array.prototype.at -------------------------------------------
if (!(Array.prototype as any).at) {
  (Array.prototype as any).at = function (index: number) {
    index = Math.trunc(index) || 0;
    if (index < 0) index += this.length;
    return index >= 0 && index < this.length ? this[index] : undefined;
  };
}

// --- ES2022 String.prototype.replaceAll ----------------------------------
if (!(String.prototype as any).replaceAll) {
  (String.prototype as any).replaceAll = function (search: string | RegExp, replacement: string) {
    if (search instanceof RegExp) {
      if (!search.global) {
        throw new TypeError("replaceAll must be called with a global RegExp");
      }
      return this.replace(search, replacement);
    }
    return this.split(search).join(replacement);
  };
}

// --- ES2022 Object.hasOwn ------------------------------------------------
if (!(Object as any).hasOwn) {
  (Object as any).hasOwn = function (obj: object, prop: PropertyKey) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
}

// --- ES2019 Array.prototype.flat / flatMap -------------------------------
if (!(Array.prototype as any).flat) {
  (Array.prototype as any).flat = function (depth: number = 1) {
    const out: unknown[] = [];
    const walk = (arr: unknown[], d: number) => {
      for (const item of arr) {
        if (Array.isArray(item) && d > 0) walk(item, d - 1);
        else out.push(item);
      }
    };
    walk(this, depth);
    return out;
  };
}
if (!(Array.prototype as any).flatMap) {
  (Array.prototype as any).flatMap = function (
    fn: (v: unknown, i: number, a: unknown[]) => unknown,
  ) {
    return this.map((v: unknown, i: number, a: unknown[]) => fn(v, i, a)).flat(1);
  };
}

// --- ES2019 Object.fromEntries -------------------------------------------
if (!(Object as any).fromEntries) {
  (Object as any).fromEntries = function (entries: Iterable<readonly [PropertyKey, unknown]>) {
    const out: Record<string, unknown> = {};
    for (const pair of entries) {
      const key = pair[0];
      const value = pair[1];
      out[String(key)] = value;
    }
    return out;
  };
}

export {};
