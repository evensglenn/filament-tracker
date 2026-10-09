import { Filament, FilamentDoc, ManagedType } from '../types';
import { getHue } from './color';

export type FilterOption = 'All' | 'PLA' | 'PETG' | 'Other';
export type SortField = 'name' | 'quantity' | 'color';
export type SortOrder = 'asc' | 'desc';

export const toSpools = (grams: number, spoolWeight: number) => grams / (spoolWeight || 1000);

export const spoolsToGrams = (spools: number, spoolWeight: number) => Math.max(0, Math.round(spools * spoolWeight));

/** Spools with at most two decimals, e.g. 2, 0.5 or 0.87. */
export const formatSpools = (spools: number) => String(Number(spools.toFixed(2)));

/** Joins the stored filaments with their type and computes the quantity in spools. */
export const toInventory = (docs: FilamentDoc[], types: ManagedType[]): Filament[] => {
  const typeNames = new Map(types.map(t => [t.id, t.name]));
  return docs.map(doc => ({
    ...doc,
    typeName: typeNames.get(doc.typeId) ?? 'Onbekend type',
    spools: toSpools(doc.remainingGrams, doc.spoolWeight),
  }));
};

const matchesFilter = (filament: Filament, filterType: FilterOption) => {
  switch (filterType) {
    case 'All': return true;
    case 'PLA': return filament.typeName.startsWith('PLA');
    case 'PETG': return filament.typeName.startsWith('PETG');
    case 'Other': return filament.typeName === 'Other' || filament.typeName === 'TPU';
  }
};

const matchesSearch = (filament: Filament, searchQuery: string) => {
  const q = searchQuery.toLowerCase();
  return filament.colorName.toLowerCase().includes(q) ||
         filament.brand.toLowerCase().includes(q) ||
         filament.typeName.toLowerCase().includes(q);
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

export const getQuantityColor = (qty: number) => {
  if (qty < 0.25) return 'text-red-600 bg-red-50';
  if (qty < 0.75) return 'text-amber-600 bg-amber-50';
  return 'text-emerald-600 bg-emerald-50';
};
