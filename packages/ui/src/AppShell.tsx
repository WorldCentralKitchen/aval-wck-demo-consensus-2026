import type { ReactNode } from "react";

interface AppShellProps {
  appName: string;
  role?: string;
  children: ReactNode;
}

export function AppShell({ appName, role, children }: AppShellProps) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-wck-blueberry/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-semibold text-wck-blueberry">
              Aval
            </span>
            <span className="text-sm text-wck-ink/60">/ {appName}</span>
          </div>
          {role && <span className="aval-pill">{role}</span>}
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
      <footer className="border-t border-wck-blueberry/10 bg-white/60">
        <div className="mx-auto max-w-7xl px-6 py-3 text-xs text-wck-ink/50">
          World Central Kitchen · Base Sepolia · Demo build
        </div>
      </footer>
    </div>
  );
}
