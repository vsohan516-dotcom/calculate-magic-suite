import { Copy, Mic, MicOff, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DisplayProps {
  expression: string;
  result: string;
  onCopy: () => void;
  onSpeak: () => void;
  onMic?: () => void;
  listening?: boolean;
  micSupported?: boolean;
  error?: string | null;
  memoryActive?: boolean;
  angleMode?: "deg" | "rad";
}

export function Display({
  expression,
  result,
  onCopy,
  onSpeak,
  onMic,
  listening,
  micSupported,
  error,
  memoryActive,
  angleMode,
}: DisplayProps) {
  return (
    <div className="glass-panel relative overflow-hidden p-5 sm:p-6">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <div className="flex items-center gap-2">
          {memoryActive ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary">M</span>
          ) : null}
          {angleMode ? <span>{angleMode}</span> : null}
        </div>
        <div className="flex items-center gap-1">
          {onMic && micSupported ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={onMic}
              aria-label={listening ? "Stop voice input" : "Start voice input"}
              className={cn("size-8", listening && "text-primary animate-pulse")}
            >
              {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </Button>
          ) : null}
          <Button
            size="icon"
            variant="ghost"
            onClick={onSpeak}
            aria-label="Speak result"
            className="size-8"
          >
            <Volume2 className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onCopy}
            aria-label="Copy result"
            className="size-8"
          >
            <Copy className="size-4" />
          </Button>
        </div>
      </div>

      <div
        className="mt-3 min-h-7 break-all text-right font-mono text-sm text-muted-foreground sm:text-base"
        aria-label="Current expression"
      >
        {expression || "\u00A0"}
      </div>

      <div
        className={cn(
          "mt-1 break-all text-right font-display text-4xl font-semibold tracking-tight sm:text-5xl",
          error ? "text-destructive" : "text-grad",
        )}
        aria-live="polite"
        aria-label="Result"
      >
        {error ?? result ?? "0"}
      </div>
    </div>
  );
}
