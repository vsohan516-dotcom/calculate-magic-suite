import { useMemo, useState } from "react";
import { Copy, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ResultBox, ToolCard } from "@/components/calculator/ToolCard";
import { checkPasswordStrength, generatePassword } from "@/lib/tools-extra";
import { toast } from "sonner";

export function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState("");

  const make = () => {
    try {
      setPassword(generatePassword({ length, upper, lower, digits, symbols, excludeAmbiguous }));
    } catch {
      toast.error("Pick at least one character set");
    }
  };

  const rows: Array<[string, boolean, (v: boolean) => void]> = [
    ["Uppercase A–Z", upper, setUpper],
    ["Lowercase a–z", lower, setLower],
    ["Numbers 0–9", digits, setDigits],
    ["Exclude look-alikes (Il1O0)", excludeAmbiguous, setExcludeAmbiguous],
    ["Symbols !@#", symbols, setSymbols],
  ];

  return (
    <ToolCard title="Password Generator" description="Strong random passwords, generated on-device">
      <div className="space-y-2">
        <Label>Length — {length}</Label>
        <Slider min={6} max={64} step={1} value={[length]} onValueChange={([v]) => setLength(v)} />
      </div>
      {rows.map(([label, value, set]) => (
        <div key={label} className="flex items-center justify-between rounded-xl bg-muted/20 px-3 py-2">
          <span className="text-sm">{label}</span>
          <Switch checked={value} onCheckedChange={set} />
        </div>
      ))}
      <Button onClick={make} className="gap-1.5">
        <RefreshCw className="size-4" /> Generate
      </Button>
      {password ? (
        <ResultBox
          label="Password"
          value={password}
          action={
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5"
              onClick={() => {
                void navigator.clipboard?.writeText(password);
                toast.success("Copied");
              }}
            >
              <Copy className="size-4" /> Copy
            </Button>
          }
        />
      ) : null}
    </ToolCard>
  );
}

export function PasswordStrengthChecker() {
  const [pw, setPw] = useState("");
  const strength = useMemo(() => (pw ? checkPasswordStrength(pw) : null), [pw]);

  return (
    <ToolCard title="Password Strength" description="Checked locally — nothing is uploaded">
      <div className="space-y-1.5">
        <Label htmlFor="pw-check">Password</Label>
        <Input
          id="pw-check"
          type="text"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Type to test"
        />
      </div>
      {strength ? (
        <ResultBox
          label="Verdict"
          value={strength.label}
          sub={
            <span className="flex items-center gap-1.5">
              <KeyRound className="size-3" /> Score {strength.score}/4 · {strength.entropyBits} bits
              {strength.hints.length ? ` · ${strength.hints.join(" · ")}` : ""}
            </span>
          }
        />
      ) : null}
    </ToolCard>
  );
}
