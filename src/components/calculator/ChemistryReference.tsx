import React from "react";
import { CHEMISTRY_REFERENCE } from "@/lib/chemistry/chemistryReference";

export function ChemistryReference() {
  return (
    <div className="glass-panel p-4">
      <h3 className="font-display text-sm font-semibold">Chemistry Reference</h3>
      <div className="mt-3">
        <div className="text-xs font-medium">Groups</div>
        <ul className="mt-2">
          {Object.entries(CHEMISTRY_REFERENCE.groups).map(([g, name]) => (
            <li key={g}>
              {g}: {name}
            </li>
          ))}
        </ul>

        <div className="mt-3 text-xs font-medium">Common polyatomic ions</div>
        <ul className="mt-2">
          {CHEMISTRY_REFERENCE.commonPolyatomicIons.map((ion) => (
            <li key={ion.formula}>
              {ion.formula} — {ion.name} ({ion.charge > 0 ? `+${ion.charge}` : ion.charge})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
