/** True for colors where dark text or icons read better than white ones. */
export const isLightColor = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
};

export const getHue = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  // Achromatic colors (Black, Gray, White)
  if (s < 0.15) {
    // Sort by lightness: White -> Gray -> Black
    // Put them after chromatic colors
    return 10 + (1 - l);
  }

  let h = 0;
  if (max === r) h = (g - b) / d;
  else if (max === g) h = (b - r) / d + 2;
  else if (max === b) h = (r - g) / d + 4;

  // Normalize so Red (around 0) is at the start
  if (h < -0.5) h += 6;

  return h;
};
