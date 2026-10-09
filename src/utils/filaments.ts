import { Filament, FilamentDoc, ManagedType } from '../types';
import { getHue } from './color';

export type FilterOption = 'All' | 'PLA' | 'PETG' | 'Low';
export type SortField = 'name' | 'quantity' | 'color';
export type SortOrder = 'asc' | 'desc';

const KILOGRAMS = new Intl.NumberFormat('nl-BE', { maximumFractionDigits: 2 });

/** A weight as number and unit: grams below a kilogram, kilograms from there ("873 g", "3,8 kg"). */
export const weightParts = (grams: number) =>
  grams < 1000 ? { value: String(Math.round(grams)), unit: 'g' } : { value: KILOGRAMS.format(grams / 1000), unit: 'kg' };

export const formatWeight = (grams: number) => {
  const { value, unit } = weightParts(grams);
  return `${value} ${unit}`;
};

/** At or below these amounts a filament is "Bijna op" or "Beperkt", whatever the spool size. */
export const ALMOST_EMPTY_GRAMS = 250;
export const LIMITED_GRAMS = 500;

export type StockStatus = 'almostEmpty' | 'limited';

/** The stock state worth pointing out, or null when there is plenty left. */
export const getStockStatus = (remainingGrams: number): StockStatus | null =>
  remainingGrams <= ALMOST_EMPTY_GRAMS ? 'almostEmpty' : remainingGrams <= LIMITED_GRAMS ? 'limited' : null;

export const isAlmostEmpty = (filament: Pick<Filament, 'remainingGrams'>) =>
  getStockStatus(filament.remainingGrams) === 'almostEmpty';


/** Sorts by most recently used in a print first, then by name. */
export const byRecentUse = (a: Filament, b: Filament) =>
  (b.lastUsedAt?.toMillis() ?? 0) - (a.lastUsedAt?.toMillis() ?? 0) || a.colorName.localeCompare(b.colorName);

/** Case-insensitive match on color name, brand and type. */
export const matchesSearch = (filament: Filament, searchQuery: string) => {
  const q = searchQuery.trim().toLowerCase();
  return filament.colorName.toLowerCase().includes(q) ||
         filament.brand.toLowerCase().includes(q) ||
         filament.typeName.toLowerCase().includes(q);
};

/** Joins the stored filaments with their type. */
export const toInventory = (docs: FilamentDoc[], types: ManagedType[]): Filament[] => {
  const typesById = new Map(types.map(t => [t.id, t]));
  return docs.map(doc => ({
    ...doc,
    typeName: typesById.get(doc.typeId)?.name ?? 'Onbekend type',
    typeBrand: typesById.get(doc.typeId)?.brand ?? '',
  }));
};

const matchesFilter = (filament: Filament, filterType: FilterOption) => {
  switch (filterType) {
    case 'All': return true;
    case 'PLA': return filament.typeName.startsWith('PLA');
    case 'PETG': return filament.typeName.startsWith('PETG');
    case 'Low': return isAlmostEmpty(filament);
  }
};

export const filterAndSortFilaments = (
  filaments: Filament[],
  searchQuery: string,
  filterType: FilterOption,
  sortBy: SortField,
  sortOrder: SortOrder
) => filaments
  .filter(f => matchesSearch(f, searchQuery) && matchesFilter(f, filterType))
  .sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.colorName.localeCompare(b.colorName);
    } else if (sortBy === 'color') {
      comparison = getHue(a.colorHex) - getHue(b.colorHex);
    } else {
      comparison = a.remainingGrams - b.remainingGrams;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

