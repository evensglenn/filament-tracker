import { Filament } from '../types';
import { getHue } from './color';

export type FilterOption = 'All' | 'PLA' | 'PETG' | 'Other';
export type SortField = 'name' | 'quantity' | 'color';
export type SortOrder = 'asc' | 'desc';

const matchesFilter = (filament: Filament, filterType: FilterOption) => {
  switch (filterType) {
    case 'All': return true;
    case 'PLA': return filament.type.startsWith('PLA');
    case 'PETG': return filament.type.startsWith('PETG');
    case 'Other': return filament.type === 'Other' || filament.type === 'TPU';
  }
};

const matchesSearch = (filament: Filament, searchQuery: string) => {
  const q = searchQuery.toLowerCase();
  return filament.colorName.toLowerCase().includes(q) ||
         filament.brand.toLowerCase().includes(q) ||
         filament.type.toLowerCase().includes(q);
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
      comparison = a.quantity - b.quantity;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

export const getQuantityColor = (qty: number) => {
  if (qty < 0.25) return 'text-red-600 bg-red-50';
  if (qty < 0.75) return 'text-amber-600 bg-amber-50';
  return 'text-emerald-600 bg-emerald-50';
};
