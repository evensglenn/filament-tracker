import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { FilamentDoc, ManagedType } from '../types';
import { filterAndSortFilaments, formatWeight, toInventory, weightParts } from './filaments';

const types: ManagedType[] = [
  { id: 'pla', name: 'PLA Basic', brand: 'Bambu Lab', presets: [] },
  { id: 'petg', name: 'PETG HF', brand: 'Bambu Lab', presets: [] },
];

const filamentDoc = (overrides: Partial<FilamentDoc>): FilamentDoc => ({
  id: 'id',
  typeId: 'pla',
  brand: 'Bambu Lab',
  colorName: 'Zwart',
  colorHex: '#000000',
  remainingGrams: 1000,
  spoolWeight: 1000,
  notes: '',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides,
});

describe('formatWeight', () => {
  it('shows grams below a kilogram', () => {
    expect(formatWeight(0)).toBe('0 g');
    expect(formatWeight(873)).toBe('873 g');
    expect(formatWeight(999.6)).toBe('1000 g');
  });

  it('shows kilograms from a kilogram, with a decimal comma and at most two decimals', () => {
    expect(formatWeight(1000)).toBe('1 kg');
    expect(formatWeight(3800)).toBe('3,8 kg');
    expect(formatWeight(1250)).toBe('1,25 kg');
    expect(formatWeight(2333)).toBe('2,33 kg');
  });

  it('splits number and unit for separate styling', () => {
    expect(weightParts(3800)).toEqual({ value: '3,8', unit: 'kg' });
    expect(weightParts(150)).toEqual({ value: '150', unit: 'g' });
  });
});

describe('toInventory', () => {
  it('joins the type name and brand', () => {
    const [item] = toInventory([filamentDoc({ typeId: 'petg', remainingGrams: 500 })], types);
    expect(item.typeName).toBe('PETG HF');
    expect(item.typeBrand).toBe('Bambu Lab');
  });

  it('marks filaments with an unknown type', () => {
    const [item] = toInventory([filamentDoc({ typeId: 'gone' })], types);
    expect(item.typeName).toBe('Onbekend type');
  });
});

describe('filterAndSortFilaments', () => {
  const inventory = toInventory([
    filamentDoc({ id: 'a', colorName: 'Rood', colorHex: '#ff0000', remainingGrams: 200 }),
    filamentDoc({ id: 'b', colorName: 'Blauw', colorHex: '#0000ff', remainingGrams: 3000, typeId: 'petg' }),
    filamentDoc({ id: 'c', colorName: 'Wit', colorHex: '#ffffff', remainingGrams: 1000 }),
  ], types);

  const ids = (list: { id: string }[]) => list.map(f => f.id);

  it('filters on the type name', () => {
    expect(ids(filterAndSortFilaments(inventory, '', 'PETG', 'name', 'asc'))).toEqual(['b']);
    expect(ids(filterAndSortFilaments(inventory, '', 'PLA', 'name', 'asc'))).toEqual(['a', 'c']);
  });

  it('searches color, brand and type name', () => {
    expect(ids(filterAndSortFilaments(inventory, 'petg', 'All', 'name', 'asc'))).toEqual(['b']);
    expect(ids(filterAndSortFilaments(inventory, 'wit', 'All', 'name', 'asc'))).toEqual(['c']);
  });

  it('sorts by weight', () => {
    expect(ids(filterAndSortFilaments(inventory, '', 'All', 'quantity', 'desc'))).toEqual(['b', 'c', 'a']);
  });

  it('sorts colors by hue with white after the chromatic colors', () => {
    expect(ids(filterAndSortFilaments(inventory, '', 'All', 'color', 'asc'))).toEqual(['a', 'b', 'c']);
  });
});

describe('isLightColor', () => {
  it('tells light from dark colors', async () => {
    const { isLightColor } = await import('./color');
    expect(isLightColor('#FFFFFF')).toBe(true);
    expect(isLightColor('#FDB913')).toBe(true);
    expect(isLightColor('#D0112B')).toBe(false);
    expect(isLightColor('#1A1A1A')).toBe(false);
  });
});

describe('getStockStatus', () => {
  it('marks 250 g or less as almost empty and 500 g or less as limited', async () => {
    const { getStockStatus } = await import('./filaments');
    expect(getStockStatus(0)).toBe('almostEmpty');
    expect(getStockStatus(250)).toBe('almostEmpty');
    expect(getStockStatus(251)).toBe('limited');
    expect(getStockStatus(500)).toBe('limited');
    expect(getStockStatus(501)).toBeNull();
  });
});
