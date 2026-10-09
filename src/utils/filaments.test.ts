import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { FilamentDoc, ManagedType } from '../types';
import { filterAndSortFilaments, formatSpools, spoolsToGrams, toInventory, toSpools } from './filaments';

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

describe('spool conversions', () => {
  it('converts grams to spools using the spool weight', () => {
    expect(toSpools(1500, 1000)).toBe(1.5);
    expect(toSpools(125, 250)).toBe(0.5);
  });

  it('rounds spools to whole grams and never goes negative', () => {
    expect(spoolsToGrams(0.873, 1000)).toBe(873);
    expect(spoolsToGrams(1 / 3, 1000)).toBe(333);
    expect(spoolsToGrams(-1, 1000)).toBe(0);
  });

  it('formats spools with at most two decimals', () => {
    expect(formatSpools(2)).toBe('2');
    expect(formatSpools(0.5)).toBe('0.5');
    expect(formatSpools(0.873)).toBe('0.87');
  });
});

describe('toInventory', () => {
  it('joins the type name and computes spools', () => {
    const [item] = toInventory([filamentDoc({ typeId: 'petg', remainingGrams: 500 })], types);
    expect(item.typeName).toBe('PETG HF');
    expect(item.spools).toBe(0.5);
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

  it('sorts by quantity in spools', () => {
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
