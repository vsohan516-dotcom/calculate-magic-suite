import { useCallback, useState } from "react";
import {
  Atom, Calculator as CalcIcon, FlaskConical, History, Moon, NotebookPen, ScanLine, Sliders,
  Sparkles, Sun, Type,
} from "lucide-react";
import { Toaster } from "@/comp
        
import { useCallback, useState } from "react";
import {
  Atom, Calculator as CalcIcon, FlaskConical, History, Moon, NotebookPen, ScanLine, Sliders,
  Sparkles, Sun, Type,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Calculator } from "@/components/calculator/Calculator";
import { HistoryPanel } from "@/components/calculator/HistoryPanel";
import { StatsChart } from "@/components/calculator/StatsChart";
import { UnitConverter } from "@/components/calculator/UnitConverter";
import { CurrencyConverter } from "@/components/calculator/CurrencyConverter";
import { GitSyncStatus } from "@/components/calculator/GitSyncStatus";
import {
  AgeCalc, BmiCalc, DiscountCalc, EmiCalc, GstCalc, PercentageCalc, TipCalc,
} from "@/components/calculator/Tools";
import {
  AverageCalc, CompoundInterestCalc, FuelCostCalc, LoanCalc, ProfitLossCalc,
  SimpleInterestCalc, SipCalc, SplitBillCalc, TaxCalc, UnitPriceCalc,
} from "@/components/calculator/FinanceTools";
import { BmrCalc, BodyFatCalc, WaterIntakeCalc } from "@/components/calculator/HealthTools";
import { CountdownTimer, DateDiffCalc, Stopwatch, TimeCalc } from "@/components/calculator/TimerTools";
import {
  AsciiConverter, BaseConverter, DataSizeConverter, RomanConverter,
} from "@/components/calculator/ConverterTools";
import { AiSolver } from "@/components/calculator/AiSolver";
import { OcrTool, QrGenerator, QrScanner } from "@/components/calculator/ScanTools";
import { PasswordGenerator, PasswordStrengthChecker } from "@/components/calculator/SecurityTools";
import { TextTools } from "@/components/calculator/TextTools";
import {
  ConstantsTable, MolarMassCalc, PeriodicTableLookup, PhysicsCalc,
} from "@/components/calculator/ScienceTools";
import { NotesVault } from "@/components/calculator/NotesVault";
import { Chemistry } from "@/components/calculator/Chemistry";
import { useHistory } from "@/hooks/use-history";
import { useTheme } from "@/hooks/use-theme";

