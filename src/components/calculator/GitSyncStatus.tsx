import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, GitBranch, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const REPO = "vsohan516-dotcom/calculate-magic-suite";
const BRANCH = "main";
/** Files added on Aug 1 — used to detect whether that work reached GitHub. */
const MARKER_FILES = ["src/lib/tools-extra.ts", "src/components/calculator/FinanceTools.tsx"];

type State = {
  status: "loading" | "ok" | "error";
  pushedAt?: string;
  message?: string;
  sha?: string;
  hasMarker?: boolean;
  error?: string;
};

function relative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "अभी";
  if (mins < 60) return `${mins} मिनट पहले`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} घंटे पहले`;
  return `${Math.round(hrs / 24)} दिन पहले`;
}

export function GitSyncStatus() {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/commits/${BRANCH}`, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const data = await res.json();
      const sha: string = data.sha;

      const checks = await Promise.all(
        MARKER_FILES.map(async (path) => {
          const r = await fetch(
            `https://api.github.com/repos/${REPO}/contents/${path}?ref=${sha}`,
            { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" },
          );
          return r.ok;
        }),
      );

      setState({
        status: "ok",
        sha: sha.slice(0, 7),
        pushedAt: data.commit?.committer?.date ?? data.commit?.author?.date,
        message: (data.commit?.message ?? "").split("\n")[0],
        hasMarker: checks.every(Boolean),
      });
    } catch (e) {
      setState({ status: "error", error: e instanceof Error ? e.message : "unknown error" });
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GitBranch className="size-4" />
          GitHub sync
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void load()}
          aria-label="Refresh GitHub sync status"
          disabled={state.status === "loading"}
        >
          {state.status === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
        </Button>
      </div>

      <div className="mt-3 space-y-2 text-xs">
        {state.status === "loading" && (
          <p className="text-muted-foreground">स्थिति जाँच रहे हैं…</p>
        )}

        {state.status === "error" && (
          <p className="flex items-start gap-1.5 text-destructive">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            स्थिति नहीं मिली ({state.error})
          </p>
        )}

        {state.status === "ok" && (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Last push</span>
              <span className="font-medium">
                {state.pushedAt ? relative(state.pushedAt) : "—"}
              </span>
            </div>
            {state.pushedAt && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Timestamp</span>
                <span className="font-mono">
                  {new Date(state.pushedAt).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Commit</span>
              <span className="font-mono">{state.sha}</span>
            </div>
            <p className="truncate text-muted-foreground" title={state.message}>
              {state.message}
            </p>

            <div
              className={`mt-2 flex items-start gap-1.5 rounded-xl p-2 ${
                state.hasMarker
                  ? "bg-primary/10 text-foreground"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {state.hasMarker ? (
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
              ) : (
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              )}
              <span>
                {state.hasMarker
                  ? "1 तारीख वाला offline tools code GitHub पर मौजूद है ✅"
                  : "1 तारीख वाला offline tools code अभी GitHub पर नहीं पहुँचा ❌"}
              </span>
            </div>

            <a
              className="mt-1 inline-block underline underline-offset-2 text-muted-foreground"
              href={`https://github.com/${REPO}/commits/${BRANCH}`}
              target="_blank"
              rel="noreferrer"
            >
              GitHub पर commits देखो
            </a>
          </>
        )}
      </div>
    </div>
  );
}
