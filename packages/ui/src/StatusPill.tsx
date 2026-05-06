import type { ReactNode } from "react";

type Tone = "info" | "success" | "warn" | "danger";

const toneClasses: Record<Tone, string> = {
  info: "bg-wck-seafoam-200 text-wck-blueberry-700",
  success: "bg-emerald-100 text-emerald-800",
  warn: "bg-amber-100 text-amber-800",
  danger: "bg-rose-100 text-rose-800",
};

interface StatusPillProps {
  tone?: Tone;
  children: ReactNode;
}

export function StatusPill({ tone = "info", children }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
