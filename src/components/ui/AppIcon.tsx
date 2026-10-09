/** The app icon (same as the favicon and home screen icon): antraciet tile, kalk spool, petrol hub. */
export function AppIcon({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={`shrink-0 ${className}`}>
      <rect width="64" height="64" rx="14" fill="#2A2C2E" />
      {/* A faint edge, so the tile stays visible on the antraciet header in dark mode */}
      <rect x="0.5" y="0.5" width="63" height="63" rx="13.5" fill="none" className="stroke-transparent dark:stroke-white/15" />
      <circle cx="32" cy="32" r="19" fill="none" stroke="#EEECE7" strokeWidth="4.5" />
      <circle cx="32" cy="32" r="6.5" fill="#1E8A8A" />
    </svg>
  );
}
