import type { ReactNode } from "react";
import { PanMark } from "./PanMark.js";

interface AppBarProps {
  appName: string;
  appRole?: string;
  user: string;
  role: string;
  badge?: ReactNode;
}

export function AppBar({ appName, appRole, user, role, badge }: AppBarProps) {
  const initials = user
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="aval-bar">
      <div className="aval-bar-brand">
        <PanMark />
        <span>Aval</span>
      </div>
      <div className="aval-bar-divider" />
      <div className="aval-bar-app">
        {appName}
        {appRole && <small>· {appRole}</small>}
      </div>
      {badge}
      <div className="aval-bar-spacer" />
      <div className="aval-bar-user">
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 600, color: "var(--wck-ink)" }}>{user}</div>
          <div className="aval-bar-role">{role}</div>
        </div>
        <div className="avatar">{initials}</div>
      </div>
    </div>
  );
}
