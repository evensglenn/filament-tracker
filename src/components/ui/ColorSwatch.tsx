import { CSSProperties } from 'react';

const TRANSPARENT_NAME = /transparant|helder|clear|translucent/i;

// Checkerboard behind a see-through color, like an image editor
const CHECKERBOARD: CSSProperties = {
  backgroundImage: 'repeating-conic-gradient(#d1d5db 0% 25%, #ffffff 0% 50%)',
  backgroundSize: '8px 8px',
};

interface ColorSwatchProps {
  hex: string;
  /** Used to show a checkerboard for transparent filaments. */
  name?: string;
  /** Tailwind size classes, e.g. 'w-10 h-10'. */
  className?: string;
}

/** Round color sample with an outline, so white and light colors stay visible on white. */
export function ColorSwatch({ hex, name = '', className = 'w-10 h-10' }: ColorSwatchProps) {
  const isTransparent = TRANSPARENT_NAME.test(name);
  return (
    <span
      className={`relative inline-block shrink-0 rounded-full overflow-hidden ring-1 ring-inset ring-black/15 dark:ring-white/25 ${className}`}
      style={isTransparent ? CHECKERBOARD : { backgroundColor: hex }}
    >
      {isTransparent && <span className="absolute inset-0" style={{ backgroundColor: hex, opacity: 0.55 }} />}
    </span>
  );
}
