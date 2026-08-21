import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToolCard } from "@/components/calculator/ToolCard";
import { CaseMode, convertCase, textStats } from "@/lib/tools-extra";
import { toast } from "sonner";

const MODES: Array<{ id: CaseMode; label: string }> = [
  { id: "upper", label: "UPPER" },
  { id: "lower", label: "lower" },
  { id: "title", label: "Title" },
  { id: "sentence", label: "Sentence" },
  { id: "camel", label: "camelCase" },
  { id: "snake", label: "snake_case" },
  { id: "kebab", label: "kebab-case" },
];

export function TextTools() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<CaseMode>("title");

  const stats = useMemo(() => textStats(text), [text]);
  const converted = useMemo(() => (text ? convertCase(text, mode) : ""), [text, mode]);

  return (
    <ToolCard title="Text Utilities" description="Word count, reading time and case conversion">
      <Textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type text here…"
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {(
          [
            ["Words", stats.words],
            ["Characters", stats.characters],
            ["No spaces", stats.charactersNoSpaces],
            ["Sentences", stats.sentences],
            ["Paragraphs", stats.paragraphs],
            ["Reading time", `${stats.readingMinutes} min`],
          ] as Array<[string, string | number]>
        ).map(([label, value]) => (
          <div key={label} className="rounded-xl bg-muted/30 p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
            <div className="font-display text-lg font-semibold tabular-nums">{value}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <Button
            key={m.id}
            size="sm"
            variant={mode === m.id ? "default" : "outline"}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </Button>
        ))}
      </div>
      {converted ? (
        <div className="space-y-2 rounded-2xl bg-muted/30 p-4">
          <div className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-sm">
            {converted}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            onClick={() => {
              void navigator.clipboard?.writeText(converted);
              toast.success("Copied");
            }}
          >
            <Copy className="size-4" /> Copy
          </Button>
        </div>
      ) : null}
    </ToolCard>
  );
}
