import React from "react";
import { getElementInfoBySymbol } from "@/lib/chemistry/chemistryInfo";

export function ChemistryInfoPanel({ symbol }: { symbol: string }) {
  const info = getElementInfoBySymbol(symbol);
  if (!info) return <div className="text-sm text-muted-foreground">Element data not available</div>;
  return (
    <div className="glass-panel p-4">
      <div className="flex items-start gap-4">
        <div className="text-4xl font-display font-semibold">{info.symbol}</div>
        <div>
          <div className="text-sm text-muted-foreground">{info.name}</div>
          <div className="mt-2 text-xs">Atomic number: {info.atomicNumber}</div>
          <div className="text-xs">Atomic mass: {String(info.atomicMass)}</div>
          <div className="text-xs">
            Group: {info.group ?? "Not available"} · Period: {info.period ?? "Not available"}
          </div>
          <div className="text-xs">
            Block: {info.block ?? "Not available"} · Category: {info.category ?? "Not available"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <div>
          <div className="text-xs uppercase text-muted-foreground">Atomic information</div>
          <div className="text-sm">
            Electronic configuration: {info.electronicConfiguration ?? "Not available"}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase text-muted-foreground">Physical properties</div>
          <div className="text-sm">
            State at room temp: {info.stateAtRoomTemp ?? "Not available"}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase text-muted-foreground">Chemical properties</div>
          <div className="text-sm">
            Important compounds:{" "}
            {(info.importantCompounds && info.importantCompounds.join(", ")) ?? "Not available"}
          </div>
        </div>
      </div>
    </div>
  );
}
