import { Filament, FilamentDoc, ManagedType } from '../types';
import { getHue } from './color';

export type FilterOption = 'All' | 'PLA' | 'PETG' | 'Low';
export type SortField = 'name' | 'quantity' | 'color';
export type SortOrder = 'asc' | 'desc';

export const toSpools = (grams: number, spoolWeight: number) => grams / (spoolWeight || 1000);

export const spoolsToGrams = (spools: number, spoolWeight: number) => Math.max(0, Math.round(spools * spoolWeight));

/** Spools with at most two decimals, e.g. 2, 0.5 or 0.87. */
export const formatSpools = (spools: number) => String(Number(spools.toFixed(2)));

/** "1 rol", "0.87 rol", "2.3 rollen" */
export const formatSpoolsWithUnit = (spools: number) => `${formatSpools(spools)} ${spools > 1 ? 'rollen' : 'rol'}`;

/** Below this many spools a filament counts as almost empty. */
export const LOW_STOCK_SPOOLS = 0.25;

export type StockLevel = 'low' | 'medium' | 'ok';

export const getStockLevel = (spools: number): StockLevel =>
  spools < LOW_STOCK_SPOOLS ? 'low' : spools < 0.75 ? 'medium' : 'ok';

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

/** Joins the stored filaments with their type and computes the quantity in spools. */
export const toInventory = (docs: FilamentDoc[], types: ManagedType[]): Filament[] => {
  const typesById = new Map(types.map(t => [t.id, t]));
  return docs.map(doc => ({
    ...doc,
    typeName: typesById.get(doc.typeId)?.name ?? 'Onbekend type',
    typeBrand: typesById.get(doc.typeId)?.brand ?? '',
    spools: toSpools(doc.remainingGrams, doc.spoolWeight),
  }));
};

const matchesFilter = (filament: Filament, filterType: FilterOption) => {
  switch (filterType) {
    case 'All': return true;
    case 'PLA': return filament.typeName.startsWith('PLA');
    case 'PETG': return filament.typeName.startsWith('PETG');
    case 'Low': return filament.spools < LOW_STOCK_SPOOLS;
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
      comparison = a.spools - b.spools;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

