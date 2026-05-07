interface ActivationBarProps {
  label?: string;
  activation?: string;
  day?: number;
  treasury?: string;
}

export function ActivationBar({
  label = "Caribbean Hurricane 2026",
  activation = "CRBN-2026-04",
  day = 4,
  treasury = "24,318 USDC",
}: ActivationBarProps) {
  return (
    <div className="aval-activation-bar">
      <span className="aval-activation-badge">Active Response</span>
      <span>
        {label} · Activation {activation}
      </span>
      <span style={{ opacity: 0.85, fontWeight: 400, marginLeft: "auto" }}>
        Day {day} · Base Sepolia · Treasury {treasury}
      </span>
    </div>
  );
}
