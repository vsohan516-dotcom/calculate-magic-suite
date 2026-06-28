import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type KeyVariant = "default" | "operator" | "accent" | "equals" | "danger" | "ghost";

interface CalcKeyProps {
  children: ReactNode;
  onClick: () => void;
  variant?: KeyVariant;
  span?: 1 | 2;
  ariaLabel?: string;
  className?: string;
}

const VARIANT_CLASS: Record<KeyVariant, string> = {
  default: "glass-key glass-key-hover text-foreground",
  operator:
    "glass-key glass-key-hover text-accent-foreground bg-[color-mix(in_oklab,var(--accent)_22%,var(--glass))]",
  accent:
    "glass-key glass-key-hover text-primary-foreground grad-accent",
  equals: "glass-key glass-key-hover text-primary-foreground grad-primary",
  danger:
    "glass-key glass-key-hover text-destructive-foreground bg-[color-mix(in_oklab,var(--destructive)_70%,transparent)]",
  ghost:
    "glass-key glass-key-hover text-muted-foreground bg-[color-mix(in_oklab,var(--muted)_40%,transparent)]",
};

export function CalcKey({
  children,
  onClick,
  variant = "default",
  span = 1,
  ariaLabel,
  className,
}: CalcKeyProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "flex h-14 items-center justify-center rounded-2xl font-display text-lg font-medium select-none sm:h-16 sm:text-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        span === 2 && "col-span-2",
        VARIANT_CLASS[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
