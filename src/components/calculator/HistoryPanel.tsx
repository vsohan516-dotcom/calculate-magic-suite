import { useMemo, useState } from "react";
import { Download, FileText, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { HistoryEntry } from "@/hooks/use-history";
import { toast } from "sonner";
import { isNative, saveOrShareFile } from "@/lib/native";

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onClear: () => void;
  onRemove: (id: string) => void;
  onReuse?: (entry: HistoryEntry) => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toCSV(entries: HistoryEntry[]): string {
  const header = "Timestamp,Category,Expression,Result\n";
  const rows = entries
    .map((e) => {
      const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
      return [
        esc(new Date(e.timestamp).toISOString()),
        esc(e.category),
        esc(e.expression),
        esc(e.result),
      ].join(",");
    })
    .join("\n");
  return header + rows;
}

function buildHistoryHTML(entries: HistoryEntry[]): string {
  const rows = entries
    .map(
      (e) => `
      <tr>
        <td>${new Date(e.timestamp).toLocaleString()}</td>
        <td>${e.category}</td>
        <td>${e.expression.replace(/</g, "&lt;")}</td>
        <td><strong>${e.result.replace(/</g, "&lt;")}</strong></td>
      </tr>`,
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Calculation History</title>
    <style>
      *{box-sizing:border-box}
      body{font-family:Inter,system-ui,sans-serif;padding:32px;color:#111}
      h1{font-size:22px;margin:0 0 8px}
      .meta{color:#555;font-size:12px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th,td{padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top}
      th{background:#f4f4f7;font-weight:600}
      tr:nth-child(even) td{background:#fafafa}
      @media print { body{padding:16px} }
    </style></head><body>
    <h1>Calculation History</h1>
    <div class="meta">Exported ${new Date().toLocaleString()} · ${entries.length} entries</div>
    <table><thead><tr><th>Time</th><th>Mode</th><th>Expression</th><th>Result</th></tr></thead>
    <tbody>${rows}</tbody></table>
  </body></html>`;
}

async function exportPDF(entries: HistoryEntry[]) {
  const html = buildHistoryHTML(entries);
  // On native Android/iOS we can't open a print pop-up — save the HTML and let
  // the user open it in a browser to print / Save as PDF.
  if (isNative()) {
    try {
      await saveOrShareFile(`history-${Date.now()}.html`, html, "text/html");
      toast.success("History exported — open in a browser to save as PDF");
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    }
    return;
  }
  const win = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
  if (!win) {
    // Pop-up blocked — fall back to a downloadable HTML file.
    await saveOrShareFile(`history-${Date.now()}.html`, html, "text/html");
    toast.success("Downloaded HTML — open it and print to PDF");
    return;
  }
  win.document.write(
    html.replace(
      "</body>",
      `<script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body>`,
    ),
  );
  win.document.close();
}

async function exportCSV(entries: HistoryEntry[]) {
  try {
    await saveOrShareFile(`history-${Date.now()}.csv`, toCSV(entries), "text/csv");
  } catch (err) {
    console.error(err);
    toast.error("Export failed");
  }
}

export function HistoryPanel({ entries, onClear, onRemove, onReuse }: HistoryPanelProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.expression.toLowerCase().includes(q) ||
        e.result.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q),
    );
  }, [entries, query]);

  return (
    <div className="glass-panel flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">History</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportPDF(entries)}
            disabled={!entries.length}
            aria-label="Export history as PDF"
          >
            <FileText className="size-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              downloadBlob(toCSV(entries), "text/csv", `history-${Date.now()}.csv`)
            }
            disabled={!entries.length}
            aria-label="Export history as CSV"
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={!entries.length}
            aria-label="Clear history"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search expression or result"
          className="pl-9"
          aria-label="Search history"
        />
      </div>

      <ScrollArea className="-mr-2 mt-3 flex-1 pr-2">
        {filtered.length === 0 ? (
          <div className="grid place-items-center py-10 text-center text-sm text-muted-foreground">
            {entries.length === 0 ? "Your calculations will appear here." : "No matches."}
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((e) => (
              <li
                key={e.id}
                className="group glass-key animate-pop relative rounded-xl p-3 transition hover:bg-muted/40"
              >
                <button
                  type="button"
                  onClick={() => onReuse?.(e)}
                  className="block w-full text-left"
                  aria-label={`Reuse ${e.expression}`}
                >
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
                    <span>{e.category}</span>
                    <time dateTime={new Date(e.timestamp).toISOString()}>
                      {formatTime(e.timestamp)}
                    </time>
                  </div>
                  <div className="mt-1 break-all font-mono text-sm text-muted-foreground">
                    {e.expression}
                  </div>
                  <div className="mt-0.5 break-all font-display text-lg font-semibold text-foreground">
                    = {e.result}
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(e.id)}
                  aria-label="Remove entry"
                  className="absolute right-2 top-2 size-7 opacity-0 transition group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
