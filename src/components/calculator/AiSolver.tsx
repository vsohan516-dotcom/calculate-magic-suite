import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CommitFn, ToolCard } from "@/components/calculator/ToolCard";
import { solveMath } from "@/lib/ai.functions";
import { toast } from "sonner";

/** AI Math Solver — step-by-step solutions in English or Hindi. */
export function AiSolver({ onCommit }: { onCommit: CommitFn }) {
  const solve = useServerFn(solveMath);
  const [problem, setProblem] = useState("");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const q = problem.trim();
    if (!q) return toast.error("Enter a problem first");
    setBusy(true);
    setAnswer("");
    try {
      const res = await solve({ data: { problem: q, language } });
      setAnswer(res.text);
      onCommit(q, res.text.split("\n").slice(-1)[0] ?? "solved", "AI Solver");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not solve that");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolCard title="AI Math Solver" description="Step-by-step solutions · English / हिंदी">
      <Textarea
        rows={4}
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
        placeholder="e.g. Solve 2x² − 5x + 3 = 0"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "hi")}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="hi">हिंदी</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={run} disabled={busy} className="gap-1.5">
          <Sparkles className="size-4" /> {busy ? "Solving…" : "Solve"}
        </Button>
      </div>
      {answer ? (
        <div className="whitespace-pre-wrap rounded-2xl bg-muted/30 p-4 text-sm leading-relaxed">
          {answer}
        </div>
      ) : null}
    </ToolCard>
  );
}
