*** Begin Patch
*** Update File: src/components/calculator/Chemistry.tsx
@@
-import { ELEMENTS, CATEGORY_LABELS, gridPosition, molarMass } from "@/lib/chemistry/periodicTable";
+import { ELEMENTS, CATEGORY_LABELS, gridPosition, molarMass } from "@/lib/chemistry/periodicTable";
+import { ChemistryInfoPanel } from "@/components/calculator/ChemistryInfo";
+import { ChemistryCalculators } from "@/components/calculator/ChemistryCalculators";
+import { ChemistryReference } from "@/components/calculator/ChemistryReference";
+import { ChemistryQuiz } from "@/components/calculator/ChemistryQuiz";
@@
   const [expanded, setExpanded] = useState(false);
+  const [hubOpen, setHubOpen] = useState(false);
@@
           <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
@@
           </div>
@@
-      <div>
+      <div>
         <h3 className="font-display text-sm font-semibold">Element details</h3>
         <div className="mt-2">
           {selected ? (
-            (() => {
-              const el = bySymbol[selected];
-              if (!el) return <div className="text-sm text-muted-foreground">Element not found</div>;
-              return (
-                <div className="glass-panel p-4">
-                  <div className="flex items-start gap-4">
-                    <div className="text-4xl font-display font-semibold">{el.symbol}</div>
-                    <div>
-                      <div className="text-sm text-muted-foreground">{el.name}</div>
-                      <div className="mt-2 text-xs">Atomic number: {el.number}</div>
-                      <div className="text-xs">Atomic mass: {el.mass}</div>
-                      <div className="text-xs">Group: {el.group} · Period: {el.period}</div>
-                      <div className="mt-2">
-                        <Button onClick={() => insertSymbol(el.symbol)}>Add to formula</Button>
-                        <Button variant="ghost" onClick={() => setSelected(null)} className="ml-2">Close</Button>
-                      </div>
-                    </div>
-                  </div>
-                </div>
-              );
-            })()
+            (() => {
+              // Reuse the new ChemistryInfoPanel to show structured information
+              return <ChemistryInfoPanel symbol={selected} />;
+            })()
           ) : (
             <div className="text-sm text-muted-foreground">Select an element to view details.</div>
           )}
         </div>
       </div>
+      <div className="mt-4">
+        <div className="flex items-center justify-between">
+          <h3 className="font-display text-sm font-semibold">Chemistry Hub</h3>
+          <div>
+            <Button variant="ghost" onClick={() => setHubOpen((s) => !s)}>{hubOpen ? "Close Hub" : "Open Chemistry Hub"}</Button>
+          </div>
+        </div>
+        {hubOpen ? (
+          <div className="mt-3 grid gap-3">
+            <ChemistryCalculators />
+            <ChemistryReference />
+            <ChemistryQuiz />
+          </div>
+        ) : null}
+      </div>
*** End Patch