export function CalculatorApp() {
  const history = useHistory();
  const { theme, toggle } = useTheme();
  const [mode, setMode] = useState<
    | "standard" | "scientific" | "tools" | "convert" | "finance" | "health" | "time"
    | "ai" | "scan" | "text" | "lab" | "notes"
  >("standard");

  const commitMisc = useCallback(
    (expression: string, result: string, category = "Tools") => {
      history.add({ expression, result, category });
    },
    [history],
  );

  const commitCalc = useCallback(
    (entry: { expression: string; result: string; category: string }) => {
      history.add(entry);
    },
    [history],
  );

  return (
    <div className="min-h-dvh">
      <Toaster position="top-center" richColors />

      <header className="sticky top-0 z-40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="grad-primary grid size-9 place-items-center rounded-xl shadow-lg">
              <CalcIcon className="size-5" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-base font-semibold">Lumen Calc</div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Premium calculator suite
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open history" className="lg:hidden">
                  <History className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full p-3 sm:max-w-md">
                <div className="mt-6 flex h-[calc(100dvh-2rem)] flex-col gap-3">
                  <GitSyncStatus />
                  <StatsChart entries={history.entries} />
                  <div className="min-h-0 flex-1">
                    <HistoryPanel
                      entries={history.entries}
                      onClear={history.clear}
                      onRemove={history.remove}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <TabsList className="glass-panel grid h-auto w-full grid-cols-4 gap-1 rounded-2xl p-1.5 sm:grid-cols-6 lg:grid-cols-12">
              <TabsTrigger value="standard" className="gap-1.5 rounded-xl py-2">
                <CalcIcon className="size-4" />
                <span className="hidden sm:inline">Standard</span>
              </TabsTrigger>
              <TabsTrigger value="scientific" className="gap-1.5 rounded-xl py-2">
                <FlaskConical className="size-4" />
                <span className="hidden sm:inline">Science</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="gap-1.5 rounded-xl py-2">
                <Sliders className="size-4" />
                <span className="hidden sm:inline">Tools</span>
              </TabsTrigger>
              <TabsTrigger value="convert" className="gap-1.5 rounded-xl py-2">
                <span className="text-sm">⇄</span>
                <span className="hidden sm:inline">Convert</span>
              </TabsTrigger>
              <TabsTrigger value="finance" className="gap-1.5 rounded-xl py-2">
                <span className="text-sm">₹</span>
                <span className="hidden sm:inline">Finance</span>
              </TabsTrigger>
              <TabsTrigger value="health" className="gap-1.5 rounded-xl py-2">
                <span className="text-sm">♥</span>
                <span className="hidden sm:inline">Health</span>
              </TabsTrigger>
              <TabsTrigger value="time" className="gap-1.5 rounded-xl py-2">
                <span className="text-sm">⏱</span>
                <span className="hidden sm:inline">Time</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-1.5 rounded-xl py-2">
                <Sparkles className="size-4" />
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
              <TabsTrigger value="scan" className="gap-1.5 rounded-xl py-2">
                <ScanLine className="size-4" />
                <span className="hidden sm:inline">Scan</span>
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-1.5 rounded-xl py-2">
                <Type className="size-4" />
                <span className="hidden sm:inline">Text</span>
              </TabsTrigger>
              <TabsTrigger value="lab" className="gap-1.5 rounded-xl py-2">
                <Atom className="size-4" />
                <span className="hidden sm:inline">Lab</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1.5 rounded-xl py-2">
                <NotebookPen className="size-4" />
                <span className="hidden sm:inline">Notes</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="standard" className="animate-pop mt-4">
              <Calculator onCommit={commitCalc} />
            </TabsContent>
            <TabsContent value="scientific" className="animate-pop mt-4">
              <Calculator scientific onCommit={commitCalc} />
            </TabsContent>
            <TabsContent value="tools" className="animate-pop mt-4 space-y-4">
              <PercentageCalc onCommit={commitMisc} />
              <GstCalc onCommit={commitMisc} />
              <DiscountCalc onCommit={commitMisc} />
              <TipCalc onCommit={commitMisc} />
              <EmiCalc onCommit={commitMisc} />
              <BmiCalc onCommit={commitMisc} />
              <AgeCalc onCommit={commitMisc} />
              <Chemistry onCommit={commitMisc} />
            </TabsContent>
            <TabsContent value="convert" className="animate-pop mt-4 space-y-4">
              <UnitConverter onCommit={(e: string, r: string) => commitMisc(e, r, "Unit")} />
              <CurrencyConverter onCommit={(e: string, r: string) => commitMisc(e, r, "Currency")} />
              <BaseConverter onCommit={commitMisc} />
              <RomanConverter onCommit={commitMisc} />
              <AsciiConverter />
              <DataSizeConverter onCommit={commitMisc} />
            </TabsContent>
            <TabsContent value="finance" className="animate-pop mt-4 space-y-4">
              <SipCalc onCommit={commitMisc} />
              <LoanCalc onCommit={commitMisc} />
              <SimpleInterestCalc onCommit={commitMisc} />
              <CompoundInterestCalc onCommit={commitMisc} />
              <TaxCalc onCommit={commitMisc} />
              <ProfitLossCalc onCommit={commitMisc} />
              <SplitBillCalc onCommit={commitMisc} />
              <FuelCostCalc onCommit={commitMisc} />
              <UnitPriceCalc onCommit={commitMisc} />
              <AverageCalc onCommit={commitMisc} />
            </TabsContent>
            <TabsContent value="health" className="animate-pop mt-4 space-y-4">
              <BmrCalc onCommit={commitMisc} />
              <BodyFatCalc onCommit={commitMisc} />
              <WaterIntakeCalc onCommit={commitMisc} />
            </TabsContent>
            <TabsContent value="time" className="animate-pop mt-4 space-y-4">
              <TimeCalc onCommit={commitMisc} />
              <DateDiffCalc onCommit={commitMisc} />
              <Stopwatch />
              <CountdownTimer />
            </TabsContent>
            <TabsContent value="ai" className="animate-pop mt-4 space-y-4">
              <AiSolver onCommit={commitMisc} />
            </TabsContent>
            <TabsContent value="scan" className="animate-pop mt-4 space-y-4">
              <QrGenerator />
              <QrScanner />
              <OcrTool />
            </TabsContent>
            <TabsContent value="text" className="animate-pop mt-4 space-y-4">
              <TextTools />
              <PasswordGenerator />
              <PasswordStrengthChecker />
            </TabsContent>
            <TabsContent value="lab" className="animate-pop mt-4 space-y-4">
              <ConstantsTable />
              <PhysicsCalc onCommit={commitMisc} />
              <MolarMassCalc onCommit={commitMisc} />
              <PeriodicTableLookup />
            </TabsContent>
            <TabsContent value="notes" className="animate-pop mt-4 space-y-4">
              <NotesVault />
            </TabsContent>
          </Tabs>
        </section>

        <aside className="hidden flex-col gap-4 lg:flex lg:sticky lg:top-24 lg:h-[calc(100dvh-7rem)]">
          <GitSyncStatus />
          <StatsChart entries={history.entries} />
          <div className="min-h-0 flex-1">
            <HistoryPanel
              entries={history.entries}
              onClear={history.clear}
              onRemove={history.remove}
            />
          </div>
        </aside>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-xs text-muted-foreground sm:px-6">
        Built with precision · Data stays on your device
      </footer>
    </div>
  );
}
