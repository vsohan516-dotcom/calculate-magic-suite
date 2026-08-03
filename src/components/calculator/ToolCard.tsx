import type { ReactNode } from "react";

/**
 * Shared shell for the additional tool cards. Matches the existing glass-panel
 * styling used by Tools.tsx without altering it.
 */
export function ToolCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="glass-panel space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-3">{children}</div>
      {footer}
    </div>
  );
}

export function ResultBox({
  label,
  value,
  sub,
  action,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-muted/30 p-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="mt-1 break-words font-display text-2xl font-semibold text-grad sm:text-3xl">
          {value}
        </div>
        {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
      </div>
      {action}
    </div>
  );
}

export const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
};

export type CommitFn = (expression: string, result: string, category?: string) => void;
