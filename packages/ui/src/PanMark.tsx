interface PanMarkProps { size?: number; }

export function PanMark({ size = 26 }: PanMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#1565ad" />
      <circle cx="32" cy="32" r="22" fill="#fff" />
      <circle cx="32" cy="32" r="14" fill="#e86027" />
      <rect x="56" y="29" width="6" height="6" rx="1" fill="#26a9e1" />
    </svg>
  );
}
