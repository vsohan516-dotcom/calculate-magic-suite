// Local-only obfuscation + passcode gate for the Secure Vault.
// Notes never leave the device; this protects against casual snooping only.

const PASS_KEY = "lumen.vault.pass.v1";

function hash(text: string): string {
  // Simple non-cryptographic digest — enough to avoid storing the raw passcode.
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    h1 = (h1 ^ text.charCodeAt(i)) * 16777619;
    h2 = (h2 + text.charCodeAt(i) * (i + 7)) | 0;
  }
  return `${(h1 >>> 0).toString(36)}.${(h2 >>> 0).toString(36)}.${text.length}`;
}

function readPass(): string | null {
  // localStorage throws when storage is blocked in the WebView — never let a
  // vault lookup take the whole app down with it.
  try {
    return window.localStorage.getItem(PASS_KEY);
  } catch {
    return null;
  }
}

function writePass(value: string): void {
  try {
    window.localStorage.setItem(PASS_KEY, value);
  } catch {
    /* ignore quota / blocked-storage errors */
  }
}

export function hasPasscode(): boolean {
  if (typeof window === "undefined") return false;
  return !!readPass();
}

export function setPasscode(passcode: string): void {
  writePass(hash(passcode));
}

export function verifyPasscode(passcode: string): boolean {
  const stored = readPass();
  return stored !== null && stored === hash(passcode);
}

function xor(text: string, key: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    out += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return out;
}

export function encryptText(text: string, passcode: string): string {
  try {
    const bytes = new TextEncoder().encode(xor(text, passcode || "lumen"));
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  } catch {
    return text;
  }
}

export function decryptText(payload: string, passcode: string): string {
  try {
    const bin = atob(payload);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return xor(new TextDecoder().decode(bytes), passcode || "lumen");
  } catch {
    return "";
  }
}
