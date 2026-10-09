// Draws the inventory overview as one image with a fixed width, like the scoreboard summary.
// The height grows with the content (more types and colors -> a longer image), so nothing has
// to shrink to fit. Everything is drawn on a fixed design grid of DESIGN_W wide that ctx.scale()
// enlarges to the real canvas size (W), so the image stays sharp on large screens.
import { Filament } from '../types';
import { getHue, isLightColor } from './color';
import { formatSpools, formatSpoolsWithUnit, LOW_STOCK_SPOOLS } from './filaments';

const DESIGN_W = 1080;
const SCALE = 2;

export const W = DESIGN_W * SCALE;

const INK = '#111827';
const MUTED = '#6b7280';
const FAINT = '#9ca3af';
const LINE = '#e5e7eb';
const PAPER = '#f9fafb';
const TILE = '#ffffff';
const ACCENT = '#059669';
const RED = '#dc2626';
const RED_LINE = '#fecaca';

const PAD = 56;
const COLS = 3;
const GAP = 16;
const TILE_W = (DESIGN_W - 2 * PAD - (COLS - 1) * GAP) / COLS;
const TILE_H = 96;
const SWATCH_R = 26;
const HEADER_H = 210;
const SECTION_HEAD_H = 60;
const SECTION_GAP = 36;
const FOOTER_H = 80;

const font = (weight: number, size: number) => `${weight} ${size}px Inter, ui-sans-serif, system-ui, sans-serif`;

const TRANSPARENT_NAME = /transparant|helder|clear|translucent/i;

interface Section {
  title: string;
  items: Filament[];
  top: number;
}

/** Groups by type (alphabetically) with the colors of each type ordered like a rainbow. */
function groupByType(filaments: Filament[]) {
  const groups = new Map<string, Filament[]>();
  for (const f of filaments) {
    groups.set(f.typeName, [...(groups.get(f.typeName) ?? []), f]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, items]) => ({ title, items: items.sort((a, b) => getHue(a.colorHex) - getHue(b.colorHex)) }));
}

// Shared layout: where each section starts and how tall the whole image is. drawOverview() and
// overviewHeight() use the same calculation, so the canvas always fits exactly what is drawn.
function computeLayout(filaments: Filament[]) {
  let y = HEADER_H;
  const sections: Section[] = groupByType(filaments).map(group => {
    const top = y;
    const rows = Math.ceil(group.items.length / COLS);
    y += SECTION_HEAD_H + rows * TILE_H + (rows - 1) * GAP + SECTION_GAP;
    return { ...group, top };
  });
  const emptyH = filaments.length === 0 ? 120 : 0;
  return { sections, height: y - (sections.length ? SECTION_GAP : 0) + emptyH + FOOTER_H };
}

/** Height in pixels of the canvas for these filaments. */
export const overviewHeight = (filaments: Filament[]) => Math.round(computeLayout(filaments).height * SCALE);

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Cuts text with an ellipsis so it fits in maxWidth with the current font. */
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

