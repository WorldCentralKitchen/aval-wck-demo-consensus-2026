import type { ReactNode } from "react";

export type PillTone =
  | "success" | "warn" | "danger" | "info"
  | "neutral" | "primary" | "saffron";

interface PillProps {
  tone?: PillTone;
  dot?: boolean;
  children: ReactNode;
}

export function Pill({ tone = "neutral", dot = false, children }: PillProps) {
  return (
    <span className={`aval-pill pill-${tone}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

// backward-compat alias
export { Pill as StatusPill };
