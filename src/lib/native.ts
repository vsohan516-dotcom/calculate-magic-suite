// Helpers that transparently switch between web and Capacitor native runtime.

export function isNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  return !!cap?.isNativePlatform?.();
}

/**
 * Save a file so the user can open/share it. On web this triggers a normal
 * blob download. On Capacitor (Android/iOS) it writes to the app cache and
 * opens the native share sheet, since WebView blocks anchor downloads and
 * window.open pop-ups.
 */
export async function saveOrShareFile(
  filename: string,
  content: string,
  mimeType: string,
): Promise<void> {
  if (isNative()) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import("@capacitor/filesystem"),
      import("@capacitor/share"),
    ]);
    const isBinaryOrHtml = mimeType.startsWith("application/") || mimeType.includes("html");
    const written = await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Cache,
      encoding: isBinaryOrHtml ? undefined : Encoding.UTF8,
    });
    await Share.share({
      title: filename,
      text: filename,
      url: written.uri,
      dialogTitle: `Save ${filename}`,
    });
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