function swatch(ctx: CanvasRenderingContext2D, f: Filament, cx: number, cy: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, SWATCH_R, 0, Math.PI * 2);
  ctx.clip();
  if (TRANSPARENT_NAME.test(f.colorName)) {
    // Checkerboard behind a see-through color
    const size = 8;
    for (let x = cx - SWATCH_R; x < cx + SWATCH_R; x += size) {
      for (let y = cy - SWATCH_R; y < cy + SWATCH_R; y += size) {
        ctx.fillStyle = (Math.floor((x - cx) / size) + Math.floor((y - cy) / size)) % 2 === 0 ? '#ffffff' : '#d1d5db';
        ctx.fillRect(x, y, size, size);
      }
    }
    ctx.globalAlpha = 0.55;
  }
  ctx.fillStyle = f.colorHex;
  ctx.fillRect(cx - SWATCH_R, cy - SWATCH_R, SWATCH_R * 2, SWATCH_R * 2);
  ctx.restore();

  // Outline, so white and light colors stay visible
  ctx.beginPath();
  ctx.arc(cx, cy, SWATCH_R - 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = isLightColor(f.colorHex) ? 'rgba(0, 0, 0, 0.18)' : 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function tile(ctx: CanvasRenderingContext2D, f: Filament, x: number, y: number) {
  const low = f.spools < LOW_STOCK_SPOOLS;

  roundRect(ctx, x, y, TILE_W, TILE_H, 18);
  ctx.fillStyle = TILE;
  ctx.fill();
  ctx.strokeStyle = low ? RED_LINE : LINE;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  swatch(ctx, f, x + 22 + SWATCH_R, y + TILE_H / 2);

  const textX = x + 22 + SWATCH_R * 2 + 16;
  const textW = TILE_W - (textX - x) - 18;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = font(600, 25);
  ctx.fillStyle = INK;
  // Without the product code, like on the cards, so the color name fits
  ctx.fillText(fit(ctx, f.colorName.split(' (')[0], textW), textX, y + 42);

  ctx.font = font(500, 21);
  ctx.fillStyle = low ? RED : MUTED;
  ctx.fillText(fit(ctx, low ? `${formatSpoolsWithUnit(f.spools)} · bijna op` : `${formatSpoolsWithUnit(f.spools)} · ${f.remainingGrams} g`, textW), textX, y + 72);
}

interface DrawOptions {
  date: Date;
  version: string;
}

export function drawOverview(ctx: CanvasRenderingContext2D, filaments: Filament[], { date, version }: DrawOptions) {
  const { sections, height } = computeLayout(filaments);
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, DESIGN_W, height);

  // Header
  ctx.fillStyle = ACCENT;
  roundRect(ctx, PAD, 56, 56, 56, 16);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(PAD + 28, 84, 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(PAD + 28, 84, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = font(700, 44);
  ctx.fillText('Filamentvoorraad', PAD + 76, 100);

  const totalSpools = filaments.reduce((sum, f) => sum + f.spools, 0);
  const lowCount = filaments.filter(f => f.spools < LOW_STOCK_SPOOLS).length;
  const dateText = date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' });
  const summary = `${dateText} · ${filaments.length} ${filaments.length === 1 ? 'kleur' : 'kleuren'} · ${formatSpools(totalSpools)} ${totalSpools > 1 ? 'rollen' : 'rol'}`;
  ctx.font = font(500, 24);
  ctx.fillStyle = MUTED;
  ctx.fillText(summary, PAD, 160);
  if (lowCount > 0) {
    // "· 2 bijna op" in red after the summary
    const x = PAD + ctx.measureText(`${summary} · `).width;
    ctx.fillText(' · ', PAD + ctx.measureText(summary).width, 160);
    ctx.fillStyle = RED;
    ctx.font = font(600, 24);
    ctx.fillText(`${lowCount} bijna op`, x, 160);
  }

  // Sections per type
  for (const section of sections) {
    ctx.textAlign = 'left';
    ctx.font = font(700, 26);
    ctx.fillStyle = INK;
    ctx.fillText(section.title, PAD, section.top + 36);
    const titleW = ctx.measureText(section.title).width;
    ctx.font = font(500, 22);
    ctx.fillStyle = FAINT;
    ctx.fillText(String(section.items.length), PAD + titleW + 12, section.top + 36);

    section.items.forEach((f, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      tile(ctx, f, PAD + col * (TILE_W + GAP), section.top + SECTION_HEAD_H + row * (TILE_H + GAP));
    });
  }

  if (filaments.length === 0) {
    ctx.textAlign = 'center';
    ctx.font = font(500, 26);
    ctx.fillStyle = MUTED;
    ctx.fillText('Geen filament om te tonen', DESIGN_W / 2, HEADER_H + 60);
  }

  // Footer
  ctx.textAlign = 'center';
  ctx.font = font(500, 18);
  ctx.fillStyle = FAINT;
  ctx.fillText(`Filament tracker v${version}`, DESIGN_W / 2, height - 34);
}
